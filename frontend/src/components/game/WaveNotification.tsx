import { memo, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { hideWaveNotification } from '../../features/game';
import {
    getDifficultyBracket,
    bracketColors,
    bracketNames,
} from '../../features/difficultyV2';

/**
 * 🌊 WAVE NOTIFICATION
 * Non-blocking, right-side floating notification for wave transitions.
 * Features slide-in animation and auto-fade-out.
 */
function WaveNotification() {
    const dispatch = useDispatch();
    const { showWaveNotification, waveNotificationData, level } = useSelector(
        (state: RootState) => state.game
    );

    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    const bracket = getDifficultyBracket(waveNotificationData?.level || level);
    const colors = bracketColors[bracket];
    const sectorName = bracketNames[bracket];

    // Handle show/hide animation
    useEffect(() => {
        if (showWaveNotification && waveNotificationData) {
            setIsExiting(false);
            setIsVisible(true);

            // Auto-hide after 2.5 seconds
            const hideTimer = setTimeout(() => {
                setIsExiting(true);
            }, 2500);

            // Dispatch hide after exit animation
            const removeTimer = setTimeout(() => {
                setIsVisible(false);
                dispatch(hideWaveNotification());
            }, 3000);

            return () => {
                clearTimeout(hideTimer);
                clearTimeout(removeTimer);
            };
        }
    }, [showWaveNotification, waveNotificationData, dispatch]);

    if (!isVisible || !waveNotificationData) {
        return null;
    }

    const isBossWave = waveNotificationData.bossName;
    const wave = waveNotificationData.wave;
    const targetLevel = waveNotificationData.level;

    return (
        <div
            className={`
                fixed right-4 top-24 z-50 
                transform transition-all duration-500 ease-out
                ${isExiting
                    ? 'translate-x-[120%] opacity-0'
                    : 'translate-x-0 opacity-100'
                }
            `}
            style={{
                animation: isExiting ? undefined : 'slideInRight 0.5s ease-out',
            }}
        >
            <div
                className="relative px-5 py-4 rounded-xl backdrop-blur-md border overflow-hidden min-w-[200px]"
                style={{
                    backgroundColor: isBossWave
                        ? 'rgba(239, 68, 68, 0.15)'
                        : `${colors.primary}15`,
                    borderColor: isBossWave
                        ? 'rgba(239, 68, 68, 0.4)'
                        : `${colors.primary}40`,
                    boxShadow: isBossWave
                        ? '0 0 30px rgba(239, 68, 68, 0.3)'
                        : `0 0 30px ${colors.glow}`,
                }}
            >
                {/* Animated glow bar */}
                <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{
                        background: isBossWave
                            ? 'linear-gradient(90deg, transparent, #ef4444, transparent)'
                            : `linear-gradient(90deg, transparent, ${colors.primary}, transparent)`,
                        animation: 'shimmer 2s infinite',
                    }}
                />

                {/* Content */}
                <div className="relative z-10">
                    {/* Sector indicator */}
                    <p
                        className="text-[9px] font-bold uppercase tracking-[0.3em] mb-1 opacity-80"
                        style={{ color: isBossWave ? '#f87171' : colors.primary }}
                    >
                        {sectorName}
                    </p>

                    {/* Wave/Boss title */}
                    {isBossWave ? (
                        <div className="flex items-center gap-2">
                            <span className="text-lg animate-pulse">⚠️</span>
                            <span
                                className="text-xl font-orbitron font-black tracking-tight"
                                style={{
                                    color: '#ef4444',
                                    textShadow: '0 0 15px rgba(239, 68, 68, 0.6)',
                                }}
                            >
                                BOSS BATTLE
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <span
                                className="text-3xl font-orbitron font-black"
                                style={{
                                    color: colors.primary,
                                    textShadow: `0 0 15px ${colors.glow}`,
                                }}
                            >
                                {wave}
                            </span>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                                    Wave
                                </span>
                                <span
                                    className="text-sm font-bold"
                                    style={{ color: colors.primary }}
                                >
                                    Level {targetLevel}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Wave progress dots */}
                    {!isBossWave && (
                        <div className="flex gap-1 mt-2">
                            {[1, 2, 3, 4, 5].map((w) => (
                                <div
                                    key={w}
                                    className={`w-2 h-1 rounded-sm transition-all duration-300 ${w <= wave ? 'opacity-100' : 'opacity-30'
                                        }`}
                                    style={{ backgroundColor: colors.primary }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Background decoration */}
                <div
                    className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-10 blur-xl"
                    style={{ backgroundColor: isBossWave ? '#ef4444' : colors.primary }}
                />
            </div>
        </div>
    );
}

export default memo(WaveNotification);
