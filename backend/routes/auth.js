import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
    const user = req.user;
    const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true });
    res.redirect('http://localhost:5173');
});

router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ ok: true });
});

export default router;
