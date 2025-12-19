import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store';
import { setGameStatus } from '../features/game';
import { useAuth } from '../hooks/useAuth';
import { useUserStats, api, ScoreHistoryEntry } from '../lib/api';
import CosmicBackground from '../scenes/CosmicBackground';
import AccountWidget from '../components/AccountWidget';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAuth();
  const { stats, loading, error, refetch } = useUserStats();
  
  // Local settings state
  const [volume, setVolume] = useState(80);
  const [difficulty, setDifficulty] = useState('normal');
  const [theme, setTheme] = useState('cosmic');
  const [savingSettings, setSavingSettings] = useState(false);

  // Fetch stats on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refetch();
    }
  }, [isAuthenticated, refetch]);

  // Apply dark theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  // Save settings to API
  const handleSaveSettings = async () => {
    if (!isAuthenticated) return;
    
    setSavingSettings(true);
    try {
      await api.updateSettings({ difficulty, sound: volume > 0, theme });
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-inter overflow-x-hidden">
      
      {/* 🌌 BACKGROUND LAYER */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Reusing the gradient from HomePage for consistency but slightly dimmed for readability */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_var(--brand-primary-light)_0%,_transparent_50%)] opacity-20" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 animate-[shimmer_120s_linear_infinite]" />
      </div>

      {/* 🛰️ CUSTOM NAVBAR (Specific to Profile as requested) */}
      <nav className="fixed top-0 left-0 right-0 z-[var(--z-sticky)] glass border-b border-[var(--border-divider)]">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-1 sm:gap-2 text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors group whitespace-nowrap flex-shrink-0"
          >
            <span className="material-icons text-lg sm:text-xl group-hover:-translate-x-1 transition-transform flex-shrink-0">arrow_back</span>
            <span className="hidden sm:inline font-bold tracking-wide text-xs sm:text-sm">BACK TO BASE</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-4 ml-auto flex-shrink-0">
            <div className="text-right hidden sm:block min-w-0">
              <p className="text-[10px] sm:text-xs text-[var(--text-muted)] font-bold tracking-widest uppercase truncate">Pilot Profile</p>
              <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">{user?.name || 'Commander'}</p>
            </div>
            <div className="h-8 sm:h-10 w-8 sm:w-10 rounded-full bg-[var(--bg-tertiary)] border border-[var(--brand-primary)] p-0.5 flex-shrink-0">
               <img 
                 src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`} 
                 alt="Avatar" 
                 className="rounded-full bg-[var(--bg-primary)] w-full h-full"
               />
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer for navbar height */}
      <div className="h-16 sm:h-20" />

      {/* 🚀 MAIN CONTENT GRID */}
      <main className="relative z-40 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20 flex flex-col lg:flex-row gap-8 sm:gap-12">
        
        {/* LEFT COLUMN: Header, Stats, Table */}
        <div className="flex-1 space-y-12">
          
          {/* PROFILE HEADER */}
          <header className="text-center animate-fade-in relative">
            <div className="inline-block relative">
              <div className="w-32 h-32 mx-auto rounded-full p-1 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] shadow-[0_0_40px_var(--glow-effect)]">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`} 
                  alt="Avatar" 
                  className="w-full h-full rounded-full bg-[var(--bg-primary)] border-4 border-[var(--bg-primary)]"
                />
              </div>
              <div className="absolute bottom-0 right-0 bg-[var(--bg-surface)] border border-[var(--brand-primary)] rounded-full p-2 shadow-lg">
                <span className="material-icons text-[var(--brand-primary)] text-xl">edit</span>
              </div>
            </div>
            
            <h1 className="text-4xl font-black font-orbitron mt-6 mb-2 text-white">
              {user?.name || 'John Doe'}
            </h1>
            <p className="text-[var(--text-body)] text-sm font-mono mb-6">
              PILOT ID: <span className="text-[var(--text-primary)]">CS-2025-X99</span> &bull; JOINED 2025
            </p>

            <div className="flex justify-center items-center gap-4 flex-wrap">
              <div className="px-6 py-3 rounded-2xl glass border border-[var(--border-primary)] shadow-sm">
                <p className="text-xs text-[var(--text-muted)] font-bold tracking-widest uppercase mb-1">High Score</p>
                <p className="text-4xl font-black font-orbitron text-gradient-primary drop-shadow-[0_0_15px_var(--glow-effect)]">
                  {stats?.highScore?.toLocaleString() || user?.highScore?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="px-4 py-2 rounded-full bg-[var(--primary-light)] border border-[var(--brand-primary)] text-[var(--brand-primary)] font-bold text-sm flex items-center gap-2">
                <span className="material-icons text-base">emoji_events</span>
                RANK #{stats?.rank || '--'} GLOBAL
              </div>
            </div>
          </header>

          {/* STATS GRID */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
            <StatCard 
              label="Total Games" 
              value={stats?.totalGames?.toString() || user?.totalGames?.toString() || '0'} 
              icon="videogame_asset" 
              color="text-blue-400"
            />
            <StatCard 
              label="High Score" 
              value={(stats?.highScore || user?.highScore || 0).toLocaleString()} 
              icon="emoji_events" 
              color="text-yellow-400"
            />
            <StatCard 
              label="Global Rank" 
              value={stats?.rank ? `#${stats.rank}` : '--'} 
              icon="leaderboard" 
              color="text-[var(--brand-primary)]"
            />
            <StatCard 
              label="Recent Games" 
              value={stats?.recentScores?.length?.toString() || '0'} 
              icon="history" 
              color="text-green-400"
            />
          </section>

          {/* RECENT GAMES TABLE */}
          <section className="glass rounded-[var(--radius-2xl)] border border-[var(--border-primary)] overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-[var(--border-divider)] flex justify-between items-center">
              <h3 className="text-lg font-bold font-orbitron text-[var(--text-primary)]">Flight Log</h3>
              {loading && <span className="material-icons text-[var(--brand-primary)] animate-spin">sync</span>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--bg-tertiary)] text-[var(--text-muted)] font-bold uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4">Level</th>
                    <th className="px-6 py-4">Difficulty</th>
                    <th className="px-6 py-4 text-right">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-divider)]">
                  {stats?.recentScores?.map((entry, index) => (
                    <TableRow 
                      key={index}
                      date={new Date(entry.playedAt).toLocaleDateString()} 
                      score={entry.score.toLocaleString()} 
                      level={entry.level} 
                      difficulty={entry.difficulty} 
                      accuracy={`${entry.accuracy}%`} 
                    />
                  ))}
                  {(!stats?.recentScores || stats.recentScores.length === 0) && !loading && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-[var(--text-muted)]">
                        {isAuthenticated ? 'No games played yet. Start your first mission!' : 'Log in to see your flight history'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Settings Panel (Sticky) */}
        <aside className="lg:w-80 flex-shrink-0 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="sticky top-28 glass rounded-[var(--radius-2xl)] border border-[var(--border-primary)] p-6 space-y-8">
            <div className="flex items-center gap-3 pb-4 border-b border-[var(--border-divider)]">
              <span className="material-icons text-[var(--brand-primary)]">tune</span>
              <h3 className="font-bold font-orbitron text-lg">System Config</h3>
            </div>

            {/* Difficulty Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-[var(--text-secondary)]">Difficulty</label>
                <span className="text-xs font-mono text-[var(--brand-primary)] uppercase">{difficulty}</span>
              </div>
              <input 
                type="range" 
                min="0" max="2" step="1" 
                value={difficulty === 'easy' ? 0 : difficulty === 'normal' ? 1 : 2}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setDifficulty(val === 0 ? 'easy' : val === 1 ? 'normal' : 'hard');
                }}
                className="w-full h-2 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--brand-primary)]"
              />
              <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-bold tracking-widest uppercase">
                <span>Easy</span>
                <span>Normal</span>
                <span>Hard</span>
              </div>
            </div>

            {/* Sound Settings */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-[var(--text-secondary)]">Master Volume</label>
                <span className="text-xs font-mono text-[var(--text-muted)]">{volume}%</span>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setVolume(volume > 0 ? 0 : 80)}
                  className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center hover:text-[var(--brand-primary)] transition-colors"
                >
                  <span className="material-icons text-sm">{volume === 0 ? 'volume_off' : 'volume_up'}</span>
                </button>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value))}
                  className="w-full h-2 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--brand-primary)]"
                />
              </div>
            </div>

            {/* Theme Selector */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-[var(--text-secondary)]">Interface Theme</label>
              <div className="grid grid-cols-3 gap-2">
                <ThemeOption label="Neon" active={theme === 'neon'} onClick={() => setTheme('neon')} color="bg-cyan-500" />
                <ThemeOption label="Cosmic" active={theme === 'cosmic'} onClick={() => setTheme('cosmic')} color="bg-purple-600" />
                <ThemeOption label="Dark" active={theme === 'dark'} onClick={() => setTheme('dark')} color="bg-slate-800" />
              </div>
            </div>

            <div className="pt-6 border-t border-[var(--border-divider)]">
              <button 
                onClick={handleSaveSettings}
                disabled={savingSettings || !isAuthenticated}
                className="w-full py-3 rounded-xl bg-[var(--brand-primary)] text-white font-bold hover:scale-[1.02] transition-transform shadow-[var(--shadow-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingSettings ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
              {!isAuthenticated && (
                <p className="text-xs text-[var(--text-muted)] mt-2 text-center">Log in to save settings</p>
              )}
            </div>
          </div>
        </aside>

      </main>
    </div>
  );
};

/* --- SUB-COMPONENTS --- */

const StatCard: React.FC<{ label: string, value: string, icon: string, color: string }> = ({ label, value, icon, color }) => (
  <div className="p-6 rounded-2xl glass border border-[var(--border-primary)] hover:border-[var(--brand-primary)] transition-all group hover-lift relative overflow-hidden">
    <div className="flex justify-between items-start mb-4">
      <div className={`w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center ${color}`}>
        <span className="material-icons">{icon}</span>
      </div>
    </div>
    <p className="text-2xl font-black font-orbitron text-[var(--text-primary)]">{value}</p>
    <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider mt-1">{label}</p>
    <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-5 blur-2xl bg-[var(--brand-primary)]" />
  </div>
);

const TableRow: React.FC<{ date: string, score: string, level: number, difficulty: string, accuracy: string }> = ({ date, score, level, difficulty, accuracy }) => (
  <tr className="hover:bg-[var(--bg-tertiary)] transition-colors group">
    <td className="px-6 py-4 font-mono text-[var(--text-secondary)]">{date}</td>
    <td className="px-6 py-4 font-bold text-[var(--text-primary)] group-hover:text-[var(--brand-primary)] transition-colors">{score}</td>
    <td className="px-6 py-4 text-[var(--text-secondary)]">Lvl {level}</td>
    <td className="px-6 py-4">
      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
        difficulty === 'hard' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
        difficulty === 'normal' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
        'bg-green-500/10 text-green-400 border border-green-500/20'
      }`}>
        {difficulty}
      </span>
    </td>
    <td className="px-6 py-4 text-right font-mono text-[var(--text-secondary)]">{accuracy}</td>
  </tr>
);

const ThemeOption: React.FC<{ label: string, active: boolean, onClick: () => void, color: string }> = ({ label, active, onClick, color }) => (
  <button 
    onClick={onClick}
    className={`p-2 rounded-lg border flex flex-col items-center gap-2 transition-all ${
      active 
      ? 'border-[var(--brand-primary)] bg-[var(--bg-tertiary)] text-white' 
      : 'border-transparent hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
    }`}
  >
    <div className={`w-4 h-4 rounded-full ${color} shadow-sm`} />
    <span className="text-[10px] font-bold uppercase">{label}</span>
  </button>
);

export default ProfilePage;