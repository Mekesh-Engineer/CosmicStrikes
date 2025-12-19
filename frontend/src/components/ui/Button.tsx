import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: string; // Material Icon name
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon, 
  isLoading, 
  className = '', 
  ...props 
}) => {
  // Base styles including focus rings, transitions, and active press effects
  const baseStyles = "relative inline-flex items-center justify-center gap-2 font-bold tracking-wide transition-all duration-300 rounded-xl focus:outline-none focus-ring disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-95 group overflow-hidden select-none";
  
  // Size variations - Refined padding for optical balance
  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base",
  };

  // Variant styles mapping to global.css variables
  const variants = {
    primary: "bg-[var(--gradient-button)] text-white shadow-[var(--shadow-primary)] hover:shadow-[var(--glow-primary)] hover:-translate-y-0.5 border border-transparent",
    
    secondary: "bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] hover:bg-[var(--bg-interactive)] hover:border-[var(--brand-primary)] hover:text-white hover:shadow-lg",
    
    ghost: "bg-transparent text-[var(--text-secondary)] border border-transparent hover:text-[var(--brand-primary)] hover:bg-[var(--bg-surface)] hover:border-[var(--border-primary)]",
    
    danger: "bg-[var(--error-bg)] text-[var(--error-light)] border border-[var(--error)] hover:bg-[var(--error)] hover:text-white hover:shadow-[var(--glow-danger)]",
  };

  return (
    <button 
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      aria-busy={isLoading}
      {...props}
    >
      {/* Loading Spinner */}
      {isLoading && (
        <span className="material-icons animate-spin text-lg">sync</span>
      )}
      
      {/* Optional Icon - scaled slightly on hover for visual interest */}
      {!isLoading && icon && (
        <span className="material-icons text-lg group-hover:scale-110 transition-transform duration-300">
          {icon}
        </span>
      )}

      {/* Button Text */}
      <span className="relative z-10">{children}</span>
      
      {/* Hover Shine Effect for Primary Buttons */}
      {variant === 'primary' && (
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0 pointer-events-none" />
      )}
    </button>
  );
};

export default Button;