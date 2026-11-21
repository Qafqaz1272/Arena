import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  installLabel: string;
  iosTitle: string;
  iosStep1: string;
  iosStep2: string;
  closeLabel: string;
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  installLabel,
  iosTitle,
  iosStep1,
  iosStep2,
  closeLabel,
  compact = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#168A4A]/45 dark:border-[#2BD576]/40 bg-[#2BD576]/10 font-semibold text-[#147A42] dark:text-[#2BD576] transition-colors hover:bg-[#2BD576]/18 cursor-pointer whitespace-nowrap ${
          compact ? 'h-9 px-2.5 text-xs' : 'w-full min-h-[42px] px-3 py-2 text-xs'
        }`}
      >
        <Download className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        <span>{installLabel}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] font-semibold text-[#111827] dark:text-[#F3F6FA] transition-colors hover:border-[#168A4A] dark:hover:border-[#2BD576] cursor-pointer whitespace-nowrap ${
            compact ? 'h-9 px-2.5 text-xs' : 'w-full min-h-[42px] px-3 py-2 text-xs'
          }`}
        >
          <Smartphone className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          <span>{installLabel}</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-pwa-title"
            className="fixed inset-0 z-[95] flex items-center justify-center bg-[#0B0F14]/80 p-4"
          >
            <div className="w-full max-w-sm rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-5 text-[#111827] dark:text-[#F3F6FA]">
              <div className="flex items-start justify-between gap-3">
                <h3
                  id="ios-pwa-title"
                  className="font-display text-xl font-bold uppercase text-[#111827] dark:text-[#F3F6FA]"
                >
                  {iosTitle}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label={closeLabel}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] text-[#64748B] hover:text-[#111827] dark:hover:text-[#F3F6FA] cursor-pointer"
                >
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
              <ol className="mt-3 space-y-2 text-xs leading-relaxed text-[#475569] dark:text-[#94A3B8]">
                <li>1. {iosStep1}</li>
                <li>2. {iosStep2}</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full min-h-[40px] rounded-lg bg-[#168A4A] dark:bg-[#2BD576] py-2 text-xs font-semibold text-white dark:text-[#08140D] hover:opacity-90 cursor-pointer"
              >
                {closeLabel}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
