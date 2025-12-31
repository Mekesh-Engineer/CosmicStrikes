import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';

const ResetPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isValidating, setIsValidating] = useState(true);
    const [isValidToken, setIsValidToken] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Validate token on mount
    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setError('Invalid or missing reset token');
                setIsValidating(false);
                return;
            }

            try {
                const result = await api.validateResetToken(token);
                setIsValidToken(result.valid);
                if (!result.valid) {
                    setError('This password reset link has expired or is invalid');
                }
            } catch (err) {
                setError('Failed to validate reset token');
                setIsValidToken(false);
            } finally {
                setIsValidating(false);
            }
        };

        validateToken();
    }, [token]);

    // Apply dark theme
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!password) {
            setError('Password is required');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!token) {
            setError('Invalid reset token');
            return;
        }

        setIsLoading(true);

        try {
            await api.resetPassword(token, password);
            setSuccess(true);

            // Redirect to home page after 3 seconds
            setTimeout(() => {
                navigate('/', { replace: true });
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to reset password. The link may have expired.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-inter overflow-hidden">

            {/* 🌌 BACKGROUND EFFECTS */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--brand-primary-light)_0%,_transparent_60%)] opacity-10" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 animate-[pulse_8s_infinite]" />
            </div>

            {/* 🛰️ NAVBAR */}
            <nav className="fixed top-0 w-full z-[var(--z-sticky)] glass border-b border-[var(--border-divider)]">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors group"
                    >
                        <span className="material-icons group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        <span className="font-bold tracking-wide text-sm">BACK TO HOME</span>
                    </button>
                </div>
            </nav>

            {/* MAIN CONTENT */}
            <main className="relative z-40 min-h-screen flex items-center justify-center px-6 pt-20">
                <div className="w-full max-w-md">

                    {/* Glow Effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] rounded-[var(--radius-2xl)] opacity-20 blur-xl" />

                    <div className="relative bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-[var(--radius-2xl)] shadow-2xl overflow-hidden p-8">

                        {/* Top Bar */}
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-accent)] to-[var(--brand-primary)]" />

                        {/* HEADER */}
                        <div className="text-center mb-8">
                            <div className="text-5xl mb-4">
                                {isValidating ? '⏳' : success ? '✅' : isValidToken ? '🔐' : '❌'}
                            </div>
                            <h1 className="text-3xl font-black font-orbitron text-white tracking-widest mb-2">
                                {isValidating ? 'VALIDATING...' : success ? 'PASSWORD RESET!' : isValidToken ? 'RESET PASSWORD' : 'INVALID LINK'}
                            </h1>
                            <p className="text-sm text-[var(--text-muted)] font-mono">
                                {isValidating
                                    ? 'Checking your reset link...'
                                    : success
                                        ? 'Your password has been updated successfully'
                                        : isValidToken
                                            ? 'Enter your new password below'
                                            : 'This password reset link is invalid or has expired'}
                            </p>
                        </div>

                        {isValidating && (
                            <div className="flex justify-center py-8">
                                <span className="material-icons text-5xl text-[var(--brand-primary)] animate-spin">sync</span>
                            </div>
                        )}

                        {!isValidating && !isValidToken && (
                            <div className="text-center">
                                <p className="text-[var(--text-secondary)] mb-6">
                                    Please request a new password reset link from the login page.
                                </p>
                                <button
                                    onClick={() => navigate('/')}
                                    className="w-full py-3 px-6 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-black font-bold rounded-lg hover:shadow-[0_0_30px_rgba(var(--brand-primary-rgb),0.6)] transition-all"
                                >
                                    Return to Home
                                </button>
                            </div>
                        )}

                        {!isValidating && isValidToken && !success && (
                            <>
                                {/* ERROR MESSAGE */}
                                {error && (
                                    <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
                                        <span className="material-icons text-lg">error_outline</span>
                                        {error}
                                    </div>
                                )}

                                {/* FORM */}
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter new password"
                                            disabled={isLoading}
                                            className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] transition-all disabled:opacity-50"
                                        />
                                        <p className="text-xs text-[var(--text-muted)] mt-1">
                                            Must be at least 6 characters
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                                            Confirm Password
                                        </label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm new password"
                                            disabled={isLoading}
                                            className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] transition-all disabled:opacity-50"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-3 px-6 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-black font-bold rounded-lg shadow-[0_0_20px_rgba(var(--brand-primary-rgb),0.4)] hover:shadow-[0_0_30px_rgba(var(--brand-primary-rgb),0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="material-icons animate-spin text-lg">sync</span>
                                                Resetting Password...
                                            </span>
                                        ) : (
                                            'Reset Password'
                                        )}
                                    </button>
                                </form>
                            </>
                        )}

                        {success && (
                            <div className="text-center">
                                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 border-2 border-green-500/30">
                                    <span className="material-icons text-4xl text-green-400">check_circle</span>
                                </div>
                                <p className="text-[var(--text-primary)] mb-6">
                                    You can now login with your new password.
                                </p>
                                <p className="text-xs text-[var(--text-muted)] animate-pulse">
                                    Redirecting to home page...
                                </p>
                            </div>
                        )}

                    </div>
                </div>
            </main>
        </div>
    );
};

export default ResetPasswordPage;
