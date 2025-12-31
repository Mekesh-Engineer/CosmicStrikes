import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../lib/api';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (token?: string) => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [resetToken, setResetToken] = useState<string | null>(null);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setEmail('');
            setError(null);
            setSuccess(false);
            setResetToken(null);
        }
    }, [isOpen]);

    // Handle body scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email.trim()) {
            setError('Email is required');
            return;
        }

        if (!email.includes('@')) {
            setError('Please enter a valid email address');
            return;
        }

        setIsLoading(true);

        try {
            const response = await api.requestPasswordReset(email);
            setSuccess(true);
            setResetToken(response.token || null);

            // Call success callback after a short delay
            setTimeout(() => {
                onSuccess?.(response.token);
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">

            {/* 🌫️ BACKDROP */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* 🔑 MODAL CONTENT */}
            <div className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-[var(--radius-2xl)] shadow-2xl overflow-hidden animate-bounce-in">

                {/* Decorative Top Bar */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-accent)] to-[var(--brand-primary)]" />

                {/* Background Glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--brand-primary)_0%,_transparent_70%)] opacity-5 pointer-events-none" />

                <div className="p-8 text-center relative z-10">

                    {/* HEADER */}
                    <div className="mb-6">
                        <div className="text-5xl mb-3">🔑</div>
                        <h2 className="text-3xl font-black font-orbitron text-white tracking-widest mb-2">
                            FORGOT PASSWORD
                        </h2>
                        <p className="text-sm text-[var(--text-muted)] font-mono">
                            {success ? 'Check your email for reset instructions' : 'Enter your email to receive a password reset link'}
                        </p>
                    </div>

                    {!success ? (
                        <>
                            {/* FORM */}
                            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                                <div className="text-left">
                                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="pilot@cosmic-strikes.com"
                                        disabled={isLoading}
                                        className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                </div>

                                {/* ERROR MESSAGE */}
                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* SUBMIT BUTTON */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 px-6 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-black font-bold rounded-lg shadow-[0_0_20px_rgba(var(--brand-primary-rgb),0.4)] hover:shadow-[0_0_30px_rgba(var(--brand-primary-rgb),0.6)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="material-icons animate-spin text-lg">sync</span>
                                            Sending Reset Link...
                                        </span>
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </button>
                            </form>

                            {/* BACK TO LOGIN */}
                            <button
                                onClick={onClose}
                                className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors font-medium"
                            >
                                ← Back to Login
                            </button>
                        </>
                    ) : (
                        <>
                            {/* SUCCESS STATE */}
                            <div className="mb-6">
                                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 border-2 border-green-500/30">
                                    <span className="material-icons text-4xl text-green-400">check_circle</span>
                                </div>
                                <p className="text-[var(--text-primary)] mb-4">
                                    Password reset instructions have been sent to:
                                </p>
                                <p className="font-mono text-[var(--brand-accent)] text-sm mb-4">
                                    {email}
                                </p>

                                {/* Dev mode: show token */}
                                {resetToken && (
                                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-left mb-4">
                                        <p className="text-xs font-bold text-yellow-400 mb-2">DEV MODE - Reset Token:</p>
                                        <code className="text-xs text-yellow-300 break-all">{resetToken}</code>
                                    </div>
                                )}

                                <p className="text-xs text-[var(--text-muted)]">
                                    Please check your email and click the reset link to set a new password.
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full py-3 px-6 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] font-bold rounded-lg hover:bg-[var(--bg-interactive)] transition-all"
                            >
                                Close
                            </button>
                        </>
                    )}

                </div>
            </div>
        </div>,
        document.body
    );
};

export default ForgotPasswordModal;
