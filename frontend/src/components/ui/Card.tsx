import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: string;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  title, 
  subtitle, 
  icon, 
  className = '',
  onClick 
}) => {
  return (
    <div 
      onClick={onClick}
      className={`
        relative p-6 rounded-[var(--radius-xl)] 
        bg-[var(--bg-card)] border border-[var(--border-primary)] 
        hover:border-[var(--brand-primary)] transition-all duration-300 
        group ${onClick ? 'cursor-pointer hover-lift' : ''}
        ${className}
      `}
    >
      {/* Glow Backdrop on Hover */}
      <div className="absolute inset-0 rounded-[var(--radius-xl)] bg-[var(--brand-primary)] opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none" />

      {/* Header Section */}
      {(title || icon) && (
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-10 h-10 rounded-lg bg-[var(--primary-light)] flex items-center justify-center border border-[var(--brand-primary)]/20">
                <span className="material-icons text-[var(--brand-primary)]">{icon}</span>
              </div>
            )}
            <div>
              {title && <h3 className="text-lg font-bold font-orbitron text-[var(--text-primary)]">{title}</h3>}
              {subtitle && <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="text-[var(--text-body)] relative z-10">
        {children}
      </div>
    </div>
  );
};

export default Card;