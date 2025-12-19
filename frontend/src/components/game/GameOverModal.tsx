import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { reset, setGameStatus } from '../../features/game';
import { setHighScore } from '../../features/profileSlice';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';

const GameOverModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Connect to Redux State
  const { score, level, wave, status, totalKills, maxCombo, difficultyBracket } = useAppSelector((state) => state.game);
  const { highScore } = useAppSelector((state) => state.profile);
  const { settings } = useAppSelector((state) => state.profile);

  // Local state
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [serverHighScore, setServerHighScore] = useState<boolean>(false);

  // Check for new high score
  const isNewRecord = score > highScore;

  // Submit score and sync high score on game over
  useEffect(() => {
    if (status === 'gameOver') {
      // Update local high score
      if (isNewRecord) {
        dispatch(setHighScore(score));
      }

      // Submit to server if authenticated
      if (isAuthenticated && !submitted) {
        setSubmitting(true);
        setSubmitError(null);

        api.submitScore(score, level, settings?.difficulty || 'normal', 0)
          .then((result) => {
            setSubmitted(true);
            setServerHighScore(result.newHighScore);
          })
          .catch((err) => {
            setSubmitError(err.message || 'Failed to submit score');
          })
          .finally(() => {
            setSubmitting(false);
          });
      }
    }
  }, [status, score, level, isNewRecord, dispatch, isAuthenticated, submitted, settings?.difficulty]);

  // Reset submitted state when game restarts
  useEffect(() => {
    if (status === 'playing') {
      setSubmitted(false);
      setServerHighScore(false);
      setSubmitError(null);
    }
  }, [status]);

  if (status !== 'gameOver') return null;

  const handleRetry = () => {
    dispatch(reset());
    dispatch(setGameStatus('playing'));
  };

  const handleQuit = () => {
    dispatch(reset()); // Reset state before leaving
    dispatch(setGameStatus('idle'));
    navigate('/');
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
          <div className="mb-8">
            <h2 className="text-4xl font-black font-orbitron text-white tracking-widest drop-shadow-[0_0_15px_rgba(239,68,68,0.6)] mb-2">
              MISSION FAILED
            </h2>
            <p className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-[0.2em]">
              Signal Lost in Sector {level} • Wave {wave}
            </p>
          </div>

          {/* STATS ROW */}
          <div className="flex justify-center gap-6 mb-6">
            <div className="text-center">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Kills</p>
              <p className="text-xl font-orbitron font-bold text-green-400">{totalKills}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Max Combo</p>
              <p className="text-xl font-orbitron font-bold text-yellow-400">x{maxCombo}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Sector</p>
              <p className="text-xl font-orbitron font-bold text-purple-400">{difficultyBracket.toUpperCase()}</p>
            </div>
          </div>

          {/* SCORE CARD */}
          <div className="relative py-6 px-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] mb-8">
            {(isNewRecord || serverHighScore) && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[var(--brand-accent)] text-black text-[10px] font-bold uppercase tracking-widest rounded-full shadow-[0_0_15px_var(--glow-accent)] animate-pulse">
                {serverHighScore ? '🏆 New Global High Score!' : 'New Personal Best!'}
              </div>
            )}

            <p className="text-xs text-[var(--text-secondary)] font-bold uppercase mb-1">Final Score</p>
            <p className="text-5xl font-black font-orbitron text-gradient-primary tracking-tight">
              {score.toLocaleString()}
            </p>

            {!isNewRecord && !serverHighScore && (
              <p className="text-xs text-[var(--text-muted)] mt-2">
                Personal Best: <span className="text-[var(--text-primary)]">{highScore.toLocaleString()}</span>
              </p>
            )}

            {/* Submission Status */}
            {isAuthenticated && (
              <div className="mt-3 pt-3 border-t border-[var(--border-divider)]">
                {submitting && (
                  <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
                    <span className="material-icons text-sm animate-spin">sync</span>
                    Syncing score...
                  </div>
                )}
                {submitted && !submitError && (
                  <div className="flex items-center justify-center gap-2 text-xs text-green-400">
                    <span className="material-icons text-sm">cloud_done</span>
                    Score synced to leaderboard
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
                Log in to save your score to the leaderboard
              </p>
            )}
          </div>

          {/* STATS GRID */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)]">
              <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Wave Reached</p>
              <p className="text-xl font-bold font-orbitron text-[var(--text-primary)]">{level}</p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)]">
              <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Accuracy</p>
              {/* Mock data for visual completeness - connect to real stats if available */}
              <p className="text-xl font-bold font-orbitron text-[var(--text-primary)]">87%</p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleRetry}
              className="w-full py-3.5 rounded-xl bg-[var(--gradient-button)] text-[var(--text-inverse)] font-bold tracking-wide hover-lift focus-ring group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span className="material-icons group-hover:rotate-180 transition-transform duration-500">refresh</span>
                RETRY MISSION
              </span>
              {/* Shimmer effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
            </button>

            <button
              onClick={handleQuit}
              className="w-full py-3.5 rounded-xl border border-[var(--border-primary)] bg-transparent text-[var(--text-secondary)] font-bold hover:bg-[var(--bg-tertiary)] hover:text-white transition-all focus-ring"
            >
              RETURN TO BASE
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GameOverModal;