import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ScoreEntry {
  score: number;
  date: Date;
  difficulty: string;
}

interface ProfileState {
  highScore: number;
  recentScores: ScoreEntry[];
  settings: {
    difficulty: 'easy' | 'normal' | 'hard';
    sound: boolean;
    theme: string;
  };
}

const initialState: ProfileState = {
  highScore: 0,
  recentScores: [],
  settings: {
    difficulty: 'normal',
    sound: true,
    theme: 'cosmic',
  },
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setHighScore(state, action: PayloadAction<number>) {
      if (action.payload > state.highScore) {
        state.highScore = action.payload;
      }
    },
    addRecentScore(state, action: PayloadAction<ScoreEntry>) {
      state.recentScores.unshift(action.payload);
      if (state.recentScores.length > 5) {
        state.recentScores.pop();
      }
    },
    updateSettings(state, action: PayloadAction<Partial<ProfileState['settings']>>) {
      state.settings = { ...state.settings, ...action.payload };
    },
  },
});

export const { setHighScore, addRecentScore, updateSettings } = profileSlice.actions;
export default profileSlice.reducer;
