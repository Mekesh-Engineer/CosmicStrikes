import { memo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import {
    getDifficultyBracket,
    bracketColors,
    bracketNames,
    isBossLevel,
    getBossConfig,
    getWaveConfig,
    type WaveNumber
} from '../../features/difficultyV2';

interface WaveTransitionProps {
    onComplete?: () => void;
}

function WaveTransition({ onComplete }: WaveTransitionProps) {
    const { level, wave, status } = useSelector((state: RootState) => state.game);

    const bracket = getDifficultyBracket(level);
    const colors = bracketColors[bracket];
    const waveConfig = getWaveConfig(level, wave as WaveNumber);
    const bossInfo = isBossLevel(level) && wave === 5 ? getBossConfig(level) : null;

    if (status !== 'waveTransition' && status !== 'boss') {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn"
            onClick={onComplete}
        >
            <div className="text-center">
                {/* Level indicator */}
                <div
                    className="text-sm uppercase tracking-widest mb-2"
                    style={{ color: colors.primary }}
                >
                    {bracketNames[bracket]}
                </div>

                {/* Wave/Boss title */}
                {bossInfo ? (
                    <>
                        <div className="text-red-500 text-6xl font-black animate-pulse mb-4">
                            ⚠️ BOSS BATTLE ⚠️
                        </div>
                        <div
                            className="text-4xl font-bold mb-2"
                            style={{
                                color: '#ef4444',
                                textShadow: '0 0 30px rgba(239,68,68,0.8)'
                            }}
                        >
                            {bossInfo.name}
                        </div>
                        <div className="text-gray-400 text-lg">
                            HP: {bossInfo.hp} | Pattern: {bossInfo.pattern.toUpperCase()}
                        </div>
                        <div className="text-gray-500 text-sm mt-2">
                            Special Power: {bossInfo.power.replace('_', ' ').toUpperCase()}
                        </div>
                    </>
                ) : (
                    <>
                        <div
                            className="text-6xl font-black mb-4"
                            style={{
                                color: colors.primary,
                                textShadow: `0 0 40px ${colors.glow}`
                            }}
                        >
                            WAVE {wave}
                        </div>
                        <div className="text-gray-400 text-lg mb-2">
                            Level {level}
                        </div>

                        {/* Wave stats */}
                        <div className="flex justify-center gap-8 text-sm text-gray-500 mt-4">
                            <div>
                                <div className="text-xs uppercase tracking-wider">Enemies</div>
                                <div
                                    className="text-xl font-bold"
                                    style={{ color: colors.primary }}
                                >
                                    {waveConfig.enemiesRequired}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-wider">Speed</div>
                                <div
                                    className="text-xl font-bold"
                                    style={{ color: colors.primary }}
                                >
                                    {(waveConfig.alienSpeed * 100).toFixed(0)}%
                                </div>
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-wider">Armor</div>
                                <div
                                    className="text-xl font-bold"
                                    style={{ color: colors.primary }}
                                >
                                    {waveConfig.alienHP} HP
                                </div>
                            </div>
                        </div>

                        {/* Special warning */}
                        {waveConfig.special !== 'basic' && (
                            <div
                                className="mt-4 px-4 py-2 rounded-lg inline-block animate-pulse"
                                style={{ backgroundColor: `${colors.primary}22` }}
                            >
                                <span className="text-yellow-400">⚠️</span>
                                <span
                                    className="ml-2 font-bold uppercase"
                                    style={{ color: colors.primary }}
                                >
                                    {waveConfig.special} enemies incoming!
                                </span>
                            </div>
                        )}
                    </>
                )}

                {/* Continue prompt */}
                <div className="mt-8 text-gray-500 text-sm animate-pulse">
                    Click or press any key to continue...
                </div>
            </div>
        </div>
    );
}

export default memo(WaveTransition);
