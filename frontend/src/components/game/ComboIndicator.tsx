import { memo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { getComboMultiplier, PERFECT_COMBO_BONUS } from '../../features/difficultyV2';

/**
 * 🔥 COMBO INDICATOR
 * Shows flashy combo feedback with tier-based animations
 * 
 * Tiers:
 * - 0-5: No display
 * - 6-15: GREAT (2x) - Green
 * - 16-30: AWESOME (3x) - Blue
 * - 31-50: INCREDIBLE (4x) - Purple
 * - 50+: PERFECT (5x) - Gold with bonus
 */

const tierStyles: Record<string, { color: string; glow: string; animation: string }> = {
    '': { color: '#6b7280', glow: 'none', animation: '' },
    'GREAT': { color: '#22c55e', glow: '0 0 20px rgba(34,197,94,0.6)', animation: 'animate-pulse' },
    'AWESOME': { color: '#3b82f6', glow: '0 0 25px rgba(59,130,246,0.7)', animation: 'animate-pulse' },
    'INCREDIBLE': { color: '#a855f7', glow: '0 0 30px rgba(168,85,247,0.8)', animation: 'animate-bounce' },
    'PERFECT': { color: '#fbbf24', glow: '0 0 40px rgba(251,191,36,0.9)', animation: 'animate-bounce' },
};

function ComboIndicator() {
    const { combo, maxCombo } = useSelector((state: RootState) => state.game);
    const [showPerfectBonus, setShowPerfectBonus] = useState(false);
    const [lastCombo, setLastCombo] = useState(0);

    const comboInfo = getComboMultiplier(combo);
    const style = tierStyles[comboInfo.tier] || tierStyles[''];

    // Show perfect bonus animation when hitting 50 combo
    useEffect(() => {
        if (combo === 50 && lastCombo < 50) {
            setShowPerfectBonus(true);
            const timer = setTimeout(() => setShowPerfectBonus(false), 2000);
            return () => clearTimeout(timer);
        }
        setLastCombo(combo);
    }, [combo, lastCombo]);

    // Don't show below 6 combo
    if (combo < 6) return null;

    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none select-none">
            {/* Main combo display */}
            <div className={`text-center ${style.animation}`}>
                {/* Tier name */}
                <div
                    className="text-lg font-black tracking-widest mb-1"
                    style={{
                        color: style.color,
                        textShadow: style.glow
                    }}
                >
                    {comboInfo.tier}!
                </div>

                {/* Combo count */}
                <div
                    className="text-5xl font-black"
                    style={{
                        color: style.color,
                        textShadow: style.glow
                    }}
                >
                    {combo}
                    <span className="text-2xl ml-2">COMBO</span>
                </div>

                {/* Multiplier */}
                <div
                    className="text-xl font-bold mt-1"
                    style={{ color: style.color }}
                >
                    {comboInfo.multiplier}x MULTIPLIER
                </div>

                {/* Progress to next tier */}
                <div className="w-48 h-2 bg-gray-800 rounded-full overflow-hidden mt-2 mx-auto">
                    <div
                        className="h-full transition-all duration-300"
                        style={{
                            width: `${getComboProgress(combo)}%`,
                            backgroundColor: style.color
                        }}
                    />
                </div>

                {/* Next tier hint */}
                <div className="text-xs text-gray-500 mt-1">
                    {getNextTierHint(combo)}
                </div>
            </div>

            {/* Perfect bonus popup */}
            {showPerfectBonus && (
                <div
                    className="absolute -top-16 left-1/2 -translate-x-1/2 animate-bounce"
                    style={{
                        color: '#fbbf24',
                        textShadow: '0 0 30px rgba(251,191,36,0.9)'
                    }}
                >
                    <div className="text-2xl font-black">
                        🌟 PERFECT BONUS 🌟
                    </div>
                    <div className="text-lg font-bold text-center">
                        +{PERFECT_COMBO_BONUS.toLocaleString()}
                    </div>
                </div>
            )}

            {/* Max combo indicator */}
            {combo === maxCombo && combo >= 10 && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-yellow-600">
                    🏆 BEST COMBO
                </div>
            )}
        </div>
    );
}

function getComboProgress(combo: number): number {
    if (combo >= 50) return 100;
    if (combo >= 31) return ((combo - 31) / 19) * 100;
    if (combo >= 16) return ((combo - 16) / 15) * 100;
    if (combo >= 6) return ((combo - 6) / 10) * 100;
    return (combo / 6) * 100;
}

function getNextTierHint(combo: number): string {
    if (combo >= 50) return 'MAX TIER REACHED!';
    if (combo >= 31) return `${50 - combo} to PERFECT`;
    if (combo >= 16) return `${31 - combo} to INCREDIBLE`;
    if (combo >= 6) return `${16 - combo} to AWESOME`;
    return `${6 - combo} to GREAT`;
}

export default memo(ComboIndicator);
