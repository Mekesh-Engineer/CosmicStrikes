import React from 'react';

interface LoginButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary';
  icon?: string;
  label?: string;
}

const LoginButton: React.FC<LoginButtonProps> = ({ 
  isLoading = false,
  variant = 'primary',
  icon = 'login',
  label = 'Login',
  className = '',
  disabled = false,
  ...props 
}) => {
  const baseClasses = `
    relative inline-flex items-center justify-center gap-2 px-6 py-2.5
    font-bold tracking-wide rounded-xl transition-all duration-300
    active:scale-95 focus-ring group overflow-hidden
  `;

  const variantClasses = variant === 'primary'
    ? `bg-[var(--gradient-button)] text-[var(--text-inverse)] 
       shadow-[var(--shadow-primary)] hover:shadow-[var(--glow-primary)] 
       hover:-translate-y-0.5 hover:scale-[1.02]`
    : `border border-[var(--border-primary)] text-[var(--text-secondary)]
       hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]
       hover:bg-[var(--bg-tertiary)]`;

  const disabledClasses = disabled || isLoading ? 'opacity-70 cursor-not-allowed' : '';

  return (
    <button 
      className={`${baseClasses} ${variantClasses} ${disabledClasses} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0 pointer-events-none" />
      <div className="relative z-10 flex items-center gap-2 uppercase text-xs sm:text-sm font-orbitron">
        {isLoading ? (
          <>
            <span className="material-icons animate-spin text-lg">sync</span>
            Loading...
          </>
        ) : (
          <>
            <span className="material-icons text-lg group-hover:rotate-12 transition-transform duration-300">
              {icon}
            </span>
            {label}
          </>
        )}
      </div>
    </button>
  );
};

export default LoginButton;