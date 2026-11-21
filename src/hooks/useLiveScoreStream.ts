import { useCallback, useEffect, useRef, useState } from 'react';
import {
  formatGoalAlertText,
  type LiveGoalEvent,
  type LiveRedCardEvent,
  type LiveScorePatch,
  type LiveStatusChangeEvent,
} from '../utils/liveGoalDetector';

export interface RecentGoalFlash {
  side: 'home' | 'away';
  minute: string;
  scorerName?: string;
  expiresAt: number;
}

interface UseLiveScoreStreamOptions {
  enabled: boolean;
  soundEnabled: boolean;
  browserNotifyEnabled: boolean;
  favoriteTeams: string[];
  onPatches: (patches: LiveScorePatch[]) => void;
  onStatusChange?: (ev: LiveStatusChangeEvent) => void;
  onRedCard?: (ev: LiveRedCardEvent) => void;
}

function playGoalChime(): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Crisp two-tone stadium chime (E5 -> B5)
    const tones = [
      { freq: 659.25, start: 0, dur: 0.14 },
      { freq: 987.77, start: 0.14, dur: 0.28 },
    ];
    for (const t of tones) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(t.freq, now + t.start);
      gain.gain.setValueAtTime(0.001, now + t.start);
      gain.gain.exponentialRampToValueAtTime(0.14, now + t.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t.start + t.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + t.start);
      osc.stop(now + t.start + t.dur + 0.02);
    }
    window.setTimeout(() => {
      void ctx.close().catch(() => {});
    }, 650);
  } catch {
    // Ignore autoplay/audio restrictions
  }
}

export function useLiveScoreStream(options: UseLiveScoreStreamOptions) {
  const {
    enabled,
    soundEnabled,
    browserNotifyEnabled,
    favoriteTeams,
    onPatches,
    onStatusChange,
    onRedCard,
  } = options;

  const [streamConnected, setStreamConnected] = useState(false);
  const [lastSyncIso, setLastSyncIso] = useState<string | null>(null);
  const [activeGoalAlerts, setActiveGoalAlerts] = useState<LiveGoalEvent[]>([]);
  const [recentGoalFlashes, setRecentGoalFlashes] = useState<Record<string, RecentGoalFlash>>({});

  const onPatchesRef = useRef(onPatches);
  const onStatusChangeRef = useRef(onStatusChange);
  const onRedCardRef = useRef(onRedCard);
  const soundEnabledRef = useRef(soundEnabled);
  const browserNotifyRef = useRef(browserNotifyEnabled);
  const favoriteTeamsRef = useRef(favoriteTeams);
  const seenEventIdsRef = useRef<Set<string>>(new Set());

  onPatchesRef.current = onPatches;
  onStatusChangeRef.current = onStatusChange;
  onRedCardRef.current = onRedCard;
  soundEnabledRef.current = soundEnabled;
  browserNotifyRef.current = browserNotifyEnabled;
  favoriteTeamsRef.current = favoriteTeams;

  const dismissGoalAlert = useCallback((eventId: string) => {
    setActiveGoalAlerts((prev) => prev.filter((g) => g.eventId !== eventId));
  }, []);

  // Expire 15-second goal flashes automatically
  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now();
      setRecentGoalFlashes((prev) => {
        let changed = false;
        const next: Record<string, RecentGoalFlash> = {};
        for (const [k, v] of Object.entries(prev)) {
          if (v.expiresAt > now) next[k] = v;
          else changed = true;
        }
        return changed ? next : prev;
      });
    }, 2000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setStreamConnected(false);
      return;
    }

    let closed = false;
    let es: EventSource | null = null;
    let retryTimer: number | null = null;

    const connect = () => {
      if (closed) return;
      es = new EventSource('/api/platform/live-stream');

      es.addEventListener('connected', (evt) => {
        setStreamConnected(true);
        try {
          const data = JSON.parse((evt as MessageEvent).data) as {
            patches?: LiveScorePatch[];
            polledAt?: string;
          };
          if (data.polledAt) setLastSyncIso(data.polledAt);
          if (Array.isArray(data.patches) && data.patches.length > 0) {
            onPatchesRef.current(data.patches);
          }
        } catch {
          // ignore malformed payload
        }
      });

      es.addEventListener('score_delta', (evt) => {
        setStreamConnected(true);
        try {
          const data = JSON.parse((evt as MessageEvent).data) as {
            patches?: LiveScorePatch[];
            polledAt?: string;
          };
          if (data.polledAt) setLastSyncIso(data.polledAt);
          if (Array.isArray(data.patches) && data.patches.length > 0) {
            onPatchesRef.current(data.patches);
          }
        } catch {
          // ignore
        }
      });

      es.addEventListener('sync', (evt) => {
        setStreamConnected(true);
        try {
          const data = JSON.parse((evt as MessageEvent).data) as { polledAt?: string };
          if (data.polledAt) setLastSyncIso(data.polledAt);
        } catch {
          // ignore
        }
      });

      es.addEventListener('goal', (evt) => {
        try {
          const goal = JSON.parse((evt as MessageEvent).data) as LiveGoalEvent;
          if (!goal?.eventId || seenEventIdsRef.current.has(goal.eventId)) return;
          seenEventIdsRef.current.add(goal.eventId);

          setRecentGoalFlashes((prev) => ({
            ...prev,
            [goal.matchId]: {
              side: goal.scoringSide,
              minute: goal.minute,
              scorerName: goal.scorerName,
              expiresAt: Date.now() + 16_000,
            },
          }));

          setActiveGoalAlerts((prev) => [goal, ...prev].slice(0, 3));
          window.setTimeout(() => {
            setActiveGoalAlerts((prev) => prev.filter((g) => g.eventId !== goal.eventId));
          }, 14_000);

          if (soundEnabledRef.current) {
            playGoalChime();
          }

          if (
            browserNotifyRef.current &&
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            const favSet = new Set(favoriteTeamsRef.current);
            const isFavMatch =
              favSet.size === 0 ||
              favSet.has(goal.homeShort) ||
              favSet.has(goal.awayShort) ||
              favSet.has(goal.matchId);
            if (isFavMatch) {
              try {
                new Notification(`QOL! ${goal.homeShort} ${goal.homeScore}-${goal.awayScore} ${goal.awayShort}`, {
                  body: formatGoalAlertText(goal),
                });
              } catch {
                // ignore notification errors in sandboxed iframes
              }
            }
          }
        } catch {
          // ignore
        }
      });

      es.addEventListener('red_card', (evt) => {
        try {
          const rc = JSON.parse((evt as MessageEvent).data) as LiveRedCardEvent;
          if (!rc?.eventId || seenEventIdsRef.current.has(rc.eventId)) return;
          seenEventIdsRef.current.add(rc.eventId);
          onRedCardRef.current?.(rc);
        } catch {
          // ignore
        }
      });

      es.addEventListener('status_change', (evt) => {
        try {
          const sc = JSON.parse((evt as MessageEvent).data) as LiveStatusChangeEvent;
          if (!sc?.eventId || seenEventIdsRef.current.has(sc.eventId)) return;
          seenEventIdsRef.current.add(sc.eventId);
          onStatusChangeRef.current?.(sc);
        } catch {
          // ignore
        }
      });

      es.onerror = () => {
        setStreamConnected(false);
        es?.close();
        es = null;
        if (!closed) {
          retryTimer = window.setTimeout(connect, 3500);
        }
      };
    };

    connect();

    return () => {
      closed = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      es?.close();
    };
  }, [enabled]);

  return {
    streamConnected,
    lastSyncIso,
    activeGoalAlerts,
    recentGoalFlashes,
    dismissGoalAlert,
  };
}
