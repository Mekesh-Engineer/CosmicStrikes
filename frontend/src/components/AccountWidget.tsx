import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoginModal from './auth/LoginModal';

export default function AccountWidget() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Helper to determine display name
  const displayName = user?.name ?? (isAuthenticated ? 'Commander' : 'Guest Pilot');

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    navigate('/profile');
  };

  const handleLoginClick = () => {
    setIsOpen(false);
    setShowLoginModal(true);
  };

  return (
    <>
      <div className="relative inline-flex z-[var(--z-dropdown)]">
        {/* Trigger Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className={`
            flex items-center gap-3 px-4 py-2 rounded-full transition-all duration-300
            border border-[var(--border-primary)] hover:border-[var(--brand-primary)]
            ${isOpen ? 'bg-[var(--bg-tertiary)] glow-primary' : 'glass hover:bg-[var(--bg-tertiary)]'}
          `}
        >
          {/* Avatar / Icon */}
          <div className="w-8 h-8 rounded-full bg-[var(--bg-surface)] flex items-center justify-center border border-[var(--border-secondary)]">
            {isAuthenticated && user?.avatar ? (
              <img 
                src={user.avatar} 
                alt="Avatar" 
                className="w-full h-full rounded-full"
              />
            ) : (
              <span className="material-icons text-sm text-[var(--brand-primary)]">
                {isAuthenticated ? 'verified_user' : 'person'}
              </span>
            )}
          </div>

          {/* User Info */}
          <div className="flex flex-col items-start text-xs">
            <span className="text-[var(--text-muted)] font-bold tracking-wider uppercase text-[10px]">
              {isAuthenticated ? `${user?.totalGames || 0} GAMES` : 'NOT SYNCED'}
            </span>
            <span className={`font-orbitron font-bold tracking-wide ${isAuthenticated ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
              {displayName}
            </span>
          </div>

          <span className={`material-icons text-[var(--text-muted)] text-sm transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>

        {/* Dropdown Menu */}
        <div className={`
          absolute right-0 top-full mt-2 w-56 p-2 rounded-xl
          bg-[var(--bg-surface)] border border-[var(--border-primary)] shadow-2xl
          transform transition-all duration-200 origin-top-right
          ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
        `}>
          <div className="px-3 py-2 border-b border-[var(--border-primary)] mb-2">
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Account Status</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-yellow-500'}`} />
              <span className="text-xs text-[var(--text-primary)]">
                {isAuthenticated ? 'Online' : 'Local Mode'}
              </span>
            </div>
            {isAuthenticated && user?.highScore !== undefined && (
              <p className="text-xs text-[var(--text-muted)] mt-1">
                High Score: <span className="text-[var(--brand-primary)] font-bold">{user.highScore.toLocaleString()}</span>
              </p>
            )}
          </div>

          {isAuthenticated ? (
            <>
              <button 
                onClick={handleProfileClick}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-interactive)] transition-colors"
              >
                <span className="material-icons text-base">query_stats</span>
                Flight Logs
              </button>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--error-light)] hover:bg-[var(--error-bg)] transition-colors mt-1"
              >
                <span className="material-icons text-base">power_settings_new</span>
                Disconnect
              </button>
            </>
          ) : (
            <button 
              onClick={handleLoginClick}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:text-white hover:bg-[var(--brand-primary)] transition-colors group"
            >
              <span className="material-icons text-base group-hover:text-white transition-colors">login</span>
              Sync Profile
            </button>
          )}
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </>
  );
}