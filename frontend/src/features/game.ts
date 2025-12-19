import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  calculateLevelFromScore, 
  getAlienSpeed, 
  getPowerUpDuration,
  getPowerUpDropChance,
  getScorePressure,
  getDifficultyBracket,
  getComboMultiplier,
  getWaveClearBonus,
  isBossLevel,
  PERFECT_COMBO_BONUS,
  type DifficultyBracket,
  type WaveNumber,
  type DifficultyMode,
  type GameStatus as DifficultyGameStatus
} from './difficultyV2';

export type Bullet = { id: string; x: number; y: number; vx: number; vy: number };
export type AlienType = 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'cyan';
export type PowerUp = 'fireRate' | 'doubleBullets' | 'spreadShot' | 'scoreMultiplier' | 'shield' | 'slowMotion';
export type GamePhase = 'idle' | 'playing' | 'paused' | 'gameOver' | 'boss' | 'waveTransition' | 'victory';
export type VictoryType = 'minor' | 'major' | 'ultimate' | null;

export interface Alien {
  id: string;
  x: number;
  y: number;
  type: AlienType;
  hp: number;          // Current HP
  maxHp: number;       // Max HP for armor display
  isBoss: boolean;     // Is this a mini-boss?
  vx?: number;         // Horizontal velocity (for patterns)
  behavior?: 'straight' | 'erratic' | 'fast' | 'tank' | 'bombs' | 'pack' | 'all' | 'teleport' | 'area';
}

export interface ActivePowerUp {
  type: PowerUp;
  expiresAt: number;
}

export interface GameState {
  playerX: number;
  playerY: number;
  bullets: Bullet[];
  aliens: Alien[];
  running: boolean;
  score: number;
  lives: number;
  level: number;
  previousLevel: number;     // Track level-ups
  
  // ═══════════════════════════════════════════════════
  // 🌊 WAVE SYSTEM (5 waves per level)
  // ═══════════════════════════════════════════════════
  wave: WaveNumber;          // Current wave (1-5)
  waveKills: number;         // Kills in current wave
  waveEnemiesSpawned: number; // Total spawned this wave
  waveStartTime: number;     // When wave started
  
  // ═══════════════════════════════════════════════════
  // 🎮 GAME STATUS
  // ═══════════════════════════════════════════════════
  status: GamePhase;
  difficultyMode: DifficultyMode;  // normal | elite | mastery
  
  activePowerUps: ActivePowerUp[];
  scoreMultiplier: number;
  
  // ═══════════════════════════════════════════════════
  // 🔥 COMBO SYSTEM (0-50+ for 1x-5x multiplier)
  // ═══════════════════════════════════════════════════
  combo: number;             // Kill combo counter (0-50+)
  maxCombo: number;          // Best combo this game
  comboTimer: number;        // Combo decay timer
  comboTier: string;         // Current tier name
  
  difficultyBracket: DifficultyBracket;
  bossActive: boolean;       // Is a boss currently spawned?
  bossHP: number;            // Current boss HP
  bossMaxHP: number;         // Max boss HP
  
  totalKills: number;        // Track total kills
  missedAliens: number;      // Track aliens that got through
  escapeStreak: number;      // Consecutive aliens escaped (for loss condition)
  
  // ═══════════════════════════════════════════════════
  // 🏆 VICTORY & SOFT LOSS TRACKING
  // ═══════════════════════════════════════════════════
  victoryType: VictoryType;  // Type of victory achieved
  victoryTitle: string;      // Title earned (Elite Sector, Cosmic Savior, etc.)
  lastShotTime: number;      // Timestamp of last shot fired (for idle detection)
  missesInWindow: number;    // Aliens missed in current 10-second window
  missWindowStart: number;   // Start of current miss tracking window
  
  // ═══════════════════════════════════════════════════
  // 🌊 WAVE NOTIFICATION
  // ═══════════════════════════════════════════════════
  showWaveNotification: boolean;
  waveNotificationData: { wave: number; level: number; bossName?: string } | null;
  
  // ═══════════════════════════════════════════════════
  // 📊 GAME SESSION STATS (for leaderboard)
  // ═══════════════════════════════════════════════════
  shotsFired: number;        // Total bullets fired
  shotsHit: number;          // Bullets that hit enemies
  gameStartTime: number;     // Timestamp when game started
  powerUpsCollected: number; // Total power-ups collected
  wavesCompleted: number;    // Total waves completed
}

const initialState: GameState = {
  playerX: 0,
  playerY: -2.5,
  bullets: [],
  aliens: [],
  running: true,
  score: 0,
  lives: 3,
  level: 1,
  previousLevel: 1,
  
  // Wave system
  wave: 1,
  waveKills: 0,
  waveEnemiesSpawned: 0,
  waveStartTime: 0,
  
  status: 'idle',
  difficultyMode: 'normal',
  
  activePowerUps: [],
  scoreMultiplier: 1,
  
  // Combo system
  combo: 0,
  maxCombo: 0,
  comboTimer: 0,
  comboTier: '',
  
  difficultyBracket: 'training',
  bossActive: false,
  bossHP: 0,
  bossMaxHP: 0,
  
  totalKills: 0,
  missedAliens: 0,
  escapeStreak: 0,
  
  // Victory & soft loss tracking
  victoryType: null,
  victoryTitle: '',
  lastShotTime: Date.now(),
  missesInWindow: 0,
  missWindowStart: Date.now(),
  
  // Wave notification
  showWaveNotification: false,
  waveNotificationData: null,
  
  // Game session stats
  shotsFired: 0,
  shotsHit: 0,
  gameStartTime: Date.now(),
  powerUpsCollected: 0,
  wavesCompleted: 0,
};

// Alien type rewards mapping
const alienRewards: Record<AlienType, { points: number; powerUp: PowerUp }> = {
  red: { points: 100, powerUp: 'fireRate' },           // Fire rate +50%
  green: { points: 150, powerUp: 'shield' },           // +1 Life (shield)
  blue: { points: 200, powerUp: 'slowMotion' },        // Slow aliens
  yellow: { points: 250, powerUp: 'scoreMultiplier' }, // 2x Score
  purple: { points: 300, powerUp: 'doubleBullets' },   // 2 bullets per shot
  cyan: { points: 350, powerUp: 'spreadShot' },        // 3-way spread
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 PERFORMANCE OPTIMIZED UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

// Fast clamp function
const clamp = (v: number, min: number, max: number): number => 
  v < min ? min : v > max ? max : v;

// Fast unique ID generator (avoids expensive toString(36))
let idCounter = 0;
const generateId = (): string => `e${++idCounter}`;

// Pre-computed constants for collision detection
const HIT_RADIUS_NORMAL = 0.0625; // 0.25 squared
const HIT_RADIUS_BOSS = 0.16;     // 0.4 squared
const BULLET_LIMIT = 100;         // Maximum bullets on screen
const ALIEN_LIMIT = 80;           // Maximum aliens on screen

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    // Optimized movement with configurable sensitivity
    move(state, action: PayloadAction<{ dx?: number; dy?: number; sensitivity?: number }>) {
      const { dx = 0, dy = 0, sensitivity = 1 } = action.payload;
      state.playerX = clamp(state.playerX + dx * sensitivity, -3, 3);
      state.playerY = clamp(state.playerY + dy * sensitivity, -3, 3);
    },
    
    // Optimized fire with bullet limit
    fire(state) {
      // Track last shot time for idle detection
      state.lastShotTime = Date.now();
      
      // Enforce bullet limit for performance
      if (state.bullets.length >= BULLET_LIMIT) {
        // Remove oldest bullets
        state.bullets = state.bullets.slice(-BULLET_LIMIT + 3);
      }
      
      const id = generateId();
      // Cache power-up checks (avoid repeated array scans)
      const hasSpreadShot = state.activePowerUps.some(p => p.type === 'spreadShot');
      const hasDoubleBullets = state.activePowerUps.some(p => p.type === 'doubleBullets');
      
      if (hasSpreadShot) {
        // 3-way spread shot - counts as 3 shots
        state.bullets.push(
          { id: id + '-left', x: state.playerX - 0.2, y: state.playerY + 0.5, vx: -0.05, vy: 0.15 },
          { id: id + '-center', x: state.playerX, y: state.playerY + 0.5, vx: 0, vy: 0.15 },
          { id: id + '-right', x: state.playerX + 0.2, y: state.playerY + 0.5, vx: 0.05, vy: 0.15 }
        );
        state.shotsFired += 3;
      } else if (hasDoubleBullets) {
        // Double bullets side-by-side - counts as 2 shots
        state.bullets.push(
          { id: id + '-left', x: state.playerX - 0.1, y: state.playerY + 0.5, vx: 0, vy: 0.15 },
          { id: id + '-right', x: state.playerX + 0.1, y: state.playerY + 0.5, vx: 0, vy: 0.15 }
        );
        state.shotsFired += 2;
      } else {
        // Single bullet
        state.bullets.push({ id, x: state.playerX, y: state.playerY + 0.5, vx: 0, vy: 0.15 });
        state.shotsFired += 1;
      }
    },
    // Optimized alien spawning with limit enforcement
    spawnAlien(state, action: PayloadAction<{ x: number; y: number; type: AlienType; hp: number; isBoss?: boolean; vx?: number }>) {
      // Enforce alien limit for performance
      if (state.aliens.length >= ALIEN_LIMIT && !action.payload.isBoss) {
        return; // Skip spawning if at limit (bosses always spawn)
      }
      
      const { x, y, type, hp, isBoss = false, vx = 0 } = action.payload;
      state.aliens.push({ 
        id: generateId(), 
        x, 
        y, 
        type, 
        hp, 
        maxHp: hp, 
        isBoss,
        vx 
      });
      if (isBoss) state.bossActive = true;
    },
    tick(state) {
      const currentTime = Date.now();
      
      // ═══════════════════════════════════════════════════
      // 📊 LEVEL CALCULATION (Score-based progression)
      // ═══════════════════════════════════════════════════
      state.previousLevel = state.level;
      state.level = calculateLevelFromScore(state.score);
      state.difficultyBracket = getDifficultyBracket(state.level);
      
      // ═══════════════════════════════════════════════════
      // 🔥 COMBO MULTIPLIER CALCULATION (1x-5x)
      // ═══════════════════════════════════════════════════
      const comboInfo = getComboMultiplier(state.combo);
      state.comboTier = comboInfo.tier;
      
      // ═══════════════════════════════════════════════════
      // ⏳ SOFT LOSS: IDLE DETECTION (15 seconds no shots)
      // ═══════════════════════════════════════════════════
      const IDLE_TIMEOUT = 15000; // 15 seconds
      if (state.combo > 0 && currentTime - state.lastShotTime >= IDLE_TIMEOUT) {
        state.combo = 0;
        state.comboTimer = 0;
      }
      
      // ═══════════════════════════════════════════════════
      // ⏳ SOFT LOSS: MISS WINDOW (3 misses in 10 seconds)
      // ═══════════════════════════════════════════════════
      const MISS_WINDOW = 10000; // 10 seconds
      if (currentTime - state.missWindowStart >= MISS_WINDOW) {
        // Reset window
        state.missesInWindow = 0;
        state.missWindowStart = currentTime;
      }
      
      // ═══════════════════════════════════════════════════
      // ⏱️ COMBO DECAY (Level 50+)
      // ═══════════════════════════════════════════════════
      const pressure = getScorePressure(state.level);
      if (state.combo > 0 && pressure.comboDecay > 0) {
        state.comboTimer -= 16; // ~60fps
        if (state.comboTimer <= 0) {
          state.combo = Math.max(0, state.combo - 1);
          state.comboTimer = 2000;
        }
      }
      
      // Remove expired power-ups (cache currentTime comparison)
      const activePowerUps = state.activePowerUps;
      for (let i = activePowerUps.length - 1; i >= 0; i--) {
        if (activePowerUps[i].expiresAt <= currentTime) {
          activePowerUps.splice(i, 1);
        }
      }
      
      // Cache power-up states for this frame (avoid repeated array scans)
      const hasScoreMultiplier = activePowerUps.some(p => p.type === 'scoreMultiplier');
      const hasSlowMotion = activePowerUps.some(p => p.type === 'slowMotion');
      
      // Update score multiplier based on combo tiers (1x-5x) + power-ups
      const powerUpMultiplier = hasScoreMultiplier ? 2 : 1;
      state.scoreMultiplier = comboInfo.multiplier * powerUpMultiplier;
      
      // ═══════════════════════════════════════════════════
      // 🚀 ALIEN SPEED (Level + Wave scaled + slow motion)
      // ═══════════════════════════════════════════════════
      const alienSpeed = getAlienSpeed(state.level, state.wave, hasSlowMotion);
      
      // ═══════════════════════════════════════════════════
      // 🔄 UPDATE BULLETS (in-place for performance)
      // ═══════════════════════════════════════════════════
      const bullets = state.bullets;
      let bulletWriteIdx = 0;
      for (let i = 0; i < bullets.length; i++) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        // Keep bullet if still in bounds
        if (b.y < 4.5) {
          bullets[bulletWriteIdx++] = b;
        }
      }
      bullets.length = bulletWriteIdx;
      
      // ═══════════════════════════════════════════════════
      // 👾 ALIEN MOVEMENT (in-place update)
      // ═══════════════════════════════════════════════════
      const aliens = state.aliens;
      for (let i = 0; i < aliens.length; i++) {
        const a = aliens[i];
        if (a.vx) {
          a.x += a.vx;
          // Bounce off walls
          if (Math.abs(a.x) > 3.5) {
            a.vx = -a.vx;
            a.x += a.vx;
          }
        }
        a.y -= alienSpeed;
      }
      
      // ═══════════════════════════════════════════════════
      // 💥 OPTIMIZED COLLISION DETECTION
      // ═══════════════════════════════════════════════════
      // Uses squared distance (avoid sqrt), early exit, spatial checks
      const destroyedAliens: Alien[] = [];
      const bulletsToRemove: Set<string> = new Set();
      
      // Sort aliens by Y for better cache locality (optional optimization)
      for (let bi = 0; bi < bullets.length; bi++) {
        const b = bullets[bi];
        if (bulletsToRemove.has(b.id)) continue;
        
        // Early Y-bounds check for bullet
        if (b.y < -4 || b.y > 5) continue;
        
        for (let ai = 0; ai < aliens.length; ai++) {
          const a = aliens[ai];
          
          // Early Y distance check (cheap)
          const dy = a.y - b.y;
          if (dy > 0.5 || dy < -0.5) continue;
          
          // Full distance check with squared radius
          const dx = a.x - b.x;
          const distSq = dx * dx + dy * dy;
          const hitRadiusSq = a.isBoss ? HIT_RADIUS_BOSS : HIT_RADIUS_NORMAL;
          
          if (distSq < hitRadiusSq) {
            bulletsToRemove.add(b.id);
            state.shotsHit += 1; // Track successful hits
            
            // Reduce HP
            const alienIndex = state.aliens.findIndex(alien => alien.id === a.id);
            if (alienIndex >= 0) {
              state.aliens[alienIndex].hp -= 1;
              
              // Check if destroyed
              if (state.aliens[alienIndex].hp <= 0) {
                destroyedAliens.push(state.aliens[alienIndex]);
              }
            }
            break; // Bullet can only hit one alien
          }
        }
      }
      
      // ═══════════════════════════════════════════════════
      // 🎁 PROCESS KILLS & REWARDS
      // ═══════════════════════════════════════════════════
      for (const alien of destroyedAliens) {
        const reward = alienRewards[alien.type];
        
        // Combo increase (capped at 50+ for PERFECT tier)
        state.combo += 1;
        state.maxCombo = Math.max(state.maxCombo, state.combo);
        state.comboTimer = 2000;
        state.totalKills += 1;
        state.waveKills += 1;
        state.escapeStreak = 0; // Reset escape streak on kill
        
        // Perfect combo bonus at 50+
        if (state.combo === 50) {
          state.score += PERFECT_COMBO_BONUS;
        }
        
        // Boss gives extra points
        const bossMultiplier = alien.isBoss ? 5 : 1;
        state.score += Math.floor(reward.points * state.scoreMultiplier * bossMultiplier);
        
        // Power-up drop chance (reduced at high levels)
        const dropChance = getPowerUpDropChance(state.level);
        const shouldDrop = alien.isBoss || Math.random() < dropChance;
        
        if (shouldDrop) {
          const powerUpDuration = getPowerUpDuration(state.level);
          const expiresAt = currentTime + powerUpDuration;
          
          if (reward.powerUp === 'shield') {
            state.lives = Math.min(3, state.lives + 1);
            state.powerUpsCollected += 1; // Track shield as power-up
          } else {
            const existingIndex = state.activePowerUps.findIndex(p => p.type === reward.powerUp);
            if (existingIndex >= 0) {
              state.activePowerUps[existingIndex].expiresAt = expiresAt;
            } else {
              state.activePowerUps.push({ type: reward.powerUp, expiresAt });
            }
            state.powerUpsCollected += 1; // Track power-up collection
          }
        }
        
        // Clear boss flag if boss defeated
        if (alien.isBoss) {
          state.bossActive = false;
          
          // ═══════════════════════════════════════════════════
          // 🏆 VICTORY CONDITIONS (Boss defeats at L10/L50/L100)
          // ═══════════════════════════════════════════════════
          if (state.level >= 100) {
            // Ultimate Victory: Level 100 boss defeated
            state.status = 'victory';
            state.victoryType = 'ultimate';
            state.victoryTitle = 'COSMIC SAVIOR';
          } else if (state.level >= 50) {
            // Major Victory: Level 50 boss defeated
            state.status = 'victory';
            state.victoryType = 'major';
            state.victoryTitle = 'ELITE SECTOR';
          } else if (state.level >= 10) {
            // Minor Victory: Level 10 boss defeated
            state.status = 'victory';
            state.victoryType = 'minor';
            state.victoryTitle = 'SECTOR CLEARED';
          }
        }
      }
      
      // Remove destroyed aliens
      state.aliens = state.aliens.filter(a => a.hp > 0);
      
      // Remove bullets that hit
      state.bullets = state.bullets.filter(b => !bulletsToRemove.has(b.id));
      
      // ═══════════════════════════════════════════════════
      // 🚀 CANNON-ALIEN COLLISION (Immediate loss on collision)
      // ═══════════════════════════════════════════════════
      const CANNON_HIT_RADIUS = 0.5; // Player cannon hitbox radius
      const CANNON_HIT_RADIUS_SQ = CANNON_HIT_RADIUS * CANNON_HIT_RADIUS;
      for (const a of state.aliens) {
        const dx = a.x - state.playerX;
        const dy = a.y - state.playerY;
        const distSq = dx * dx + dy * dy;
        
        // Alien collision with cannon
        if (distSq < CANNON_HIT_RADIUS_SQ) {
          state.lives -= 1;
          state.combo = 0;
          
          // Remove the alien that hit the cannon
          state.aliens = state.aliens.filter(alien => alien.id !== a.id);
          
          // Game over if no lives left
          if (state.lives <= 0) {
            state.lives = 0;
            state.status = 'gameOver';
          }
          break; // Only one collision per tick
        }
      }
      
      // ═══════════════════════════════════════════════════
      // ☠️ ALIENS REACHING BOTTOM (Life loss + score penalty)
      // ═══════════════════════════════════════════════════
      const MISS_THRESHOLD = 3; // 3 misses in window resets combo
      for (const a of state.aliens) {
        if (a.y < -3) {
          state.lives = Math.max(0, state.lives - 1);
          state.missedAliens += 1;
          state.escapeStreak += 1;
          state.missesInWindow += 1;
          
          // Soft loss: Reset combo if 3 misses within 10 seconds
          if (state.missesInWindow >= MISS_THRESHOLD) {
            state.combo = 0;
            state.comboTimer = 0;
            state.missesInWindow = 0;
            state.missWindowStart = currentTime;
          }
          
          // Immediate game over if boss reaches bottom
          if (a.isBoss) {
            state.status = 'gameOver';
            state.lives = 0;
          }
          
          // Screen overflow: 5+ aliens escaped = game over
          if (state.escapeStreak >= 5) {
            state.status = 'gameOver';
            state.lives = 0;
          }
          
          // Score penalty at high levels
          if (pressure.missedPenalty > 0) {
            state.score = Math.max(0, state.score - pressure.missedPenalty);
          }
          
          state.aliens = state.aliens.filter(alien => alien.id !== a.id);
          
          if (state.lives === 0) {
            state.status = 'gameOver';
          }
        }
      }
    },
    reset(state) {
      Object.assign(state, initialState);
      state.waveStartTime = Date.now();
      state.lastShotTime = Date.now();
      state.missWindowStart = Date.now();
      state.gameStartTime = Date.now(); // Reset game start time for accurate play time tracking
    },
    setGameStatus(state, action: PayloadAction<GameState['status']>) {
      state.status = action.payload;
    },
    setDifficultyMode(state, action: PayloadAction<DifficultyMode>) {
      state.difficultyMode = action.payload;
    },
    // Show wave notification (non-blocking)
    showWaveNotification(state, action: PayloadAction<{ wave: number; level: number; bossName?: string }>) {
      state.showWaveNotification = true;
      state.waveNotificationData = action.payload;
    },
    // Hide wave notification
    hideWaveNotification(state) {
      state.showWaveNotification = false;
      state.waveNotificationData = null;
    },
    // Continue game after victory (for minor/major victories)
    continueAfterVictory(state) {
      state.status = 'playing';
      state.victoryType = null;
      state.victoryTitle = '';
    },
    // Advance to next wave
    // Advance to next wave (non-blocking with floating notification)
    nextWave(state) {
      const currentWave = state.wave;
      
      // Award wave clear bonus
      state.score += getWaveClearBonus(currentWave, state.level);
      state.wavesCompleted += 1; // Track wave completion
      
      if (currentWave >= 5) {
        // Level complete - check for boss level
        if (isBossLevel(state.level)) {
          state.status = 'boss';
          // Show boss notification
          state.showWaveNotification = true;
          state.waveNotificationData = { wave: 5, level: state.level, bossName: 'BOSS INCOMING' };
        } else {
          // Next level starts at wave 1 - game continues (non-blocking)
          state.wave = 1;
          // Show wave notification without blocking gameplay
          state.showWaveNotification = true;
          state.waveNotificationData = { wave: 1, level: state.level + 1 };
          // Keep playing - no status change
        }
      } else {
        // Advance wave - game continues (non-blocking)
        state.wave = (currentWave + 1) as WaveNumber;
        // Show wave notification without blocking gameplay
        state.showWaveNotification = true;
        state.waveNotificationData = { wave: state.wave, level: state.level };
        // Keep playing - no status change
      }
      
      state.waveKills = 0;
      state.waveEnemiesSpawned = 0;
      state.waveStartTime = Date.now();
    },
    // Start wave (after transition)
    startWave(state) {
      state.status = 'playing';
      state.waveStartTime = Date.now();
    },
    // Start boss fight
    startBoss(state) {
      state.status = 'boss';
      state.aliens = []; // Clear regular aliens before boss
    },
    // Track spawned enemies for wave
    incrementWaveSpawns(state) {
      state.waveEnemiesSpawned += 1;
    },
    incrementScore(state, action: PayloadAction<number>) {
      state.score += action.payload;
    },
    // Spawn boss at specific level milestones
    spawnBoss(state, action: PayloadAction<{ hp: number; type: AlienType; name?: string }>) {
      const id = 'boss-' + generateId();
      const { hp, type } = action.payload;
      state.aliens.push({
        id,
        x: 0,
        y: 4.5,
        type,
        hp,
        maxHp: hp,
        isBoss: true,
        vx: 0.02 // Boss weaves
      });
      state.bossActive = true;
      state.bossHP = hp;
      state.bossMaxHP = hp;
      state.status = 'boss';
    },
    // Update boss HP (for UI)
    updateBossHP(state, action: PayloadAction<number>) {
      state.bossHP = action.payload;
      if (state.bossHP <= 0) {
        state.bossActive = false;
      }
    },
    // Set victory
    setVictory(state) {
      state.status = 'victory';
    },
  },
});

export const { 
  move, 
  fire, 
  spawnAlien, 
  tick, 
  reset, 
  setGameStatus, 
  setDifficultyMode,
  showWaveNotification,
  hideWaveNotification,
  continueAfterVictory,
  nextWave,
  startWave,
  startBoss,
  incrementWaveSpawns,
  incrementScore, 
  spawnBoss,
  updateBossHP,
  setVictory
} = gameSlice.actions;
export { gameSlice };
export default gameSlice.reducer;
