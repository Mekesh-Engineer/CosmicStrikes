import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ProfileState {
  highScore: number;
}

const initialState: ProfileState = {
  highScore: 0,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setHighScore(state, action: PayloadAction<number>) {
      state.highScore = Math.max(state.highScore, action.payload);
    },
  },
});

export const { setHighScore } = profileSlice.actions;
export default profileSlice.reducer;
