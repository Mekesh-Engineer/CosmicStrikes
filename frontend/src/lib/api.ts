/**
 * 🚀 COSMIC STRIKES - API Client
 * 
 * Typed API client for backend communication.
 * Handles auth tokens, error handling, and request/response typing.
 */

// ============================================================
// Configuration
// ============================================================

// In production on Vercel, API is at same origin (/api/*)
// In development, proxy handles /api/* → localhost:5000
const API_BASE = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? '' // Same origin in production (Vercel)
    : 'http://localhost:5000'
);

// ============================================================
// Types
// ============================================================

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  highScore: number;
  totalGames: number;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  highScore: number;
  totalGames: number;
}

export interface ScoreSubmitResponse {
  ok: boolean;
  newHighScore: boolean;
  previousHigh: number;
  message: string;
}

// Extended game stats for leaderboard submission
export interface GameStats {
  score: number;
  level: number;
  wave: number;
  difficulty: string;
  totalKills: number;
  maxCombo: number;
  accuracy: number;        // 0-100 percentage
  playTimeSeconds: number; // Duration in seconds
  shotsFired: number;
  shotsHit: number;
  powerUpsCollected: number;
  wavesCompleted: number;
  difficultyBracket: string;
}

export interface ScoreHistoryEntry {
  score: number;
  level: number;
  difficulty: string;
  accuracy: number;
  playedAt: string;
}

export interface UserRankResponse {
  rank: number;
  highScore: number;
  totalGames: number;
}

export interface ScoreHistoryResponse {
  recentScores: ScoreHistoryEntry[];
  highScore: number;
  totalGames: number;
}

export interface DbStatus {
  type: 'mongodb' | 'sqlite';
  connected: boolean;
  initialized: boolean;
}

export interface ApiError {
  error: string;
  code?: string;
}

// ============================================================
// API Client Class
// ============================================================

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Load token from localStorage on init
    this.token = localStorage.getItem('cosmic_token');
  }

  // Set auth token
  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('cosmic_token', token);
    } else {
      localStorage.removeItem('cosmic_token');
    }
  }

  // Get current token
  getToken(): string | null {
    return this.token;
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Generic fetch wrapper with error handling
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth header if we have a token
    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Send cookies for httpOnly token
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(error.error || `Request failed with status ${response.status}`);
    }

    return data as T;
  }

  // ========================================
  // Auth Endpoints
  // ========================================

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    this.setToken(response.token);
    return response;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.token);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request<{ ok: boolean }>('/api/auth/logout', {
        method: 'POST',
      });
    } finally {
      this.setToken(null);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.token) return null;
    
    try {
      const response = await this.request<{ user: User }>('/api/auth/me');
      return response.user;
    } catch (error) {
      // Token might be invalid/expired
      this.setToken(null);
      return null;
    }
  }

  async requestPasswordReset(email: string): Promise<{ ok: boolean; message: string; token?: string }> {
    return this.request<{ ok: boolean; message: string; token?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async validateResetToken(token: string): Promise<{ valid: boolean }> {
    return this.request<{ valid: boolean }>(`/api/auth/validate-reset-token/${token}`);
  }

  async resetPassword(token: string, password: string): Promise<{ ok: boolean; message: string }> {
    return this.request<{ ok: boolean; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  // ========================================
  // Score Endpoints
  // ========================================

  // Legacy submitScore for backward compatibility
  async submitScore(
    score: number, 
    level: number, 
    difficulty: string = 'normal',
    accuracy: number = 0
  ): Promise<ScoreSubmitResponse> {
    return this.request<ScoreSubmitResponse>('/api/scores', {
      method: 'POST',
      body: JSON.stringify({ score, level, difficulty, accuracy }),
    });
  }

  // Enhanced score submission with full game stats
  async submitGameStats(stats: GameStats): Promise<ScoreSubmitResponse> {
    return this.request<ScoreSubmitResponse>('/api/scores', {
      method: 'POST',
      body: JSON.stringify(stats),
    });
  }

  async getLeaderboard(limit: number = 50): Promise<{ leaderboard: LeaderboardEntry[], total: number }> {
    return this.request<{ leaderboard: LeaderboardEntry[], total: number }>(
      `/api/scores/leaderboard?limit=${limit}`
    );
  }

  async getUserRank(): Promise<UserRankResponse> {
    return this.request<UserRankResponse>('/api/scores/rank');
  }

  async getScoreHistory(): Promise<ScoreHistoryResponse> {
    return this.request<ScoreHistoryResponse>('/api/scores/history');
  }

  // ========================================
  // User Settings
  // ========================================

  async updateSettings(settings: {
    difficulty?: string;
    sound?: boolean;
    theme?: string;
  }): Promise<{ ok: boolean }> {
    return this.request<{ ok: boolean }>('/api/user/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  }

  // ========================================
  // Status Endpoints
  // ========================================

  async getDbStatus(): Promise<DbStatus> {
    return this.request<DbStatus>('/api/db-status');
  }

  async getApiStatus(): Promise<{ status: string, database: DbStatus, timestamp: string }> {
    return this.request<{ status: string, database: DbStatus, timestamp: string }>('/api/status');
  }
}

// ============================================================
// Export singleton instance
// ============================================================

export const api = new ApiClient(API_BASE);

// ============================================================
// React Hooks for API
// ============================================================

import { useState, useCallback, useEffect } from 'react';

// Hook for async API calls with loading/error state
export function useApiCall<T, Args extends unknown[]>(
  apiFunction: (...args: Args) => Promise<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (...args: Args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  return { data, loading, error, execute };
}

// Hook for fetching leaderboard
export function useLeaderboard(autoFetch: boolean = true) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (limit?: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getLeaderboard(limit);
      setLeaderboard(result.leaderboard);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load leaderboard';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetch();
    }
  }, [autoFetch, fetch]);

  return { leaderboard, loading, error, refetch: fetch };
}

// Hook for user stats
export function useUserStats() {
  const [stats, setStats] = useState<{
    rank: number;
    highScore: number;
    totalGames: number;
    recentScores: ScoreHistoryEntry[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!api.isAuthenticated()) {
      setStats(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [rankData, historyData] = await Promise.all([
        api.getUserRank(),
        api.getScoreHistory(),
      ]);
      
      setStats({
        rank: rankData.rank,
        highScore: historyData.highScore,
        totalGames: historyData.totalGames,
        recentScores: historyData.recentScores,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load stats';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { stats, loading, error, refetch: fetch };
}
