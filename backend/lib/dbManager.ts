/**
 * 🚀 COSMIC STRIKES - SQLite Database Manager
 * 
 * Lightweight SQLite-only database with TypeScript API.
 * Optimized for local development and small-scale deployments.
 */

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// Type Definitions
// ============================================================

export type DatabaseType = 'sqlite';
export type Difficulty = 'easy' | 'normal' | 'hard' | 'insane';

export interface ScoreEntry {
  score: number;
  level: number;
  difficulty: Difficulty;
  accuracy: number;
  date: Date | number;
}

export interface UserSettings {
  difficulty: Difficulty;
  sound: boolean;
  theme: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  avatar?: string;
  highScore: number;
  totalGames: number;
  recentScores: ScoreEntry[];
  settings: UserSettings;
  createdAt: Date | number;
  lastPlayed: Date | number;
}

export interface PublicUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  highScore: number;
  totalGames: number;
}

export interface LeaderboardEntry {
  username: string;
  score: number;
  highScore: number;
  rank: number;
  avatar?: string;
  userId: string;
  totalGames: number;
}

// ============================================================
// SQLite Database Manager Class
// ============================================================

class SQLiteDB {
  private sqliteDB?: Database.Database;
  private initialized = false;
  private initPromise?: Promise<void>;

  constructor() {
    // Don't auto-init - wait for explicit init() call or first operation
  }

  async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }
    this.initPromise = this.init();
    return this.initPromise;
  }

  private async init(): Promise<void> {
    this.initSQLite();
    this.initialized = true;
  }

  private initSQLite(): void {
    const dbPath = path.join(__dirname, '..', 'cosmic-strikes.db');
    this.sqliteDB = new Database(dbPath);

    // Enable WAL mode for better concurrent access
    this.sqliteDB.pragma('journal_mode = WAL');

    // Create users table
    this.sqliteDB.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        googleId TEXT UNIQUE,
        username TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT,
        avatar TEXT,
        highScore INTEGER DEFAULT 0,
        totalGames INTEGER DEFAULT 0,
        recentScores TEXT DEFAULT '[]',
        settings TEXT DEFAULT '{"difficulty":"normal","sound":true,"theme":"cosmic"}',
        createdAt INTEGER NOT NULL,
        lastPlayed INTEGER NOT NULL
      )
    `);

    // Create scores table for detailed tracking
    this.sqliteDB.exec(`
      CREATE TABLE IF NOT EXISTS scores (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        score INTEGER NOT NULL,
        level INTEGER DEFAULT 1,
        difficulty TEXT DEFAULT 'normal',
        accuracy REAL DEFAULT 0,
        playedAt INTEGER NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Create password reset tokens table
    this.sqliteDB.exec(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expiresAt INTEGER NOT NULL,
        used INTEGER DEFAULT 0,
        createdAt INTEGER NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    this.sqliteDB.exec('CREATE INDEX IF NOT EXISTS idx_users_highscore ON users(highScore DESC)');
    this.sqliteDB.exec('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    this.sqliteDB.exec('CREATE INDEX IF NOT EXISTS idx_users_googleId ON users(googleId)');
    this.sqliteDB.exec('CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC)');
    this.sqliteDB.exec('CREATE INDEX IF NOT EXISTS idx_scores_userId ON scores(userId)');
    this.sqliteDB.exec('CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens(token)');
    this.sqliteDB.exec('CREATE INDEX IF NOT EXISTS idx_reset_tokens_userId ON password_reset_tokens(userId)');

    console.log('✅ SQLite database initialized');
    console.log(`   Path: ${dbPath}`);
  }

  // ============================================================
  // Public API - Status
  // ============================================================

  getStatus(): { type: DatabaseType; initialized: boolean } {
    return {
      type: 'sqlite',
      initialized: this.initialized
    };
  }

  async waitForInit(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.init();
    }
    await this.initPromise;
  }

  // ============================================================
  // Public API - User Management
  // ============================================================

  async createUser(
    username: string, 
    email: string, 
    password: string
  ): Promise<User> {
    await this.waitForInit();

    const passwordHash = await bcrypt.hash(password, 12);
    const now = Date.now();

    const userId = uuidv4();
    const settings: UserSettings = { difficulty: 'normal', sound: true, theme: 'cosmic' };

    const insert = this.sqliteDB!.prepare(`
      INSERT INTO users (id, username, email, passwordHash, highScore, totalGames, 
                        recentScores, settings, createdAt, lastPlayed)
      VALUES (?, ?, ?, ?, 0, 0, '[]', ?, ?, ?)
    `);

    insert.run(userId, username, email.toLowerCase(), passwordHash, 
               JSON.stringify(settings), now, now);

    return {
      id: userId,
      username,
      email: email.toLowerCase(),
      passwordHash,
      highScore: 0,
      totalGames: 0,
      recentScores: [],
      settings,
      createdAt: now,
      lastPlayed: now
    };
  }

  async createUserWithGoogle(
    googleId: string,
    email: string,
    username: string,
    avatar?: string
  ): Promise<User> {
    await this.waitForInit();
    const now = Date.now();

    // Check if user exists
    const existing = this.sqliteDB!.prepare(
      'SELECT * FROM users WHERE googleId = ? OR email = ?'
    ).get(googleId, email.toLowerCase()) as any;

    if (existing) {
      // Update Google ID if not set
      if (!existing.googleId) {
        this.sqliteDB!.prepare(
          'UPDATE users SET googleId = ?, avatar = COALESCE(?, avatar) WHERE id = ?'
        ).run(googleId, avatar, existing.id);
      }
      return this.sqliteRowToUser(existing);
    }

    const userId = uuidv4();
    const settings: UserSettings = { difficulty: 'normal', sound: true, theme: 'cosmic' };

    const insert = this.sqliteDB!.prepare(`
      INSERT INTO users (id, googleId, username, email, avatar, highScore, totalGames, 
                        recentScores, settings, createdAt, lastPlayed)
      VALUES (?, ?, ?, ?, ?, 0, 0, '[]', ?, ?, ?)
    `);

    insert.run(userId, googleId, username, email.toLowerCase(), avatar,
               JSON.stringify(settings), now, now);

    return {
      id: userId,
      googleId,
      username,
      email: email.toLowerCase(),
      avatar,
      highScore: 0,
      totalGames: 0,
      recentScores: [],
      settings,
      createdAt: now,
      lastPlayed: now
    };
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    await this.waitForInit();

    const row = this.sqliteDB!.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).get(email.toLowerCase()) as any;

    if (!row || !row.passwordHash) {
      return null;
    }

    const valid = await bcrypt.compare(password, row.passwordHash);
    if (!valid) return null;

    // Update lastPlayed
    this.sqliteDB!.prepare(
      'UPDATE users SET lastPlayed = ? WHERE id = ?'
    ).run(Date.now(), row.id);

    return this.sqliteRowToUser(row);
  }

  async getUserById(userId: string): Promise<User | null> {
    await this.waitForInit();

    const row = this.sqliteDB!.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).get(userId) as any;
    return row ? this.sqliteRowToUser(row) : null;
  }

  async getUserByGoogleId(googleId: string): Promise<User | null> {
    await this.waitForInit();

    const row = this.sqliteDB!.prepare(
      'SELECT * FROM users WHERE googleId = ?'
    ).get(googleId) as any;
    return row ? this.sqliteRowToUser(row) : null;
  }

  async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<boolean> {
    await this.waitForInit();

    const user = await this.getUserById(userId);
    if (!user) return false;

    const newSettings = { ...user.settings, ...settings };
    this.sqliteDB!.prepare(
      'UPDATE users SET settings = ? WHERE id = ?'
    ).run(JSON.stringify(newSettings), userId);
    return true;
  }

  // ============================================================
  // Public API - Score Management
  // ============================================================

  async submitScore(
    userId: string,
    score: number,
    level: number,
    difficulty: Difficulty,
    accuracy: number
  ): Promise<{ newHighScore: boolean; previousHigh: number }> {
    await this.waitForInit();
    const now = Date.now();

    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');

    const previousHigh = user.highScore;
    const newHighScore = score > previousHigh;

    // Update user stats
    this.sqliteDB!.prepare(`
      UPDATE users SET 
        highScore = MAX(highScore, ?),
        totalGames = totalGames + 1,
        lastPlayed = ?
      WHERE id = ?
    `).run(score, now, userId);

    // Add score to scores table
    const scoreId = uuidv4();
    this.sqliteDB!.prepare(`
      INSERT INTO scores (id, userId, score, level, difficulty, accuracy, playedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(scoreId, userId, score, level, difficulty, accuracy, now);

    // Update recent scores in user record
    const recentScores = [...user.recentScores];
    recentScores.unshift({ score, level, difficulty, accuracy, date: now });
    if (recentScores.length > 10) recentScores.pop();

    this.sqliteDB!.prepare(
      'UPDATE users SET recentScores = ? WHERE id = ?'
    ).run(JSON.stringify(recentScores), userId);

    return { newHighScore, previousHigh };
  }

  async getLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
    await this.waitForInit();

    const rows = this.sqliteDB!.prepare(`
      SELECT id, username, highScore, avatar, totalGames
      FROM users
      WHERE highScore > 0
      ORDER BY highScore DESC
      LIMIT ?
    `).all(limit) as any[];

    return rows.map((row, index) => ({
      username: row.username,
      score: row.highScore,
      highScore: row.highScore,
      rank: index + 1,
      avatar: row.avatar,
      userId: row.id,
      totalGames: row.totalGames
    }));
  }

  async getUserRank(userId: string): Promise<number | null> {
    await this.waitForInit();

    const user = await this.getUserById(userId);
    if (!user || user.highScore === 0) return null;

    const result = this.sqliteDB!.prepare(`
      SELECT COUNT(*) as count FROM users WHERE highScore > ?
    `).get(user.highScore) as { count: number };
    return result.count + 1;
  }

  // ============================================================
  // Public API - Token Management
  // ============================================================

  generateToken(userId: string, email: string, username: string): string {
    const secret = process.env.JWT_SECRET || 'cosmic-secret-dev';
    return jwt.sign(
      { userId, email, username },
      secret,
      { expiresIn: '7d' }
    );
  }

  verifyToken(token: string): { userId: string; email: string; username: string } | null {
    try {
      const secret = process.env.JWT_SECRET || 'cosmic-secret-dev';
      const decoded = jwt.verify(token, secret) as any;
      return {
        userId: decoded.userId,
        email: decoded.email,
        username: decoded.username
      };
    } catch {
      return null;
    }
  }

  // ============================================================
  // Public API - Password Reset
  // ============================================================

  /**
   * Generate a password reset token for a user
   * Returns the token that should be sent to the user's email
   */
  async createPasswordResetToken(email: string): Promise<string | null> {
    await this.waitForInit();

    // Find user by email
    const stmt = this.sqliteDB!.prepare('SELECT id FROM users WHERE email = ?');
    const user = stmt.get(email.toLowerCase()) as { id: string } | undefined;

    if (!user) {
      // Don't reveal if email exists or not (security)
      return null;
    }

    // Generate secure random token (32 bytes = 64 hex chars)
    const token = uuidv4() + uuidv4().replace(/-/g, ''); // 32 char token
    const now = Date.now();
    const expiresAt = now + (60 * 60 * 1000); // 1 hour from now

    // Delete any existing unused tokens for this user
    this.sqliteDB!.prepare('DELETE FROM password_reset_tokens WHERE userId = ? AND used = 0')
      .run(user.id);

    // Insert new token
    const insert = this.sqliteDB!.prepare(`
      INSERT INTO password_reset_tokens (id, userId, token, expiresAt, used, createdAt)
      VALUES (?, ?, ?, ?, 0, ?)
    `);
    insert.run(uuidv4(), user.id, token, expiresAt, now);

    return token;
  }

  /**
   * Reset user password using a valid token
   */
  async resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
    await this.waitForInit();

    const now = Date.now();

    // Find valid token
    const stmt = this.sqliteDB!.prepare(`
      SELECT userId, expiresAt, used 
      FROM password_reset_tokens 
      WHERE token = ?
    `);
    const tokenData = stmt.get(token) as { userId: string; expiresAt: number; used: number } | undefined;

    if (!tokenData) {
      return false; // Token not found
    }

    if (tokenData.used === 1) {
      return false; // Token already used
    }

    if (tokenData.expiresAt < now) {
      return false; // Token expired
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update user password
    const updateUser = this.sqliteDB!.prepare(`
      UPDATE users 
      SET passwordHash = ? 
      WHERE id = ?
    `);
    updateUser.run(passwordHash, tokenData.userId);

    // Mark token as used
    const updateToken = this.sqliteDB!.prepare(`
      UPDATE password_reset_tokens 
      SET used = 1 
      WHERE token = ?
    `);
    updateToken.run(token);

    // Clean up expired tokens (housekeeping)
    this.sqliteDB!.prepare('DELETE FROM password_reset_tokens WHERE expiresAt < ?')
      .run(now);

    return true;
  }

  /**
   * Validate if a reset token is still valid
   */
  async validateResetToken(token: string): Promise<boolean> {
    await this.waitForInit();

    const now = Date.now();

    const stmt = this.sqliteDB!.prepare(`
      SELECT expiresAt, used 
      FROM password_reset_tokens 
      WHERE token = ?
    `);
    const tokenData = stmt.get(token) as { expiresAt: number; used: number } | undefined;

    if (!tokenData) {
      return false;
    }

    if (tokenData.used === 1 || tokenData.expiresAt < now) {
      return false;
    }

    return true;
  }

  // ============================================================
  // Private Helpers - Data Conversion
  // ============================================================

  private sqliteRowToUser(row: any): User {
    return {
      id: row.id,
      googleId: row.googleId,
      username: row.username,
      email: row.email,
      passwordHash: row.passwordHash,
      avatar: row.avatar,
      highScore: row.highScore,
      totalGames: row.totalGames,
      recentScores: JSON.parse(row.recentScores || '[]'),
      settings: JSON.parse(row.settings || '{}'),
      createdAt: row.createdAt,
      lastPlayed: row.lastPlayed
    };
  }

  // ============================================================
  // Utility - Get public user (no sensitive data)
  // ============================================================

  toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      highScore: user.highScore,
      totalGames: user.totalGames
    };
  }
}

// Export singleton instance
export const db = new SQLiteDB();
