import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountWidget from '../AccountWidget';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[var(--z-sticky)] glass border-b border-[var(--border-divider)] transition-all duration-300">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          
          {/* Logo Section */}
          <div 
            className="flex items-center gap-2 sm:gap-3 group cursor-pointer flex-shrink-0" 
            onClick={() => {
              navigate('/');
              setIsOpen(false);
            }}
          >
            <span className="material-icons text-3xl sm:text-4xl text-[var(--brand-primary)] drop-shadow-[0_0_8px_var(--glow-effect)] group-hover:rotate-12 transition-transform duration-500 flex-shrink-0">
              rocket_launch
            </span>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-lg sm:text-2xl tracking-tighter font-orbitron text-gradient-primary leading-tight truncate">
                COSMIC STRIKES
              </span>
              <span className="text-[8px] sm:text-[10px] text-[var(--text-muted)] font-mono tracking-[0.2em] sm:tracking-[0.3em] uppercase hidden sm:block truncate">
                Redux Combat
              </span>
            </div>
          </div>

          {/* Desktop Navigation & Actions */}
          <div className="flex items-center gap-3 sm:gap-4 md:gap-8 ml-auto">
            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-[var(--text-secondary)]">
              <a href="/#features" className="hover:text-[var(--brand-primary)] transition-colors relative group whitespace-nowrap">
                FEATURES
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--brand-primary)] transition-all group-hover:w-full" />
              </a>
              <button 
                onClick={() => navigate('/leaderboard')} 
                className="hover:text-[var(--brand-primary)] transition-colors relative group whitespace-nowrap"
              >
                RANKINGS
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--brand-primary)] transition-all group-hover:w-full" />
              </button>
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-[var(--border-primary)] hidden md:block flex-shrink-0" />

            {/* User Widget */}
            <div className="flex-shrink-0">
              <AccountWidget />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors flex-shrink-0"
              aria-label="Toggle menu"
            >
              <span className="material-icons text-xl text-[var(--text-secondary)]">
                {isOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-[var(--border-divider)] bg-[var(--bg-tertiary)]/80 backdrop-blur-md">
            <div className="px-4 sm:px-6 py-4 space-y-3">
              <a 
                href="/#features" 
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm"
              >
                FEATURES
              </a>
              <button 
                onClick={() => {
                  navigate('/leaderboard');
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm"
              >
                RANKINGS
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer to prevent content overlap */}
      <div className="h-16 sm:h-20" />
    </>
  );
};

export default Navbar;