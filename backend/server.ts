/**
 * 🚀 COSMIC STRIKES - Backend Server
 * 
 * Hybrid Database API with MongoDB/SQLite auto-fallback.
 * Supports both password and Google OAuth authentication.
 */

// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { db, PublicUser, Difficulty } from './lib/dbManager.js';

const app = express();

// ============================================================
// Middleware
// ============================================================

app.use(cors({ 
  origin: (origin, callback) => {
    // Allow requests from localhost on any port during development
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
    ];
    
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in development
    }
  },
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());

// ============================================================
// Auth Middleware
// ============================================================

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    username: string;
  };
}

const authGuard = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const decoded = db.verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  req.user = decoded;
  next();
};

// ============================================================
// Routes - Status
// ============================================================

app.get('/api/status', async (_req: Request, res: Response) => {
  await db.waitForInit();
  res.json({
    status: 'ok',
    database: db.getStatus(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/db-status', async (_req: Request, res: Response) => {
  await db.waitForInit();
  res.json(db.getStatus());
});

// ============================================================
// Routes - Authentication
// ============================================================

// Register new user
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email, and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    if (!email.includes('@')) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    const user = await db.createUser(username, email, password);
    const token = db.generateToken(user.id, user.email, user.username);

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      token,
      user: db.toPublicUser(user)
    });
  } catch (error: any) {
    if (error.message?.includes('duplicate') || error.message?.includes('UNIQUE')) {
      res.status(409).json({ error: 'Email or username already exists' });
      return;
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await db.authenticateUser(email, password);

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = db.generateToken(user.id, user.email, user.username);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      token,
      user: db.toPublicUser(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ ok: true, message: 'Logged out successfully' });
});

// Get current user
app.get('/api/auth/me', authGuard, async (req: AuthRequest, res: Response) => {
  try {
    const user = await db.getUserById(req.user!.userId);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user: db.toPublicUser(user) });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Google OAuth callback (simplified - integrate with passport if needed)
app.post('/api/auth/google', async (req: Request, res: Response) => {
  try {
    const { googleId, email, name, avatar } = req.body;

    if (!googleId || !email || !name) {
      res.status(400).json({ error: 'Google ID, email, and name are required' });
      return;
    }

    const user = await db.createUserWithGoogle(googleId, email, name, avatar);
    const token = db.generateToken(user.id, user.email, user.username);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      token,
      user: db.toPublicUser(user)
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

// ============================================================
// Routes - Scores
// ============================================================

// Submit score
app.post('/api/scores', authGuard, async (req: AuthRequest, res: Response) => {
  try {
    const { score, level, difficulty, accuracy } = req.body;

    if (typeof score !== 'number' || score < 0) {
      res.status(400).json({ error: 'Invalid score' });
      return;
    }

    const result = await db.submitScore(
      req.user!.userId,
      score,
      level || 1,
      (difficulty as Difficulty) || 'normal',
      accuracy || 0
    );

    res.json({
      ok: true,
      newHighScore: result.newHighScore,
      previousHigh: result.previousHigh,
      message: result.newHighScore ? '🎉 New high score!' : 'Score submitted'
    });
  } catch (error) {
    console.error('Score submission error:', error);
    res.status(500).json({ error: 'Failed to submit score' });
  }
});

// Get leaderboard
app.get('/api/scores/leaderboard', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
    const leaderboard = await db.getLeaderboard(limit);

    res.json({
      leaderboard,
      total: leaderboard.length
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// Get user's rank
app.get('/api/scores/rank', authGuard, async (req: AuthRequest, res: Response) => {
  try {
    const rank = await db.getUserRank(req.user!.userId);
    const user = await db.getUserById(req.user!.userId);

    res.json({
      rank,
      highScore: user?.highScore || 0,
      totalGames: user?.totalGames || 0
    });
  } catch (error) {
    console.error('Rank error:', error);
    res.status(500).json({ error: 'Failed to get rank' });
  }
});

// Get user's recent scores
app.get('/api/scores/history', authGuard, async (req: AuthRequest, res: Response) => {
  try {
    const user = await db.getUserById(req.user!.userId);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      recentScores: user.recentScores,
      highScore: user.highScore,
      totalGames: user.totalGames
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to get score history' });
  }
});

// ============================================================
// Routes - User Settings
// ============================================================

app.patch('/api/user/settings', authGuard, async (req: AuthRequest, res: Response) => {
  try {
    const { difficulty, sound, theme } = req.body;
    
    const updated = await db.updateUserSettings(req.user!.userId, {
      difficulty,
      sound,
      theme
    });

    if (!updated) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ ok: true, message: 'Settings updated' });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ============================================================
// Routes - Legacy Compatibility
// ============================================================

// Support old /auth routes
app.get('/auth/logout', (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

// ============================================================
// Error Handler
// ============================================================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================
// Start Server
// ============================================================

const port = process.env.PORT || 5000;

app.listen(port, async () => {
  await db.waitForInit();
  const status = db.getStatus();
  
  console.log('');
  console.log('🚀 ═══════════════════════════════════════════════════');
  console.log('   COSMIC STRIKES API SERVER');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`   🌐 URL: http://localhost:${port}`);
  console.log(`   💾 Database: ${status.type.toUpperCase()}`);
  console.log(`   🔐 JWT: ${process.env.JWT_SECRET ? 'Configured' : 'Using default'}`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('📡 Endpoints:');
  console.log('   POST /api/auth/register   - Create account');
  console.log('   POST /api/auth/login      - Login');
  console.log('   POST /api/auth/logout     - Logout');
  console.log('   GET  /api/auth/me         - Get current user');
  console.log('   POST /api/scores          - Submit score');
  console.log('   GET  /api/scores/leaderboard - Get leaderboard');
  console.log('   GET  /api/db-status       - Database status');
  console.log('');
});

export default app;
