export type FormOutcome = 'W' | 'D' | 'L';
export type TableZone = 'ucl' | 'europa' | 'relegation' | 'mid';
export type MatchStatus = 'LIVE' | 'FINISHED' | 'UPCOMING';

export interface PortalFixture {
  id: string;
  leagueId: string;
  dateId: string;
  time: string;
  status: MatchStatus;
  minute: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  stadium: string;
  round: string;
}

export interface LeagueZoneConfig {
  uclSpots: number;
  europaSpots: number;
  relegationStart: number;
}

export interface CountdownParts {
  hours: string;
  minutes: string;
  seconds: string;
  totalSeconds: number;
}

export interface MatchEventItem {
  id: string;
  minute: number;
  team: 'home' | 'away';
  type: 'goal' | 'yellow' | 'red' | 'sub';
  player: string;
  assist?: string;
  detail: string;
}

export interface SimulatedGoalResult {
  homeScore: number;
  awayScore: number;
  minute: number;
  newEvent: MatchEventItem;
}

export function computeCountdownParts(totalSeconds: number): CountdownParts {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  return {
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
    totalSeconds: safe,
  };
}

export function filterFixtures(
  fixtures: PortalFixture[],
  leagueId: string,
  dateId: string
): PortalFixture[] {
  return fixtures.filter((item) => {
    const leagueOk = leagueId === 'all' || item.leagueId === leagueId;
    const dateOk = dateId === 'all' || item.dateId === dateId;
    return leagueOk && dateOk;
  });
}

export function getTableZone(position: number, config: LeagueZoneConfig): TableZone {
  if (position <= config.uclSpots) return 'ucl';
  if (position <= config.europaSpots) return 'europa';
  if (position >= config.relegationStart) return 'relegation';
  return 'mid';
}

export function formatGoalDifference(gf: number, ga: number): string {
  const diff = gf - ga;
  if (diff > 0) return `+${diff}`;
  return String(diff);
}

export function simulateGoalEvent(params: {
  homeScore: number;
  awayScore: number;
  minute: number;
  scoringSide: 'home' | 'away';
  scorerName: string;
  assistName?: string;
  eventSeq: number;
}): SimulatedGoalResult {
  const nextMinute = Math.min(90, Math.max(1, params.minute + 2));
  const nextHome = params.scoringSide === 'home' ? params.homeScore + 1 : params.homeScore;
  const nextAway = params.scoringSide === 'away' ? params.awayScore + 1 : params.awayScore;

  return {
    homeScore: nextHome,
    awayScore: nextAway,
    minute: nextMinute,
    newEvent: {
      id: `sim-goal-${params.eventSeq}`,
      minute: nextMinute,
      team: params.scoringSide,
      type: 'goal',
      player: params.scorerName,
      assist: params.assistName,
      detail: 'Canlı qol anı · Uzaq küncə dəqiq zərbə',
    },
  };
}

export function validateNewsletterEmail(raw: string): { valid: boolean; error?: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { valid: false, error: 'Zəhmət olmasa e-poçt ünvanınızı daxil edin.' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Düzgün e-poçt ünvanı daxil edin (məs: ad@mail.az).' };
  }
  return { valid: true };
}
