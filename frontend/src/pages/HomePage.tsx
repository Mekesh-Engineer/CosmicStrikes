import React, { useEffect, Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CosmicBackground from '../scenes/CosmicBackground';
import Navbar from '../components/ui/Navbar';
import AccountWidget from '../components/AccountWidget';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [playerCount, setPlayerCount] = useState(12840);

  // Apply dark theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');

    // Scroll listener for parallax/navbar effects
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(scrolled / maxScroll);
    };

    // Live player counter simulation
    const interval = setInterval(() => {
      setPlayerCount(prev => prev + Math.floor(Math.random() * 3));
    }, 3000);

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-inter overflow-x-hidden selection:bg-[var(--brand-primary)] selection:text-white">

      {/* 🌌 FULLSCREEN 3D COSMIC BG (Parallax Layer) */}
      <div className="fixed inset-0 z-0 pointer-events-none transform transition-transform duration-75" style={{ transform: `translateY(${scrollProgress * -50}px)` }}>
        <Suspense fallback={<div className="bg-black w-full h-full" />}>
          <CosmicBackground />
        </Suspense>
        {/* Overlay gradient for UI readability */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_transparent_0%,_var(--bg-primary)_90%)] opacity-80" />
      </div>

      {/* 🛰️ FIXED NAVBAR */}
      <Navbar />

      {/* =========================================
          1. HERO SECTION
      ========================================= */}
      <section className="relative z-40 min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20">

        {/* Cosmic Logo Stack (Cleaned Layout) */}
        <div className="animate-float mb-6">
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-none mb-2">
            <span className="text-gradient-primary drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">COSMIC</span>
            <br />
            <span className="text-white font-orbitron drop-shadow-[0_0_30px_var(--glow-effect)]">STRIKES</span>
          </h1>
        </div>

        {/* Subtitle & Counter */}
        <p className="text-[var(--text-secondary)] text-lg md:text-2xl max-w-3xl mb-4 font-light tracking-wide animate-slide-up">
          60FPS Redux Arcade Shooter | <span className="text-[var(--brand-accent)] font-bold">Defend Earth</span> from Alien Invasion
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] mb-10 animate-fade-in">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm font-mono text-[var(--text-primary)]">
            <span className="font-bold">{playerCount.toLocaleString()}</span> pilots online
          </span>
        </div>

        {/* CTA Row - UPDATED COLORS (Blue & White) */}
        <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto items-center justify-center animate-bounce-in">

          {/* 🔵 PRIMARY CTA: Blue-to-Cyan Gradient */}
          <button
            onClick={() => navigate('/game')}
            className="
              group relative overflow-hidden
              w-full sm:w-auto px-12 py-5 
              
              /* Custom Blue Gradient */
              bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500
              text-white
              border border-blue-400/30
              
              rounded-[var(--radius-xl)] 
              font-orbitron font-bold text-xl tracking-wide
              
              /* Blue Glow Shadow */
              shadow-[0_4px_20px_rgba(37,99,235,0.5)]
              
              transition-all duration-300 ease-out
              
              /* Hover States */
              hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] 
              hover:-translate-y-1 
              hover:brightness-110
              hover:border-cyan-300/50
              
              /* Active/Click States */
              active:scale-95 
              active:shadow-none
              
              flex items-center justify-center gap-3
            "
          >
            {/* Animated Shimmer Overlay */}
            <div className="absolute inset-0 translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            <span className="material-icons text-3xl group-hover:rotate-12 transition-transform duration-300">play_arrow</span>
            <span className="relative z-10 drop-shadow-md">PLAY NOW</span>
          </button>

          {/* ⚪ SECONDARY CTA: White Ghost Style */}
          <button
            onClick={() => navigate('/game?mode=demo')}
            className="
              group
              w-full sm:w-auto px-10 py-5 
              
              /* Transparent BG with White Border */
              bg-white/5 
              backdrop-blur-sm
              text-white
              border-2 border-white/50
              
              rounded-[var(--radius-xl)] 
              font-orbitron font-bold text-xl tracking-wide
              
              transition-all duration-300 ease-out
              
              /* Hover States: Fills White */
              hover:bg-white 
              hover:text-[var(--bg-primary)]
              hover:border-white
              hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]
              hover:-translate-y-1
              
              /* Active States */
              active:scale-95
              
              flex items-center justify-center gap-3
            "
          >
            <span className="material-icons transition-transform duration-300 group-hover:scale-110">smartphone</span>
            TRY DEMO
          </button>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce flex flex-col items-center gap-2 opacity-70">
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Discover the mission</span>
          <span className="material-icons text-[var(--brand-primary)]">keyboard_arrow_down</span>
        </div>
      </section>

      {/* =========================================
          2. GAMEPLAY GALLERY SECTION (Images)
      ========================================= */}
      <section className="relative z-40 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-[var(--brand-primary)] font-bold tracking-widest uppercase text-sm">Visual Intelligence</span>
            <h2 className="text-3xl font-orbitron font-black text-white mt-2">COMBAT FOOTAGE</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto md:h-[500px]">

            {/* Main Featured Image */}
            <div className="relative rounded-[var(--radius-2xl)] overflow-hidden border border-[var(--border-primary)] group h-[300px] md:h-full shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1614726365723-49cfae96a604?q=80&w=1200&auto=format&fit=crop"
                alt="Boss Battle Gameplay"
                className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
              <div className="absolute bottom-6 left-6">
                <span className="px-3 py-1 bg-[var(--brand-primary)] text-white text-xs font-bold rounded-full mb-2 inline-block">EPIC BOSSES</span>
                <h3 className="text-2xl font-orbitron font-bold text-white">Sector 7 Guardian</h3>
              </div>
            </div>

            {/* Side Grid */}
            <div className="grid grid-rows-2 gap-6 h-[400px] md:h-full">
              <div className="relative rounded-[var(--radius-2xl)] overflow-hidden border border-[var(--border-primary)] group shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop"
                  alt="Neon City Level"
                  className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                <div className="absolute bottom-4 left-4">
                  <h4 className="text-lg font-orbitron font-bold text-white">Neon Nebula</h4>
                </div>
              </div>

              <div className="relative rounded-[var(--radius-2xl)] overflow-hidden border border-[var(--border-primary)] group shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop"
                  alt="Customization Hangar"
                  className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                <div className="absolute bottom-4 left-4">
                  <h4 className="text-lg font-orbitron font-bold text-white">Ship Hangar</h4>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================
          3. FEATURES SCROLL (Horizontal Snap)
      ========================================= */}
      <section className="relative z-40 py-32 bg-gradient-to-b from-[var(--bg-secondary)]/50 to-transparent">
        <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
          <h2 className="text-4xl md:text-5xl font-black font-orbitron text-white mb-4">SYSTEM CORE FEATURES</h2>
          <div className="h-1 w-24 bg-[var(--gradient-primary)] mx-auto rounded-full" />
        </div>

        <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 px-6 pb-12 max-w-7xl mx-auto no-scrollbar">
          <FeatureCard
            icon="precision_manufacturing"
            title="PRECISION PHYSICS"
            desc="Trigonometric aiming engine synced with Redux for frame-perfect 60FPS combat."
          />
          <FeatureCard
            icon="emoji_events"
            title="GLOBAL RANKING"
            desc="Climb the weekly leaderboards. Live updates via WebSocket connection."
          />
          <FeatureCard
            icon="public"
            title="3D COSMIC WORLD"
            desc="Immersive React Three Fiber backgrounds with parallax nebula particles."
          />
          <FeatureCard
            icon="devices"
            title="CROSS-PLATFORM"
            desc="Seamless experience across Desktop, Tablet, and Mobile with responsive touch controls."
          />
          <FeatureCard
            icon="cloud_sync"
            title="INSTANT SAVE"
            desc="Google OAuth integration ensures your progress is saved to the cloud instantly."
          />
        </div>
      </section>

      {/* =========================================
          4. STATS & TESTIMONIALS
      ========================================= */}
      <section className="relative z-40 py-32">
        <div className="max-w-7xl mx-auto px-6">

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-24 text-center">
            <StatItem value="2.4M" label="Total Kills 🔥" />
            <StatItem value="127K" label="Games Played 🎮" />
            <StatItem value="500+" label="Leaderboard Slots 🏆" />
            <StatItem value="98%" label="Pilot Retention ⭐" />
          </div>

          {/* Testimonials */}
          <h2 className="text-3xl font-orbitron font-bold text-center mb-12">TRANSMISSIONS FROM THE VOID</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Testimonial
              quote="Addicted! Best arcade shooter since Geometry Wars. The visuals are stunning."
              author="@PlayerX"
              role="Top 10 Pilot"
            />
            <Testimonial
              quote="The Redux state management is flawless. Zero lag even on mobile data."
              author="@DevGuru"
              role="Tech Reviewer"
            />
            <Testimonial
              quote="Finally, a web game that feels native. The touch controls are incredibly responsive."
              author="@MobileGamer"
              role="Esports Coach"
            />
          </div>

          {/* Trust Badges */}
          <div className="mt-20 flex flex-wrap justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <span className="text-xl font-bold flex items-center gap-2"><span className="material-icons">security</span> Google Identity</span>
            <span className="text-xl font-bold flex items-center gap-2"><span className="material-icons">storage</span> MongoDB</span>
            <span className="text-xl font-bold flex items-center gap-2"><span className="material-icons">code</span> React 18</span>
            <span className="text-xl font-bold flex items-center gap-2"><span className="material-icons">style</span> Tailwind CSS</span>
          </div>
        </div>
      </section>

      {/* =========================================
          5. UPCOMING FEATURES (Roadmap)
      ========================================= */}
      <section className="relative z-40 py-32 mx-4 md:mx-12">
        <div className="glass rounded-[var(--radius-2xl)] border border-[var(--border-primary)] p-12 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[var(--brand-primary)] font-bold tracking-widest uppercase text-sm mb-2 block">Mission Roadmap</span>
            <h2 className="text-4xl font-orbitron font-black text-white">FUTURE UPDATES</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connector Line (Desktop) */}
            <div className="hidden md:block absolute top-8 left-0 right-0 h-1 bg-[var(--border-primary)] z-0" />

            <RoadmapItem
              quarter="Q1 2026"
              title="MULTIPLAYER DUELS"
              desc="Real-time PvP 1v1 battles."
              icon="groups"
            />
            <RoadmapItem
              quarter="Q2 2026"
              title="WEAPON UPGRADES"
              desc="Laser, plasma, and missile tech."
              icon="upgrade"
            />
            <RoadmapItem
              quarter="Q3 2026"
              title="CUSTOM SKINS"
              desc="Personalize your ship and exhaust."
              icon="palette"
            />
          </div>
        </div>
      </section>

      {/* =========================================
          6. FINAL CTA SECTION
      ========================================= */}
      <section className="relative z-40 py-32 text-center px-6">
        <h2 className="text-5xl md:text-7xl font-black font-orbitron text-white mb-8 tracking-tighter">
          READY TO DEFEND<br />
          <span className="text-gradient-primary">THE GALAXY?</span>
        </h2>

        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
          <button
            onClick={() => navigate('/game')}
            className="px-12 py-5 bg-[var(--gradient-button)] text-white font-bold rounded-xl text-xl shadow-[var(--glow-primary)] hover:scale-105 transition-transform flex items-center justify-center gap-3"
          >
            <span className="material-icons">bolt</span>
            PLAY NOW FREE
          </button>
          <button className="px-12 py-5 bg-[#5865F2] text-white font-bold rounded-xl text-xl hover:bg-[#4752C4] transition-colors flex items-center justify-center gap-3">
            <span className="material-icons">discord</span>
            JOIN DISCORD
          </button>
        </div>

        {/* Email Subscribe */}
        <div className="max-w-md mx-auto">
          <p className="text-[var(--text-muted)] mb-4 text-sm font-bold uppercase tracking-widest">Get Mission Updates</p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="pilot@cosmic.com"
              className="flex-1 px-4 py-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-white focus:ring-2 focus:ring-[var(--brand-primary)] outline-none"
            />
            <button className="px-6 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--brand-primary)] text-[var(--brand-primary)] font-bold rounded-lg transition-colors">
              JOIN
            </button>
          </div>
        </div>
      </section>

      {/* =========================================
          FOOTER
      ========================================= */}
      <footer className="relative z-50 bg-[var(--bg-secondary)] border-t border-[var(--border-divider)] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">

          <div className="flex items-center gap-3">
            <span className="material-icons text-3xl text-[var(--brand-primary)]">rocket_launch</span>
            <div>
              <h3 className="font-orbitron font-bold text-xl text-white">COSMIC STRIKES</h3>
              <p className="text-xs text-[var(--text-muted)]">© 2025 All Rights Reserved</p>
            </div>
          </div>

          <div className="flex gap-8 text-sm font-bold text-[var(--text-secondary)]">
            <a href="#" className="hover:text-[var(--brand-primary)] transition-colors">PRIVACY</a>
            <a href="#" className="hover:text-[var(--brand-primary)] transition-colors">TERMS</a>
            <a href="#" className="hover:text-[var(--brand-primary)] transition-colors">SUPPORT</a>
          </div>

          <div className="text-right">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Status</p>
            <div className="flex items-center gap-2 text-green-400 font-mono text-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Servers Online ({playerCount.toLocaleString()})
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};

/* --- SUB-COMPONENTS --- */

const FeatureCard: React.FC<{ icon: string, title: string, desc: string }> = ({ icon, title, desc }) => (
  <div className="min-w-[280px] snap-center p-8 rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[var(--brand-primary)] hover:-translate-y-2 transition-all duration-300 group">
    <div className="w-14 h-14 rounded-xl bg-[var(--primary-light)] flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-300">
      <span className="material-icons text-3xl text-[var(--brand-primary)]">{icon}</span>
    </div>
    <h3 className="text-xl font-bold mb-3 font-orbitron text-white">{title}</h3>
    <p className="text-[var(--text-body)] text-sm leading-relaxed">{desc}</p>
  </div>
);

const StatItem: React.FC<{ value: string, label: string }> = ({ value, label }) => (
  <div className="p-4">
    <p className="text-5xl md:text-6xl font-black font-orbitron text-gradient-primary mb-2">{value}</p>
    <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">{label}</p>
  </div>
);

const Testimonial: React.FC<{ quote: string, author: string, role: string }> = ({ quote, author, role }) => (
  <div className="p-8 rounded-[var(--radius-xl)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] relative">
    <span className="material-icons text-4xl text-[var(--border-primary)] absolute top-6 left-6">format_quote</span>
    <p className="text-[var(--text-primary)] italic mb-6 relative z-10 pt-4">"{quote}"</p>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-[var(--brand-secondary)] flex items-center justify-center font-bold text-[var(--brand-primary)]">
        {author[1]}
      </div>
      <div>
        <p className="font-bold text-white text-sm">{author}</p>
        <p className="text-xs text-[var(--text-muted)] uppercase">{role}</p>
      </div>
    </div>
  </div>
);

const RoadmapItem: React.FC<{ quarter: string, title: string, desc: string, icon: string }> = ({ quarter, title, desc, icon }) => (
  <div className="relative z-10 text-center group">
    <div className="w-16 h-16 mx-auto rounded-full bg-[var(--bg-surface)] border-4 border-[var(--bg-card)] flex items-center justify-center mb-6 shadow-[var(--shadow-lg)] group-hover:scale-110 transition-transform duration-300">
      <span className="material-icons text-2xl text-[var(--brand-primary)]">{icon}</span>
    </div>
    <div className="inline-block px-3 py-1 rounded-full bg-[var(--primary-light)] text-[var(--brand-primary)] text-xs font-bold mb-3">
      {quarter}
    </div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-[var(--text-muted)] text-sm">{desc}</p>
  </div>
);

export default HomePage;