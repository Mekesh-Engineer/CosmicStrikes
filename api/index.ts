/**
 * 🚀 COSMIC STRIKES - Vercel Serverless API
 * 
 * Main API entry point for Vercel deployment.
 * Handles all /api/* routes via Express.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

// ============================================================
// Middleware
// ============================================================

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
  process.env.FRONTEND_URL || '',
].filter(Boolean);

app.use(cors({ 
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // Allow any Vercel preview URL
    if (origin.includes('.vercel.app')) return callback(null, true);
    
    // Check allowed origins
    if (allowedOrigins.includes(origin)) return callback(null, true);
    
    // In development, allow all
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    
    callback(null, true); // Allow all for now
  },
  credentials: true 
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// ============================================================
// Health Check
// ============================================================

app.get('/api', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok',
    message: 'Cosmic Strikes API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok',
    database: 'serverless',
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// Placeholder Routes (Full implementation in backend/server.ts)
// ============================================================

app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    database: { type: 'serverless', connected: true },
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// Error Handler
// ============================================================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================
// Vercel Serverless Export
// ============================================================

export default app;
