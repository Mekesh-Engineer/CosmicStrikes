import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api, User } from '../lib/api';

// ============================================================
// Types
// ============================================================

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  highScore: number;
  totalGames: number;
}

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  error: string | null;
}

// ============================================================
// Helper: Convert API User to AuthUser
// ============================================================

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    name: user.username,
    email: user.email,
    avatar: user.avatar,
    highScore: user.highScore,
    totalGames: user.totalGames,
  };
}

// ============================================================
// Async Thunks
// ============================================================

// Check auth on app load
export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const user = await api.getCurrentUser();
      if (!user) {
        return null;
      }
      return { user: toAuthUser(user), token: api.getToken() };
    } catch (error) {
      return rejectWithValue('Session expired');
    }
  }
);

// Register new user
export const registerUser = createAsyncThunk(
  'auth/register',
  async (
    { username, email, password }: { username: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.register(username, email, password);
      return { user: toAuthUser(response.user), token: response.token };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

// Login user
export const loginUser = createAsyncThunk(
  'auth/login',
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.login(email, password);
      return { user: toAuthUser(response.user), token: response.token };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      return rejectWithValue(message);
    }
  }
);

// Logout user
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    await api.logout();
    return null;
  }
);

// ============================================================
// Initial State
// ============================================================

const initialState: AuthState = {
  token: localStorage.getItem('cosmic_token'),
  user: null,
  status: 'idle',
  error: null,
};

// ============================================================
// Slice
// ============================================================

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Manual setAuth (for compatibility)
    setAuth(state, action: PayloadAction<{ token: string; user: AuthUser }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.status = 'authenticated';
      state.error = null;
    },
    // Clear auth state
    clearAuth(state) {
      state.token = null;
      state.user = null;
      state.status = 'unauthenticated';
      state.error = null;
      api.setToken(null);
    },
    // Clear error
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ---- Check Auth ----
    builder.addCase(checkAuth.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(checkAuth.fulfilled, (state, action) => {
      if (action.payload) {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.status = 'authenticated';
      } else {
        state.status = 'unauthenticated';
      }
      state.error = null;
    });
    builder.addCase(checkAuth.rejected, (state) => {
      state.status = 'unauthenticated';
      state.token = null;
      state.user = null;
    });

    // ---- Register ----
    builder.addCase(registerUser.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.status = 'authenticated';
      state.error = null;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.status = 'unauthenticated';
      state.error = action.payload as string;
    });

    // ---- Login ----
    builder.addCase(loginUser.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.status = 'authenticated';
      state.error = null;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.status = 'unauthenticated';
      state.error = action.payload as string;
    });

    // ---- Logout ----
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.token = null;
      state.user = null;
      state.status = 'unauthenticated';
      state.error = null;
    });
  },
});

export const { setAuth, clearAuth, clearError } = authSlice.actions;
export default authSlice.reducer;
