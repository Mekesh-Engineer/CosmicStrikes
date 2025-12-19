import jwt from 'jsonwebtoken';

export default function authGuard(req, res, next) {
    const header = req.headers.authorization;
    const token = header?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Missing token' });
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
        req.user = payload;
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}
