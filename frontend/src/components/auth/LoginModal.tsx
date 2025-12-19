import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../hooks/useAuth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: 'login' | 'register';
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess, initialMode = 'login' }) => {
  const { login, register, logout, error, status, clearAuthError, isAuthenticated, user } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [isAnimating, setIsAnimating] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  const isLoading = status === 'loading';

  // Handle entry animation and body scroll lock
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 200);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
      setValidationError(null);
      clearAuthError();
    }
  }, [isOpen, mode, clearAuthError]);

  // Close modal on successful auth
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      onClose();
      onSuccess?.();
    }
  }, [isAuthenticated, isOpen, onClose, onSuccess]);

  // Update mode when initialMode prop changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (mode === 'register') {
      if (!formData.username.trim()) {
        setValidationError('Callsign is required');
        return;
      }
      if (formData.username.length < 3) {
        setValidationError('Callsign must be at least 3 characters');
        return;
      }
      if (!formData.email.includes('@')) {
        setValidationError('Valid email is required');
        return;
      }
      if (formData.password.length < 6) {
        setValidationError('Password must be at least 6 characters');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setValidationError('Passwords do not match');
        return;
      }

      await register(formData.username, formData.email, formData.password);
    } else {
      if (!formData.email.trim() || !formData.password.trim()) {
        setValidationError('Email and password are required');
        return;
      }
      
      await login(formData.email, formData.password);
    }
  };

  const handleGuestPlay = () => {
    onClose();
    onSuccess?.();
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  if (!isOpen && !isAnimating) return null;

  const displayError = validationError || error;

  const modalContent = (
    <div className={`fixed inset-0 flex items-center justify-center p-4 overflow-y-auto transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} style={{ zIndex: 99999 }}>
      
      {/* 🌑 BACKDROP */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-all duration-300"
        style={{ zIndex: 99998 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 🚀 MODAL CONTENT */}
      <div className={`relative w-full max-w-[24rem] my-auto transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`} style={{ zIndex: 99999 }}>
        
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] rounded-[var(--radius-2xl)] opacity-20 blur-xl animate-pulse" />

        <div className="relative bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-[var(--radius-2xl)] shadow-2xl overflow-hidden">
          
          {/* Top Bar */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-[var(--gradient-primary)]" />
          
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-full transition-colors z-20"
            aria-label="Close Modal"
          >
            <span className="material-icons text-lg">close</span>
          </button>

          <div className="p-6 sm:p-8 relative z-10">
            
            {/* HEADER */}
            <div className="text-center mb-6 relative">
              <div className="absolute inset-0 bg-[var(--brand-primary)] opacity-10 blur-[40px] rounded-full" />
              <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] shadow-[var(--glow-primary)] mb-4 group">
                <span className="material-icons text-2xl text-[var(--brand-primary)] group-hover:-rotate-12 transition-transform duration-500">
                  {mode === 'login' ? 'login' : 'person_add'}
                </span>
              </div>
              <h2 className="text-2xl font-black font-orbitron text-gradient-primary tracking-tighter mb-2">
                {mode === 'login' ? 'WELCOME BACK' : 'JOIN THE FLEET'}
              </h2>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {mode === 'login' 
                  ? 'Sign in to sync your scores' 
                  : 'Create your pilot account'
                }
              </p>
            </div>

            {/* ERROR DISPLAY */}
            {displayError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
                <span className="material-icons text-lg">error_outline</span>
                {displayError}
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    Callsign
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter your pilot name"
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
                    disabled={isLoading}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="commander@cosmic.io"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
                  disabled={isLoading}
                />
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
                    disabled={isLoading}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="group w-full py-3 mt-3 rounded-xl bg-[var(--gradient-button)] text-white font-bold tracking-wide hover-lift focus-ring relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-icons animate-spin text-lg">autorenew</span>
                    {mode === 'login' ? 'AUTHENTICATING...' : 'CREATING ACCOUNT...'}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-icons">
                      {mode === 'login' ? 'rocket_launch' : 'how_to_reg'}
                    </span>
                    {mode === 'login' ? 'LAUNCH SESSION' : 'CREATE ACCOUNT'}
                  </span>
                )}
              </button>
            </form>

            {/* MODE TOGGLE */}
            <div className="mt-4 text-center text-sm">
              <span className="text-[var(--text-muted)]">
                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-[var(--brand-primary)] hover:text-white font-bold transition-colors"
              >
                {mode === 'login' ? 'Register' : 'Sign In'}
              </button>
            </div>

            {/* DIVIDER */}
            <div className="flex items-center gap-4 my-4">
              <div className="h-px bg-[var(--border-divider)] flex-1" />
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">OR</span>
              <div className="h-px bg-[var(--border-divider)] flex-1" />
            </div>

            {/* GUEST BUTTON */}
            <button 
              onClick={handleGuestPlay}
              disabled={isLoading}
              className="group w-full py-3 rounded-xl border border-[var(--border-primary)] bg-transparent text-[var(--text-primary)] font-bold hover:bg-[var(--bg-tertiary)] hover:border-[var(--brand-primary)] hover:text-white transition-all duration-300 flex items-center justify-center gap-2 focus-ring disabled:opacity-50"
            >
              <span className="material-icons text-[var(--text-muted)] group-hover:text-white transition-colors group-hover:scale-110">
                gamepad
              </span>
              <span>Guest Quick Play</span>
            </button>
            
            <p className="mt-3 text-xs text-[var(--text-muted)] leading-tight text-center">
              *Guest progress is stored locally and won't sync to leaderboards.
            </p>

          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at the document body level, ensuring it's above everything
  return createPortal(modalContent, document.body);
};

export default LoginModal;