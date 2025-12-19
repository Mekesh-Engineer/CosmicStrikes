import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { reset, setGameStatus, continueAfterVictory } from '../../features/game';
import { setHighScore } from '../../features/profileSlice';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';

/**
 * 🏆 VICTORY MODAL
 * Displays victory screen for minor, major, and ultimate victories.
 * - Minor (L10): "Sector Cleared" - Can continue playing
 * - Major (L50): "Elite Sector" title - Can continue playing
 * - Ultimate (L100): "Cosmic Savior" + End credits - Final victory
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
        maxCombo
    } = useAppSelector((state) => state.game);
    const { highScore, settings } = useAppSelector((state) => state.profile);

    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [showCredits, setShowCredits] = useState(false);

    const isNewRecord = score > highScore;

    // Submit score on victory
    useEffect(() => {
        if (status === 'victory' && victoryType) {
            if (isNewRecord) {
                dispatch(setHighScore(score));
            }

            if (isAuthenticated && !submitted) {
                setSubmitting(true);
                api.submitScore(score, level, settings?.difficulty || 'normal', 0)
                    .then(() => setSubmitted(true))
                    .catch(console.error)
                    .finally(() => setSubmitting(false));
            }
        }
    }, [status, victoryType, score, level, isNewRecord, dispatch, isAuthenticated, submitted, settings?.difficulty]);

    // Reset on leave
    useEffect(() => {
        if (status === 'playing') {
            setSubmitted(false);
        }
    }, [status]);

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
                    <div className="flex justify-center gap-6 mb-6">
                        <div className="text-center">
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Level</p>
                            <p className="text-xl font-orbitron font-bold" style={{ color: config.color }}>{level}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Kills</p>
                            <p className="text-xl font-orbitron font-bold text-green-400">{totalKills}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Max Combo</p>
                            <p className="text-xl font-orbitron font-bold text-yellow-400">x{maxCombo}</p>
                        </div>
                    </div>

                    {/* Score */}
                    <div className="py-6 px-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] mb-8">
                        {isNewRecord && (
                            <div
                                className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full mb-2 animate-pulse"
                                style={{ backgroundColor: config.color, color: 'black' }}
                            >
                                🏆 New High Score!
                            </div>
                        )}
                        <p className="text-xs text-[var(--text-secondary)] font-bold uppercase mb-1">Final Score</p>
                        <p className="text-5xl font-black font-orbitron text-gradient-primary tracking-tight">
                            {score.toLocaleString()}
                        </p>

                        {submitting && (
                            <p className="text-xs text-gray-500 mt-2 animate-pulse">Syncing score...</p>
                        )}
                        {submitted && (
                            <p className="text-xs text-green-400 mt-2">✓ Score saved to leaderboard</p>
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
                            className="w-full py-3 rounded-xl border border-[var(--border-primary)] bg-transparent text-[var(--text-secondary)] font-bold hover:bg-[var(--bg-tertiary)] transition-all"
                        >
                            NEW GAME
                        </button>

                        <button
                            onClick={handleQuit}
                            className="w-full py-3 rounded-xl text-[var(--text-muted)] font-medium hover:text-white transition-all"
                        >
                            RETURN TO BASE
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VictoryModal;
