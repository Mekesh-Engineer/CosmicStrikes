import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store'; //
import { move, fire, tick, spawnAlien } from '../features/game'; //
import type { AlienType } from '../features/game';
import Cannon from './Cannon';
import Alien from './Alien';
import Bullet from './Bullet';

// Helper to get random alien type
function getRandomAlienType(): AlienType {
  const types: AlienType[] = ['red', 'green', 'blue', 'yellow', 'purple', 'cyan'];
  return types[Math.floor(Math.random() * types.length)];
}

export default function GameCanvas() {
  const dispatch = useAppDispatch();
  const { playerX, bullets, aliens, running } = useAppSelector((s) => s.game); // Note: Removed playerY as it's static in SVG logic usually

  // Game Loop Logic
  useEffect(() => {
    if (!running) return;

    // Keyboard Listeners
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') dispatch(move({ dx: -0.3 }));
      if (e.key === 'ArrowRight') dispatch(move({ dx: 0.3 }));
      // Removed Up/Down to keep gameplay strictly arcade horizontal
      if (e.key === ' ') dispatch(fire());
    };
    
    window.addEventListener('keydown', onKey);

    // Physics Tick (60 FPS)
    const interval = setInterval(() => dispatch(tick()), 16);
    
    // Spawner with updated signature
    const spawner = setInterval(() => {
      const x = (Math.random() - 0.5) * 6; // Range -3 to 3
      dispatch(spawnAlien({ 
        x, 
        y: 3.5, 
        type: getRandomAlienType(),
        hp: 1,
        isBoss: false
      }));
    }, 2000);

    return () => {
      window.removeEventListener('keydown', onKey);
      clearInterval(interval);
      clearInterval(spawner);
    };
  }, [dispatch, running]);

  return (
    <div className="w-full h-full relative cursor-crosshair">
       {/* SVG ViewBox set to -4 to 4 on X axis to match Redux logic.
          preserveAspectRatio ensures the game arena scales correctly on all screens.
       */}
      <svg 
        viewBox="-4 -4 8 8" 
        className="w-full h-full block touch-none select-none"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Shared Gradients for Game Elements */}
          <linearGradient id="neonGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-primary)" />
            <stop offset="100%" stopColor="var(--brand-primary-dark)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="0.15" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Game Entities */}
        <Cannon x={playerX} />
        
        {bullets.map((b) => (
          <Bullet key={b.id} x={b.x} y={b.y} />
        ))}
        
        {aliens.map((a) => (
          <Alien key={a.id} x={a.x} y={a.y} type={a.type} />
        ))}
        
        {/* HUD Elements (Optional Overlay inside SVG) */}
        <text x="-3.8" y="-3.5" fill="var(--text-muted)" fontSize="0.2" fontFamily="monospace" opacity="0.5">
          SYS.RENDER_SVG_60FPS
        </text>
      </svg>
    </div>
  );
}