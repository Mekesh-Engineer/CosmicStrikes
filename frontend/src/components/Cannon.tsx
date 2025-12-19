import React, { memo } from 'react';

interface CannonProps {
  x: number;
  y?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 PERFORMANCE OPTIMIZED CANNON/SPACECRAFT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
// - Memoized to prevent re-renders when position hasn't changed
// - Simplified SVG structure for better GPU performance
// - Removed expensive filter effects
// - Pre-defined gradients using CSS variables
// ═══════════════════════════════════════════════════════════════════════════════

const Cannon: React.FC<CannonProps> = memo(({ x, y = -3.2 }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Gradient Definitions */}
      <defs>
        <linearGradient id="hullGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--brand-accent)" />
          <stop offset="50%" stopColor="var(--brand-primary)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--brand-accent)" />
        </linearGradient>

        <linearGradient id="metalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--text-secondary)" />
          <stop offset="100%" stopColor="var(--text-muted)" />
        </linearGradient>

        <radialGradient id="coreEnergy" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--brand-warning)" />
          <stop offset="70%" stopColor="var(--brand-danger)" />
          <stop offset="100%" stopColor="var(--bg-tertiary)" />
        </radialGradient>

        <linearGradient id="thrusterHeat" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--brand-accent)" stopOpacity="0.7" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>

      {/* Engine Thrusters - Simplified */}
      <path d="M-0.08,-0.35 L0.08,-0.35 L0,-0.7 Z" fill="url(#thrusterHeat)" />
      <path d="M-0.22,-0.25 L-0.32,-0.25 L-0.27,-0.42 Z" fill="url(#thrusterHeat)" opacity="0.5" />
      <path d="M0.22,-0.25 L0.32,-0.25 L0.27,-0.42 Z" fill="url(#thrusterHeat)" opacity="0.5" />

      {/* Wings - Simplified */}
      <path d="M-0.14,0 L-0.5,-0.08 L-0.42,0.18 L-0.14,0.1 Z" fill="url(#metalGradient)" />
      <path d="M0.14,0 L0.5,-0.08 L0.42,0.18 L0.14,0.1 Z" fill="url(#metalGradient)" />

      {/* Inner Wing Plates */}
      <path d="M-0.11,0.1 L-0.32,0.05 L-0.28,0.28 L-0.11,0.32 Z" fill="url(#hullGradient)" />
      <path d="M0.11,0.1 L0.32,0.05 L0.28,0.28 L0.11,0.32 Z" fill="url(#hullGradient)" />

      {/* Central Chassis */}
      <path d="M-0.14,-0.28 L0.14,-0.28 L0.09,0.38 L-0.09,0.38 Z" fill="var(--bg-secondary)" />

      {/* Nose Cone */}
      <path d="M0,0.55 L0.07,0.38 L-0.07,0.38 Z" fill="url(#metalGradient)" />

      {/* Main Hull */}
      <path 
        d="M-0.09,0.38 L-0.11,-0.18 L-0.07,-0.28 L0.07,-0.28 L0.11,-0.18 L0.09,0.38 Z" 
        fill="url(#hullGradient)" 
      />

      {/* Vents */}
      <rect x="-0.07" y="-0.14" width="0.035" height="0.08" fill="var(--bg-primary)" rx="0.008" />
      <rect x="0.035" y="-0.14" width="0.035" height="0.08" fill="var(--bg-primary)" rx="0.008" />

      {/* Cockpit/Core - No filter for performance */}
      <ellipse cx="0" cy="0.14" rx="0.05" ry="0.1" fill="url(#coreEnergy)" stroke="var(--brand-warning)" strokeWidth="0.015" />
      <ellipse cx="-0.015" cy="0.16" rx="0.015" ry="0.03" fill="var(--text-primary)" opacity="0.5" />

      {/* Weapon Hardpoints */}
      <rect x="-0.26" y="0.14" width="0.035" height="0.12" fill="var(--bg-tertiary)" />
      <rect x="0.225" y="0.14" width="0.035" height="0.12" fill="var(--bg-tertiary)" />
    </g>
  );
}, (prevProps, nextProps) => {
  // Only re-render if position changed
  return prevProps.x === nextProps.x && prevProps.y === nextProps.y;
});

export default Cannon;