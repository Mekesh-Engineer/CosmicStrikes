/**
 * 🎮 COSMIC STRIKES - REDESIGNED DIFFICULTY SYSTEM V2
 * 
 * Complete Level 1-100 progression with:
 * - 5 waves per level
 * - Boss battles every 10 levels
 * - Elite enemy types with progressive unlocks
 * - Combo multiplier system (1x-5x)
 * - Win/loss conditions
 * - Non-linear score gates
 */

import type { AlienType, PowerUp } from './game';

// ════════════════════════════════════════════════════════════════════════════════
// 1️⃣ CORE TYPES & ENUMS
// ════════════════════════════════════════════════════════════════════════════════

export type GameStatus = 'playing' | 'boss' | 'victory' | 'defeat' | 'waveTransition';
export type DifficultyMode = 'normal' | 'elite' | 'mastery';
export type WaveNumber = 1 | 2 | 3 | 4 | 5;

// ════════════════════════════════════════════════════════════════════════════════
// 2️⃣ LEVEL PROGRESSION (Non-Linear Score Gates)
// ════════════════════════════════════════════════════════════════════════════════

const BASE_SCORE_PER_LEVEL = 500;

/**
 * Calculate required score for a specific level (non-linear scaling)
 * Formula: 500 * level * level^0.85
 * 
 * Level  | Score Req | Total Score
 * 1      | 500       | 500
 * 10     | 7,200     | 25K
 * 25     | 32K       | 150K
 * 50     | 95K       | 750K  
 * 80     | 210K      | 2.1M
 * 100    | 285K      | 3.8M+
 */
export function getRequiredScoreForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(BASE_SCORE_PER_LEVEL * level * Math.pow(level, 0.85));
}

/**
 * Calculate current level based on score
 */
export function calculateLevelFromScore(score: number): number {
  for (let level = 1; level <= 100; level++) {
    if (score < getRequiredScoreForLevel(level)) {
      return Math.max(1, level - 1);
    }
  }
  return 100;
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

/**
 * Get cumulative score needed to reach a level
 */
export function getCumulativeScoreForLevel(targetLevel: number): number {
  let total = 0;
  for (let level = 1; level <= targetLevel; level++) {
    total += getRequiredScoreForLevel(level);
  }
  return total;
}

// ════════════════════════════════════════════════════════════════════════════════
// 3️⃣ DIFFICULTY BRACKETS / SECTORS
// ════════════════════════════════════════════════════════════════════════════════

export type DifficultyBracket = 
  | 'training'      // 1-10: Blue nebula
  | 'cadet'         // 11-25: Purple vortex
  | 'pilot'         // 26-40: Red plasma
  | 'veteran'       // 41-60: Black hole
  | 'ace'           // 61-80: Star crusher
  | 'elite';        // 81-100: Apocalypse

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

export const bracketColors: Record<DifficultyBracket, { primary: string; glow: string; bg: string }> = {
  training: { primary: '#22c55e', glow: 'rgba(34, 197, 94, 0.5)', bg: '#0a1a0f' },
  cadet: { primary: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)', bg: '#0a0f1a' },
  pilot: { primary: '#a855f7', glow: 'rgba(168, 85, 247, 0.5)', bg: '#140a1a' },
  veteran: { primary: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)', bg: '#1a140a' },
  ace: { primary: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)', bg: '#1a0a0a' },
  elite: { primary: '#ec4899', glow: 'rgba(236, 72, 153, 0.5)', bg: '#1a0a14' }
};

// ════════════════════════════════════════════════════════════════════════════════
// 4️⃣ WAVE SYSTEM (5 Waves Per Level)
// ════════════════════════════════════════════════════════════════════════════════

export interface WaveConfig {
  wave: WaveNumber;
  enemiesPerSecond: number;
  alienSpeed: number;
  alienHP: number;
  special: 'basic' | 'zigzag' | 'scouts' | 'shielded' | 'formations' | 'elite';
  duration: number; // Wave duration in ms
  enemiesRequired: number; // Enemies to kill to clear wave
}

/**
 * Get wave configuration based on level and wave number
 */
export function getWaveConfig(level: number, wave: WaveNumber): WaveConfig {
  // Base config varies by level band
  let baseEPS: number, baseSpeed: number, baseHP: number, special: WaveConfig['special'];
  
  if (level <= 10) {
    // Level 1-10: Wave 1-5 [0.5→1.5 | 0.03→0.06 | 1 | Basic]
    baseEPS = 0.5 + (wave - 1) * 0.25;
    baseSpeed = 0.03 + (wave - 1) * 0.0075;
    baseHP = 1;
    special = 'basic';
  } else if (level <= 25) {
    // Level 11-25: [1.2→2.0 | 0.06→0.09 | 1-2 | Zigzag]
    baseEPS = 1.2 + (wave - 1) * 0.2;
    baseSpeed = 0.06 + (wave - 1) * 0.0075;
    baseHP = wave >= 3 ? 2 : 1;
    special = wave >= 3 ? 'zigzag' : 'basic';
  } else if (level <= 40) {
    // Level 26-40: [2.0→3.0 | 0.09→0.11 | 2 | Scouts]
    baseEPS = 2.0 + (wave - 1) * 0.25;
    baseSpeed = 0.09 + (wave - 1) * 0.005;
    baseHP = 2;
    special = wave >= 4 ? 'scouts' : 'zigzag';
  } else if (level <= 60) {
    // Level 41-60: [3.0→4.5 | 0.11→0.13 | 2-3 | Shielded]
    baseEPS = 3.0 + (wave - 1) * 0.375;
    baseSpeed = 0.11 + (wave - 1) * 0.005;
    baseHP = wave >= 3 ? 3 : 2;
    special = wave >= 4 ? 'shielded' : 'scouts';
  } else if (level <= 80) {
    // Level 61-80: [4.5→6.0 | 0.13→0.15 | 3-4 | Formations]
    baseEPS = 4.5 + (wave - 1) * 0.375;
    baseSpeed = 0.13 + (wave - 1) * 0.005;
    baseHP = wave >= 4 ? 4 : 3;
    special = wave >= 3 ? 'formations' : 'shielded';
  } else {
    // Level 81-100: [6.0→8.0 | 0.15→0.18 | 4 | Elite + Mini-boss]
    baseEPS = 6.0 + (wave - 1) * 0.5;
    baseSpeed = 0.15 + (wave - 1) * 0.0075;
    baseHP = wave >= 2 ? 4 : 3;
    special = wave >= 4 ? 'elite' : 'formations';
  }
  
  // Scale with level within bracket
  const levelWithinBracket = getLevelWithinBracket(level);
  const scaleFactor = 1 + levelWithinBracket * 0.02;
  
  return {
    wave,
    enemiesPerSecond: baseEPS * scaleFactor,
    alienSpeed: baseSpeed * scaleFactor,
    alienHP: baseHP,
    special,
    duration: 15000 + wave * 3000, // 18s → 30s
    enemiesRequired: Math.floor((5 + level * 0.3) * wave)
  };
}

function getLevelWithinBracket(level: number): number {
  if (level <= 10) return level - 1;
  if (level <= 25) return level - 11;
  if (level <= 40) return level - 26;
  if (level <= 60) return level - 41;
  if (level <= 80) return level - 61;
  return level - 81;
}

/**
 * Get spawn interval based on wave config
 */
export function getSpawnInterval(level: number, wave: WaveNumber = 1): number {
  const config = getWaveConfig(level, wave);
  return Math.max(350, Math.floor(1000 / config.enemiesPerSecond));
}

/**
 * Get alien speed for current wave
 */
export function getAlienSpeed(level: number, wave: WaveNumber = 1, hasSlowMotion: boolean = false): number {
  const config = getWaveConfig(level, wave);
  return hasSlowMotion ? config.alienSpeed * 0.5 : config.alienSpeed;
}

// ════════════════════════════════════════════════════════════════════════════════
// 5️⃣ BOSS SYSTEM (Every 10 Levels)
// ════════════════════════════════════════════════════════════════════════════════

export type BossPattern = 'circle' | 'zigzag' | 'bomb' | 'spawn' | 'multi' | 'teleport' | 'chase' | 'asteroid' | 'spiral' | 'apocalypse';
export type BossPower = 'spawn_scouts' | 'shield_minions' | 'screen_bombs' | 'rapid_spawn' | 'all_powers' | 'blackout' | 'homing' | 'collision' | 'gravity' | 'apocalypse';

export interface BossConfig {
  level: number;
  name: string;
  hp: number;
  pattern: BossPattern;
  power: BossPower;
  powerCooldown: number;
  speed: number;
  phases: number;
  guaranteedDrop: PowerUp;
  scoreBonus: number;
}

export const BOSS_CONFIGS: Record<number, Omit<BossConfig, 'level' | 'hp' | 'powerCooldown' | 'scoreBonus'>> = {
  10: { name: 'SCOUT COMMANDER', pattern: 'circle', power: 'spawn_scouts', speed: 0.015, phases: 2, guaranteedDrop: 'shield' },
  20: { name: 'SHIELD WARDEN', pattern: 'zigzag', power: 'shield_minions', speed: 0.012, phases: 2, guaranteedDrop: 'spreadShot' },
  30: { name: 'PLASMA BOMBER', pattern: 'bomb', power: 'screen_bombs', speed: 0.014, phases: 3, guaranteedDrop: 'fireRate' },
  40: { name: 'SWARM QUEEN', pattern: 'spawn', power: 'rapid_spawn', speed: 0.010, phases: 3, guaranteedDrop: 'doubleBullets' },
  50: { name: 'ELITE VANGUARD', pattern: 'multi', power: 'all_powers', speed: 0.013, phases: 3, guaranteedDrop: 'scoreMultiplier' },
  60: { name: 'NEBULA LORD', pattern: 'teleport', power: 'blackout', speed: 0.016, phases: 3, guaranteedDrop: 'slowMotion' },
  70: { name: 'VOID REAPER', pattern: 'chase', power: 'homing', speed: 0.018, phases: 4, guaranteedDrop: 'shield' },
  80: { name: 'STAR CRUSHER', pattern: 'asteroid', power: 'collision', speed: 0.014, phases: 4, guaranteedDrop: 'spreadShot' },
  90: { name: 'GALAXY DEVOURER', pattern: 'spiral', power: 'gravity', speed: 0.012, phases: 4, guaranteedDrop: 'fireRate' },
  100: { name: 'COSMIC BEHEMOTH', pattern: 'apocalypse', power: 'apocalypse', speed: 0.015, phases: 5, guaranteedDrop: 'scoreMultiplier' }
};

/**
 * Check if level is a boss level
 */
export function isBossLevel(level: number): boolean {
  return level > 0 && level % 10 === 0 && level <= 100;
}

/**
 * Get boss HP based on level
 * L10: 40, L20: 65, L30: 90, L40: 115, L50: 140
 * L60: 165, L70: 190, L80: 215, L90: 240, L100: 265
 */
export function getBossHP(level: number): number {
  const bossNumber = level / 10;
  return 15 + bossNumber * 25;
}

/**
 * Get boss power cooldown (increases with level)
 */
export function getBossPowerCooldown(level: number): number {
  return 5000 + level * 50; // 5.5s at L10, 10s at L100
}

/**
 * Get complete boss configuration
 */
export function getBossConfig(level: number): BossConfig | null {
  if (!isBossLevel(level)) return null;
  
  const baseConfig = BOSS_CONFIGS[level];
  if (!baseConfig) return null;
  
  return {
    level,
    ...baseConfig,
    hp: getBossHP(level),
    powerCooldown: getBossPowerCooldown(level),
    scoreBonus: 50000 * (level / 10) // 50K at L10, 500K at L100
  };
}

/**
 * Calculate boss phase (1-5) based on remaining HP
 */
export function getBossPhase(currentHP: number, maxHP: number, totalPhases: number): number {
  const hpPercent = currentHP / maxHP;
  return Math.max(1, Math.ceil(hpPercent * totalPhases));
}

// Legacy alias
export function getMiniBossConfig(level: number) {
  return getBossConfig(level);
}

// ════════════════════════════════════════════════════════════════════════════════
// 6️⃣ COMBO & MULTIPLIER SYSTEM
// ════════════════════════════════════════════════════════════════════════════════

export interface ComboInfo {
  multiplier: number;
  tier: string;
  isPerfect: boolean;
}

/**
 * Get multiplier based on combo count
 * 0-5 kills: 1x
 * 6-15: 2x  
 * 16-30: 3x
 * 31-50: 4x
 * 50+: 5x → PERFECT bonus (+10K)
 */
export function getComboMultiplier(combo: number): ComboInfo {
  if (combo >= 50) return { multiplier: 5, tier: 'PERFECT', isPerfect: true };
  if (combo >= 31) return { multiplier: 4, tier: 'INCREDIBLE', isPerfect: false };
  if (combo >= 16) return { multiplier: 3, tier: 'AWESOME', isPerfect: false };
  if (combo >= 6) return { multiplier: 2, tier: 'GREAT', isPerfect: false };
  return { multiplier: 1, tier: '', isPerfect: false };
}

/**
 * Calculate score for killing an alien
 * Base Points: 500 * alienHP * waveNumber * difficultyMultiplier
 */
export function calculateKillScore(
  alienHP: number,
  wave: WaveNumber,
  combo: number,
  isBoss: boolean = false,
  difficultyMode: DifficultyMode = 'normal'
): number {
  const basePoints = 500 * alienHP * wave;
  const { multiplier } = getComboMultiplier(combo);
  
  // Difficulty mode multiplier
  const modeMultiplier = difficultyMode === 'mastery' ? 2 : difficultyMode === 'elite' ? 1.5 : 1;
  
  // Boss gives 5x base
  const bossMultiplier = isBoss ? 5 : 1;
  
  return Math.floor(basePoints * multiplier * modeMultiplier * bossMultiplier);
}

/**
 * Get wave clear bonus
 */
export function getWaveClearBonus(wave: WaveNumber, level: number): number {
  return 5000 * wave + level * 100;
}

/**
 * Perfect combo bonus (50+ kills without missing)
 */
export const PERFECT_COMBO_BONUS = 10000;

// ════════════════════════════════════════════════════════════════════════════════
// 7️⃣ ELITE ENEMY TYPES
// ════════════════════════════════════════════════════════════════════════════════

export type EliteEnemyType = 
  | 'basic'       // Default
  | 'zigzag'      // L11+: Erratic pathing
  | 'scout'       // L26+: Double speed
  | 'armored'     // L41+: 2 hits to kill (3 HP)
  | 'bomber'      // L51+: Drops bombs
  | 'swarm'       // L61+: Travels in packs
  | 'elite'       // L71+: All traits
  | 'voidwalker'  // L81+: Teleports
  | 'apocalypse'; // L91+: Screen-wide attacks

export interface EliteEnemyConfig {
  type: EliteEnemyType;
  minLevel: number;
  hp: number;
  speed: number; // Multiplier
  behavior: string;
  spawnWeight: number; // Chance weight
}

export const ELITE_ENEMY_CONFIGS: EliteEnemyConfig[] = [
  { type: 'basic', minLevel: 1, hp: 1, speed: 1, behavior: 'straight', spawnWeight: 100 },
  { type: 'zigzag', minLevel: 11, hp: 2, speed: 1, behavior: 'erratic', spawnWeight: 30 },
  { type: 'scout', minLevel: 26, hp: 1, speed: 2, behavior: 'fast', spawnWeight: 25 },
  { type: 'armored', minLevel: 41, hp: 3, speed: 0.8, behavior: 'tank', spawnWeight: 20 },
  { type: 'bomber', minLevel: 51, hp: 2, speed: 0.9, behavior: 'bombs', spawnWeight: 15 },
  { type: 'swarm', minLevel: 61, hp: 2, speed: 1.1, behavior: 'pack', spawnWeight: 15 },
  { type: 'elite', minLevel: 71, hp: 4, speed: 1.2, behavior: 'all', spawnWeight: 10 },
  { type: 'voidwalker', minLevel: 81, hp: 5, speed: 1, behavior: 'teleport', spawnWeight: 8 },
  { type: 'apocalypse', minLevel: 91, hp: 6, speed: 1.3, behavior: 'area', spawnWeight: 5 }
];

/**
 * Get available elite enemy types for a level
 */
export function getAvailableEliteTypes(level: number): EliteEnemyConfig[] {
  return ELITE_ENEMY_CONFIGS.filter(config => level >= config.minLevel);
}

/**
 * Get weighted random elite enemy type
 */
export function getRandomEliteType(level: number): EliteEnemyConfig {
  const available = getAvailableEliteTypes(level);
  const totalWeight = available.reduce((sum, e) => sum + e.spawnWeight, 0);
  let random = Math.random() * totalWeight;
  
  for (const enemy of available) {
    random -= enemy.spawnWeight;
    if (random <= 0) return enemy;
  }
  
  return available[0];
}

// ════════════════════════════════════════════════════════════════════════════════
// 8️⃣ ALIEN TYPE DISTRIBUTION
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Get weighted alien type distribution based on level
 */
export function getAlienTypeWeights(level: number): Record<AlienType, number> {
  const bracket = getDifficultyBracket(level);
  
  switch (bracket) {
    case 'training':
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
  
  return 'red';
}

// ════════════════════════════════════════════════════════════════════════════════
// 9️⃣ ALIEN HP SYSTEM
// ════════════════════════════════════════════════════════════════════════════════

export interface AlienHealthTier {
  hp: number;
  armorLevel: number;
  name: string;
}

/**
 * Get alien HP based on level and wave
 */
export function getAlienHP(level: number, wave: WaveNumber = 1): AlienHealthTier {
  const config = getWaveConfig(level, wave);
  
  if (config.alienHP <= 1) return { hp: 1, armorLevel: 0, name: 'standard' };
  if (config.alienHP === 2) return { hp: 2, armorLevel: 1, name: 'armored' };
  if (config.alienHP === 3) return { hp: 3, armorLevel: 2, name: 'shielded' };
  return { hp: config.alienHP, armorLevel: 3, name: 'elite' };
}

// ════════════════════════════════════════════════════════════════════════════════
// 🔟 FORMATION PATTERNS
// ════════════════════════════════════════════════════════════════════════════════

export type FormationType = 
  | 'random'       // Default scattered spawn
  | 'v-shape'      // V formation → converge center (L30+)
  | 'horizontal'   // Horizontal line → sweeps left/right (L40+)
  | 'staggered'    // 3 lanes with gaps (L50+)
  | 'swarm'        // 8 enemies tight → splits apart (L70+)
  | 'diagonal'     // Diagonal sweep
  | 'pincer';      // Two groups from sides

export interface FormationSpawn {
  type: FormationType;
  positions: { x: number; y: number; vx?: number }[];
}

/**
 * Get formation based on level and wave
 */
export function getFormation(level: number, wave: WaveNumber = 1): FormationSpawn {
  // Random spawns for early levels
  if (level < 30) {
    const x = (Math.random() - 0.5) * 6;
    return { type: 'random', positions: [{ x, y: 4 }] };
  }
  
  // Formation chance increases with level and wave
  const formationChance = Math.min(0.7, (level - 30) * 0.015 + wave * 0.05);
  
  if (Math.random() > formationChance) {
    const x = (Math.random() - 0.5) * 6;
    return { type: 'random', positions: [{ x, y: 4 }] };
  }
  
  // Pick a formation based on level
  const formations: FormationType[] = ['v-shape'];
  if (level >= 40) formations.push('horizontal');
  if (level >= 50) formations.push('staggered');
  if (level >= 70) formations.push('swarm');
  
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
      const sweepDir = Math.random() > 0.5 ? 0.02 : -0.02;
      return {
        type: 'horizontal',
        positions: [
          { x: -2, y: 4, vx: sweepDir },
          { x: -1, y: 4, vx: sweepDir },
          { x: 0, y: 4, vx: sweepDir },
          { x: 1, y: 4, vx: sweepDir },
          { x: 2, y: 4, vx: sweepDir }
        ]
      };
    
    case 'staggered':
      return {
        type: 'staggered',
        positions: [
          { x: -2, y: 4 },
          { x: 0, y: 4.3 },
          { x: 2, y: 4 },
          { x: -1, y: 4.6 },
          { x: 1, y: 4.6 }
        ]
      };
    
    case 'swarm':
      const centerX = (Math.random() - 0.5) * 3;
      return {
        type: 'swarm',
        positions: [
          { x: centerX, y: 4, vx: -0.01 },
          { x: centerX - 0.4, y: 4.1, vx: -0.015 },
          { x: centerX + 0.4, y: 4.1, vx: 0.015 },
          { x: centerX - 0.6, y: 4.3, vx: -0.02 },
          { x: centerX + 0.6, y: 4.3, vx: 0.02 },
          { x: centerX - 0.3, y: 4.5 },
          { x: centerX + 0.3, y: 4.5 },
          { x: centerX, y: 4.6 }
        ]
      };
    
    default:
      return { type: 'random', positions: [{ x: (Math.random() - 0.5) * 6, y: 4 }] };
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// 1️⃣1️⃣ POWER-UP SCALING
// ════════════════════════════════════════════════════════════════════════════════

export interface PowerUpScaling {
  duration: number;
  charges?: number;
  bonus?: number;
}

/**
 * Get power-up configuration based on level
 * Power-up | L1-25 | L26-50 | L51-75 | L76-100
 * Rapid Fire | 8s | 6s | 4s | 3s
 * Double Score | 10s | 8s | 6s | 4s
 * Shield | 5s | 4s | 3s | 2s (3 charges)
 */
export function getPowerUpScaling(powerUp: PowerUp, level: number): PowerUpScaling {
  if (level <= 25) {
    return {
      duration: powerUp === 'scoreMultiplier' ? 10000 : powerUp === 'shield' ? 5000 : 8000,
      charges: powerUp === 'shield' ? 1 : undefined
    };
  }
  if (level <= 50) {
    return {
      duration: powerUp === 'scoreMultiplier' ? 8000 : powerUp === 'shield' ? 4000 : 6000,
      charges: powerUp === 'shield' ? 2 : undefined
    };
  }
  if (level <= 75) {
    return {
      duration: powerUp === 'scoreMultiplier' ? 6000 : powerUp === 'shield' ? 3000 : 4000,
      charges: powerUp === 'shield' ? 2 : undefined
    };
  }
  return {
    duration: powerUp === 'scoreMultiplier' ? 4000 : powerUp === 'shield' ? 2000 : 3000,
    charges: powerUp === 'shield' ? 3 : undefined
  };
}

export function getPowerUpDuration(level: number): number {
  if (level <= 25) return 8000;
  if (level <= 50) return 6000;
  if (level <= 75) return 4000;
  return 3000;
}

export function getPowerUpDropChance(level: number): number {
  if (level < 50) return 1.0;
  if (level < 70) return 0.85;
  if (level < 90) return 0.7;
  return 0.6;
}

// ════════════════════════════════════════════════════════════════════════════════
// 1️⃣2️⃣ WIN/LOSS CONDITIONS
// ════════════════════════════════════════════════════════════════════════════════

export interface LossCondition {
  type: 'immediate' | 'soft';
  reason: string;
  effect: 'gameOver' | 'comboReset' | 'multiplierReset';
}

export const LOSS_CONDITIONS: LossCondition[] = [
  // Immediate loss (Game Over)
  { type: 'immediate', reason: 'Alien touched cannon (0 lives)', effect: 'gameOver' },
  { type: 'immediate', reason: 'Boss reached bottom', effect: 'gameOver' },
  { type: 'immediate', reason: 'Screen overflow (5+ aliens past bottom)', effect: 'gameOver' },
  
  // Soft loss (Multiplier Reset)
  { type: 'soft', reason: 'Miss 3 aliens in 10s', effect: 'comboReset' },
  { type: 'soft', reason: 'Idle 15s (no shots fired)', effect: 'multiplierReset' }
];

export interface VictoryCondition {
  level: number;
  title: string;
  type: 'minor' | 'major' | 'ultimate';
  reward: string;
}

export const VICTORY_CONDITIONS: VictoryCondition[] = [
  { level: 10, title: 'Sector Cleared', type: 'minor', reward: 'Cadet Badge' },
  { level: 25, title: 'Pilot Status', type: 'minor', reward: 'Pilot Wings' },
  { level: 50, title: 'Elite Sector', type: 'major', reward: 'Elite Title + 100K Bonus' },
  { level: 75, title: 'Ace Status', type: 'major', reward: 'Ace Medal + 500K Bonus' },
  { level: 100, title: 'COSMIC SAVIOR', type: 'ultimate', reward: 'Credits Roll + 1M Bonus' }
];

export function checkVictoryCondition(level: number): VictoryCondition | null {
  return VICTORY_CONDITIONS.find(v => v.level === level) || null;
}

// ════════════════════════════════════════════════════════════════════════════════
// 1️⃣3️⃣ SCORE PRESSURE MECHANICS (Level 50+)
// ════════════════════════════════════════════════════════════════════════════════

export interface ScorePressure {
  comboDecay: number;
  missedPenalty: number;
  idlePenalty: boolean;
}

export function getScorePressure(level: number): ScorePressure {
  if (level < 50) {
    return { comboDecay: 0, missedPenalty: 0, idlePenalty: false };
  }
  if (level < 70) {
    return { comboDecay: 0.1, missedPenalty: 100, idlePenalty: false };
  }
  if (level < 90) {
    return { comboDecay: 0.2, missedPenalty: 250, idlePenalty: true };
  }
  return { comboDecay: 0.3, missedPenalty: 500, idlePenalty: true };
}

// ════════════════════════════════════════════════════════════════════════════════
// 1️⃣4️⃣ VISUAL FEEDBACK
// ════════════════════════════════════════════════════════════════════════════════

export interface VisualFeedback {
  backgroundDarkness: number;
  screenShake: number;
  glowIntensity: number;
  particleDensity: number;
  waveColor: string;
}

export function getVisualFeedback(level: number, wave: WaveNumber = 1): VisualFeedback {
  const bracket = getDifficultyBracket(level);
  const colors = bracketColors[bracket];
  const progress = Math.min(1, level / 100);
  
  return {
    backgroundDarkness: 0.1 + progress * 0.3,
    screenShake: 1 + progress * 0.5 + (wave - 1) * 0.1,
    glowIntensity: 1 + progress * 2,
    particleDensity: 1 + progress * 1.5,
    waveColor: colors.primary
  };
}

// ════════════════════════════════════════════════════════════════════════════════
// 1️⃣5️⃣ LEVEL MILESTONES
// ════════════════════════════════════════════════════════════════════════════════

export const levelMilestones = [
  { level: 1, title: 'Rookie Launch', description: 'Welcome, Pilot!' },
  { level: 10, title: 'First Blood', description: 'Defeated Scout Commander' },
  { level: 20, title: 'Rising Star', description: 'Shield Warden vanquished' },
  { level: 30, title: 'Formation Master', description: 'V-formations unlocked' },
  { level: 40, title: 'Veteran Status', description: 'Sweep waves incoming' },
  { level: 50, title: 'ELITE SECTOR', description: 'Score pressure begins!' },
  { level: 60, title: 'Nebula Hunter', description: 'Facing teleporting foes' },
  { level: 70, title: 'Swarm Breaker', description: 'Swarm formations active' },
  { level: 80, title: 'Star Crusher', description: 'Maximum armor enemies' },
  { level: 90, title: 'Galaxy Champion', description: 'Near-mastery achieved' },
  { level: 100, title: 'COSMIC SAVIOR', description: 'Ultimate rank achieved!' }
];

export function getCurrentMilestone(level: number) {
  return levelMilestones.filter(m => m.level <= level).pop() || levelMilestones[0];
}

// ════════════════════════════════════════════════════════════════════════════════
// 1️⃣6️⃣ DIFFICULTY CONFIG HELPER
// ════════════════════════════════════════════════════════════════════════════════

export interface DifficultyConfig {
  level: number;
  wave: WaveNumber;
  bracket: DifficultyBracket;
  bracketName: string;
  waveConfig: WaveConfig;
  alienHP: AlienHealthTier;
  isBossLevel: boolean;
  boss: BossConfig | null;
  visualFeedback: VisualFeedback;
  scorePressure: ScorePressure;
}

export function getDifficultyConfig(level: number, wave: WaveNumber = 1): DifficultyConfig {
  const bracket = getDifficultyBracket(level);
  
  return {
    level,
    wave,
    bracket,
    bracketName: bracketNames[bracket],
    waveConfig: getWaveConfig(level, wave),
    alienHP: getAlienHP(level, wave),
    isBossLevel: isBossLevel(level),
    boss: getBossConfig(level),
    visualFeedback: getVisualFeedback(level, wave),
    scorePressure: getScorePressure(level)
  };
}

export function getAliensPerSpawn(level: number): number {
  if (level < 30) return 1;
  if (level < 50) return Math.random() > 0.7 ? 2 : 1;
  if (level < 70) return Math.random() > 0.5 ? 2 : 1;
  if (level < 90) return Math.random() > 0.4 ? 3 : 2;
  return Math.random() > 0.3 ? 3 : 2;
}
