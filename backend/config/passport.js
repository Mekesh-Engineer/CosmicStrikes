import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn('Google OAuth env vars missing. Auth routes will be limited.');
}

passport.use(
    new GoogleStrategy(
        {
            clientID: GOOGLE_CLIENT_ID || 'placeholder',
            clientSecret: GOOGLE_CLIENT_SECRET || 'placeholder',
            callbackURL: '/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;
                const name = profile.displayName || 'User';
                let user = await User.findOne({ email });
                if (!user) {
                    user = await User.create({ email, name });
                }
                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    )
);

export default passport;
