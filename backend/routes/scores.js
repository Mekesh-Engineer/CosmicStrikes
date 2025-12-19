import express from 'express';
import authGuard from '../middleware/auth.js';
import Score from '../models/Score.js';

const router = express.Router();

router.get('/', async (req, res) => {
    const top = await Score.find().sort({ value: -1 }).limit(20).lean();
    res.json(top);
});

router.post('/', authGuard, async (req, res) => {
    const { value } = req.body;
    if (typeof value !== 'number') return res.status(400).json({ error: 'Invalid score' });
    const s = await Score.create({ userId: req.user.id, value });
    res.json(s);
});

export default router;
