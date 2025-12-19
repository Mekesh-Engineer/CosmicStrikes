import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store'; //
import {
  move,
  fire,
  tick,
  spawnAlien,
  setGameStatus,
  spawnBoss,
  nextWave,
  startWave,
  incrementWaveSpawns,
  hideWaveNotification
} from '../features/game'; //
import type { AlienType } from '../features/game';
import {
  getSpawnInterval,
  getAlienHP,
  getFormation,
  getWeightedAlienType,
  isBossLevel,
  getBossConfig,
  getLevelProgress,
  getDifficultyBracket,
  bracketNames,
  bracketColors,
  getCurrentMilestone,
  getVisualFeedback,
  getWaveConfig,
  type WaveNumber
} from '../features/difficultyV2';
import { getPerformanceConfig } from '../config/performance';
import CosmicBackground from '../scenes/CosmicBackground'; //
import AccountWidget from '../components/AccountWidget'; //
import Cannon from '../components/Cannon'; //
import Alien from '../components/Alien'; //
import HUD from '../components/game/HUD'; //
import WaveTransition from '../components/game/WaveTransition'; //
import WaveNotification from '../components/game/WaveNotification'; //
import VictoryModal from '../components/game/VictoryModal'; //
import ComboIndicator from '../components/game/ComboIndicator'; //

const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    playerX,
    playerY,
    bullets,
    aliens,
    score,
    lives,
    level,
    previousLevel,
    wave,
    waveKills,
    waveEnemiesSpawned,
    status,
    activePowerUps,
    combo,
    bossActive,
    bossHP,
    bossMaxHP,
    totalKills,
    showWaveNotification: waveNotificationVisible,
    victoryType
  } = useAppSelector((state) => state.game);

  const hasFireRate = activePowerUps.some((p) => p.type === 'fireRate');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showMilestone, setShowMilestone] = useState<string | null>(null);

  // Difficulty state derived from level
  const bracket = getDifficultyBracket(level);
  const bracketName = bracketNames[bracket];
  const bracketColor = bracketColors[bracket];
  const levelProgress = getLevelProgress(score, level);
  const visualFeedback = getVisualFeedback(level);

  // Refs for Touch Control Logic (2D movement)
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isMoving = useRef(false);
  const lastTouchX = useRef<number>(0);
  const lastTouchY = useRef<number>(0);

  // Apply the dark theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  // 🖥️ Responsive viewport sizing with safe-area padding
  useEffect(() => {
    const recomputeStage = () => {
      const container = containerRef.current;
      if (!container) return;

      const { clientWidth, clientHeight } = container;
      const minWidth = 280;
      const minHeight = 158;

      // Match viewport aspect so we use full height with no letterboxing
      const targetAspect = clientWidth / clientHeight;
      setAspectRatio(targetAspect);

      const width = Math.max(minWidth, clientWidth);
      const height = Math.max(minHeight, clientHeight);

      setStageSize({ width, height });
    };

    recomputeStage();
    window.addEventListener('resize', recomputeStage);
    window.addEventListener('orientationchange', recomputeStage);
    return () => {
      window.removeEventListener('resize', recomputeStage);
      window.removeEventListener('orientationchange', recomputeStage);
    };
  }, [aspectRatio]);

  // 🎮 AUTO-START GAME
  useEffect(() => {
    // Start game automatically when component mounts
    if (status === 'idle') {
      dispatch(setGameStatus('playing'));
    }
  }, [dispatch, status]);

  // 🎯 LEVEL-UP DETECTION
  useEffect(() => {
    if (level > previousLevel && previousLevel > 0) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 2000);

      // Check for milestone
      const milestone = getCurrentMilestone(level);
      if (milestone.level === level) {
        setShowMilestone(milestone.title);
        setTimeout(() => setShowMilestone(null), 3000);
      }
    }
  }, [level, previousLevel]);

  // ⌨️ GLOBAL KEYBOARD SHORTCUTS (Pause, Resume, Shoot)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Pause/Resume with P or Escape
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        e.preventDefault();
        if (status === 'playing') {
          dispatch(setGameStatus('paused'));
        } else if (status === 'paused') {
          dispatch(setGameStatus('playing'));
        }
        return;
      }

      // Spacebar to shoot (manual fire - complements auto-fire)
      if (e.key === ' ' && status === 'playing') {
        e.preventDefault();
        dispatch(fire());
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [dispatch, status]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // 🕹️ OPTIMIZED GAME LOOP (requestAnimationFrame for smooth 60fps)
  // ═══════════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (status !== 'playing' && status !== 'boss') return;

    const perfConfig = getPerformanceConfig();
    let animationFrameId: number;
    let lastTickTime = 0;
    let lastSpawnTime = 0;
    let lastFireTime = 0;
    let lastBossCheckTime = 0;

    const waveConfig = getWaveConfig(level, wave as WaveNumber);

    const gameLoop = (currentTime: number) => {
      if (!lastTickTime) lastTickTime = currentTime;

      const deltaTime = currentTime - lastTickTime;

      // Game tick at ~60fps (16.67ms intervals)
      if (deltaTime >= 16) {
        dispatch(tick());
        lastTickTime = currentTime;
      }

      // ═══════════════════════════════════════════════════════════════════════════
      // 🌊 WAVE COMPLETION CHECK
      // ═══════════════════════════════════════════════════════════════════════════
      if (waveKills >= waveConfig.enemiesRequired && !bossActive && status === 'playing') {
        dispatch(nextWave());
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      // Alien spawner (variable interval based on level and wave)
      const spawnInterval = getSpawnInterval(level, wave as WaveNumber);
      if (currentTime - lastSpawnTime >= spawnInterval && !bossActive && status === 'playing') {
        const alienHP = getAlienHP(level, wave as WaveNumber);
        const formation = getFormation(level, wave as WaveNumber);

        // Spawn aliens in formation (without setTimeout for performance)
        formation.positions.forEach((pos) => {
          const alienType: AlienType = getWeightedAlienType(level);
          dispatch(spawnAlien({
            x: pos.x,
            y: pos.y,
            type: alienType,
            hp: alienHP.hp,
            isBoss: false,
            vx: pos.vx || (formation.type === 'horizontal' ? 0.01 : 0)
          }));
          dispatch(incrementWaveSpawns());
        });

        lastSpawnTime = currentTime;
      }

      // Boss check (every 1000ms) - triggers at wave 5 of boss levels
      if (currentTime - lastBossCheckTime >= 1000) {
        if (isBossLevel(level) && !bossActive && wave === 5 && waveKills >= waveConfig.enemiesRequired) {
          const bossConfig = getBossConfig(level);
          if (bossConfig) {
            const bossTypes: AlienType[] = ['purple', 'cyan', 'yellow', 'red', 'blue', 'green'];
            const bossType = bossTypes[Math.floor(level / 10) % bossTypes.length];
            dispatch(spawnBoss({ hp: bossConfig.hp, type: bossType, name: bossConfig.name }));
          }
        }
        lastBossCheckTime = currentTime;
      }

      // Auto-fire (faster with power-up)
      const fireInterval = hasFireRate ? 100 : 200;
      if (currentTime - lastFireTime >= fireInterval) {
        dispatch(fire());
        lastFireTime = currentTime;
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [dispatch, status, level, wave, waveKills, hasFireRate, bossActive]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // 🌊 WAVE TRANSITION HANDLER
  // ═══════════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (status === 'waveTransition') {
      // Auto-continue after 2 seconds or on user input
      const timer = setTimeout(() => {
        dispatch(startWave());
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, dispatch]);

  const handleWaveTransitionComplete = useCallback(() => {
    if (status === 'waveTransition') {
      dispatch(startWave());
    }
  }, [status, dispatch]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // ⌨️ OPTIMIZED KEYBOARD CONTROLS (Polling with configurable sensitivity)
  // ═══════════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (status !== 'playing' && status !== 'boss') return;

    const keys = new Set<string>();
    const perfConfig = getPerformanceConfig();
    const sensitivity = perfConfig.keyboardMoveSensitivity;
    let animationFrameId: number;
    let lastMoveTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Add keys for 2D movement (don't preventDefault to allow global shortcuts)
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'A', 'd', 'D', 'w', 'W', 's', 'S'].includes(e.key)) {
        keys.add(e.key.toLowerCase());
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.key.toLowerCase());
    };

    // Handle window blur to prevent stuck keys
    const handleBlur = () => keys.clear();

    // Use requestAnimationFrame for smoother input polling
    const pollMovement = (currentTime: number) => {
      // Throttle to ~60fps for consistent movement speed
      if (currentTime - lastMoveTime >= 16) {
        let dx = 0;
        let dy = 0;

        // Horizontal movement
        if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
        if (keys.has('arrowright') || keys.has('d')) dx += 1;

        // Vertical movement  
        if (keys.has('arrowup') || keys.has('w')) dy += 1;
        if (keys.has('arrowdown') || keys.has('s')) dy -= 1;

        // Normalize diagonal movement & apply sensitivity
        if (dx !== 0 || dy !== 0) {
          if (dx !== 0 && dy !== 0) {
            const magnitude = Math.sqrt(dx * dx + dy * dy);
            dx = (dx / magnitude) * sensitivity;
            dy = (dy / magnitude) * sensitivity;
          } else {
            dx *= sensitivity;
            dy *= sensitivity;
          }
          dispatch(move({ dx, dy }));
        }

        lastMoveTime = currentTime;
      }

      animationFrameId = requestAnimationFrame(pollMovement);
    };

    animationFrameId = requestAnimationFrame(pollMovement);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      cancelAnimationFrame(animationFrameId);
    };
  }, [dispatch, status]);

  // 📱 TOUCH CONTROLS (Smooth 2D Swipe/Drag with configurable sensitivity)
  const touchSensitivity = getPerformanceConfig().touchMoveSensitivity;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (status !== 'playing') return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    lastTouchX.current = e.touches[0].clientX;
    lastTouchY.current = e.touches[0].clientY;
    isMoving.current = true;
  }, [status]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (status !== 'playing' || !isMoving.current) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - lastTouchX.current;
    const deltaY = currentY - lastTouchY.current;

    // Apply configurable touch sensitivity
    if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
      dispatch(move({
        dx: deltaX * touchSensitivity,
        dy: -deltaY * touchSensitivity  // Negative because screen Y increases downward
      }));
      lastTouchX.current = currentX;
      lastTouchY.current = currentY;
    }
  }, [dispatch, status, touchSensitivity]);

  const handleTouchEnd = useCallback(() => {
    touchStartX.current = null;
    touchStartY.current = null;
    isMoving.current = false;
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-screen w-full bg-[var(--bg-primary)] text-white font-inter select-none touch-none"
      style={{
        paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 12px)',
        paddingRight: 'calc(env(safe-area-inset-right, 0px) + 12px)',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="relative overflow-hidden rounded-2xl border border-[var(--border-strong)] shadow-2xl bg-[var(--bg-elevated)] w-full h-full"
        style={{
          width: stageSize.width ? `${stageSize.width}px` : '100%',
          height: stageSize.height ? `${stageSize.height}px` : '100%',
          aspectRatio: `${aspectRatio}`,
          maxWidth: '100%',
          maxHeight: '100vh',
        }}
      >
        {/* 🌌 LAYER 0: BACKGROUND */}
        <div className="absolute inset-0 -z-10">
          <CosmicBackground />
          <div className="game-background-blur" />
        </div>

        {/* 🛰️ LAYER 1: NAVBAR */}
        <nav className="absolute top-0 left-0 right-0 z-50 glass border-b border-[var(--border-divider)] h-14 sm:h-16 flex items-center px-4 sm:px-6 lg:px-8">
          <div className="w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer flex-shrink-0" onClick={() => navigate('/')}>
              <span className="material-icons text-3xl sm:text-4xl text-[var(--brand-primary)] flex-shrink-0">rocket_launch</span>
              <span className="font-orbitron font-bold tracking-tighter text-sm sm:text-base truncate">COSMIC STRIKES</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 ml-auto">
              <div className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-1 bg-white/5 rounded-full border border-white/10 flex-shrink-0">
                <span className="text-[var(--text-muted)] text-[8px] sm:text-[10px] uppercase font-bold tracking-widest">SYSTEM</span>
                <span className="text-[var(--brand-primary)] font-mono text-xs sm:text-sm animate-pulse">ONLINE</span>
              </div>
              <button
                onClick={() => dispatch(setGameStatus(status === 'paused' ? 'playing' : 'paused'))}
                className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors flex-shrink-0"
                title={status === 'paused' ? 'Resume' : 'Pause'}
              >
                <span className="material-icons text-lg text-[var(--text-secondary)]">
                  {status === 'paused' ? 'play_arrow' : 'pause'}
                </span>
              </button>
              <div className="flex-shrink-0">
                <AccountWidget />
              </div>
            </div>
          </div>
        </nav>

        {/* Spacer for navbar height */}
        <div className="h-14 sm:h-16" />

        {/* 📊 LAYER 2: HUD */}
        <div className="absolute top-16 sm:top-20 left-4 right-4 sm:left-6 sm:right-6 z-40 flex justify-between items-start pointer-events-none gap-3">
          <div className="flex flex-col gap-3 animate-fade-in">
            {/* Lives */}
            <div className="lives-container">
              {[...Array(3)].map((_, i) => (
                <span key={i} className={`material-icons text-2xl ${i < lives ? 'text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]' : 'text-gray-700'}`}>
                  favorite
                </span>
              ))}
            </div>

            {/* Level with Progress Bar */}
            <div className="hud-element border-l-4 min-w-[140px]" style={{ borderLeftColor: bracketColor.primary }}>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: bracketColor.primary }}>
                {bracketName}
              </p>
              <p className="text-2xl font-orbitron font-bold" style={{ color: bracketColor.primary }}>
                LVL-{level}
              </p>
              {/* Level Progress Bar */}
              <div className="w-full h-1.5 bg-black/40 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${levelProgress}%`,
                    backgroundColor: bracketColor.primary,
                    boxShadow: `0 0 8px ${bracketColor.glow}`
                  }}
                />
              </div>
            </div>

            {/* Combo Counter */}
            {combo > 0 && (
              <div className="hud-element border-l-4 border-l-yellow-500 animate-bounce-in">
                <p className="text-[10px] text-yellow-400 font-bold tracking-[0.2em] uppercase">COMBO</p>
                <p className="text-xl font-orbitron font-bold text-yellow-400">
                  x{combo}
                </p>
              </div>
            )}

            {/* Kills Counter */}
            <div className="text-[10px] text-[var(--text-muted)] font-mono">
              <span className="opacity-60">KILLS:</span> <span className="text-white">{totalKills}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 animate-slide-down">
            <div className="text-right">
              <p className="text-[10px] text-[var(--text-muted)] font-bold tracking-[0.2em] uppercase">SCORE</p>
              <p className="score-display drop-shadow-[0_0_20px_var(--glow-effect)]">
                {score.toLocaleString()}
              </p>
            </div>

            {/* ⌨️ KEYBOARD SHORTCUTS HINT */}
            <div className="hidden md:flex flex-col gap-1 text-right text-[9px] text-[var(--text-muted)] font-mono uppercase tracking-wider pointer-events-auto bg-black/20 px-3 py-2 rounded-lg border border-white/10">
              <div className="flex items-center gap-2 justify-end">
                <span>Move</span>
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[8px] font-bold">↑↓←→</kbd>
                <span>or</span>
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[8px] font-bold">WASD</kbd>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <span>Fire</span>
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[8px] font-bold">Space</kbd>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <span>Pause</span>
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[8px] font-bold">P</kbd>
                <span>or</span>
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[8px] font-bold">Esc</kbd>
              </div>
            </div>

            {/* 🎁 ACTIVE POWER-UPS DISPLAY */}
            {activePowerUps.length > 0 && (
              <div className="flex flex-col gap-1 bg-black/40 backdrop-blur px-3 py-2 rounded-lg border border-[var(--brand-primary)]/30 animate-slide-down">
                <p className="text-[9px] text-[var(--brand-primary)] font-bold tracking-[0.2em] uppercase text-center">ACTIVE BOOSTS</p>
                {activePowerUps.map((powerUp, index) => {
                  const timeLeft = Math.max(0, Math.ceil((powerUp.expiresAt - Date.now()) / 1000));
                  const powerUpIcons: Record<string, string> = {
                    fireRate: '⚡',
                    doubleBullets: '🔫',
                    spreadShot: '💥',
                    scoreMultiplier: '⭐',
                    shield: '🛡️',
                    slowMotion: '⏰'
                  };
                  const powerUpNames: Record<string, string> = {
                    fireRate: 'RAPID FIRE',
                    doubleBullets: 'DOUBLE SHOT',
                    spreadShot: 'SPREAD BURST',
                    scoreMultiplier: '2X SCORE',
                    shield: 'SHIELD',
                    slowMotion: 'SLOW TIME'
                  };
                  return (
                    <div key={`${powerUp.type}-${index}`} className="flex items-center justify-between gap-2 text-[10px]">
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{powerUpIcons[powerUp.type]}</span>
                        <span className="text-white font-mono">{powerUpNames[powerUp.type]}</span>
                      </div>
                      <span className="text-[var(--brand-accent)] font-bold">{timeLeft}s</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="accuracy-bar">
              <div className="accuracy-bar-fill" style={{ width: '87%' }} />
            </div>
          </div>
        </div>

        {/* 🎮 LAYER 3: SVG GAME ENGINE */}
        <svg
          viewBox="-4 -4 8 8"
          className="game-canvas preserve-3d w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <radialGradient id="alienGlow">
              <stop offset="10%" stopColor="var(--brand-primary)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="0.1" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 🔄 COORDINATE SYSTEM FLIP 
             Scale(1, -1) inverts the Y axis. 
             - Y positive is now UP. 
             - Y negative is now DOWN.
             This allows Redux logic (decreasing Y) to translate to VISUALLY FALLING objects.
          */}
          <g transform="scale(1, -1)">

            {/* 👾 Aliens (with HP props) */}
            {aliens.map((alien) => (
              <Alien
                key={alien.id}
                x={alien.x}
                y={alien.y}
                type={alien.type}
                hp={alien.hp}
                maxHp={alien.maxHp}
                isBoss={alien.isBoss}
              />
            ))}

            {/* 💥 Bullets */}
            {bullets.map((bullet) => (
              <circle
                key={bullet.id}
                cx={bullet.x}
                cy={bullet.y}
                r="0.08"
                fill="white"
                className="drop-shadow-[0_0_4px_#fff]"
              />
            ))}

            {/* 🚀 Player Spacecraft */}
            <Cannon x={playerX} y={playerY} />

          </g>
        </svg>

        {/* 📱 MOBILE CONTROLS HINT */}
        <div className="absolute bottom-4 left-0 right-0 z-50 md:hidden flex justify-center">
          <div className="text-[11px] text-[var(--text-muted)] font-mono bg-black/40 px-3 py-2 rounded-full border border-white/10 backdrop-blur pointer-events-none animate-fade-in">
            ↑ ↓ ← → Swipe to move • 🔫 Auto-fire ON
          </div>
        </div>

        {/* � WAVE INDICATOR */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div className="flex items-center gap-1 bg-black/40 px-4 py-1 rounded-full border border-white/10 backdrop-blur">
            <span className="text-xs text-gray-400 mr-2">WAVE</span>
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className={`w-3 h-1.5 rounded-sm transition-all duration-300 ${i < wave ? 'opacity-100' : 'opacity-30'
                  }`}
                style={{ backgroundColor: bracketColor.primary }}
              />
            ))}
            <span className="text-xs ml-2" style={{ color: bracketColor.primary }}>
              {wave}/5
            </span>
          </div>
        </div>

        {/* 🔥 COMBO INDICATOR */}
        <ComboIndicator />

        {/* 🌊 WAVE NOTIFICATION (Non-blocking, right-side floating) */}
        <WaveNotification />

        {/* 🌊 WAVE TRANSITION OVERLAY (Legacy - kept for boss transitions) */}
        {status === 'waveTransition' && (
          <WaveTransition onComplete={handleWaveTransitionComplete} />
        )}

        {/* 👹 BOSS HEALTH BAR */}
        {bossActive && (
          <div className="absolute top-32 left-1/2 -translate-x-1/2 z-40 w-64 pointer-events-none">
            <div className="text-center mb-1">
              <span className="text-xs text-red-400 animate-pulse">⚠️ BOSS BATTLE ⚠️</span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-red-500">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-200"
                style={{ width: `${Math.max(0, (bossHP / bossMaxHP) * 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 text-center mt-1">
              {bossHP} / {bossMaxHP} HP
            </div>
          </div>
        )}

        {/* �🎯 LEVEL UP NOTIFICATION */}
        {showLevelUp && (
          <div className="absolute inset-0 z-[55] flex items-center justify-center pointer-events-none">
            <div
              className="text-center animate-bounce-in"
              style={{ textShadow: `0 0 40px ${bracketColor.glow}` }}
            >
              <p className="text-lg font-mono uppercase tracking-[0.3em] mb-2" style={{ color: bracketColor.primary }}>
                LEVEL UP
              </p>
              <p
                className="text-6xl font-orbitron font-black"
                style={{ color: bracketColor.primary }}
              >
                {level}
              </p>
              {showMilestone && (
                <p className="text-xl font-bold mt-2 text-yellow-400 animate-pulse">
                  🏆 {showMilestone}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 👹 BOSS WARNING */}
        {bossActive && (
          <div className="absolute top-1/4 left-0 right-0 z-[54] flex justify-center pointer-events-none">
            <div className="bg-red-900/80 backdrop-blur px-6 py-2 rounded-lg border-2 border-red-500 animate-pulse">
              <p className="text-red-400 font-orbitron font-bold text-lg tracking-widest">
                ⚠️ BOSS INCOMING ⚠️
              </p>
            </div>
          </div>
        )}

        {/* ⏸️ PAUSE MODAL */}
        {status === 'paused' && (
          <div className="absolute inset-0 z-[60] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
            <h2 className="text-5xl font-orbitron font-black text-gradient-primary mb-4 tracking-widest">PAUSED</h2>

            {/* Current Stats */}
            <div className="mb-6 grid grid-cols-2 gap-4 text-center">
              <div className="bg-white/5 px-4 py-2 rounded-lg">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Level</p>
                <p className="text-2xl font-orbitron font-bold" style={{ color: bracketColor.primary }}>{level}</p>
              </div>
              <div className="bg-white/5 px-4 py-2 rounded-lg">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Score</p>
                <p className="text-2xl font-orbitron font-bold text-[var(--brand-primary)]">{score.toLocaleString()}</p>
              </div>
              <div className="bg-white/5 px-4 py-2 rounded-lg">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Kills</p>
                <p className="text-2xl font-orbitron font-bold text-green-400">{totalKills}</p>
              </div>
              <div className="bg-white/5 px-4 py-2 rounded-lg">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Sector</p>
                <p className="text-sm font-bold" style={{ color: bracketColor.primary }}>{bracketName}</p>
              </div>
            </div>

            {/* Keyboard Shortcuts Guide */}
            <div className="mb-8 text-center space-y-2">
              <p className="text-[var(--text-muted)] text-sm font-mono uppercase tracking-widest">Press <kbd className="px-2 py-1 bg-white/20 rounded font-bold">P</kbd> or <kbd className="px-2 py-1 bg-white/20 rounded font-bold">Esc</kbd> to resume</p>
            </div>

            <div className="flex gap-6">
              <button
                onClick={() => dispatch(setGameStatus('playing'))}
                className="px-8 py-3 bg-[var(--brand-primary)] text-black font-bold rounded-xl hover:scale-105 transition-transform flex items-center gap-2"
              >
                <span className="material-icons">play_arrow</span> RESUME
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-8 py-3 bg-white/10 text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-all"
              >
                EXIT
              </button>
            </div>
          </div>
        )}

        {/* 🏆 VICTORY MODAL */}
        {status === 'victory' && <VictoryModal />}
      </div>
    </div>
  );
};

export default GamePage;