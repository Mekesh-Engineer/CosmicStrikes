import React, { memo } from 'react';

interface BulletProps {
  x: number;
  y: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 PERFORMANCE OPTIMIZED BULLET COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
// - Memoized to prevent unnecessary re-renders
// - Simplified SVG structure (removed expensive glow filter)
// - Uses transform for positioning (GPU accelerated)
// ═══════════════════════════════════════════════════════════════════════════════

const Bullet: React.FC<BulletProps> = memo(({ x, y }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Motion Trail - Simplified */}
      <line 
        x1="0" y1="0" 
        x2="0" y2="-0.5" 
        stroke="var(--brand-primary)" 
        strokeWidth="0.03" 
        opacity="0.5" 
        strokeLinecap="round"
      />
      
      {/* Projectile Core - No filter for performance */}
      <circle r="0.06" fill="#FFFFFF" />
      
      {/* Outer Halo - Simplified */}
      <circle 
        r="0.1" 
        stroke="var(--brand-primary-light)" 
        strokeWidth="0.015" 
        fill="none" 
        opacity="0.7" 
      />
    </g>
  );
}, (prevProps, nextProps) => {
  // Only re-render if position changed significantly
  return (
    Math.abs(prevProps.x - nextProps.x) < 0.01 &&
    Math.abs(prevProps.y - nextProps.y) < 0.01
  );
});

export default Bullet;