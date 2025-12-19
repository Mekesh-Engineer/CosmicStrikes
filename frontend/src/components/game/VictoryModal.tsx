import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { reset, setGameStatus, continueAfterVictory } from '../../features/game';
import { setHighScore } from '../../features/profileSlice';
import { useAuth } from '../../hooks/useAuth';
import { api, GameStats, LeaderboardEntry } from '../../lib/api';

/**
 * 🏆 VICTORY MODAL
 * Displays victory screen for minor, major, and ultimate victories.
 * - Minor (L10): "Sector Cleared" - Can continue playing
 * - Major (L50): "Elite Sector" title - Can continue playing
 * - Ultimate (L100): "Cosmic Savior" + End credits - Final victory
 * 
 * Features comprehensive stats display, leaderboard persistence,
 * and displays current global high score from leaderboard.
 */
const VictoryModal: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const {
        score,
        level,
        wave,
        status,
        victoryType,
        victoryTitle,
        totalKills,
        maxCombo,
        shotsFired,
        shotsHit,
        gameStartTime,
        powerUpsCollected,
        wavesCompleted,
        difficultyBracket,
        difficultyMode
    } = useAppSelector((state) => state.game);
    const { highScore, settings } = useAppSelector((state) => state.profile);

    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [serverHighScore, setServerHighScore] = useState<boolean>(false);
    const [showCredits, setShowCredits] = useState(false);

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

    const isNewRecord = score > highScore;

    // Submit comprehensive game stats on victory
    useEffect(() => {
        if (status === 'victory' && victoryType) {
            if (isNewRecord) {
                dispatch(setHighScore(score));
            }

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
                        // Fallback to legacy submitScore
                        api.submitScore(score, level, settings?.difficulty || 'normal', accuracy)
                            .then((result) => {
                                setSubmitted(true);
                                setServerHighScore(result.newHighScore);
                            })
                            .catch((fallbackErr) => {
                                setSubmitError(fallbackErr.message || 'Failed to submit score');
                            });
                    })
                    .finally(() => setSubmitting(false));
            }
        }
    }, [status, victoryType, score, level, wave, isNewRecord, dispatch, isAuthenticated, submitted, settings?.difficulty, difficultyMode, totalKills, maxCombo, accuracy, playTimeSeconds, shotsFired, shotsHit, powerUpsCollected, wavesCompleted, difficultyBracket]);

    // Reset on leave
    useEffect(() => {
        if (status === 'playing') {
            setSubmitted(false);
            setServerHighScore(false);
            setSubmitError(null);
            setTopScore(null);
        }
    }, [status]);

    // Fetch leaderboard to show global high score when victory
    useEffect(() => {
        if (status === 'victory' && victoryType) {
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
    }, [status, victoryType]);

    if (status !== 'victory' || !victoryType) return null;

    const handleContinue = () => {
        dispatch(continueAfterVictory());
    };

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

    // Victory configurations
    const victoryConfig = {
        minor: {
            title: 'SECTOR CLEARED',
            subtitle: 'Training Complete',
            description: 'You have defeated the Scout Commander and cleared the training sector.',
            icon: '🎖️',
            color: '#22c55e',
            glow: 'rgba(34, 197, 94, 0.5)',
            canContinue: true,
        },
        major: {
            title: 'ELITE SECTOR',
            subtitle: 'Title Unlocked',
            description: 'You have proven yourself by defeating the Elite Vanguard. You are now an Elite Pilot!',
            icon: '🏆',
            color: '#f59e0b',
            glow: 'rgba(245, 158, 11, 0.5)',
            canContinue: true,
        },
        ultimate: {
            title: 'COSMIC SAVIOR',
            subtitle: 'The Galaxy Is Safe',
            description: 'Against all odds, you have defeated the Cosmic Behemoth and saved the galaxy!',
            icon: '👑',
            color: '#ec4899',
            glow: 'rgba(236, 72, 153, 0.5)',
            canContinue: false,
        },
    };

    const config = victoryConfig[victoryType];

    // Ultimate victory credits
    if (victoryType === 'ultimate' && showCredits) {
        return (
            <div className="fixed inset-0 z-[var(--z-modal)] bg-black flex items-center justify-center">
                <div className="text-center animate-fade-in space-y-8">
                    <div className="text-6xl mb-8">👑</div>
                    <h1 className="text-5xl font-orbitron font-black text-gradient-primary tracking-widest">
                        COSMIC SAVIOR
                    </h1>
                    <p className="text-xl text-gray-400 max-w-md mx-auto">
                        The galaxy will forever remember your name among the stars.
                    </p>

                    <div className="mt-12 space-y-4 text-gray-500 animate-scroll-up">
                        <p className="text-sm uppercase tracking-[0.5em]">Created By</p>
                        <p className="text-lg text-white">Cosmic Strikes Team</p>
                        <div className="h-8" />
                        <p className="text-sm uppercase tracking-[0.5em]">Special Thanks</p>
                        <p className="text-lg text-white">You, the Player</p>
                    </div>

                    <button
                        onClick={handleQuit}
                        className="mt-12 px-8 py-3 bg-[var(--brand-primary)] text-black font-bold rounded-xl hover:scale-105 transition-transform"
                    >
                        RETURN HOME
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/90 backdrop-blur-md animate-fade-in"
                onClick={handleQuit}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-[var(--radius-2xl)] shadow-2xl overflow-hidden animate-bounce-in">

                {/* Top bar with victory color */}
                <div
                    className="absolute top-0 inset-x-0 h-1.5"
                    style={{
                        background: `linear-gradient(90deg, ${config.color}, var(--brand-primary), ${config.color})`
                    }}
                />

                {/* Background glow */}
                <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                        background: `radial-gradient(circle at center, ${config.color} 0%, transparent 70%)`
                    }}
                />

                <div className="p-8 text-center relative z-10">
                    {/* Icon */}
                    <div className="text-6xl mb-4 animate-bounce">{config.icon}</div>

                    {/* Title */}
                    <h2
                        className="text-4xl font-black font-orbitron tracking-widest mb-2"
                        style={{
                            color: config.color,
                            textShadow: `0 0 30px ${config.glow}`
                        }}
                    >
                        {config.title}
                    </h2>
                    <p className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-[0.2em] mb-4">
                        {config.subtitle}
                    </p>
                    <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
                        {config.description}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)]">
                            <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Level</p>
                            <p className="text-lg font-orbitron font-bold" style={{ color: config.color }}>{level}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)]">
                            <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Kills</p>
                            <p className="text-lg font-orbitron font-bold text-green-400">{totalKills}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)]">
                            <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Combo</p>
                            <p className="text-lg font-orbitron font-bold text-yellow-400">x{maxCombo}</p>
                        </div>
                    </div>

                    {/* Secondary Stats */}
                    <div className="grid grid-cols-4 gap-2 mb-6">
                        <div className="p-2 rounded-lg bg-[var(--bg-primary)]/50 border border-[var(--border-divider)]">
                            <p className="text-[8px] text-[var(--text-muted)] uppercase">Accuracy</p>
                            <p className="text-sm font-bold font-orbitron text-cyan-400">{accuracy}%</p>
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
                            <p className="text-[8px] text-[var(--text-muted)] uppercase">Power-Ups</p>
                            <p className="text-sm font-bold font-orbitron text-purple-400">{powerUpsCollected}</p>
                        </div>
                    </div>

                    {/* Score */}
                    <div className="py-6 px-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] mb-6">
                        {(isNewRecord || serverHighScore) && (
                            <div
                                className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full mb-2 animate-pulse"
                                style={{ backgroundColor: config.color, color: 'black' }}
                            >
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

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        {config.canContinue && (
                            <button
                                onClick={handleContinue}
                                className="w-full py-3.5 rounded-xl font-bold tracking-wide hover-lift focus-ring group relative overflow-hidden"
                                style={{ backgroundColor: config.color, color: 'black' }}
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    <span className="material-icons">arrow_forward</span>
                                    CONTINUE MISSION
                                </span>
                            </button>
                        )}

                        {victoryType === 'ultimate' && (
                            <button
                                onClick={() => setShowCredits(true)}
                                className="w-full py-3.5 rounded-xl font-bold tracking-wide hover-lift focus-ring group relative overflow-hidden"
                                style={{ backgroundColor: config.color, color: 'black' }}
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    <span className="material-icons">movie</span>
                                    VIEW CREDITS
                                </span>
                            </button>
                        )}

                        <button
                            onClick={handleRetry}
                            className="w-full py-3 rounded-xl border border-[var(--border-primary)] bg-transparent text-[var(--text-secondary)] font-bold hover:bg-[var(--bg-tertiary)] transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-icons text-lg">refresh</span>
                            NEW GAME
                        </button>

                        <button
                            onClick={handleViewLeaderboard}
                            className="w-full py-3 rounded-xl border border-[var(--border-accent)] bg-transparent text-[var(--brand-accent)] font-bold hover:bg-[var(--brand-accent)]/10 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-icons text-lg">leaderboard</span>
                            VIEW LEADERBOARD
                        </button>

                        <button
                            onClick={handleQuit}
                            className="w-full py-2.5 rounded-xl text-[var(--text-muted)] font-medium hover:text-white transition-all"
                        >
                            RETURN TO MAIN MENU
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VictoryModal;
