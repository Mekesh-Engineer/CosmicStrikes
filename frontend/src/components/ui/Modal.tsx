import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode; // For footer buttons
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, actions }) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center px-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-[fade-in_0.2s_ease-out]" 
        onClick={onClose} 
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg rounded-[var(--radius-2xl)] bg-[var(--bg-surface)] border border-[var(--border-primary)] shadow-2xl animate-[fade-in_0.3s_ease-out] overflow-hidden">
        {/* Decorative Top Bar */}
        <div className="h-1 w-full bg-[var(--gradient-primary)]" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-divider)]">
          <h2 className="text-xl font-bold font-orbitron text-[var(--text-primary)] tracking-tight">
            {title}
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-white transition-colors"
          >
            <span className="material-icons text-lg">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-[var(--text-secondary)]">
          {children}
        </div>

        {/* Footer Actions */}
        {actions && (
          <div className="p-6 pt-0 flex justify-end gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;