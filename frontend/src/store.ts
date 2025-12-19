import { configureStore, createSelector } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import game from './features/game';
import auth from './features/auth';
import profileSlice from './features/profileSlice';

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 OPTIMIZED REDUX STORE
// ═══════════════════════════════════════════════════════════════════════════════
// - Configured with performance-optimized middleware settings
// - Memoized selectors for efficient re-render prevention
// ═══════════════════════════════════════════════════════════════════════════════

// Check if we're in development mode (Vite uses import.meta.env)
const isDev = import.meta.env.DEV;

export const store = configureStore({
  reducer: { 
    game, 
    auth, 
    profile: profileSlice 
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Disable serializable check in production for performance
      serializableCheck: isDev,
      // Disable immutable check in production for performance  
      immutableCheck: isDev,
    }),
  devTools: isDev,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 MEMOIZED SELECTORS (Prevent unnecessary re-renders)
// ═══════════════════════════════════════════════════════════════════════════════

// Game state base selectors
const selectGame = (state: RootState) => state.game;

// Memoized player position selector
export const selectPlayerPosition = createSelector(
  [selectGame],
  (game) => ({ x: game.playerX, y: game.playerY })
);

// Memoized bullets selector (returns new ref only when bullets change)
export const selectBullets = createSelector(
  [selectGame],
  (game) => game.bullets
);

// Memoized aliens selector
export const selectAliens = createSelector(
  [selectGame],
  (game) => game.aliens
);

// Memoized game status selector
export const selectGameStatus = createSelector(
  [selectGame],
  (game) => ({
    status: game.status,
    score: game.score,
    lives: game.lives,
    level: game.level,
  })
);

// Memoized power-ups selector
export const selectActivePowerUps = createSelector(
  [selectGame],
  (game) => game.activePowerUps
);

// Memoized combo/score multiplier selector
export const selectComboState = createSelector(
  [selectGame],
  (game) => ({
    combo: game.combo,
    maxCombo: game.maxCombo,
    comboTier: game.comboTier,
    scoreMultiplier: game.scoreMultiplier,
    totalKills: game.totalKills,
  })
);

// Memoized wave state selector
export const selectWaveState = createSelector(
  [selectGame],
  (game) => ({
    level: game.level,
    wave: game.wave,
    waveKills: game.waveKills,
    waveEnemiesSpawned: game.waveEnemiesSpawned,
    status: game.status,
    difficultyMode: game.difficultyMode,
  })
);

// Memoized boss state selector
export const selectBossState = createSelector(
  [selectGame],
  (game) => ({
    bossActive: game.bossActive,
    bossHP: game.bossHP,
    bossMaxHP: game.bossMaxHP,
  })
);

// Memoized entity counts for performance monitoring
export const selectEntityCounts = createSelector(
  [selectGame],
  (game) => ({
    bulletCount: game.bullets.length,
    alienCount: game.aliens.length,
    totalEntities: game.bullets.length + game.aliens.length,
  })
);
