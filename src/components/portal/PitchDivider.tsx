import React from 'react';

interface PitchDividerProps {
  className?: string;
}

export const PitchDivider: React.FC<PitchDividerProps> = ({ className = '' }) => (
  <div
    className={`relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2 ${className}`}
    aria-hidden="true"
  >
    <div className="relative flex items-center justify-center">
      <div className="h-px w-full bg-[#DCE2EA] dark:bg-[#1E2733]" />
      <svg
        viewBox="0 0 80 24"
        className="absolute h-6 w-20 bg-[#F6F7F9] dark:bg-[#0B0F14] px-2 text-[#CBD5E1] dark:text-[#263140]"
        fill="none"
      >
        <line x1="0" y1="12" x2="29" y2="12" stroke="currentColor" strokeWidth="1" />
        <line x1="51" y1="12" x2="80" y2="12" stroke="currentColor" strokeWidth="1" />
        <circle cx="40" cy="12" r="9" stroke="currentColor" strokeWidth="1" />
        <circle cx="40" cy="12" r="1.5" fill="currentColor" />
      </svg>
    </div>
  </div>
);
