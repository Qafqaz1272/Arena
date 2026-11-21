export type ToastVariant = 'error' | 'warning' | 'info' | 'success';

export interface ToastInput {
  id?: string;
  variant: ToastVariant;
  title: string;
  message: string;
  durationMs?: number;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  message: string;
  durationMs: number;
  actionLabel?: string;
  onAction?: () => void;
  createdAt: number;
}

export const DEFAULT_TOAST_DURATION_MS = 6500;
export const MIN_TOAST_DURATION_MS = 2500;
export const MAX_TOAST_DURATION_MS = 15000;
export const DEFAULT_MAX_VISIBLE_TOASTS = 3;

export function clampToastDuration(durationMs?: number): number {
  if (typeof durationMs !== 'number' || !Number.isFinite(durationMs)) {
    return DEFAULT_TOAST_DURATION_MS;
  }
  return Math.min(MAX_TOAST_DURATION_MS, Math.max(MIN_TOAST_DURATION_MS, Math.round(durationMs)));
}

/**
 * Adds a toast to the active queue with deduplication (identical variant + title + message
 * refreshes the toast at the bottom of the stack instead of stacking duplicates) and
 * enforces a bounded maximum visible count.
 */
export function enqueueToast(
  current: ToastItem[],
  input: ToastInput,
  options?: { maxVisible?: number; now?: number }
): ToastItem[] {
  const maxVisible = Math.max(1, options?.maxVisible ?? DEFAULT_MAX_VISIBLE_TOASTS);
  const now = options?.now ?? Date.now();
  const title = input.title.trim();
  const message = input.message.trim();
  if (!title && !message) return current;

  const id =
    input.id || `toast-${now}-${Math.random().toString(36).slice(2, 7)}`;

  const nextToast: ToastItem = {
    id,
    variant: input.variant,
    title,
    message,
    durationMs: clampToastDuration(input.durationMs),
    actionLabel: input.actionLabel,
    onAction: input.onAction,
    createdAt: now,
  };

  // Deduplicate matching active notifications so repeated errors refresh cleanly
  const deduped = current.filter(
    (item) =>
      !(
        item.variant === nextToast.variant &&
        item.title === nextToast.title &&
        item.message === nextToast.message
      )
  );

  const combined = [...deduped, nextToast];
  if (combined.length > maxVisible) {
    return combined.slice(combined.length - maxVisible);
  }
  return combined;
}

export function dismissToast(current: ToastItem[], id: string): ToastItem[] {
  return current.filter((item) => item.id !== id);
}
