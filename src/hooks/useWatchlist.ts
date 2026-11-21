import { useCallback, useEffect, useState } from 'react';
import type { WatchlistEntry } from '../types/football';

const STORAGE_KEY = 'matchedge_watchlist_v1';

function readStoredWatchlist(): WatchlistEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is WatchlistEntry =>
        typeof item === 'object' && item !== null && typeof item.matchId === 'string'
    );
  } catch {
    return [];
  }
}

export function useWatchlist() {
  const [entries, setEntries] = useState<WatchlistEntry[]>(() => {
    if (typeof window === 'undefined') return [];
    return readStoredWatchlist();
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [entries]);

  const isSaved = useCallback(
    (matchId: string) => entries.some((e) => e.matchId === matchId),
    [entries]
  );

  const toggleWatchlist = useCallback(
    (
      matchId: string,
      savedPick?: WatchlistEntry['savedPick']
    ) => {
      setEntries((prev) => {
        const exists = prev.some((e) => e.matchId === matchId);
        if (exists) {
          return prev.filter((e) => e.matchId !== matchId);
        }
        const next: WatchlistEntry = {
          matchId,
          addedAt: new Date().toISOString(),
          savedPick,
        };
        return [next, ...prev];
      });
    },
    []
  );

  const removeEntry = useCallback((matchId: string) => {
    setEntries((prev) => prev.filter((e) => e.matchId !== matchId));
  }, []);

  const clearWatchlist = useCallback(() => {
    setEntries([]);
  }, []);

  return {
    entries,
    isSaved,
    toggleWatchlist,
    removeEntry,
    clearWatchlist,
  };
}
