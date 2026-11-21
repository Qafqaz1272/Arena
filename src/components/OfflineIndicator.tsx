import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface OfflineIndicatorProps {
  label: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ label }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-[90] flex items-center gap-2 rounded-lg border border-[#F5A524]/50 bg-[#121821] px-3.5 py-2 text-xs font-medium text-[#F3F6FA] shadow-lg"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0 text-[#F5A524]" strokeWidth={1.5} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
};
