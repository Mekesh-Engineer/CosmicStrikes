import { useEffect, useRef, useCallback, useState } from 'react';
import { getPerformanceConfig, frameTimer } from '../config/performance';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎮 OPTIMIZED GAME LOOP HOOK
// ═══════════════════════════════════════════════════════════════════════════════
// Uses requestAnimationFrame for smooth 60fps (or higher) gameplay
// Features:
// - Frame-rate independent physics with delta time normalization
// - Automatic frame throttling based on performance config
// - FPS monitoring and adaptive quality
// - Memory-efficient with proper cleanup
// ═══════════════════════════════════════════════════════════════════════════════

export interface GameLoopOptions {
  targetFPS?: number;
  enableThrottling?: boolean;
  onFPSDrop?: (currentFPS: number) => void;
}

export const useGameLoop = (
  callback: (deltaTime: number, frameNumber: number) => void, 
  isRunning: boolean,
  options: GameLoopOptions = {}
) => {
  const { 
    targetFPS = getPerformanceConfig().targetFPS,
    enableThrottling = true,
    onFPSDrop 
  } = options;

  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);
  const fpsCheckIntervalRef = useRef<number>(0);
  
  // Frame interval in milliseconds
  const frameInterval = 1000 / targetFPS;

  const animate = useCallback((currentTime: number) => {
    if (!previousTimeRef.current) {
      previousTimeRef.current = currentTime;
    }

    const elapsed = currentTime - previousTimeRef.current;
    
    // Update frame timer for FPS tracking
    const normalizedDelta = frameTimer.tick(currentTime);
    
    // Check FPS periodically and call callback if dropping
    fpsCheckIntervalRef.current += elapsed;
    if (fpsCheckIntervalRef.current >= 1000 && onFPSDrop) {
      const currentFPS = frameTimer.getFPS();
      if (currentFPS < targetFPS * 0.7) {
        onFPSDrop(currentFPS);
      }
      fpsCheckIntervalRef.current = 0;
    }

    if (enableThrottling) {
      // Fixed timestep with accumulator for consistent physics
      accumulatorRef.current += elapsed;
      
      while (accumulatorRef.current >= frameInterval) {
        frameCountRef.current++;
        callback(normalizedDelta, frameCountRef.current);
        accumulatorRef.current -= frameInterval;
      }
    } else {
      // Variable timestep - use delta time directly
      frameCountRef.current++;
      callback(normalizedDelta, frameCountRef.current);
    }
    
    previousTimeRef.current = currentTime;
    requestRef.current = requestAnimationFrame(animate);
  }, [callback, frameInterval, enableThrottling, targetFPS, onFPSDrop]);

  useEffect(() => {
    if (!isRunning) {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      // Reset timing on stop
      previousTimeRef.current = 0;
      accumulatorRef.current = 0;
      frameTimer.reset();
      return;
    }

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isRunning, animate]);

  return {
    frameCount: frameCountRef.current,
    getFPS: () => frameTimer.getFPS(),
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🕹️ OPTIMIZED INPUT POLLING HOOK
// ═══════════════════════════════════════════════════════════════════════════════
// Efficient keyboard state management with minimal re-renders

export const useInputState = () => {
  const keysRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    
    // Handle window blur to reset keys (prevents stuck keys)
    const handleBlur = () => {
      keysRef.current.clear();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);
  
  const isKeyDown = useCallback((key: string) => keysRef.current.has(key.toLowerCase()), []);
  
  const getMovementVector = useCallback(() => {
    let dx = 0;
    let dy = 0;
    
    if (keysRef.current.has('arrowleft') || keysRef.current.has('a')) dx -= 1;
    if (keysRef.current.has('arrowright') || keysRef.current.has('d')) dx += 1;
    if (keysRef.current.has('arrowup') || keysRef.current.has('w')) dy += 1;
    if (keysRef.current.has('arrowdown') || keysRef.current.has('s')) dy -= 1;
    
    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const magnitude = Math.sqrt(dx * dx + dy * dy);
      dx /= magnitude;
      dy /= magnitude;
    }
    
    return { dx, dy };
  }, []);
  
  return { isKeyDown, getMovementVector, keys: keysRef };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 FPS MONITOR HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export const useFPSMonitor = (updateInterval: number = 500) => {
  const [fps, setFPS] = useState<number>(60);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFPS(frameTimer.getFPS());
    }, updateInterval);
    
    return () => clearInterval(interval);
  }, [updateInterval]);
  
  return fps;
};
