import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Alien {
  x: number;
  y: number;
  speed: number;
  size: number;
}

interface GameState {
  cannonAngle: number;
  bullets: Bullet[];
  aliens: Alien[];
  score: number;
  lives: number;
  level: number;
  status: 'idle' | 'playing' | 'paused' | 'gameOver';
}

const initialState: GameState = {
  cannonAngle: 0,
  bullets: [],
  aliens: [],
  score: 0,
  lives: 3,
  level: 1,
  status: 'idle',
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setCannonAngle(state, action: PayloadAction<number>) {
      state.cannonAngle = action.payload;
    },
    addBullet(state, action: PayloadAction<Bullet>) {
      state.bullets.push(action.payload);
    },
    updateBullets(state, action: PayloadAction<Bullet[]>) {
      state.bullets = action.payload;
    },
    addAlien(state, action: PayloadAction<Alien>) {
      state.aliens.push(action.payload);
    },
    updateAliens(state, action: PayloadAction<Alien[]>) {
      state.aliens = action.payload;
    },
    incrementScore(state, action: PayloadAction<number>) {
      state.score += action.payload;
    },
    decrementLives(state) {
      state.lives -= 1;
    },
    setGameStatus(state, action: PayloadAction<GameState['status']>) {
      state.status = action.payload;
    },
    resetGame(state) {
      return initialState;
    },
  },
});

export const {
  setCannonAngle,
  addBullet,
  updateBullets,
  addAlien,
  updateAliens,
  incrementScore,
  decrementLives,
  setGameStatus,
  resetGame,
} = gameSlice.actions;

export default gameSlice.reducer;
