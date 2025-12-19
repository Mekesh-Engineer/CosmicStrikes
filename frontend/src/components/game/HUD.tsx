import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import {
  getDifficultyBracket,
  bracketNames,
  bracketColors,
  getLevelProgress,
  getComboMultiplier,
  getWaveConfig,
  type WaveNumber
} from '../../features/difficultyV2';
import { memo } from 'react';

function HUD() {
  const {
    score,
    lives,
    level,
    wave,
    combo,
    comboTier,
    scoreMultiplier,
    bossActive,
    bossHP,
    bossMaxHP,
    status,
    waveKills
  } = useSelector((state: RootState) => state.game);

  const bracket = getDifficultyBracket(level);
  const colors = bracketColors[bracket];
  const progress = getLevelProgress(score, level);
  const comboInfo = getComboMultiplier(combo);
  const waveConfig = getWaveConfig(level, wave as WaveNumber);

  // Format score with commas
  const formattedScore = score.toLocaleString();

  return (
    <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none select-none">
      {/* Top Bar */}
      <div className="flex justify-between items-start gap-4">
        {/* Left: Lives & Level */}
        <div className="flex flex-col gap-2">
          {/* Lives */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${i < lives
                    ? 'bg-red-500 border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.7)]'
                    : 'bg-transparent border-gray-600'
                  }`}
              />
            ))}
          </div>

          {/* Level & Bracket */}
          <div
            className="px-3 py-1 rounded-lg backdrop-blur-sm"
            style={{
              backgroundColor: `${colors.bg}cc`,
              borderLeft: `3px solid ${colors.primary}`
            }}
          >
            <div className="text-xs text-gray-400">{bracketNames[bracket]}</div>
            <div
              className="text-lg font-bold"
              style={{ color: colors.primary }}
            >
              LEVEL {level}
            </div>
            {/* Progress bar to next level */}
            <div className="w-32 h-1 bg-gray-700 rounded-full overflow-hidden mt-1">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  backgroundColor: colors.primary
                }}
              />
            </div>
          </div>

          {/* Wave indicator */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className={`w-4 h-2 rounded-sm transition-all duration-300 ${i < wave
                    ? 'opacity-100'
                    : 'opacity-30'
                  }`}
                style={{ backgroundColor: colors.primary }}
              />
            ))}
            <span className="text-xs text-gray-400 ml-2">
              WAVE {wave}/5
            </span>
          </div>
        </div>

        {/* Center: Score & Combo */}
        <div className="flex flex-col items-center">
          {/* Score */}
          <div
            className="text-3xl font-bold tracking-wider"
            style={{
              color: colors.primary,
              textShadow: `0 0 20px ${colors.glow}`
            }}
          >
            {formattedScore}
          </div>

          {/* Multiplier */}
          {scoreMultiplier > 1 && (
            <div
              className="text-lg font-bold animate-pulse"
              style={{ color: colors.primary }}
            >
              {scoreMultiplier.toFixed(1)}x MULTIPLIER
            </div>
          )}

          {/* Combo display */}
          {combo > 0 && (
            <div className="mt-2 flex flex-col items-center">
              <div
                className={`text-xl font-black transition-all duration-200 ${comboInfo.isPerfect ? 'animate-bounce text-yellow-400' : ''
                  }`}
                style={{
                  color: comboInfo.isPerfect ? '#fbbf24' : colors.primary,
                  textShadow: `0 0 15px ${comboInfo.isPerfect ? 'rgba(251,191,36,0.8)' : colors.glow}`
                }}
              >
                {combo} COMBO
              </div>
              {comboTier && (
                <div
                  className={`text-sm font-bold ${comboInfo.isPerfect ? 'text-yellow-300' : ''
                    }`}
                  style={{ color: comboInfo.isPerfect ? '#fcd34d' : colors.primary }}
                >
                  {comboTier}!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Wave info / Boss HP */}
        <div className="flex flex-col items-end gap-2">
          {bossActive ? (
            // Boss HP Bar
            <div className="w-48">
              <div className="text-xs text-red-400 text-right mb-1 animate-pulse">
                ⚠️ BOSS BATTLE
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-red-500">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-200"
                  style={{ width: `${(bossHP / bossMaxHP) * 100}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 text-right mt-1">
                {bossHP} / {bossMaxHP} HP
              </div>
            </div>
          ) : (
            // Wave progress
            <div className="text-right">
              <div className="text-xs text-gray-400">ENEMIES CLEARED</div>
              <div
                className="text-lg font-bold"
                style={{ color: colors.primary }}
              >
                {waveKills} / {waveConfig.enemiesRequired}
              </div>
              <div className="w-32 h-1 bg-gray-700 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (waveKills / waveConfig.enemiesRequired) * 100)}%`,
                    backgroundColor: colors.primary
                  }}
                />
              </div>
            </div>
          )}

          {/* Game status indicator */}
          {status === 'waveTransition' && (
            <div
              className="px-4 py-2 rounded-lg animate-pulse text-center"
              style={{ backgroundColor: `${colors.primary}22` }}
            >
              <div className="text-xs text-gray-400">INCOMING</div>
              <div
                className="text-sm font-bold"
                style={{ color: colors.primary }}
              >
                WAVE {wave}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Wave transition overlay */}
      {status === 'waveTransition' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="text-4xl font-black animate-pulse px-8 py-4 rounded-xl backdrop-blur-sm"
            style={{
              color: colors.primary,
              backgroundColor: `${colors.bg}dd`,
              textShadow: `0 0 30px ${colors.glow}`
            }}
          >
            WAVE {wave} INCOMING
          </div>
        </div>
      )}

      {/* Boss incoming warning */}
      {status === 'boss' && !bossActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="text-4xl font-black animate-bounce text-red-500 px-8 py-4 rounded-xl backdrop-blur-sm"
            style={{
              backgroundColor: 'rgba(0,0,0,0.8)',
              textShadow: '0 0 30px rgba(239,68,68,0.8)'
            }}
          >
            ⚠️ BOSS APPROACHING ⚠️
          </div>
        </div>
      )}

      {/* Victory overlay */}
      {status === 'victory' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="text-5xl font-black text-yellow-400 px-8 py-4 rounded-xl backdrop-blur-sm animate-pulse"
            style={{
              backgroundColor: 'rgba(0,0,0,0.9)',
              textShadow: '0 0 40px rgba(251,191,36,0.8)'
            }}
          >
            🏆 COSMIC SAVIOR 🏆
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(HUD);
