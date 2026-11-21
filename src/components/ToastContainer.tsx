import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, RotateCcw, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ToastItem, ToastVariant } from '../utils/toastQueue';

export interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  regionLabel: string;
  dismissLabel: string;
  /** Shifts desktop bottom-right placement left when the 380px right chat sidebar is open */
  offsetForRightSidebar?: boolean;
}

const VARIANT_STYLES: Record<
  ToastVariant,
  {
    icon: React.FC<{ className?: string }>;
    containerBorder: string;
    iconColor: string;
    progressBar: string;
    actionButton: string;
  }
> = {
  error: {
    icon: AlertCircle,
    containerBorder: 'border-rose-500/30 dark:border-rose-500/35',
    iconColor: 'text-rose-600 dark:text-rose-400',
    progressBar: 'bg-rose-500/75 dark:bg-rose-400/75',
    actionButton:
      'border-rose-500/30 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/35 dark:bg-rose-950/50 dark:text-rose-200 dark:hover:bg-rose-900/60',
  },
  warning: {
    icon: AlertTriangle,
    containerBorder: 'border-amber-500/35 dark:border-amber-500/35',
    iconColor: 'text-amber-600 dark:text-amber-400',
    progressBar: 'bg-amber-500/75 dark:bg-amber-400/75',
    actionButton:
      'border-amber-500/35 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500/35 dark:bg-amber-950/50 dark:text-amber-200 dark:hover:bg-amber-900/60',
  },
  info: {
    icon: Info,
    containerBorder: 'border-sky-500/30 dark:border-sky-500/35',
    iconColor: 'text-sky-600 dark:text-sky-400',
    progressBar: 'bg-sky-500/75 dark:bg-sky-400/75',
    actionButton:
      'border-sky-500/30 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-500/35 dark:bg-sky-950/50 dark:text-sky-200 dark:hover:bg-sky-900/60',
  },
  success: {
    icon: CheckCircle2,
    containerBorder: 'border-emerald-500/30 dark:border-emerald-500/35',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    progressBar: 'bg-emerald-500/75 dark:bg-emerald-400/75',
    actionButton:
      'border-emerald-500/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/35 dark:bg-emerald-950/50 dark:text-emerald-200 dark:hover:bg-emerald-900/60',
  },
};

interface SingleToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
  dismissLabel: string;
}

const SingleToast: React.FC<SingleToastProps> = ({ toast, onDismiss, dismissLabel }) => {
  const [paused, setPaused] = useState(false);
  const [remainingMs, setRemainingMs] = useState(toast.durationMs);
  const startedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    setRemainingMs(toast.durationMs);
  }, [toast.id, toast.durationMs]);

  useEffect(() => {
    if (paused) return;
    if (remainingMs <= 0) {
      onDismiss(toast.id);
      return;
    }

    startedAtRef.current = Date.now();
    const timer = window.setTimeout(() => {
      onDismiss(toast.id);
    }, remainingMs);

    return () => {
      window.clearTimeout(timer);
      const elapsed = Date.now() - startedAtRef.current;
      setRemainingMs((prev) => Math.max(0, prev - elapsed));
    };
  }, [paused, remainingMs, toast.id, onDismiss]);

  const style = VARIANT_STYLES[toast.variant];
  const Icon = style.icon;
  const isUrgent = toast.variant === 'error' || toast.variant === 'warning';

  const handleAction = () => {
    const fn = toast.onAction;
    onDismiss(toast.id);
    fn?.();
  };

  return (
    <motion.div
      layout
      data-testid="toast-item"
      data-toast-variant={toast.variant}
      role={isUrgent ? 'alert' : 'status'}
      aria-live={isUrgent ? 'assertive' : 'polite'}
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className={`pointer-events-auto relative overflow-hidden rounded-xl border bg-white/95 shadow-lg backdrop-blur-sm dark:bg-[#111827]/95 ${style.containerBorder}`}
    >
      <div className="flex items-start gap-3 p-3.5">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.iconColor}`} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          {toast.title && (
            <p className="text-xs font-semibold leading-snug text-slate-900 dark:text-slate-50">
              {toast.title}
            </p>
          )}
          <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {toast.message}
          </p>
          {toast.actionLabel && toast.onAction && (
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={handleAction}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${style.actionButton}`}
              >
                <RotateCcw className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span>{toast.actionLabel}</span>
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          aria-label={dismissLabel}
          className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Subtle auto-dismiss hairline indicator */}
      <div className="h-[2px] w-full bg-slate-100 dark:bg-slate-800/80" aria-hidden="true">
        <motion.div
          key={`${toast.id}-${paused ? 'paused' : 'running'}`}
          className={`h-full origin-left ${style.progressBar}`}
          initial={{ scaleX: Math.max(0, Math.min(1, remainingMs / toast.durationMs)) }}
          animate={{ scaleX: paused ? Math.max(0, Math.min(1, remainingMs / toast.durationMs)) : 0 }}
          transition={{ duration: paused ? 0 : remainingMs / 1000, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  regionLabel,
  dismissLabel,
  offsetForRightSidebar = false,
}) => {
  return (
    <section
      aria-label={regionLabel}
      data-testid="toast-container"
      className={`pointer-events-none fixed inset-x-3 top-16 z-[60] flex flex-col gap-2.5 sm:inset-x-auto sm:top-[4.25rem] sm:right-5 sm:w-[360px] sm:max-w-[calc(100vw-2.5rem)] transition-[right] duration-200 ${
        offsetForRightSidebar ? 'xl:right-[400px]' : ''
      }`}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {toasts.map((toast) => (
          <SingleToast
            key={toast.id}
            toast={toast}
            onDismiss={onDismiss}
            dismissLabel={dismissLabel}
          />
        ))}
      </AnimatePresence>
    </section>
  );
};
