/**
 * 🎮 COSMIC STRIKES - DIFFICULTY SCALING SYSTEM
 * 
 * Provides balanced difficulty progression up to Level 100
 * with multiple scaling axes: spawn rate, speed, HP, formations, and more.
 */

import type { AlienType, PowerUp } from './game';

// ============================================================
// 1️⃣ LEVEL PROGRESSION MODEL (Score → Level)
// ============================================================

const BASE_SCORE_PER_LEVEL = 500;

/**
 * Calculate required score for a specific level (non-linear scaling)
 * Formula: baseScore * level * level^0.85
 * 
 * Examples:
 * - Level 10 → ~7,000
 * - Level 25 → ~30,000
 * - Level 50 → ~95,000
 * - Level 100 → ~250,000+
 */
export function getRequiredScoreForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(BASE_SCORE_PER_LEVEL * level * Math.pow(level, 0.85));
}

/**
 * Calculate current level based on score
 */
export function calculateLevelFromScore(score: number): number {
  let level = 1;
  while (level < 100 && score >= getRequiredScoreForLevel(level + 1)) {
    level++;
  }
  return level;
}

/**
 * Get progress percentage to next level
 */
export function getLevelProgress(score: number, currentLevel: number): number {
  if (currentLevel >= 100) return 100;
  
  const currentThreshold = getRequiredScoreForLevel(currentLevel);
  const nextThreshold = getRequiredScoreForLevel(currentLevel + 1);
  const progress = ((score - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  
  return Math.min(100, Math.max(0, progress));
}

// ============================================================
// 2️⃣ DIFFICULTY BRACKETS / SECTORS
// ============================================================

export type DifficultyBracket = 
  | 'training'      // 1-10
  | 'cadet'         // 11-25
  | 'pilot'         // 26-40
  | 'veteran'       // 41-60
  | 'ace'           // 61-80
  | 'elite';        // 81-100

export function getDifficultyBracket(level: number): DifficultyBracket {
  if (level <= 10) return 'training';
  if (level <= 25) return 'cadet';
  if (level <= 40) return 'pilot';
  if (level <= 60) return 'veteran';
  if (level <= 80) return 'ace';
  return 'elite';
}

export const bracketNames: Record<DifficultyBracket, string> = {
  training: 'TRAINING SECTOR',
  cadet: 'CADET ZONE',
  pilot: 'PILOT TERRITORY',
  veteran: 'VETERAN DOMAIN',
  ace: 'ACE BATTLEFIELD',
  elite: 'ELITE SECTOR'
};

export const bracketColors: Record<DifficultyBracket, { primary: string; glow: string }> = {
  training: { primary: '#22c55e', glow: 'rgba(34, 197, 94, 0.5)' },
  cadet: { primary: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)' },
  pilot: { primary: '#a855f7', glow: 'rgba(168, 85, 247, 0.5)' },
  veteran: { primary: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)' },
  ace: { primary: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)' },
  elite: { primary: '#ec4899', glow: 'rgba(236, 72, 153, 0.5)' }
};

// ============================================================
// 3️⃣ ALIEN SPAWN RATE SCALING
// ============================================================

/**
 * Calculate spawn interval in milliseconds
 * Decreases with level but caps to prevent chaos
 */
export function getSpawnInterval(level: number): number {
  // Base: 2000ms, scales down with level, minimum 350ms
  const interval = 2000 / (level * 0.6 + 1);
  return Math.max(350, interval);
}

/**
 * Get number of aliens per spawn wave (increases at higher levels)
 */
export function getAliensPerSpawn(level: number): number {
  if (level < 30) return 1;
  if (level < 50) return Math.random() > 0.7 ? 2 : 1;
  if (level < 70) return Math.random() > 0.5 ? 2 : 1;
  if (level < 90) return Math.random() > 0.4 ? 3 : 2;
  return Math.random() > 0.3 ? 3 : 2;
}

// ============================================================
// 4️⃣ ALIEN SPEED SCALING
// ============================================================

const BASE_ALIEN_SPEED = 0.005;
const MAX_ALIEN_SPEED = 0.012;

/**
 * Calculate alien movement speed based on level
 */
export function getAlienSpeed(level: number, hasSlowMotion: boolean = false): number {
  const speedBoost = level * 0.00015;
  const baseSpeed = Math.min(MAX_ALIEN_SPEED, BASE_ALIEN_SPEED + speedBoost);
  
  // Slow motion halves the speed
  return hasSlowMotion ? baseSpeed * 0.5 : baseSpeed;
}

// ============================================================
// 5️⃣ ALIEN HEALTH / ARMOR SYSTEM
// ============================================================

export interface AlienHealthTier {
  hp: number;
  armorLevel: number; // 0 = none, 1 = light, 2 = medium, 3 = heavy
  name: string;
}

/**
 * Get alien HP based on level bracket
 */
export function getAlienHP(level: number): AlienHealthTier {
  if (level <= 15) return { hp: 1, armorLevel: 0, name: 'standard' };
  if (level <= 35) return { hp: 2, armorLevel: 1, name: 'armored' };
  if (level <= 70) return { hp: 3, armorLevel: 2, name: 'shielded' };
  return { hp: 4, armorLevel: 3, name: 'elite' };
}

/**
 * Get boss HP (scaled for mini-bosses every 10 levels)
 */
export function getBossHP(level: number): number {
  const baseHP = 8;
  const scaling = Math.floor(level / 10);
  return baseHP + scaling * 4; // Level 10: 12HP, Level 50: 28HP, Level 100: 48HP
}

// ============================================================
// 6️⃣ ENEMY TYPE DISTRIBUTION BY LEVEL
// ============================================================

/**
 * Get weighted alien type distribution based on level
 * Higher levels spawn more dangerous (higher-value) aliens
 */
export function getAlienTypeWeights(level: number): Record<AlienType, number> {
  const bracket = getDifficultyBracket(level);
  
  switch (bracket) {
    case 'training':
      // Mostly red/green (easy)
      return { red: 40, green: 30, blue: 15, yellow: 10, purple: 3, cyan: 2 };
    case 'cadet':
      return { red: 30, green: 25, blue: 20, yellow: 15, purple: 6, cyan: 4 };
    case 'pilot':
      return { red: 20, green: 20, blue: 25, yellow: 20, purple: 10, cyan: 5 };
    case 'veteran':
      return { red: 15, green: 15, blue: 20, yellow: 25, purple: 15, cyan: 10 };
    case 'ace':
      return { red: 10, green: 10, blue: 15, yellow: 25, purple: 25, cyan: 15 };
    case 'elite':
      // More rare/valuable aliens
      return { red: 8, green: 8, blue: 12, yellow: 22, purple: 28, cyan: 22 };
  }
}

/**
 * Get random alien type based on level-weighted distribution
 */
export function getWeightedAlienType(level: number): AlienType {
  const weights = getAlienTypeWeights(level);
  const types = Object.keys(weights) as AlienType[];
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  
  let random = Math.random() * totalWeight;
  
  for (const type of types) {
    random -= weights[type];
    if (random <= 0) return type;
  }
  
  return 'red'; // fallback
}

// ============================================================
// 7️⃣ FORMATION PATTERNS (Level 30+)
// ============================================================

export type FormationType = 
  | 'random'       // Default scattered spawn
  | 'v-shape'      // V formation
  | 'horizontal'   // Horizontal line
  | 'diagonal'     // Diagonal sweep
  | 'pincer'       // Two groups from sides
  | 'swarm';       // Clustered group

export interface FormationSpawn {
  type: FormationType;
  positions: { x: number; y: number }[];
}

/**
 * Get formation based on level and randomness
 */
export function getFormation(level: number): FormationSpawn {
  // Random spawns for early levels
  if (level < 30) {
    const x = (Math.random() - 0.5) * 6;
    return { type: 'random', positions: [{ x, y: 4 }] };
  }
  
  // Formation chance increases with level
  const formationChance = Math.min(0.6, (level - 30) * 0.015);
  
  if (Math.random() > formationChance) {
    const x = (Math.random() - 0.5) * 6;
    return { type: 'random', positions: [{ x, y: 4 }] };
  }
  
  // Pick a formation
  const formations: FormationType[] = ['v-shape', 'horizontal', 'diagonal', 'pincer'];
  if (level >= 60) formations.push('swarm');
  
  const formationType = formations[Math.floor(Math.random() * formations.length)];
  
  switch (formationType) {
    case 'v-shape':
      return {
        type: 'v-shape',
        positions: [
          { x: 0, y: 4 },
          { x: -0.8, y: 4.3 },
          { x: 0.8, y: 4.3 },
          { x: -1.5, y: 4.6 },
          { x: 1.5, y: 4.6 }
        ]
      };
    
    case 'horizontal':
      return {
        type: 'horizontal',
        positions: [
          { x: -2, y: 4 },
          { x: -1, y: 4 },
          { x: 0, y: 4 },
          { x: 1, y: 4 },
          { x: 2, y: 4 }
        ]
      };
    
    case 'diagonal':
      const direction = Math.random() > 0.5 ? 1 : -1;
      return {
        type: 'diagonal',
        positions: [
          { x: -2 * direction, y: 4 },
          { x: -1 * direction, y: 4.2 },
          { x: 0, y: 4.4 },
          { x: 1 * direction, y: 4.6 }
        ]
      };
    
    case 'pincer':
      return {
        type: 'pincer',
        positions: [
          { x: -2.5, y: 4 },
          { x: -2, y: 4.2 },
          { x: 2.5, y: 4 },
          { x: 2, y: 4.2 }
        ]
      };
    
    case 'swarm':
      const centerX = (Math.random() - 0.5) * 4;
      return {
        type: 'swarm',
        positions: [
          { x: centerX, y: 4 },
          { x: centerX - 0.5, y: 4.2 },
          { x: centerX + 0.5, y: 4.2 },
          { x: centerX - 0.3, y: 4.4 },
          { x: centerX + 0.3, y: 4.4 },
          { x: centerX, y: 4.5 }
        ]
      };
    
    default:
      return { type: 'random', positions: [{ x: (Math.random() - 0.5) * 6, y: 4 }] };
  }
}

// ============================================================
// 8️⃣ POWER-UP BALANCE SCALING
// ============================================================

/**
 * Get power-up duration based on level (decreases at higher levels)
 */
export function getPowerUpDuration(level: number): number {
  const baseDuration = 10000; // 10 seconds
  
  if (level < 40) return baseDuration;
  if (level < 60) return baseDuration * 0.8; // 8 seconds
  if (level < 80) return baseDuration * 0.6; // 6 seconds
  return baseDuration * 0.5; // 5 seconds for elite
}

/**
 * Get power-up drop chance (slightly reduced at high levels)
 */
export function getPowerUpDropChance(level: number): number {
  // Base: 100% (always drops)
  // Reduces slightly to make power-ups more tactical
  if (level < 50) return 1.0;
  if (level < 70) return 0.85;
  if (level < 90) return 0.7;
  return 0.6;
}

// ============================================================
// 9️⃣ MINI-BOSS SYSTEM (Every 10 Levels)
// ============================================================

export interface MiniBoss {
  level: number;
  name: string;
  hp: number;
  speed: number;
  width: number;  // Larger hitbox
  pattern: 'weave' | 'charge' | 'orbit';
  guaranteedDrop: PowerUp;
}

export function isBossLevel(level: number): boolean {
  return level > 0 && level % 10 === 0;
}

export function getMiniBossConfig(level: number): MiniBoss | null {
  if (!isBossLevel(level)) return null;
  
  const bossNumber = level / 10;
  const drops: PowerUp[] = ['shield', 'spreadShot', 'doubleBullets', 'scoreMultiplier', 'fireRate', 'slowMotion'];
  
  return {
    level,
    name: `WARLORD-${bossNumber}`,
    hp: getBossHP(level),
    speed: Math.max(0.002, 0.005 - bossNumber * 0.0002), // Slower but tankier
    width: 0.6 + bossNumber * 0.05, // Gets larger
    pattern: bossNumber % 3 === 0 ? 'orbit' : bossNumber % 2 === 0 ? 'charge' : 'weave',
    guaranteedDrop: drops[(bossNumber - 1) % drops.length]
  };
}

// ============================================================
// 🔟 SCORE PRESSURE MECHANICS (Level 50+)
// ============================================================

export interface ScorePressure {
  comboDecay: number;      // How fast combo drops
  missedPenalty: number;   // Score reduction per missed alien
  idlePenalty: boolean;    // Penalize standing still
}

export function getScorePressure(level: number): ScorePressure {
  if (level < 50) {
    return { comboDecay: 0, missedPenalty: 0, idlePenalty: false };
  }
  
  if (level < 70) {
    return { comboDecay: 0.1, missedPenalty: 10, idlePenalty: false };
  }
  
  if (level < 90) {
    return { comboDecay: 0.2, missedPenalty: 25, idlePenalty: true };
  }
  
  return { comboDecay: 0.3, missedPenalty: 50, idlePenalty: true };
}

// ============================================================
// 1️⃣1️⃣ VISUAL DIFFICULTY FEEDBACK
// ============================================================

export interface VisualFeedback {
  backgroundDarkness: number;  // 0-1
  screenShake: number;         // Intensity multiplier
  glowIntensity: number;       // 1-3
  particleDensity: number;     // Multiplier for particle effects
}

export function getVisualFeedback(level: number): VisualFeedback {
  const progress = Math.min(1, level / 100);
  
  return {
    backgroundDarkness: 0.1 + progress * 0.3, // Darker at higher levels
    screenShake: 1 + progress * 0.5,          // More shake
    glowIntensity: 1 + progress * 2,          // Brighter glows
    particleDensity: 1 + progress * 1.5       // More particles
  };
}

// ============================================================
// 1️⃣2️⃣ DIFFICULTY SUMMARY HELPER
// ============================================================

export interface DifficultyConfig {
  level: number;
  bracket: DifficultyBracket;
  bracketName: string;
  spawnInterval: number;
  alienSpeed: number;
  alienHP: AlienHealthTier;
  powerUpDuration: number;
  isBossLevel: boolean;
  boss: MiniBoss | null;
  visualFeedback: VisualFeedback;
}

/**
 * Get complete difficulty configuration for a level
 */
export function getDifficultyConfig(level: number): DifficultyConfig {
  const bracket = getDifficultyBracket(level);
  
  return {
    level,
    bracket,
    bracketName: bracketNames[bracket],
    spawnInterval: getSpawnInterval(level),
    alienSpeed: getAlienSpeed(level),
    alienHP: getAlienHP(level),
    powerUpDuration: getPowerUpDuration(level),
    isBossLevel: isBossLevel(level),
    boss: getMiniBossConfig(level),
    visualFeedback: getVisualFeedback(level)
  };
}

// ============================================================
// 1️⃣3️⃣ LEVEL MILESTONES TABLE (For Display)
// ============================================================

export const levelMilestones = [
  { level: 1, title: 'Rookie Launch', description: 'Welcome, Pilot!' },
  { level: 10, title: 'First Blood', description: 'Defeated Warlord-1' },
  { level: 20, title: 'Rising Star', description: 'Armor piercing unlocked' },
  { level: 30, title: 'Formation Master', description: 'Facing tactical enemies' },
  { level: 40, title: 'Veteran Status', description: 'Shielded enemies appear' },
  { level: 50, title: 'Halfway Hero', description: 'Score pressure begins' },
  { level: 60, title: 'Swarm Hunter', description: 'Swarm formations unlocked' },
  { level: 70, title: 'Ace Pilot', description: 'Elite enemies incoming' },
  { level: 80, title: 'Legend', description: 'Maximum armor enemies' },
  { level: 90, title: 'Cosmic Champion', description: 'Near-mastery achieved' },
  { level: 100, title: 'COSMIC STRIKE', description: 'Ultimate rank achieved!' }
];

export function getCurrentMilestone(level: number) {
  return levelMilestones.filter(m => m.level <= level).pop() || levelMilestones[0];
}
