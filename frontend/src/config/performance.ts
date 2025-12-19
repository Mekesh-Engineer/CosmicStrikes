// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 PERFORMANCE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════
// Centralized performance settings for fine-tuning game responsiveness,
// frame rate, input sensitivity, and graphics quality.
// ═══════════════════════════════════════════════════════════════════════════════

export interface PerformanceConfig {
  // Frame Rate
  targetFPS: number;
  frameInterval: number; // 1000 / targetFPS
  
  // Input Sensitivity
  keyboardMoveSensitivity: number;
  touchMoveSensitivity: number;
  
  // Graphics Quality
  maxBullets: number;
  maxAliens: number;
  enableGlowEffects: boolean;
  enableBackgroundAnimation: boolean;
  
  // Game Speed
  bulletSpeed: number;
  baseAlienSpeed: number;
}

// Quality presets
export const QUALITY_PRESETS = {
  low: {
    targetFPS: 30,
    frameInterval: 33.33,
    keyboardMoveSensitivity: 0.18,
    touchMoveSensitivity: 0.018,
    maxBullets: 30,
    maxAliens: 20,
    enableGlowEffects: false,
    enableBackgroundAnimation: false,
    bulletSpeed: 0.18,
    baseAlienSpeed: 0.015,
  },
  medium: {
    targetFPS: 60,
    frameInterval: 16.67,
    keyboardMoveSensitivity: 0.20,
    touchMoveSensitivity: 0.020,
    maxBullets: 50,
    maxAliens: 40,
    enableGlowEffects: true,
    enableBackgroundAnimation: true,
    bulletSpeed: 0.15,
    baseAlienSpeed: 0.012,
  },
  high: {
    targetFPS: 60,
    frameInterval: 16.67,
    keyboardMoveSensitivity: 0.22,
    touchMoveSensitivity: 0.022,
    maxBullets: 100,
    maxAliens: 60,
    enableGlowEffects: true,
    enableBackgroundAnimation: true,
    bulletSpeed: 0.15,
    baseAlienSpeed: 0.010,
  },
  ultra: {
    targetFPS: 144,
    frameInterval: 6.94,
    keyboardMoveSensitivity: 0.25,
    touchMoveSensitivity: 0.025,
    maxBullets: 150,
    maxAliens: 80,
    enableGlowEffects: true,
    enableBackgroundAnimation: true,
    bulletSpeed: 0.15,
    baseAlienSpeed: 0.008,
  },
} as const;

export type QualityPreset = keyof typeof QUALITY_PRESETS;

// Default to medium quality
let currentConfig: PerformanceConfig = { ...QUALITY_PRESETS.medium };

// Get/Set current performance config
export const getPerformanceConfig = (): PerformanceConfig => currentConfig;

export const setPerformanceConfig = (preset: QualityPreset | Partial<PerformanceConfig>): void => {
  if (typeof preset === 'string') {
    currentConfig = { ...QUALITY_PRESETS[preset] };
  } else {
    currentConfig = { ...currentConfig, ...preset };
  }
};

// Auto-detect optimal settings based on device
export const autoDetectQuality = (): QualityPreset => {
  // Check for low-end device indicators
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isLowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4;
  const isSlowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
  
  if (isMobile || isLowMemory || isSlowCPU) {
    return 'low';
  }
  
  // Check for high refresh rate displays
  const isHighRefresh = window.screen && 'refreshRate' in window.screen;
  
  if (isHighRefresh) {
    return 'ultra';
  }
  
  return 'medium';
};

// Frame time delta calculator for consistent physics
export class FrameTimer {
  private lastTime: number = 0;
  private deltaTime: number = 0;
  private frameCount: number = 0;
  private fpsAccumulator: number = 0;
  private currentFPS: number = 60;
  
  tick(currentTime: number): number {
    if (this.lastTime === 0) {
      this.lastTime = currentTime;
      return 1;
    }
    
    this.deltaTime = (currentTime - this.lastTime) / 16.67; // Normalized to 60fps (16.67ms per frame)
    this.lastTime = currentTime;
    
    // FPS calculation
    this.frameCount++;
    this.fpsAccumulator += this.deltaTime;
    
    if (this.fpsAccumulator >= 60) { // Every ~1 second
      this.currentFPS = Math.round(this.frameCount * 60 / this.fpsAccumulator);
      this.frameCount = 0;
      this.fpsAccumulator = 0;
    }
    
    return Math.min(this.deltaTime, 3); // Cap at 3x to prevent physics explosions on lag spikes
  }
  
  getFPS(): number {
    return this.currentFPS;
  }
  
  reset(): void {
    this.lastTime = 0;
    this.deltaTime = 0;
    this.frameCount = 0;
    this.fpsAccumulator = 0;
    this.currentFPS = 60;
  }
}

// Global frame timer instance
export const frameTimer = new FrameTimer();

// Performance monitoring
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  entityCount: number;
  memoryUsage?: number;
}

export const getPerformanceMetrics = (entityCount: number): PerformanceMetrics => {
  const metrics: PerformanceMetrics = {
    fps: frameTimer.getFPS(),
    frameTime: 1000 / Math.max(1, frameTimer.getFPS()),
    entityCount,
  };
  
  // Add memory info if available
  if ((performance as any).memory) {
    metrics.memoryUsage = Math.round((performance as any).memory.usedJSHeapSize / 1048576);
  }
  
  return metrics;
};
