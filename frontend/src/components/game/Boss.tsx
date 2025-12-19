import { memo } from 'react';
import { getBossConfig, getBossPhase } from '../../features/difficultyV2';

interface BossProps {
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    level: number;
}

/**
 * 👹 BOSS COMPONENT
 * Renders boss aliens with unique appearance per level
 * 
 * Boss levels: 10, 20, 30, 40, 50, 60, 70, 80, 90, 100
 * Each boss has unique color scheme and visual effects
 */

const bossColors: Record<number, { primary: string; secondary: string; glow: string }> = {
    10: { primary: '#22c55e', secondary: '#15803d', glow: 'rgba(34,197,94,0.6)' },   // Scout Commander - Green
    20: { primary: '#3b82f6', secondary: '#1d4ed8', glow: 'rgba(59,130,246,0.6)' },  // Shield Warden - Blue
    30: { primary: '#f97316', secondary: '#c2410c', glow: 'rgba(249,115,22,0.6)' },  // Plasma Bomber - Orange
    40: { primary: '#a855f7', secondary: '#7c3aed', glow: 'rgba(168,85,247,0.6)' },  // Swarm Queen - Purple
    50: { primary: '#ef4444', secondary: '#b91c1c', glow: 'rgba(239,68,68,0.6)' },   // Elite Vanguard - Red
    60: { primary: '#06b6d4', secondary: '#0891b2', glow: 'rgba(6,182,212,0.6)' },   // Nebula Lord - Cyan
    70: { primary: '#6366f1', secondary: '#4338ca', glow: 'rgba(99,102,241,0.6)' },  // Void Reaper - Indigo
    80: { primary: '#f59e0b', secondary: '#b45309', glow: 'rgba(245,158,11,0.6)' },  // Star Crusher - Amber
    90: { primary: '#ec4899', secondary: '#be185d', glow: 'rgba(236,72,153,0.6)' },  // Galaxy Devourer - Pink
    100: { primary: '#fbbf24', secondary: '#d97706', glow: 'rgba(251,191,36,0.8)' }, // Cosmic Behemoth - Gold
};

function Boss({ x, y, hp, maxHp, level }: BossProps) {
    const config = getBossConfig(level);
    const colors = bossColors[level] || bossColors[10];
    const phase = getBossPhase(hp, maxHp, config?.phases || 3);
    const hpPercent = (hp / maxHp) * 100;

    // Boss gets angrier (more effects) at low HP
    const isEnraged = hpPercent < 30;
    const isCritical = hpPercent < 15;

    // Scale factor based on boss level (higher level = bigger)
    const scale = 1 + (level / 100) * 0.5;

    return (
        <g
            transform={`translate(${x * 100}, ${-y * 100})`}
            className={isCritical ? 'animate-pulse' : ''}
        >
            {/* Glow effect */}
            <defs>
                <filter id={`boss-glow-${level}`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation={isEnraged ? '8' : '4'} result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <radialGradient id={`boss-gradient-${level}`} cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stopColor={colors.primary} />
                    <stop offset="100%" stopColor={colors.secondary} />
                </radialGradient>
            </defs>

            {/* Aura ring (pulsing) */}
            <circle
                cx="0"
                cy="0"
                r={60 * scale}
                fill="none"
                stroke={colors.primary}
                strokeWidth="2"
                opacity={isEnraged ? 0.8 : 0.3}
                className="animate-ping"
            />

            {/* Main body */}
            <ellipse
                cx="0"
                cy="0"
                rx={40 * scale}
                ry={35 * scale}
                fill={`url(#boss-gradient-${level})`}
                filter={`url(#boss-glow-${level})`}
                stroke={isEnraged ? '#ef4444' : colors.primary}
                strokeWidth={isEnraged ? 3 : 1}
            />

            {/* Crown/horns based on phase */}
            {phase >= 2 && (
                <>
                    <polygon
                        points={`${-20 * scale},-${30 * scale} ${-15 * scale},-${45 * scale} ${-10 * scale},-${30 * scale}`}
                        fill={colors.primary}
                    />
                    <polygon
                        points={`${10 * scale},-${30 * scale} ${15 * scale},-${45 * scale} ${20 * scale},-${30 * scale}`}
                        fill={colors.primary}
                    />
                </>
            )}

            {/* Eyes */}
            <ellipse
                cx={-15 * scale}
                cy={-5 * scale}
                rx={10 * scale}
                ry={8 * scale}
                fill={isEnraged ? '#ef4444' : '#1f2937'}
                stroke={colors.primary}
                strokeWidth="1"
            />
            <ellipse
                cx={15 * scale}
                cy={-5 * scale}
                rx={10 * scale}
                ry={8 * scale}
                fill={isEnraged ? '#ef4444' : '#1f2937'}
                stroke={colors.primary}
                strokeWidth="1"
            />

            {/* Eye pupils (track player - would need player position) */}
            <circle
                cx={-15 * scale}
                cy={-5 * scale}
                r={5 * scale}
                fill={isCritical ? '#fbbf24' : colors.primary}
                className={isEnraged ? 'animate-pulse' : ''}
            />
            <circle
                cx={15 * scale}
                cy={-5 * scale}
                r={5 * scale}
                fill={isCritical ? '#fbbf24' : colors.primary}
                className={isEnraged ? 'animate-pulse' : ''}
            />

            {/* Mouth (angry when low HP) */}
            {isEnraged ? (
                <path
                    d={`M ${-20 * scale} ${15 * scale} Q 0 ${25 * scale} ${20 * scale} ${15 * scale}`}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="3"
                />
            ) : (
                <line
                    x1={-15 * scale}
                    y1={15 * scale}
                    x2={15 * scale}
                    y2={15 * scale}
                    stroke={colors.secondary}
                    strokeWidth="2"
                />
            )}

            {/* HP bar above boss */}
            <rect
                x={-40 * scale}
                y={-55 * scale}
                width={80 * scale}
                height={8 * scale}
                fill="#1f2937"
                rx="4"
            />
            <rect
                x={-40 * scale}
                y={-55 * scale}
                width={(80 * scale) * (hp / maxHp)}
                height={8 * scale}
                fill={isEnraged ? '#ef4444' : colors.primary}
                rx="4"
            />

            {/* Boss name */}
            <text
                x="0"
                y={-65 * scale}
                textAnchor="middle"
                fill={colors.primary}
                fontSize={10 * scale}
                fontWeight="bold"
                style={{ textShadow: `0 0 10px ${colors.glow}` }}
            >
                {config?.name || 'BOSS'}
            </text>

            {/* Phase indicator */}
            <text
                x="0"
                y={50 * scale}
                textAnchor="middle"
                fill="#6b7280"
                fontSize={8 * scale}
            >
                PHASE {phase}/{config?.phases || 3}
            </text>

            {/* Critical warning */}
            {isCritical && (
                <text
                    x="0"
                    y={65 * scale}
                    textAnchor="middle"
                    fill="#ef4444"
                    fontSize={10 * scale}
                    fontWeight="bold"
                    className="animate-pulse"
                >
                    ⚠️ CRITICAL ⚠️
                </text>
            )}
        </g>
    );
}

export default memo(Boss);
