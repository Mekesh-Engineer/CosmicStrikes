import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLeaderboard, api, LeaderboardEntry } from '../lib/api';
import AccountWidget from '../components/AccountWidget';

// --- Main Component ---
const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { leaderboard, loading, error, refetch } = useLeaderboard(true);
  
  // State for Filters & Search
  const [filter, setFilter] = useState<'All' | 'Weekly' | 'Friends'>('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [userRank, setUserRank] = useState<number | null>(null);

  // Fetch user's rank if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      api.getUserRank().then(data => {
        setUserRank(data.rank);
      }).catch(() => {
        setUserRank(null);
      });
    }
  }, [isAuthenticated]);

  // Apply dark theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  // Filter leaderboard by search
  const filteredLeaderboard = leaderboard.filter(p => 
    p.username.toLowerCase().includes(search.toLowerCase())
  );

  // Get top 3 for podium
  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="relative min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-inter overflow-x-hidden">
      
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
            <span className="font-bold tracking-wide text-sm">BACK TO BASE</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Your Rank</p>
              <p className="text-sm font-bold font-orbitron text-[var(--brand-accent)]">
                {isAuthenticated && userRank ? `#${userRank}` : 'Not Ranked'}
              </p>
            </div>
            <AccountWidget />
          </div>
        </div>
      </nav>

      {/* 🏆 HEADER SECTION */}
      <main className="relative z-40 max-w-7xl mx-auto px-6 pt-32 pb-20">
        <header className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] shadow-[var(--glow-primary)] mb-6">
            <span className="material-icons text-5xl text-[var(--brand-primary)] drop-shadow-[0_0_10px_var(--brand-primary)]">
              emoji_events
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black font-orbitron text-gradient-primary tracking-tighter mb-4">
            GLOBAL RANKINGS
          </h1>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-accent)]">
            <span className="material-icons text-sm text-[var(--brand-accent)] animate-spin">sync</span>
            <span className="text-xs font-mono font-bold text-[var(--text-secondary)]">
              NEXT RESET: <span className="text-[var(--text-primary)]">DEC 22</span>
            </span>
          </div>
        </header>

        {/* 📊 FILTER TABS */}
        <div className="flex flex-wrap justify-center gap-4 mb-12 animate-slide-up">
          <FilterTab label="All Time 🏆" active={filter === 'All'} onClick={() => setFilter('All')} />
          <FilterTab label="Weekly 🔥" active={filter === 'Weekly'} onClick={() => setFilter('Weekly')} />
          <FilterTab label="Friends 👥" active={filter === 'Friends'} onClick={() => setFilter('Friends')} />
        </div>

        {/* 🥇 TOP 3 PODIUM (Visible only on 'All' filter) */}
        {filter === 'All' && !search && top3.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 items-end animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <TopPlayerCard player={top3[1]} position="silver" delay="0.2s" />
            <TopPlayerCard player={top3[0]} position="gold" delay="0s" />
            <TopPlayerCard player={top3[2]} position="bronze" delay="0.3s" />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <span className="material-icons text-4xl text-[var(--brand-primary)] animate-spin">autorenew</span>
            <p className="text-[var(--text-muted)] mt-4">Loading leaderboard...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <span className="material-icons text-4xl text-red-500">error_outline</span>
            <p className="text-red-400 mt-4">{error}</p>
            <button 
              onClick={() => refetch()}
              className="mt-4 px-6 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:border-[var(--brand-primary)] transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* 🔍 SEARCH & TABLE CONTROLS */}
        <div className="glass p-4 rounded-[var(--radius-2xl)] border border-[var(--border-primary)] mb-8 flex flex-col md:flex-row gap-4 justify-between items-center animate-fade-in">
          <div className="relative w-full md:w-96">
            <span className="material-icons absolute left-4 top-3 text-[var(--text-muted)]">search</span>
            <input 
              type="text" 
              placeholder="Search pilot callsign..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
            />
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <select className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-secondary)] focus:outline-none cursor-pointer hover:border-[var(--brand-primary)] transition-colors">
              <option>Difficulty: Any</option>
              <option>Insane</option>
              <option>Hard</option>
              <option>Normal</option>
            </select>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-secondary)] cursor-pointer hover:border-[var(--brand-primary)] transition-colors">
              <span className="material-icons text-sm">calendar_today</span>
              <span className="text-sm">Last 30 Days</span>
            </div>
          </div>
        </div>

        {/* 📋 LEADERBOARD TABLE */}
        <div className="glass rounded-[var(--radius-2xl)] border border-[var(--border-primary)] overflow-hidden shadow-2xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-tertiary)] text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider border-b border-[var(--border-divider)]">
                  <th className="px-6 py-5 text-center w-20">#</th>
                  <th className="px-6 py-5">Pilot</th>
                  <th className="px-6 py-5">Score</th>
                  <th className="px-6 py-5">Level</th>
                  <th className="px-6 py-5">Difficulty</th>
                  <th className="px-6 py-5 text-right">Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-divider)]">
                {filteredLeaderboard.map((player) => (
                  <LeaderboardRow 
                    key={player.userId} 
                    player={player} 
                    isUser={player.userId === user?.id} 
                  />
                ))}
                {filteredLeaderboard.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-muted)]">
                      {search ? 'No pilots found matching your search' : 'No scores yet. Be the first!'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* PAGINATION */}
          <div className="px-6 py-4 bg-[var(--bg-tertiary)] border-t border-[var(--border-divider)] flex justify-between items-center">
            <span className="text-xs text-[var(--text-muted)]">
              Showing <span className="text-[var(--text-primary)] font-bold">1-{filteredLeaderboard.length}</span> of <span className="text-[var(--text-primary)] font-bold">{leaderboard.length}</span>
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => refetch(100)}
                className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-primary)] hover:border-[var(--brand-primary)] text-xs font-bold transition-all"
              >
                Load More
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

/* --- SUB-COMPONENTS --- */

// 1. Filter Tab Button
const FilterTab: React.FC<{ label: string, active: boolean, onClick: () => void }> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 transform hover:-translate-y-1 ${
      active 
      ? 'bg-[var(--gradient-button)] text-white shadow-[var(--glow-primary)]' 
      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-primary)] hover:border-[var(--brand-primary)] hover:text-[var(--text-primary)]'
    }`}
  >
    {label}
  </button>
);

// 2. Podium Card (Gold/Silver/Bronze)
const TopPlayerCard: React.FC<{ player: LeaderboardEntry, position: 'gold' | 'silver' | 'bronze', delay: string }> = ({ player, position, delay }) => {
  const styles = {
    gold: {
      height: 'h-64',
      border: 'border-yellow-500/50',
      bg: 'bg-yellow-500/10',
      icon: 'text-yellow-400',
      shadow: 'shadow-[0_0_30px_rgba(234,179,8,0.3)]',
      scale: 'scale-110 z-10'
    },
    silver: {
      height: 'h-56',
      border: 'border-slate-400/50',
      bg: 'bg-slate-400/10',
      icon: 'text-slate-300',
      shadow: 'shadow-[0_0_20px_rgba(203,213,225,0.2)]',
      scale: 'translate-y-4'
    },
    bronze: {
      height: 'h-48',
      border: 'border-orange-700/50',
      bg: 'bg-orange-700/10',
      icon: 'text-orange-600',
      shadow: 'shadow-[0_0_20px_rgba(194,65,12,0.2)]',
      scale: 'translate-y-8'
    }
  };

  const style = styles[position];

  return (
    <div className={`relative ${style.height} ${style.bg} backdrop-blur-md rounded-t-[var(--radius-2xl)] border-t border-x ${style.border} flex flex-col items-center justify-end pb-6 ${style.shadow} ${style.scale} transition-transform hover:-translate-y-2 duration-500`} style={{ animationDelay: delay }}>
      
      {/* Floating Crown/Icon */}
      <div className="absolute -top-10 animate-bounce">
        <span className={`material-icons text-5xl ${style.icon} drop-shadow-lg`}>
          {position === 'gold' ? 'emoji_events' : 'workspace_premium'}
        </span>
      </div>

      {/* Avatar */}
      <div className={`w-20 h-20 rounded-full border-4 ${style.border} mb-4 p-1 bg-[var(--bg-primary)]`}>
        <img 
          src={player.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.username}`} 
          alt={player.username} 
          className="w-full h-full rounded-full bg-slate-800"
        />
      </div>

      <h3 className="font-orbitron font-bold text-xl text-[var(--text-primary)] mb-1">{player.username}</h3>
      <p className={`font-mono font-bold text-2xl ${style.icon}`}>{player.highScore.toLocaleString()}</p>
      
      <div className="mt-2 px-3 py-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border-primary)] text-xs text-[var(--text-muted)]">
        {player.totalGames} Games
      </div>
    </div>
  );
};

// 3. Data Row
const LeaderboardRow: React.FC<{ player: LeaderboardEntry, isUser: boolean }> = ({ player, isUser }) => (
  <tr className={`group transition-colors ${isUser ? 'bg-[var(--brand-primary)]/10 border-l-4 border-l-[var(--brand-primary)]' : 'hover:bg-[var(--bg-interactive)]'}`}>
    
    {/* Rank */}
    <td className="px-6 py-4 text-center">
      <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full font-bold text-xs ${
        player.rank <= 3 ? 'bg-[var(--text-primary)] text-black' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
      }`}>
        {player.rank}
      </div>
    </td>

    {/* Pilot Info */}
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <img 
          src={player.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.username}`} 
          alt="Avatar" 
          className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)]" 
        />
        <div>
          <p className={`font-bold text-sm ${isUser ? 'text-[var(--brand-primary)]' : 'text-[var(--text-primary)]'}`}>
            {player.username} {isUser && '(You)'}
          </p>
        </div>
      </div>
    </td>

    {/* Score */}
    <td className="px-6 py-4">
      <span className="font-orbitron font-bold text-[var(--text-primary)] tracking-wide">
        {player.highScore.toLocaleString()}
      </span>
    </td>

    {/* Games */}
    <td className="px-6 py-4 text-[var(--text-secondary)] text-sm">
      <span className="px-2 py-1 rounded bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
        {player.totalGames}
      </span>
    </td>

    {/* Placeholder for difficulty - API can be extended */}
    <td className="px-6 py-4">
      <span className="px-2 py-1 rounded text-[10px] font-bold uppercase border border-blue-500/30 text-blue-400 bg-blue-500/10">
        Normal
      </span>
    </td>

    {/* Placeholder for last played */}
    <td className="px-6 py-4 text-right text-sm text-[var(--text-muted)] font-mono">
      --
    </td>
  </tr>
);

export default LeaderboardPage;