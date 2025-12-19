import React, { memo } from 'react';
import { useFPSMonitor } from '../../hooks/useGameLoop';

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 FPS MONITOR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
// Displays real-time FPS counter for performance monitoring
// Only renders when FPS value changes (memoized)
// ═══════════════════════════════════════════════════════════════════════════════

interface FPSMonitorProps {
  show?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const positionStyles = {
  'top-left': 'top-2 left-2',
  'top-right': 'top-2 right-2',
  'bottom-left': 'bottom-2 left-2',
  'bottom-right': 'bottom-2 right-2',
};

export const FPSMonitor: React.FC<FPSMonitorProps> = memo(({ 
  show = true, 
  position = 'top-right' 
}) => {
  const fps = useFPSMonitor(500);
  
  if (!show) return null;
  
  // Color based on performance
  const getColor = (fps: number) => {
    if (fps >= 55) return 'text-green-400';
    if (fps >= 40) return 'text-yellow-400';
    if (fps >= 25) return 'text-orange-400';
    return 'text-red-400';
  };
  
  return (
    <div 
      className={`
        fixed ${positionStyles[position]} z-[999]
        bg-black/70 backdrop-blur-sm px-2 py-1 rounded
        font-mono text-xs select-none pointer-events-none
        border border-white/10
      `}
    >
      <span className="text-white/60">FPS:</span>
      <span className={`ml-1 font-bold ${getColor(fps)}`}>{fps}</span>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// 📈 PERFORMANCE STATS OVERLAY
// ═══════════════════════════════════════════════════════════════════════════════
// Extended stats display for debugging

interface PerformanceStatsProps {
  show?: boolean;
  entityCount?: number;
  bulletCount?: number;
  alienCount?: number;
}

export const PerformanceStats: React.FC<PerformanceStatsProps> = memo(({ 
  show = false,
  entityCount = 0,
  bulletCount = 0,
  alienCount = 0,
}) => {
  const fps = useFPSMonitor(500);
  
  if (!show) return null;
  
  // Get memory usage if available
  const memory = (performance as any).memory 
    ? Math.round((performance as any).memory.usedJSHeapSize / 1048576) 
    : null;
  
  return (
    <div className="fixed top-2 left-2 z-[999] bg-black/80 backdrop-blur-sm px-3 py-2 rounded-lg font-mono text-xs select-none pointer-events-none border border-white/10 space-y-1">
      <div className="flex justify-between gap-4">
        <span className="text-white/60">FPS</span>
        <span className={`font-bold ${fps >= 55 ? 'text-green-400' : fps >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
          {fps}
        </span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-white/60">Entities</span>
        <span className="text-cyan-400">{entityCount}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-white/60">Bullets</span>
        <span className="text-purple-400">{bulletCount}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-white/60">Aliens</span>
        <span className="text-pink-400">{alienCount}</span>
      </div>
      {memory !== null && (
        <div className="flex justify-between gap-4">
          <span className="text-white/60">Memory</span>
          <span className="text-orange-400">{memory}MB</span>
        </div>
      )}
    </div>
  );
});

export default FPSMonitor;
