import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  MatchWithPrediction,
  WatchlistAlertItem,
  WatchlistEntry,
} from '../types/football';

const NOTIF_PREF_KEY = 'matchedge_watchlist_notif_v1';

interface TrackedState {
  status: MatchWithPrediction['status'];
  homeGoals: number;
  awayGoals: number;
  homeWinProb: number;
}

export interface WatchlistNotifPayload {
  matchId: string;
  title: string;
  body: string;
  kind: WatchlistAlertItem['kind'];
}

export function useWatchlistNotifications(params: {
  entries: WatchlistEntry[];
  matches: MatchWithPrediction[];
  onInAppAlert: (alert: WatchlistNotifPayload) => void;
  labels: {
    matchLiveTitle: string;
    goalTitle: string;
    probShiftTitle: string;
    nowLiveSuffix: string;
    probMovedPrefix: string;
  };
}) {
  const { entries, matches, onInAppAlert, labels } = params;

  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      const saved = window.localStorage.getItem(NOTIF_PREF_KEY);
      return saved === null ? true : saved === '1';
    } catch {
      return true;
    }
  });

  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return window.Notification.permission;
    }
    return 'denied';
  });

  const [alerts, setAlerts] = useState<WatchlistAlertItem[]>([]);
  const prevMapRef = useRef<Map<string, TrackedState>>(new Map());

  useEffect(() => {
    try {
      window.localStorage.setItem(NOTIF_PREF_KEY, enabled ? '1' : '0');
    } catch {
      // ignore
    }
  }, [enabled]);

  const requestBrowserPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const result = await window.Notification.requestPermission();
      setBrowserPermission(result);
      if (result === 'granted') {
        setEnabled(true);
      }
      return result;
    } catch {
      return browserPermission;
    }
  }, [browserPermission]);

  const sendBrowserNotification = useCallback(
    (title: string, body: string) => {
      if (
        !enabled ||
        typeof window === 'undefined' ||
        !('Notification' in window) ||
        window.Notification.permission !== 'granted'
      ) {
        return;
      }
      try {
        new window.Notification(title, {
          body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
        });
      } catch {
        // Ignore browser notification errors in restricted iframes
      }
    },
    [enabled]
  );

  const emitAlert = useCallback(
    (payload: WatchlistNotifPayload) => {
      const item: WatchlistAlertItem = {
        id: `${payload.matchId}-${payload.kind}-${Date.now()}`,
        matchId: payload.matchId,
        title: payload.title,
        body: payload.body,
        timestamp: new Date().toISOString(),
        kind: payload.kind,
      };
      setAlerts((prev) => [item, ...prev].slice(0, 20));
      onInAppAlert(payload);
      sendBrowserNotification(payload.title, payload.body);
    },
    [onInAppAlert, sendBrowserNotification]
  );

  useEffect(() => {
    if (!enabled || entries.length === 0 || matches.length === 0) return;

    const watchedIds = new Set(entries.map((e) => e.matchId));
    const prevMap = prevMapRef.current;

    for (const match of matches) {
      if (!watchedIds.has(match.id)) continue;
      const curState: TrackedState = {
        status: match.status,
        homeGoals: match.score?.home ?? 0,
        awayGoals: match.score?.away ?? 0,
        homeWinProb: match.prediction.homeWinProb,
      };

      const prev = prevMap.get(match.id);
      if (prev) {
        const matchName = `${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`;

        if (prev.status !== 'live' && curState.status === 'live') {
          emitAlert({
            matchId: match.id,
            title: labels.matchLiveTitle,
            body: `${matchName} — ${labels.nowLiveSuffix}`,
            kind: 'live_start',
          });
        } else if (
          curState.status === 'live' &&
          (curState.homeGoals !== prev.homeGoals || curState.awayGoals !== prev.awayGoals)
        ) {
          emitAlert({
            matchId: match.id,
            title: labels.goalTitle,
            body: `${match.homeTeam.shortName} ${curState.homeGoals} – ${curState.awayGoals} ${match.awayTeam.shortName} (${match.minute ?? 0}')`,
            kind: 'goal',
          });
        } else {
          const deltaPct = (curState.homeWinProb - prev.homeWinProb) * 100;
          if (Math.abs(deltaPct) >= 5) {
            const sign = deltaPct > 0 ? '+' : '';
            emitAlert({
              matchId: match.id,
              title: labels.probShiftTitle,
              body: `${matchName} · ${labels.probMovedPrefix} ${sign}${deltaPct.toFixed(1)}%`,
              kind: 'prob_shift',
            });
          }
        }
      }

      prevMap.set(match.id, curState);
    }
  }, [entries, matches, enabled, emitAlert, labels]);

  const sendTestAlert = useCallback(
    (sampleTitle: string, sampleBody: string) => {
      emitAlert({
        matchId: entries[0]?.matchId ?? 'watchlist-test',
        title: sampleTitle,
        body: sampleBody,
        kind: 'prob_shift',
      });
    },
    [emitAlert, entries]
  );

  const clearAlerts = useCallback(() => setAlerts([]), []);

  return {
    enabled,
    setEnabled,
    browserPermission,
    browserSupported: typeof window !== 'undefined' && 'Notification' in window,
    requestBrowserPermission,
    alerts,
    clearAlerts,
    sendTestAlert,
  };
}
