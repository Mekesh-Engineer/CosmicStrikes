import React from 'react';
import { useAppSelector, useAppDispatch } from '../../store';
import { clearAuth } from '../../features/auth';

interface ProfileCardProps {
  onLogout?: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ onLogout }) => {
  const dispatch = useAppDispatch();
  const { user, status } = useAppSelector((state) => state.auth);
  
  const userData = user || { 
    name: 'Guest Pilot', 
    id: 'guest', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest'
  };
  
  const avatarUrl = userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`;
  const isAuthenticated = status === 'authenticated';

  const handleLogout = () => {
    dispatch(clearAuth());
    onLogout?.();
  };

  return (
    <div className="w-full max-w-sm p-6 rounded-[var(--radius-2xl)] glass border border-[var(--border-primary)] shadow-2xl relative group overflow-hidden hover-lift transition-all duration-300">
      
      {/* 🌌 Background Decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--brand-primary)] opacity-10 blur-[50px] rounded-full pointer-events-none transition-opacity group-hover:opacity-20" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-[var(--brand-accent)] opacity-5 blur-[40px] rounded-full pointer-events-none" />

      {/* 👤 Header: Avatar & Identity */}
      <div className="flex items-center gap-4 mb-6 relative z-10">
        <div className="relative">
          <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] shadow-[var(--glow-primary)]">
            <img 
              src={avatarUrl} 
              alt={userData.name}
              className="w-full h-full rounded-full bg-[var(--bg-primary)] object-cover"
            />
          </div>
          {/* Status Indicator */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[var(--bg-surface)] rounded-full flex items-center justify-center border border-[var(--border-primary)]">
            <span className={`material-icons text-[10px] ${isAuthenticated ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`} title={isAuthenticated ? "Authenticated" : "Guest Mode"}>
              circle
            </span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-orbitron font-bold text-lg text-[var(--text-primary)] truncate">
            {userData.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--brand-primary)] font-mono tracking-wider uppercase bg-[var(--primary-light)] px-1.5 py-0.5 rounded">
              LVL 05
            </span>
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">
              {isAuthenticated ? 'Pilot' : 'Guest'}
            </span>
          </div>
        </div>
      </div>

      {/* 📊 Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6 relative z-10">
        <div className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-center group-hover:border-[var(--brand-primary)] transition-colors duration-300">
          <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold mb-1">Rank</p>
          <p className="font-orbitron text-sm font-bold text-[var(--text-primary)]">#42</p>
        </div>
        <div className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-center group-hover:border-[var(--brand-primary)] transition-colors duration-300">
          <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold mb-1">Score</p>
          <p className="font-orbitron text-sm font-bold text-[var(--brand-accent)]">24k</p>
        </div>
        <div className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-center group-hover:border-[var(--brand-primary)] transition-colors duration-300">
          <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold mb-1">Win %</p>
          <p className="font-orbitron text-sm font-bold text-[var(--success-light)]">68%</p>
        </div>
      </div>

      {/* 🛠️ Action Buttons */}
      <div className="flex gap-3 relative z-10">
        <button className="flex-1 py-2 px-4 rounded-lg bg-[var(--bg-interactive)] hover:bg-[var(--brand-primary)] text-sm font-bold text-[var(--text-primary)] hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group/btn border border-transparent">
          <span className="material-icons text-base group-hover/btn:scale-110 transition-transform">person</span>
          Profile
        </button>
        {isAuthenticated && (
          <button 
            onClick={handleLogout}
            className="flex-1 py-2 px-4 rounded-lg bg-red-900/20 hover:bg-red-700/40 border border-red-500/30 hover:border-red-500 text-sm font-bold text-red-400 hover:text-red-300 transition-all duration-300 flex items-center justify-center gap-2 group/btn"
          >
            <span className="material-icons text-base group-hover/btn:scale-110 transition-transform">logout</span>
            Logout
          </button>
        )}
        <button className="flex-1 py-2 px-4 rounded-lg border border-[var(--border-primary)] hover:border-[var(--brand-primary)] text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-all duration-300 flex items-center justify-center gap-2 hover:bg-[var(--bg-tertiary)]">
          <span className="material-icons text-base">settings</span>
          Config
        </button>
      </div>
    </div>
  );
};

export default ProfileCard;