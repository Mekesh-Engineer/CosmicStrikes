import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { reset, setGameStatus } from '../../features/game';
import { setHighScore } from '../../features/profileSlice';
import { useAuth } from '../../hooks/useAuth';
import { api, GameStats, LeaderboardEntry } from '../../lib/api';

/**
 * 💀 GAME OVER MODAL
 * 
 * Post-game screen displaying comprehensive stats and actionable options:
 * - Replay the game
 * - Quit to main menu
 * - View leaderboard
 * - Stats persistence to leaderboard
 * - Shows current global high score from leaderboard
 */
const GameOverModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Connect to Redux State - now with extended stats
  const {
    score,
    level,
    wave,
    status,
    totalKills,
    maxCombo,
    difficultyBracket,
    shotsFired,
    shotsHit,
    gameStartTime,
    powerUpsCollected,
    wavesCompleted,
    difficultyMode
  } = useAppSelector((state) => state.game);

  const { highScore, settings } = useAppSelector((state) => state.profile);

  // Local state
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [serverHighScore, setServerHighScore] = useState<boolean>(false);

  // Leaderboard state - fetch global high score
  const [topScore, setTopScore] = useState<LeaderboardEntry | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Calculate derived stats
  const accuracy = useMemo(() => {
    if (shotsFired === 0) return 0;
    return Math.round((shotsHit / shotsFired) * 100);
  }, [shotsFired, shotsHit]);

  const playTimeSeconds = useMemo(() => {
    return Math.round((Date.now() - gameStartTime) / 1000);
  }, [gameStartTime]);

  const playTimeFormatted = useMemo(() => {
    const minutes = Math.floor(playTimeSeconds / 60);
    const seconds = playTimeSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [playTimeSeconds]);

  // Check for new high score
  const isNewRecord = score > highScore;

  // Submit comprehensive game stats to leaderboard
  useEffect(() => {
    if (status === 'gameOver') {
      // Update local high score
      if (isNewRecord) {
        dispatch(setHighScore(score));
      }

      // Submit extended stats to server if authenticated
      if (isAuthenticated && !submitted) {
        setSubmitting(true);
        setSubmitError(null);

        const gameStats: GameStats = {
          score,
          level,
          wave,
          difficulty: settings?.difficulty || difficultyMode || 'normal',
          totalKills,
          maxCombo,
          accuracy,
          playTimeSeconds,
          shotsFired,
          shotsHit,
          powerUpsCollected,
          wavesCompleted,
          difficultyBracket
        };

        api.submitGameStats(gameStats)
          .then((result) => {
            setSubmitted(true);
            setServerHighScore(result.newHighScore);
          })
          .catch((err) => {
            // Fallback to legacy submitScore if extended stats endpoint fails
            api.submitScore(score, level, settings?.difficulty || 'normal', accuracy)
              .then((result) => {
                setSubmitted(true);
                setServerHighScore(result.newHighScore);
              })
              .catch((fallbackErr) => {
                setSubmitError(fallbackErr.message || 'Failed to submit score');
              });
          })
          .finally(() => {
            setSubmitting(false);
          });
      }
    }
  }, [status, score, level, wave, isNewRecord, dispatch, isAuthenticated, submitted, settings?.difficulty, difficultyMode, totalKills, maxCombo, accuracy, playTimeSeconds, shotsFired, shotsHit, powerUpsCollected, wavesCompleted, difficultyBracket]);

  // Reset submitted state when game restarts
  useEffect(() => {
    if (status === 'playing') {
      setSubmitted(false);
      setServerHighScore(false);
      setSubmitError(null);
      setTopScore(null);
    }
  }, [status]);

  // Fetch leaderboard to show global high score when game ends
  useEffect(() => {
    if (status === 'gameOver') {
      setLoadingLeaderboard(true);
      api.getLeaderboard(1)
        .then((result) => {
          if (result.leaderboard.length > 0) {
            setTopScore(result.leaderboard[0]);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch leaderboard:', err);
        })
        .finally(() => {
          setLoadingLeaderboard(false);
        });
    }
  }, [status]);

  if (status !== 'gameOver') return null;

  const handleRetry = () => {
    dispatch(reset());
    dispatch(setGameStatus('playing'));
  };

  const handleQuit = () => {
    dispatch(reset());
    dispatch(setGameStatus('idle'));
    navigate('/');
  };

  const handleViewLeaderboard = () => {
    dispatch(reset());
    dispatch(setGameStatus('idle'));
    navigate('/leaderboard');
  };

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
      {/* 🌑 BACKDROP (Blur & Darken) */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-md animate-fade-in"
        onClick={handleQuit}
      />

      {/* 🚀 MODAL CONTENT */}
      <div className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-[var(--radius-2xl)] shadow-2xl overflow-hidden animate-bounce-in">

        {/* Decorative Top Bar (Red for Danger/Game Over) */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-600 via-[var(--brand-primary)] to-red-600" />

        {/* Background Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--brand-primary)_0%,_transparent_70%)] opacity-5 pointer-events-none" />

        <div className="p-8 text-center relative z-10">

          {/* HEADER */}
          <div className="mb-6">
            <div className="text-5xl mb-3">💀</div>
            <h2 className="text-4xl font-black font-orbitron text-white tracking-widest drop-shadow-[0_0_15px_rgba(239,68,68,0.6)] mb-2">
              MISSION FAILED
            </h2>
            <p className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-[0.2em]">
              Signal Lost in Sector {level} • Wave {wave}
            </p>
          </div>

          {/* SCORE CARD */}
          <div className="relative py-6 px-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] mb-6">
            {(isNewRecord || serverHighScore) && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[var(--brand-accent)] text-black text-[10px] font-bold uppercase tracking-widest rounded-full shadow-[0_0_15px_var(--glow-accent)] animate-pulse">
                {serverHighScore ? '🏆 New Global High Score!' : '⭐ New Personal Best!'}
              </div>
            )}

            <p className="text-xs text-[var(--text-secondary)] font-bold uppercase mb-1">Final Score</p>
            <p className="text-5xl font-black font-orbitron text-gradient-primary tracking-tight">
              {score.toLocaleString()}
            </p>

            {/* Score comparison section */}
            <div className="mt-3 flex justify-center gap-4 text-xs">
              {!isNewRecord && (
                <div className="text-[var(--text-muted)]">
                  Your Best: <span className="text-[var(--text-primary)] font-bold">{highScore.toLocaleString()}</span>
                </div>
              )}
              {topScore && (
                <div className="text-[var(--text-muted)]">
                  {loadingLeaderboard ? (
                    <span className="animate-pulse">Loading top score...</span>
                  ) : (
                    <>
                      🏆 Global #1: <span className="text-[var(--brand-accent)] font-bold">{topScore.highScore.toLocaleString()}</span>
                      <span className="text-[var(--text-muted)]"> by {topScore.username}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Submission Status */}
            {isAuthenticated && (
              <div className="mt-3 pt-3 border-t border-[var(--border-divider)]">
                {submitting && (
                  <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
                    <span className="material-icons text-sm animate-spin">sync</span>
                    Syncing to leaderboard...
                  </div>
                )}
                {submitted && !submitError && (
                  <div className="flex items-center justify-center gap-2 text-xs text-green-400">
                    <span className="material-icons text-sm">cloud_done</span>
                    Stats saved to leaderboard
                  </div>
                )}
                {submitError && (
                  <div className="flex items-center justify-center gap-2 text-xs text-red-400">
                    <span className="material-icons text-sm">error_outline</span>
                    {submitError}
                  </div>
                )}
              </div>
            )}
            {!isAuthenticated && (
              <p className="text-xs text-[var(--text-muted)] mt-3 pt-3 border-t border-[var(--border-divider)]">
                🔑 Log in to save your score to the leaderboard
              </p>
            )}
          </div>

          {/* COMPREHENSIVE STATS GRID */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)]">
              <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Kills</p>
              <p className="text-lg font-bold font-orbitron text-green-400">{totalKills}</p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)]">
              <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Max Combo</p>
              <p className="text-lg font-bold font-orbitron text-yellow-400">x{maxCombo}</p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)]">
              <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Accuracy</p>
              <p className="text-lg font-bold font-orbitron text-cyan-400">{accuracy}%</p>
            </div>
          </div>

          {/* SECONDARY STATS ROW */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            <div className="p-2 rounded-lg bg-[var(--bg-primary)]/50 border border-[var(--border-divider)]">
              <p className="text-[8px] text-[var(--text-muted)] uppercase">Level</p>
              <p className="text-sm font-bold font-orbitron text-[var(--text-primary)]">{level}</p>
            </div>
            <div className="p-2 rounded-lg bg-[var(--bg-primary)]/50 border border-[var(--border-divider)]">
              <p className="text-[8px] text-[var(--text-muted)] uppercase">Waves</p>
              <p className="text-sm font-bold font-orbitron text-[var(--text-primary)]">{wavesCompleted}</p>
            </div>
            <div className="p-2 rounded-lg bg-[var(--bg-primary)]/50 border border-[var(--border-divider)]">
              <p className="text-[8px] text-[var(--text-muted)] uppercase">Time</p>
              <p className="text-sm font-bold font-orbitron text-[var(--text-primary)]">{playTimeFormatted}</p>
            </div>
            <div className="p-2 rounded-lg bg-[var(--bg-primary)]/50 border border-[var(--border-divider)]">
              <p className="text-[8px] text-[var(--text-muted)] uppercase">Sector</p>
              <p className="text-sm font-bold font-orbitron text-purple-400 truncate">{difficultyBracket.toUpperCase()}</p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col gap-3">
            {/* Primary: Retry */}
            <button
              onClick={handleRetry}
              className="w-full py-3.5 rounded-xl bg-[var(--gradient-button)] text-[var(--text-inverse)] font-bold tracking-wide hover-lift focus-ring group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span className="material-icons group-hover:rotate-180 transition-transform duration-500">refresh</span>
                PLAY AGAIN
              </span>
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
            </button>

            {/* Secondary: View Leaderboard */}
            <button
              onClick={handleViewLeaderboard}
              className="w-full py-3 rounded-xl border border-[var(--border-accent)] bg-transparent text-[var(--brand-accent)] font-bold hover:bg-[var(--brand-accent)]/10 transition-all focus-ring flex items-center justify-center gap-2"
            >
              <span className="material-icons text-lg">leaderboard</span>
              VIEW LEADERBOARD
            </button>

            {/* Tertiary: Quit */}
            <button
              onClick={handleQuit}
              className="w-full py-3 rounded-xl border border-[var(--border-primary)] bg-transparent text-[var(--text-muted)] font-medium hover:bg-[var(--bg-tertiary)] hover:text-white transition-all focus-ring"
            >
              RETURN TO MAIN MENU
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GameOverModal;