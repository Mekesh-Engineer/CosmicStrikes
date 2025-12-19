import React, { memo, useMemo } from 'react';

export type AlienType = 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'cyan';

interface AlienProps {
  x: number;
  y: number;
  type: AlienType;
  hp?: number;        // Current HP
  maxHp?: number;     // Max HP for armor display
  isBoss?: boolean;   // Is this a mini-boss?
  isHit?: boolean;
}

// Pre-computed color palettes (avoid object recreation on each render)
const alienColors: Readonly<Record<AlienType, { shell: readonly string[]; core: readonly string[]; accent: string; glow: string }>> = {
  red: { shell: ['#dc2626', '#991b1b'], core: ['#fecaca', '#ef4444', '#b91c1c'], accent: '#f87171', glow: '#dc2626' },
  green: { shell: ['#16a34a', '#166534'], core: ['#bbf7d0', '#22c55e', '#15803d'], accent: '#4ade80', glow: '#16a34a' },
  blue: { shell: ['#2563eb', '#1e3a8a'], core: ['#bfdbfe', '#3b82f6', '#1d4ed8'], accent: '#60a5fa', glow: '#2563eb' },
  yellow: { shell: ['#eab308', '#854d0e'], core: ['#fef08a', '#facc15', '#ca8a04'], accent: '#fde047', glow: '#eab308' },
  purple: { shell: ['#9333ea', '#6b21a8'], core: ['#e9d5ff', '#a855f7', '#7e22ce'], accent: '#c084fc', glow: '#9333ea' },
  cyan: { shell: ['#06b6d4', '#155e75'], core: ['#cffafe', '#22d3ee', '#0891b2'], accent: '#67e8f9', glow: '#06b6d4' },
};

const armorColors = ['transparent', 'rgba(255,255,255,0.3)', 'rgba(168,85,247,0.5)', 'rgba(236,72,153,0.6)'] as const;

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 PERFORMANCE OPTIMIZED ALIEN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
// - Memoized with custom comparison for stable rendering
// - Simplified SVG structure (fewer elements = faster rendering)
// - Reduced filter usage (glow effects are expensive)
// - Pre-computed values to avoid recalculation
// ═══════════════════════════════════════════════════════════════════════════════

const Alien: React.FC<AlienProps> = memo(({ 
  x, 
  y, 
  type, 
  hp = 1, 
  maxHp = 1, 
  isBoss = false,
  isHit = false 
}) => {
  const colors = alienColors[type];
  const armorLevel = Math.min(3, maxHp - 1);
  const scale = isBoss ? 1.8 : 1;
  const hpPercent = maxHp > 1 ? hp / maxHp : 1;
  
  // Memoize gradients (they don't change per instance)
  const gradientIds = useMemo(() => ({
    shell: `alienShell-${type}`,
    core: `alienCore-${type}`,
  }), [type]);
  
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <defs>
        {/* Shell Gradient - Simplified */}
        <linearGradient id={gradientIds.shell} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.shell[0]} />
          <stop offset="100%" stopColor={colors.shell[1]} />
        </linearGradient>

        {/* Energy Core Gradient - Simplified */}
        <radialGradient id={gradientIds.core} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={colors.core[0]} />
          <stop offset="50%" stopColor={colors.core[1]} />
          <stop offset="100%" stopColor={colors.core[2]} />
        </radialGradient>
      </defs>

      {/* Simplified alien body - reduced SVG complexity */}
      <g>
        {/* Boss Aura (only for bosses) */}
        {isBoss && (
          <circle cx="0" cy="0" r="0.5" fill="#ec4899" opacity="0.3" />
        )}

        {/* Armor Shield */}
        {armorLevel > 0 && (
          <circle 
            cx="0" cy="0" r="0.4" 
            fill="none"
            stroke={armorColors[armorLevel]}
            strokeWidth="0.03"
            opacity="0.6"
          />
        )}

        {/* Engine Flames */}
        <path d="M-0.12,0.1 L-0.2,0.35 L-0.04,0.1 Z" fill={colors.accent} opacity="0.5" />
        <path d="M0.12,0.1 L0.2,0.35 L0.04,0.1 Z" fill={colors.accent} opacity="0.5" />

        {/* Main Body */}
        <path 
          d="M-0.28,-0.1 C-0.35,0.1 -0.28,0.28 0,0.32 C0.28,0.28 0.35,0.1 0.28,-0.1 Q0.18,-0.28 0,-0.28 Q-0.18,-0.28 -0.28,-0.1 Z" 
          fill={`url(#${gradientIds.shell})`}
          stroke={colors.shell[1]} 
          strokeWidth="0.015" 
        />

        {/* Wings */}
        <path d="M-0.22,-0.12 Q-0.35,0 -0.32,0.22 L-0.18,0.08 Z" fill={colors.shell[1]} />
        <path d="M0.22,-0.12 Q0.35,0 0.32,0.22 L0.18,0.08 Z" fill={colors.shell[1]} />

        {/* Core Eye */}
        <ellipse cx="0" cy="-0.04" rx="0.1" ry="0.1" fill="var(--bg-secondary)" />
        <circle cx="0" cy="-0.04" r="0.07" fill={`url(#${gradientIds.core})`} />
        <ellipse cx="-0.02" cy="-0.06" rx="0.015" ry="0.03" fill="white" opacity="0.8" />

        {/* HP Bar (only if needed) */}
        {maxHp > 1 && (
          <g transform="translate(0, -0.4)">
            <rect x="-0.22" y="0" width="0.44" height="0.05" rx="0.02" fill="rgba(0,0,0,0.5)" />
            <rect 
              x="-0.21" y="0.01" 
              width={0.42 * hpPercent} height="0.03" 
              rx="0.015"
              fill={hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#eab308' : '#ef4444'}
            />
          </g>
        )}

        {/* Boss Label */}
        {isBoss && (
          <text 
            x="0" y="-0.48" 
            textAnchor="middle" 
            fill="#ec4899" 
            fontSize="0.1"
            fontWeight="bold"
          >
            BOSS
          </text>
        )}
      </g>
    </g>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render when these change
  return (
    prevProps.x === nextProps.x &&
    prevProps.y === nextProps.y &&
    prevProps.hp === nextProps.hp &&
    prevProps.type === nextProps.type &&
    prevProps.isBoss === nextProps.isBoss
  );
});

export default Alien;