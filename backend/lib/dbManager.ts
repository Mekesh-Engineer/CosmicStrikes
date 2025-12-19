/**
 * 🚀 COSMIC STRIKES - Hybrid Database Manager
 * 
 * Automatic MongoDB + SQLite fallback with unified TypeScript API.
 * Detects MongoDB availability and seamlessly switches databases without code changes.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
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

export type DatabaseType = 'mongodb' | 'sqlite';
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
  rank: number;
  avatar?: string;
}

// ============================================================
// MongoDB Schema Definitions
// ============================================================

interface IScoreEntry {
  score: number;
  level: number;
  difficulty: Difficulty;
  accuracy: number;
  date: Date;
}

interface IUser extends Document {
  googleId?: string;
  email: string;
  username: string;
  passwordHash?: string;
  avatar?: string;
  highScore: number;
  totalGames: number;
  recentScores: IScoreEntry[];
  settings: {
    difficulty: Difficulty;
    sound: boolean;
    theme: string;
  };
  createdAt: Date;
  lastPlayed: Date;
}

// ============================================================
// Hybrid Database Manager Class
// ============================================================

class HybridDB {
  private dbType: DatabaseType = 'sqlite';
  private sqliteDB?: Database.Database;
  private UserModel?: Model<IUser>;
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
    const mongoUri = process.env.MONGO_URI;

    if (mongoUri) {
      try {
        // Try MongoDB first with timeout
        await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 5000, // 5 second timeout
          connectTimeoutMS: 5000,
        });

        this.dbType = 'mongodb';
        this.initMongoSchemas();
        
        console.log('✅ Connected to MongoDB');
        console.log(`   Database: ${mongoose.connection.name}`);
      } catch (error) {
        console.log('⚠️ MongoDB unavailable, using SQLite fallback');
        console.log(`   Reason: ${(error as Error).message}`);
        this.initSQLite();
      }
    } else {
      console.log('ℹ️ MONGO_URI not set, using SQLite');
      this.initSQLite();
    }

    this.initialized = true;
  }

  private initMongoSchemas(): void {
    // Score subdocument schema
    const ScoreSchema = new Schema<IScoreEntry>({
      score: { type: Number, required: true },
      level: { type: Number, default: 1 },
      difficulty: { 
        type: String, 
        enum: ['easy', 'normal', 'hard', 'insane'], 
        default: 'normal' 
      },
      accuracy: { type: Number, default: 0 },
      date: { type: Date, default: Date.now }
    }, { _id: false });

    // User schema
    const UserSchema = new Schema<IUser>({
      googleId: { type: String, unique: true, sparse: true },
      email: { type: String, lowercase: true, unique: true, required: true },
      username: { type: String, required: true },
      passwordHash: { type: String },
      avatar: { type: String },
      highScore: { type: Number, default: 0 },
      totalGames: { type: Number, default: 0 },
      recentScores: { type: [ScoreSchema], default: [] },
      settings: {
        difficulty: { type: String, default: 'normal' },
        sound: { type: Boolean, default: true },
        theme: { type: String, default: 'cosmic' }
      },
      createdAt: { type: Date, default: Date.now },
      lastPlayed: { type: Date, default: Date.now }
    });

    // Indexes for leaderboard queries
    UserSchema.index({ highScore: -1 });
    UserSchema.index({ email: 1 });
    UserSchema.index({ googleId: 1 });

    // Check if model exists to avoid recompilation errors
    this.UserModel = mongoose.models.User as Model<IUser> || 
                     mongoose.model<IUser>('User', UserSchema);
  }

  private initSQLite(): void {
    this.dbType = 'sqlite';
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

    // Create indexes
    this.sqliteDB.exec('CREATE INDEX IF NOT EXISTS idx_users_highscore ON users(highScore DESC)');
    this.sqliteDB.exec('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    this.sqliteDB.exec('CREATE INDEX IF NOT EXISTS idx_users_googleId ON users(googleId)');
    this.sqliteDB.exec('CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC)');
    this.sqliteDB.exec('CREATE INDEX IF NOT EXISTS idx_scores_userId ON scores(userId)');

    console.log('✅ SQLite database initialized');
    console.log(`   Path: ${dbPath}`);
  }

  // ============================================================
  // Public API - Status
  // ============================================================

  getStatus(): { type: DatabaseType; initialized: boolean; mongoUri: string } {
    return {
      type: this.dbType,
      initialized: this.initialized,
      mongoUri: process.env.MONGO_URI ? 'Configured' : 'Not set'
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

    if (this.dbType === 'mongodb') {
      const mongoUser = new this.UserModel!({
        username,
        email: email.toLowerCase(),
        passwordHash,
        highScore: 0,
        totalGames: 0,
        recentScores: [],
        settings: { difficulty: 'normal', sound: true, theme: 'cosmic' },
        createdAt: new Date(now),
        lastPlayed: new Date(now)
      });

      await mongoUser.save();

      return this.mongoUserToUser(mongoUser);
    } else {
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
  }

  async createUserWithGoogle(
    googleId: string,
    email: string,
    username: string,
    avatar?: string
  ): Promise<User> {
    await this.waitForInit();
    const now = Date.now();

    if (this.dbType === 'mongodb') {
      // Check if user exists
      let mongoUser = await this.UserModel!.findOne({ 
        $or: [{ googleId }, { email: email.toLowerCase() }] 
      });

      if (mongoUser) {
        // Update Google ID if not set
        if (!mongoUser.googleId) {
          mongoUser.googleId = googleId;
          mongoUser.avatar = avatar || mongoUser.avatar;
          await mongoUser.save();
        }
        return this.mongoUserToUser(mongoUser);
      }

      // Create new user
      mongoUser = new this.UserModel!({
        googleId,
        email: email.toLowerCase(),
        username,
        avatar,
        highScore: 0,
        totalGames: 0,
        recentScores: [],
        settings: { difficulty: 'normal', sound: true, theme: 'cosmic' },
        createdAt: new Date(now),
        lastPlayed: new Date(now)
      });

      await mongoUser.save();
      return this.mongoUserToUser(mongoUser);
    } else {
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
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    await this.waitForInit();

    if (this.dbType === 'mongodb') {
      const mongoUser = await this.UserModel!.findOne({ email: email.toLowerCase() });
      
      if (!mongoUser || !mongoUser.passwordHash) {
        return null;
      }

      const valid = await bcrypt.compare(password, mongoUser.passwordHash);
      if (!valid) return null;

      // Update lastPlayed
      mongoUser.lastPlayed = new Date();
      await mongoUser.save();

      return this.mongoUserToUser(mongoUser);
    } else {
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
  }

  async getUserById(userId: string): Promise<User | null> {
    await this.waitForInit();

    if (this.dbType === 'mongodb') {
      const mongoUser = await this.UserModel!.findById(userId);
      return mongoUser ? this.mongoUserToUser(mongoUser) : null;
    } else {
      const row = this.sqliteDB!.prepare(
        'SELECT * FROM users WHERE id = ?'
      ).get(userId) as any;
      return row ? this.sqliteRowToUser(row) : null;
    }
  }

  async getUserByGoogleId(googleId: string): Promise<User | null> {
    await this.waitForInit();

    if (this.dbType === 'mongodb') {
      const mongoUser = await this.UserModel!.findOne({ googleId });
      return mongoUser ? this.mongoUserToUser(mongoUser) : null;
    } else {
      const row = this.sqliteDB!.prepare(
        'SELECT * FROM users WHERE googleId = ?'
      ).get(googleId) as any;
      return row ? this.sqliteRowToUser(row) : null;
    }
  }

  async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<boolean> {
    await this.waitForInit();

    if (this.dbType === 'mongodb') {
      const result = await this.UserModel!.updateOne(
        { _id: userId },
        { $set: { settings: { ...settings } } }
      );
      return result.modifiedCount > 0;
    } else {
      const user = await this.getUserById(userId);
      if (!user) return false;

      const newSettings = { ...user.settings, ...settings };
      this.sqliteDB!.prepare(
        'UPDATE users SET settings = ? WHERE id = ?'
      ).run(JSON.stringify(newSettings), userId);
      return true;
    }
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

    if (this.dbType === 'mongodb') {
      const user = await this.UserModel!.findById(userId);
      if (!user) throw new Error('User not found');

      const previousHigh = user.highScore;
      const newHighScore = score > previousHigh;

      user.highScore = Math.max(user.highScore, score);
      user.totalGames += 1;
      user.lastPlayed = new Date();

      // Add to recent scores (keep last 10)
      user.recentScores.unshift({
        score,
        level,
        difficulty,
        accuracy,
        date: new Date()
      });
      if (user.recentScores.length > 10) {
        user.recentScores = user.recentScores.slice(0, 10);
      }

      await user.save();

      return { newHighScore, previousHigh };
    } else {
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
  }

  async getLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
    await this.waitForInit();

    if (this.dbType === 'mongodb') {
      const users = await this.UserModel!
        .find({ highScore: { $gt: 0 } })
        .sort({ highScore: -1 })
        .limit(limit)
        .select('username highScore avatar')
        .lean();

      return users.map((user, index) => ({
        username: user.username,
        score: user.highScore,
        rank: index + 1,
        avatar: user.avatar
      }));
    } else {
      const rows = this.sqliteDB!.prepare(`
        SELECT username, highScore as score, avatar
        FROM users
        WHERE highScore > 0
        ORDER BY highScore DESC
        LIMIT ?
      `).all(limit) as any[];

      return rows.map((row, index) => ({
        username: row.username,
        score: row.score,
        rank: index + 1,
        avatar: row.avatar
      }));
    }
  }

  async getUserRank(userId: string): Promise<number | null> {
    await this.waitForInit();

    const user = await this.getUserById(userId);
    if (!user || user.highScore === 0) return null;

    if (this.dbType === 'mongodb') {
      const count = await this.UserModel!.countDocuments({
        highScore: { $gt: user.highScore }
      });
      return count + 1;
    } else {
      const result = this.sqliteDB!.prepare(`
        SELECT COUNT(*) as count FROM users WHERE highScore > ?
      `).get(user.highScore) as { count: number };
      return result.count + 1;
    }
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
  // Private Helpers - Data Conversion
  // ============================================================

  private mongoUserToUser(mongoUser: IUser): User {
    return {
      id: mongoUser._id.toString(),
      googleId: mongoUser.googleId,
      username: mongoUser.username,
      email: mongoUser.email,
      passwordHash: mongoUser.passwordHash,
      avatar: mongoUser.avatar,
      highScore: mongoUser.highScore,
      totalGames: mongoUser.totalGames,
      recentScores: mongoUser.recentScores.map(s => ({
        score: s.score,
        level: s.level,
        difficulty: s.difficulty,
        accuracy: s.accuracy,
        date: s.date
      })),
      settings: {
        difficulty: mongoUser.settings.difficulty,
        sound: mongoUser.settings.sound,
        theme: mongoUser.settings.theme
      },
      createdAt: mongoUser.createdAt,
      lastPlayed: mongoUser.lastPlayed
    };
  }

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
export const db = new HybridDB();
