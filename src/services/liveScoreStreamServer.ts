import type express from 'express';
import {
  detectLiveMatchChanges,
  snapshotToPatch,
  type LiveGoalEvent,
  type LiveRedCardEvent,
  type LiveScorePatch,
  type LiveScoreSnapshot,
  type LiveStatusChangeEvent,
} from '../utils/liveGoalDetector.ts';

interface EspnFastDetail {
  type?: { text?: string };
  clock?: { displayValue?: string; value?: number };
  team?: { id?: string };
  scoringPlay?: boolean;
  redCard?: boolean;
  yellowCard?: boolean;
  penaltyKick?: boolean;
  ownGoal?: boolean;
  athletesInvolved?: Array<{ displayName?: string; shortName?: string }>;
}

interface EspnFastCompetitor {
  homeAway?: 'home' | 'away';
  score?: string;
  team?: {
    id?: string;
    displayName?: string;
    shortDisplayName?: string;
    abbreviation?: string;
    logo?: string;
  };
}

interface EspnFastEvent {
  id?: string;
  date?: string;
  season?: { slug?: string };
  status?: {
    displayClock?: string;
    clock?: number;
    type?: { state?: 'pre' | 'in' | 'post'; shortDetail?: string; description?: string };
  };
  competitions?: Array<{
    competitors?: EspnFastCompetitor[];
    details?: EspnFastDetail[];
  }>;
}

interface EspnFastScoreboard {
  leagues?: Array<{ slug?: string; name?: string; abbreviation?: string }>;
  events?: EspnFastEvent[];
}

// High-priority soccer leagues polled directly in parallel alongside `all` so no top European/UEFA goal is missed
const FAST_LIVE_SLUGS = [
  'all',
  'eng.1',
  'esp.1',
  'ita.1',
  'ger.1',
  'fra.1',
  'tur.1',
  'uefa.champions',
  'uefa.europa',
] as const;

const ACTIVE_LIVE_INTERVAL_MS = 8_000;
const IDLE_LIVE_INTERVAL_MS = 25_000;
const HEARTBEAT_INTERVAL_MS = 20_000;

const sseClients = new Set<express.Response>();
const snapshotById = new Map<string, LiveScoreSnapshot>();
const recentGoals: LiveGoalEvent[] = [];

let pollTimer: ReturnType<typeof setTimeout> | null = null;
let pollInFlight = false;
let lastPollIso = new Date().toISOString();
let lastActiveLiveCount = 0;

function formatTodayEspnDate(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

function shortenLeague(raw: string): string {
  const n = raw.toLowerCase();
  if (n.includes('champions league')) return 'Çempionlar Liqası';
  if (n.includes('europa league')) return 'Avropa Liqası';
  if (n.includes('conference')) return 'Konfrans Liqası';
  if (n.includes('premier league') && !n.includes('russian') && !n.includes('scottish')) return 'Premyer Liqa';
  if (n.includes('la liga') || n.includes('laliga')) return 'La Liqa';
  if (n.includes('serie a')) return 'Seriya A';
  if (n.includes('bundesliga')) return 'Bundesliqa';
  if (n.includes('ligue 1')) return 'Liqa 1';
  if (n.includes('süper lig') || n.includes('super lig')) return 'Türkiyə Super Liqası';
  return raw.slice(0, 26);
}

function parseEspnClock(ev: EspnFastEvent, status: 'LIVE' | 'FINISHED' | 'UPCOMING'): string {
  if (status === 'FINISHED') return 'BİTDİ';
  if (status === 'UPCOMING') {
    const d = new Date(ev.date || '');
    if (Number.isNaN(d.getTime())) return '--:--';
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  }
  const shortDetail = (ev.status?.type?.shortDetail || '').trim();
  if (shortDetail === 'HT' || shortDetail.toLowerCase().includes('half')) return 'HT';
  const displayClock = (ev.status?.displayClock || '').trim();
  if (displayClock) {
    return displayClock.endsWith("'") ? displayClock : `${displayClock}'`;
  }
  if (shortDetail) return shortDetail;
  return 'CANLI';
}

function parseScoreboardEvents(json: EspnFastScoreboard, fallbackSlug: string): LiveScoreSnapshot[] {
  const leagueName = json.leagues?.[0]?.name || fallbackSlug;
  const leagueSlug = json.leagues?.[0]?.slug || fallbackSlug;
  const leagueShort = shortenLeague(leagueName);
  const out: LiveScoreSnapshot[] = [];

  for (const ev of json.events ?? []) {
    if (!ev.id) continue;
    const comp = ev.competitions?.[0];
    const competitors = comp?.competitors ?? [];
    const home = competitors.find((c) => c.homeAway === 'home') ?? competitors[0];
    const away = competitors.find((c) => c.homeAway === 'away') ?? competitors[1];
    if (!home?.team || !away?.team) continue;

    const state = ev.status?.type?.state;
    const status: 'LIVE' | 'FINISHED' | 'UPCOMING' =
      state === 'in' ? 'LIVE' : state === 'post' ? 'FINISHED' : 'UPCOMING';

    const homeId = String(home.team.id || '');
    const awayId = String(away.team.id || '');
    const homeScoreNum =
      status === 'UPCOMING' ? null : Number.isFinite(Number(home.score)) ? Number(home.score) : 0;
    const awayScoreNum =
      status === 'UPCOMING' ? null : Number.isFinite(Number(away.score)) ? Number(away.score) : 0;

    let homeYellowCards = 0;
    let awayYellowCards = 0;
    let homeRedCards = 0;
    let awayRedCards = 0;
    let lastGoalScorer: string | undefined;
    let lastGoalMinute: string | undefined;
    let lastGoalSide: 'home' | 'away' | undefined;
    let lastGoalIsPenalty = false;
    let lastGoalIsOwnGoal = false;

    const details = comp?.details ?? [];
    for (const d of details) {
      const tid = String(d.team?.id || '');
      const side: 'home' | 'away' | null =
        tid && tid === homeId ? 'home' : tid && tid === awayId ? 'away' : null;
      if (d.yellowCard && side) {
        if (side === 'home') homeYellowCards += 1;
        else awayYellowCards += 1;
      }
      if (d.redCard && side) {
        if (side === 'home') homeRedCards += 1;
        else awayRedCards += 1;
      }
      if (d.scoringPlay && side) {
        lastGoalSide = side;
        lastGoalMinute = d.clock?.displayValue || undefined;
        const athlete = d.athletesInvolved?.[0];
        lastGoalScorer = athlete?.shortName || athlete?.displayName || undefined;
        lastGoalIsPenalty = Boolean(d.penaltyKick);
        lastGoalIsOwnGoal = Boolean(d.ownGoal);
      }
    }

    const homeName = home.team.displayName || home.team.shortDisplayName || 'Ev';
    const awayName = away.team.displayName || away.team.shortDisplayName || 'Qonaq';
    const homeShort = (home.team.abbreviation || homeName.slice(0, 3)).toUpperCase();
    const awayShort = (away.team.abbreviation || awayName.slice(0, 3)).toUpperCase();

    out.push({
      id: `espn-${ev.id}`,
      leagueSlug,
      leagueShort,
      homeTeamId: homeId,
      homeTeamName: homeName,
      homeShort,
      homeLogo:
        home.team.logo ||
        (/^\d+$/.test(homeId) ? `https://a.espncdn.com/i/teamlogos/soccer/500/${homeId}.png` : undefined),
      awayTeamId: awayId,
      awayTeamName: awayName,
      awayShort,
      awayLogo:
        away.team.logo ||
        (/^\d+$/.test(awayId) ? `https://a.espncdn.com/i/teamlogos/soccer/500/${awayId}.png` : undefined),
      status,
      minute: parseEspnClock(ev, status),
      homeScore: homeScoreNum,
      awayScore: awayScoreNum,
      homeYellowCards,
      awayYellowCards,
      homeRedCards,
      awayRedCards,
      lastGoalScorer,
      lastGoalMinute,
      lastGoalSide,
      lastGoalIsPenalty,
      lastGoalIsOwnGoal,
    });
  }

  return out;
}

function sendSseEvent(res: express.Response, eventName: string, payload: unknown): void {
  if (res.writableEnded || res.destroyed) return;
  try {
    res.write(`event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`);
  } catch {
    sseClients.delete(res);
  }
}

function broadcastSseEvent(eventName: string, payload: unknown): void {
  for (const client of sseClients) {
    sendSseEvent(client, eventName, payload);
  }
}

export async function pollLiveScoresOnce(): Promise<{
  liveCount: number;
  patches: LiveScorePatch[];
  goals: LiveGoalEvent[];
  redCards: LiveRedCardEvent[];
  statusChanges: LiveStatusChangeEvent[];
  polledAt: string;
}> {
  if (pollInFlight) {
    return {
      liveCount: lastActiveLiveCount,
      patches: [],
      goals: [],
      redCards: [],
      statusChanges: [],
      polledAt: lastPollIso,
    };
  }

  pollInFlight = true;
  try {
    const todayParam = formatTodayEspnDate();
    const settled = await Promise.allSettled(
      FAST_LIVE_SLUGS.map(async (slug) => {
        const limit = slug === 'all' ? 120 : 30;
        const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/scoreboard?dates=${todayParam}&limit=${limit}`;
        const res = await fetch(url, {
          headers: {
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
            'User-Agent': 'ArenaAzLiveStream/1.0',
          },
          cache: 'no-store',
          signal: AbortSignal.timeout(6500),
        });
        if (!res.ok) return [] as LiveScoreSnapshot[];
        const json = (await res.json()) as EspnFastScoreboard;
        return parseScoreboardEvents(json, slug);
      })
    );

    const deduped = new Map<string, LiveScoreSnapshot>();
    for (const r of settled) {
      if (r.status !== 'fulfilled') continue;
      for (const snap of r.value) {
        // Specific league slug overrides generic `all` so league name is accurate
        const existing = deduped.get(snap.id);
        if (!existing || existing.leagueSlug === 'all') {
          deduped.set(snap.id, snap);
        }
      }
    }

    const nextList = Array.from(deduped.values());
    const nowIso = new Date().toISOString();
    const diff = detectLiveMatchChanges(snapshotById, nextList, nowIso);

    // Update authoritative server snapshot
    for (const snap of nextList) {
      snapshotById.set(snap.id, snap);
    }

    lastPollIso = nowIso;
    lastActiveLiveCount = nextList.filter((s) => s.status === 'LIVE').length;

    // Push instant real-time events to every connected SSE client
    if (diff.patches.length > 0) {
      broadcastSseEvent('score_delta', {
        patches: diff.patches,
        liveCount: lastActiveLiveCount,
        polledAt: nowIso,
      });
    }

    for (const goal of diff.goals) {
      recentGoals.unshift(goal);
      if (recentGoals.length > 20) recentGoals.pop();
      broadcastSseEvent('goal', goal);
    }

    for (const red of diff.redCards) {
      broadcastSseEvent('red_card', red);
    }

    for (const sc of diff.statusChanges) {
      broadcastSseEvent('status_change', sc);
    }

    // Even if nothing changed, inform connected clients of fresh poll heartbeat so UI timestamp updates
    if (diff.patches.length === 0) {
      broadcastSseEvent('sync', {
        liveCount: lastActiveLiveCount,
        polledAt: nowIso,
      });
    }

    return {
      liveCount: lastActiveLiveCount,
      ...diff,
      polledAt: nowIso,
    };
  } finally {
    pollInFlight = false;
  }
}

function scheduleNextPoll(): void {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
  if (sseClients.size === 0) return;

  const delayMs = lastActiveLiveCount > 0 ? ACTIVE_LIVE_INTERVAL_MS : IDLE_LIVE_INTERVAL_MS;
  pollTimer = setTimeout(async () => {
    try {
      await pollLiveScoresOnce();
    } catch {
      // Keep polling loop resilient on transient upstream network hiccups
    }
    scheduleNextPoll();
  }, delayMs);
  pollTimer.unref?.();
}

export function getLatestLiveScorePatches(): LiveScorePatch[] {
  const out: LiveScorePatch[] = [];
  for (const snap of snapshotById.values()) {
    out.push(snapshotToPatch(snap));
  }
  return out;
}

export function getLiveStreamStats(): {
  connectedClients: number;
  trackedMatches: number;
  liveCount: number;
  lastPollIso: string;
  pollIntervalSec: number;
} {
  return {
    connectedClients: sseClients.size,
    trackedMatches: snapshotById.size,
    liveCount: lastActiveLiveCount,
    lastPollIso,
    pollIntervalSec: Math.round(
      (lastActiveLiveCount > 0 ? ACTIVE_LIVE_INTERVAL_MS : IDLE_LIVE_INTERVAL_MS) / 1000
    ),
  };
}

export function attachLiveScoreSseClient(req: express.Request, res: express.Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  sseClients.add(res);

  // Send immediate authoritative snapshot so client syncs on millisecond 0
  sendSseEvent(res, 'connected', {
    patches: getLatestLiveScorePatches(),
    recentGoals: recentGoals.slice(0, 5),
    liveCount: lastActiveLiveCount,
    polledAt: lastPollIso,
    pollIntervalSec: Math.round(
      (lastActiveLiveCount > 0 ? ACTIVE_LIVE_INTERVAL_MS : IDLE_LIVE_INTERVAL_MS) / 1000
    ),
  });

  // Trigger an immediate fresh poll on first subscriber or if last poll > 6s ago
  if (Date.now() - Date.parse(lastPollIso) > 6_000 || snapshotById.size === 0) {
    void pollLiveScoresOnce()
      .catch(() => {})
      .finally(() => scheduleNextPoll());
  } else if (!pollTimer) {
    scheduleNextPoll();
  }

  const heartbeat = setInterval(() => {
    if (res.writableEnded || res.destroyed) return;
    try {
      res.write(`: heartbeat ${Date.now()}\n\n`);
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, HEARTBEAT_INTERVAL_MS);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
    if (sseClients.size === 0 && pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
  });
}
