import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import passport from 'passport';
import './config/mongo.js';
import './config/passport.js';
import authRoutes from './routes/auth.js';
import scoreRoutes from './routes/scores.js';

dotenv.config();

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use('/auth', authRoutes);
app.use('/api/scores', scoreRoutes);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Backend running on http://localhost:${port}`));
