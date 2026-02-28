import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'left', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className={`relative flex items-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`
          absolute z-50 px-3 py-1.5 text-xs font-medium text-[var(--text)] bg-[var(--surface)] rounded-xl border border-white/[0.08] shadow-xl whitespace-nowrap pointer-events-none animate-fade-in
          ${position === 'right' ? 'left-full ml-3' : ''}
          ${position === 'left' ? 'right-full mr-3' : ''}
          ${position === 'top' ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' : ''}
          ${position === 'bottom' ? 'top-full mt-2 left-1/2 -translate-x-1/2' : ''}
        `}>
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
