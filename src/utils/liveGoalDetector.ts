import type { PlatformMatch } from '../types/platform.ts';

export interface LiveScoreSnapshot {
  id: string;
  leagueSlug?: string;
  leagueShort: string;
  homeTeamId: string;
  homeTeamName: string;
  homeShort: string;
  homeLogo?: string;
  awayTeamId: string;
  awayTeamName: string;
  awayShort: string;
  awayLogo?: string;
  status: 'LIVE' | 'FINISHED' | 'UPCOMING';
  minute: string;
  homeScore: number | null;
  awayScore: number | null;
  homeYellowCards: number;
  awayYellowCards: number;
  homeRedCards: number;
  awayRedCards: number;
  lastGoalScorer?: string;
  lastGoalMinute?: string;
  lastGoalSide?: 'home' | 'away';
  lastGoalIsPenalty?: boolean;
  lastGoalIsOwnGoal?: boolean;
}

export interface LiveScorePatch {
  id: string;
  status: 'LIVE' | 'FINISHED' | 'UPCOMING';
  minute: string;
  homeScore: number | null;
  awayScore: number | null;
  homeYellowCards: number;
  awayYellowCards: number;
  homeRedCards: number;
  awayRedCards: number;
}

export interface LiveGoalEvent {
  eventId: string;
  matchId: string;
  leagueShort: string;
  scoringSide: 'home' | 'away';
  scoringTeamName: string;
  scorerName?: string;
  isPenalty?: boolean;
  isOwnGoal?: boolean;
  minute: string;
  homeTeamName: string;
  awayTeamName: string;
  homeShort: string;
  awayShort: string;
  homeLogo?: string;
  awayLogo?: string;
  homeScore: number;
  awayScore: number;
  prevHomeScore: number;
  prevAwayScore: number;
  timestamp: string;
}

export interface LiveRedCardEvent {
  eventId: string;
  matchId: string;
  leagueShort: string;
  side: 'home' | 'away';
  teamName: string;
  minute: string;
  homeTeamName: string;
  awayTeamName: string;
  timestamp: string;
}

export interface LiveStatusChangeEvent {
  eventId: string;
  matchId: string;
  leagueShort: string;
  homeTeamName: string;
  awayTeamName: string;
  prevStatus: 'LIVE' | 'FINISHED' | 'UPCOMING';
  nextStatus: 'LIVE' | 'FINISHED' | 'UPCOMING';
  homeScore: number | null;
  awayScore: number | null;
  timestamp: string;
}

export interface LiveDiffResult {
  patches: LiveScorePatch[];
  goals: LiveGoalEvent[];
  redCards: LiveRedCardEvent[];
  statusChanges: LiveStatusChangeEvent[];
}

export function snapshotToPatch(snap: LiveScoreSnapshot): LiveScorePatch {
  return {
    id: snap.id,
    status: snap.status,
    minute: snap.minute,
    homeScore: snap.homeScore,
    awayScore: snap.awayScore,
    homeYellowCards: snap.homeYellowCards,
    awayYellowCards: snap.awayYellowCards,
    homeRedCards: snap.homeRedCards,
    awayRedCards: snap.awayRedCards,
  };
}

/**
 * Pure, deterministic diff between previous authoritative live snapshots and newly fetched snapshots.
 * Never fires false goal events on cold start (when previousMap does not yet contain a match).
 */
export function detectLiveMatchChanges(
  previousMap: ReadonlyMap<string, LiveScoreSnapshot>,
  nextSnapshots: readonly LiveScoreSnapshot[],
  nowIso: string = new Date().toISOString()
): LiveDiffResult {
  const patches: LiveScorePatch[] = [];
  const goals: LiveGoalEvent[] = [];
  const redCards: LiveRedCardEvent[] = [];
  const statusChanges: LiveStatusChangeEvent[] = [];

  for (const next of nextSnapshots) {
    const prev = previousMap.get(next.id);
    if (!prev) {
      // Cold start for this match ID: record baseline without firing spurious goal alerts
      continue;
    }

    const changed =
      prev.status !== next.status ||
      prev.minute !== next.minute ||
      prev.homeScore !== next.homeScore ||
      prev.awayScore !== next.awayScore ||
      prev.homeYellowCards !== next.homeYellowCards ||
      prev.awayYellowCards !== next.awayYellowCards ||
      prev.homeRedCards !== next.homeRedCards ||
      prev.awayRedCards !== next.awayRedCards;

    if (!changed) continue;

    patches.push(snapshotToPatch(next));

    // Detect goal increase (home or away) on active/just-finished matches
    const prevH = prev.homeScore ?? 0;
    const prevA = prev.awayScore ?? 0;
    const nextH = next.homeScore ?? 0;
    const nextA = next.awayScore ?? 0;

    if (
      next.homeScore !== null &&
      next.awayScore !== null &&
      (next.status === 'LIVE' || next.status === 'FINISHED') &&
      (prev.status === 'LIVE' || prev.status === 'UPCOMING')
    ) {
      if (nextH > prevH) {
        goals.push({
          eventId: `goal:${next.id}:H:${nextH}-${nextA}`,
          matchId: next.id,
          leagueShort: next.leagueShort,
          scoringSide: 'home',
          scoringTeamName: next.homeTeamName,
          scorerName: next.lastGoalSide === 'home' ? next.lastGoalScorer : undefined,
          isPenalty: next.lastGoalSide === 'home' ? next.lastGoalIsPenalty : undefined,
          isOwnGoal: next.lastGoalSide === 'home' ? next.lastGoalIsOwnGoal : undefined,
          minute: next.lastGoalSide === 'home' && next.lastGoalMinute ? next.lastGoalMinute : next.minute,
          homeTeamName: next.homeTeamName,
          awayTeamName: next.awayTeamName,
          homeShort: next.homeShort,
          awayShort: next.awayShort,
          homeLogo: next.homeLogo,
          awayLogo: next.awayLogo,
          homeScore: nextH,
          awayScore: nextA,
          prevHomeScore: prevH,
          prevAwayScore: prevA,
          timestamp: nowIso,
        });
      }
      if (nextA > prevA) {
        goals.push({
          eventId: `goal:${next.id}:A:${nextH}-${nextA}`,
          matchId: next.id,
          leagueShort: next.leagueShort,
          scoringSide: 'away',
          scoringTeamName: next.awayTeamName,
          scorerName: next.lastGoalSide === 'away' ? next.lastGoalScorer : undefined,
          isPenalty: next.lastGoalSide === 'away' ? next.lastGoalIsPenalty : undefined,
          isOwnGoal: next.lastGoalSide === 'away' ? next.lastGoalIsOwnGoal : undefined,
          minute: next.lastGoalSide === 'away' && next.lastGoalMinute ? next.lastGoalMinute : next.minute,
          homeTeamName: next.homeTeamName,
          awayTeamName: next.awayTeamName,
          homeShort: next.homeShort,
          awayShort: next.awayShort,
          homeLogo: next.homeLogo,
          awayLogo: next.awayLogo,
          homeScore: nextH,
          awayScore: nextA,
          prevHomeScore: prevH,
          prevAwayScore: prevA,
          timestamp: nowIso,
        });
      }
    }

    // Detect red cards
    if (next.homeRedCards > prev.homeRedCards) {
      redCards.push({
        eventId: `red:${next.id}:H:${next.homeRedCards}`,
        matchId: next.id,
        leagueShort: next.leagueShort,
        side: 'home',
        teamName: next.homeTeamName,
        minute: next.minute,
        homeTeamName: next.homeTeamName,
        awayTeamName: next.awayTeamName,
        timestamp: nowIso,
      });
    }
    if (next.awayRedCards > prev.awayRedCards) {
      redCards.push({
        eventId: `red:${next.id}:A:${next.awayRedCards}`,
        matchId: next.id,
        leagueShort: next.leagueShort,
        side: 'away',
        teamName: next.awayTeamName,
        minute: next.minute,
        homeTeamName: next.homeTeamName,
        awayTeamName: next.awayTeamName,
        timestamp: nowIso,
      });
    }

    // Detect kickoff / full-time transitions
    if (prev.status !== next.status) {
      statusChanges.push({
        eventId: `status:${next.id}:${prev.status}->${next.status}`,
        matchId: next.id,
        leagueShort: next.leagueShort,
        homeTeamName: next.homeTeamName,
        awayTeamName: next.awayTeamName,
        prevStatus: prev.status,
        nextStatus: next.status,
        homeScore: next.homeScore,
        awayScore: next.awayScore,
        timestamp: nowIso,
      });
    }
  }

  return { patches, goals, redCards, statusChanges };
}

/**
 * Idempotently merges compact live delta patches into the frontend PlatformMatch[] array
 * while preserving sort/filter stability and avoiding unnecessary object churn.
 */
export function mergeLiveScorePatches(
  matches: readonly PlatformMatch[],
  patches: readonly LiveScorePatch[]
): PlatformMatch[] {
  if (patches.length === 0 || matches.length === 0) return matches as PlatformMatch[];

  const patchById = new Map<string, LiveScorePatch>();
  for (const p of patches) {
    patchById.set(p.id, p);
  }

  let anyChanged = false;
  const next = matches.map((m) => {
    const patch = patchById.get(m.id);
    if (!patch) return m;
    const same =
      m.status === patch.status &&
      m.minute === patch.minute &&
      m.homeScore === patch.homeScore &&
      m.awayScore === patch.awayScore &&
      m.homeYellowCards === patch.homeYellowCards &&
      m.awayYellowCards === patch.awayYellowCards &&
      m.homeRedCards === patch.homeRedCards &&
      m.awayRedCards === patch.awayRedCards;
    if (same) return m;
    anyChanged = true;
    return {
      ...m,
      status: patch.status,
      minute: patch.minute,
      homeScore: patch.homeScore,
      awayScore: patch.awayScore,
      homeYellowCards: patch.homeYellowCards,
      awayYellowCards: patch.awayYellowCards,
      homeRedCards: patch.homeRedCards,
      awayRedCards: patch.awayRedCards,
    };
  });

  return anyChanged ? next : (matches as PlatformMatch[]);
}

export function formatGoalAlertText(goal: LiveGoalEvent): string {
  const tag = goal.isPenalty ? ' (P)' : goal.isOwnGoal ? ' (AQ)' : '';
  const scorerPart = goal.scorerName ? ` — ${goal.scorerName}${tag}` : tag;
  return `QOL! ${goal.minute} · ${goal.scoringTeamName}${scorerPart} · ${goal.homeShort} ${goal.homeScore}-${goal.awayScore} ${goal.awayShort}`;
}
