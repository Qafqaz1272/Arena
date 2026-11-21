import type {
  FormEntry,
  FormResult,
  HeadToHeadEntry,
  HistoricalPredictionRecord,
  LeagueInfo,
  LeagueStandings,
  MatchLiveStats,
  MatchRecord,
  MatchStatus,
  PerformanceSummary,
  StandingsRow,
  TeamProfile,
} from '../types/football.ts';
import { predictMatch } from '../engine/predictionEngine.ts';

interface LeagueConfig {
  slug: string;
  name: string;
  country: string;
  countryCode: string;
  region: string;
  baseElo: number;
  avgHomeGoals: number;
  avgAwayGoals: number;
  homeAdvantageFactor: number;
  hasStandings: boolean;
}

export const LIVE_LEAGUES: LeagueConfig[] = [
  {
    slug: 'eng.1',
    name: 'Premier League',
    country: 'England',
    countryCode: 'GB',
    region: 'Europe',
    baseElo: 1810,
    avgHomeGoals: 1.66,
    avgAwayGoals: 1.32,
    homeAdvantageFactor: 1.14,
    hasStandings: true,
  },
  {
    slug: 'esp.1',
    name: 'La Liga',
    country: 'Spain',
    countryCode: 'ES',
    region: 'Europe',
    baseElo: 1790,
    avgHomeGoals: 1.52,
    avgAwayGoals: 1.12,
    homeAdvantageFactor: 1.16,
    hasStandings: true,
  },
  {
    slug: 'ita.1',
    name: 'Serie A',
    country: 'Italy',
    countryCode: 'IT',
    region: 'Europe',
    baseElo: 1785,
    avgHomeGoals: 1.49,
    avgAwayGoals: 1.15,
    homeAdvantageFactor: 1.13,
    hasStandings: true,
  },
  {
    slug: 'ger.1',
    name: 'Bundesliga',
    country: 'Germany',
    countryCode: 'DE',
    region: 'Europe',
    baseElo: 1780,
    avgHomeGoals: 1.76,
    avgAwayGoals: 1.36,
    homeAdvantageFactor: 1.15,
    hasStandings: true,
  },
  {
    slug: 'fra.1',
    name: 'Ligue 1',
    country: 'France',
    countryCode: 'FR',
    region: 'Europe',
    baseElo: 1730,
    avgHomeGoals: 1.58,
    avgAwayGoals: 1.24,
    homeAdvantageFactor: 1.15,
    hasStandings: true,
  },
  {
    slug: 'tur.1',
    name: 'Süper Lig',
    country: 'Turkey',
    countryCode: 'TR',
    region: 'Europe',
    baseElo: 1650,
    avgHomeGoals: 1.64,
    avgAwayGoals: 1.21,
    homeAdvantageFactor: 1.18,
    hasStandings: true,
  },
  {
    slug: 'uefa.champions',
    name: 'UEFA Champions League',
    country: 'Europe',
    countryCode: 'EU',
    region: 'Europe',
    baseElo: 1840,
    avgHomeGoals: 1.72,
    avgAwayGoals: 1.34,
    homeAdvantageFactor: 1.14,
    hasStandings: true,
  },
  {
    slug: 'uefa.europa',
    name: 'UEFA Europa League',
    country: 'Europe',
    countryCode: 'EU',
    region: 'Europe',
    baseElo: 1730,
    avgHomeGoals: 1.65,
    avgAwayGoals: 1.28,
    homeAdvantageFactor: 1.14,
    hasStandings: false,
  },
  {
    slug: 'uefa.europa.conf',
    name: 'UEFA Conference League',
    country: 'Europe',
    countryCode: 'EU',
    region: 'Europe',
    baseElo: 1640,
    avgHomeGoals: 1.62,
    avgAwayGoals: 1.22,
    homeAdvantageFactor: 1.15,
    hasStandings: false,
  },
  {
    slug: 'ned.1',
    name: 'Eredivisie',
    country: 'Netherlands',
    countryCode: 'NL',
    region: 'Europe',
    baseElo: 1670,
    avgHomeGoals: 1.72,
    avgAwayGoals: 1.31,
    homeAdvantageFactor: 1.15,
    hasStandings: true,
  },
  {
    slug: 'por.1',
    name: 'Primeira Liga',
    country: 'Portugal',
    countryCode: 'PT',
    region: 'Europe',
    baseElo: 1675,
    avgHomeGoals: 1.54,
    avgAwayGoals: 1.15,
    homeAdvantageFactor: 1.16,
    hasStandings: true,
  },
  {
    slug: 'sco.1',
    name: 'Scottish Premiership',
    country: 'Scotland',
    countryCode: 'SC',
    region: 'Europe',
    baseElo: 1590,
    avgHomeGoals: 1.58,
    avgAwayGoals: 1.21,
    homeAdvantageFactor: 1.15,
    hasStandings: false,
  },
  {
    slug: 'bel.1',
    name: 'Belgian Pro League',
    country: 'Belgium',
    countryCode: 'BE',
    region: 'Europe',
    baseElo: 1645,
    avgHomeGoals: 1.61,
    avgAwayGoals: 1.24,
    homeAdvantageFactor: 1.14,
    hasStandings: false,
  },
  {
    slug: 'bra.1',
    name: 'Brasileirão Série A',
    country: 'Brazil',
    countryCode: 'BR',
    region: 'South America',
    baseElo: 1685,
    avgHomeGoals: 1.51,
    avgAwayGoals: 1.02,
    homeAdvantageFactor: 1.21,
    hasStandings: true,
  },
  {
    slug: 'usa.1',
    name: 'Major League Soccer',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    baseElo: 1615,
    avgHomeGoals: 1.72,
    avgAwayGoals: 1.24,
    homeAdvantageFactor: 1.19,
    hasStandings: true,
  },
  {
    slug: 'mex.1',
    name: 'Liga MX',
    country: 'Mexico',
    countryCode: 'MX',
    region: 'North America',
    baseElo: 1630,
    avgHomeGoals: 1.62,
    avgAwayGoals: 1.18,
    homeAdvantageFactor: 1.17,
    hasStandings: false,
  },
  {
    slug: 'arg.1',
    name: 'Liga Profesional',
    country: 'Argentina',
    countryCode: 'AR',
    region: 'South America',
    baseElo: 1650,
    avgHomeGoals: 1.38,
    avgAwayGoals: 0.96,
    homeAdvantageFactor: 1.2,
    hasStandings: false,
  },
  {
    slug: 'jpn.1',
    name: 'J1 League',
    country: 'Japan',
    countryCode: 'JP',
    region: 'Asia',
    baseElo: 1605,
    avgHomeGoals: 1.48,
    avgAwayGoals: 1.21,
    homeAdvantageFactor: 1.12,
    hasStandings: false,
  },
];

const LEAGUE_CONFIG_BY_SLUG = new Map(LIVE_LEAGUES.map((l) => [l.slug, l]));

interface EspnStat {
  name?: string;
  value?: number;
  displayValue?: string;
}

interface EspnStandingEntry {
  team?: {
    id?: string;
    displayName?: string;
    shortDisplayName?: string;
    abbreviation?: string;
  };
  stats?: EspnStat[];
}

interface EspnCompetitor {
  id?: string;
  homeAway?: 'home' | 'away';
  score?: string;
  form?: string;
  team?: {
    id?: string;
    displayName?: string;
    shortDisplayName?: string;
    abbreviation?: string;
  };
  records?: Array<{ name?: string; type?: string; summary?: string }>;
}

interface EspnEvent {
  id: string;
  date: string;
  name: string;
  shortName?: string;
  season?: { slug?: string; year?: number };
  status?: {
    displayClock?: string;
    type?: { state?: 'pre' | 'in' | 'post'; shortDetail?: string; description?: string };
  };
  competitions?: Array<{
    venue?: {
      fullName?: string;
      address?: { city?: string; country?: string };
    };
    competitors?: EspnCompetitor[];
  }>;
}

export interface TeamStandingLookup {
  leagueSlug: string;
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  elo: number;
  formTrend: number[];
}

export function normalizeTeamName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(fc|cf|sc|ac|fk|sk|afc|ssc|cd|ud|sd|rc|rcd|as|us|sv|vfl|vfb|tsg|rb|club|de|la|el|the)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function getDateOffsetYmd(offsetDays: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs: number = 9000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'MatchEdge/1.0',
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function readStat(stats: EspnStat[] | undefined, name: string, fallback: number = 0): number {
  if (!stats) return fallback;
  const found = stats.find((s) => s.name === name);
  if (found && typeof found.value === 'number' && Number.isFinite(found.value)) {
    return found.value;
  }
  return fallback;
}

function deriveEloFromRecord(
  baseElo: number,
  played: number,
  points: number,
  goalDiff: number
): number {
  if (played <= 0) return baseElo;
  const ppg = points / played;
  const gdPerGame = goalDiff / played;
  // Center around ~1.35 PPG and 0 GD/game
  const elo = baseElo + (ppg - 1.35) * 145 + gdPerGame * 48;
  return Math.round(Math.max(1320, Math.min(2040, elo)));
}

function parseFormString(formStr: string | undefined, referenceDate: string): FormEntry[] {
  if (!formStr) return [];
  // ESPN form strings list oldest->newest or newest->oldest; most recent 5 chars of W/D/L
  const chars = formStr
    .toUpperCase()
    .split('')
    .filter((c): c is FormResult => c === 'W' || c === 'D' || c === 'L');
  const recentFirst = [...chars].reverse();
  const ref = new Date(referenceDate);

  return recentFirst.map((result, idx) => {
    const d = new Date(ref);
    d.setUTCDate(d.getUTCDate() - (idx + 1) * 5);
    return {
      result,
      goalsFor: result === 'W' ? 2 : result === 'D' ? 1 : 0,
      goalsAgainst: result === 'W' ? 0 : result === 'D' ? 1 : 2,
      isHome: idx % 2 === 0,
      opponent: 'League Opponent',
      date: d.toISOString().slice(0, 10),
    };
  });
}

function buildFormTrendFromPpg(ppg: number, form: FormEntry[]): number[] {
  const base = Number.isFinite(ppg) ? ppg : 1.35;
  const pointsSeq = form.slice(0, 6).reverse();
  if (pointsSeq.length < 2) {
    return [
      Number(Math.max(0.4, base - 0.12).toFixed(2)),
      Number(Math.max(0.4, base - 0.05).toFixed(2)),
      Number(base.toFixed(2)),
      Number(Math.min(2.9, base + 0.04).toFixed(2)),
      Number(base.toFixed(2)),
    ];
  }
  let rolling = base;
  return pointsSeq.map((f) => {
    const pts = f.result === 'W' ? 3 : f.result === 'D' ? 1 : 0;
    rolling = rolling * 0.65 + pts * 0.35;
    return Number(rolling.toFixed(2));
  });
}

function parseMinute(displayClock: string | undefined): number | undefined {
  if (!displayClock) return undefined;
  const match = displayClock.match(/\d+/);
  if (!match) return undefined;
  return Number(match[0]);
}

function parseRecordSummary(summary: string | undefined): {
  wins: number;
  draws: number;
  losses: number;
} | null {
  if (!summary) return null;
  const parts = summary.split('-').map((n) => Number(n));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  // ESPN soccer record format is W-D-L (e.g. "7-0-3")
  return { wins: parts[0], draws: parts[1], losses: parts[2] };
}

function prettifySlugName(slug: string | undefined): string {
  if (!slug) return 'International Football';
  return slug
    .replace(/---/g, ' — ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function inferCountryFromVenueOrSlug(country: string | undefined, slug?: string): string {
  if (country && country.trim()) {
    if (country === 'USA') return 'United States';
    return country.trim();
  }
  if (slug && LEAGUE_CONFIG_BY_SLUG.has(slug)) {
    return LEAGUE_CONFIG_BY_SLUG.get(slug)!.country;
  }
  return 'International';
}

function buildTeamProfile(
  comp: EspnCompetitor,
  leagueId: string,
  country: string,
  baseElo: number,
  avgHomeGoals: number,
  avgAwayGoals: number,
  matchDateKey: string,
  standing?: TeamStandingLookup
): TeamProfile {
  const id = String(comp.team?.id || comp.id || 'unknown');
  const name = comp.team?.displayName || 'Unknown Club';
  const shortName = comp.team?.shortDisplayName || name;
  const code =
    comp.team?.abbreviation ||
    name
      .replace(/[^A-Za-z]/g, '')
      .slice(0, 3)
      .toUpperCase() ||
    'CLB';

  const parsedRec = parseRecordSummary(comp.records?.[0]?.summary);
  const formEntries = parseFormString(comp.form, matchDateKey);

  let played = standing?.played ?? 0;
  let wins = standing?.wins ?? 0;
  let draws = standing?.draws ?? 0;
  let losses = standing?.losses ?? 0;
  let goalsFor = standing?.goalsFor ?? 0;
  let goalsAgainst = standing?.goalsAgainst ?? 0;
  let points = standing?.points ?? 0;
  const position = standing?.position ?? 10;

  if (played === 0 && parsedRec) {
    wins = parsedRec.wins;
    draws = parsedRec.draws;
    losses = parsedRec.losses;
    played = wins + draws + losses;
    points = wins * 3 + draws;
    // Estimate goals from record & league averages when full table isn't available
    const winRatio = played > 0 ? (wins + draws * 0.5) / played : 0.5;
    goalsFor = Math.max(1, Math.round(played * ((avgHomeGoals + avgAwayGoals) / 2) * (0.75 + winRatio * 0.6)));
    goalsAgainst = Math.max(1, Math.round(played * ((avgHomeGoals + avgAwayGoals) / 2) * (1.35 - winRatio * 0.6)));
  } else if (played === 0 && formEntries.length > 0) {
    played = formEntries.length;
    wins = formEntries.filter((f) => f.result === 'W').length;
    draws = formEntries.filter((f) => f.result === 'D').length;
    losses = formEntries.filter((f) => f.result === 'L').length;
    points = wins * 3 + draws;
    goalsFor = formEntries.reduce((s, f) => s + f.goalsFor, 0);
    goalsAgainst = formEntries.reduce((s, f) => s + f.goalsAgainst, 0);
  } else if (played === 0) {
    played = 10;
    wins = 4;
    draws = 3;
    losses = 3;
    points = 15;
    goalsFor = Math.round(10 * ((avgHomeGoals + avgAwayGoals) / 2));
    goalsAgainst = goalsFor;
  }

  const elo =
    standing?.elo ?? deriveEloFromRecord(baseElo, played, points, goalsFor - goalsAgainst);

  const homePlayed = Math.max(1, Math.ceil(played / 2));
  const awayPlayed = Math.max(1, played - homePlayed);
  const homeWins = Math.min(homePlayed, Math.round(wins * 0.57));
  const awayWins = Math.max(0, wins - homeWins);
  const homeDraws = Math.min(homePlayed - homeWins, Math.ceil(draws * 0.5));
  const awayDraws = Math.max(0, draws - homeDraws);
  const homeLosses = Math.max(0, homePlayed - homeWins - homeDraws);
  const awayLosses = Math.max(0, awayPlayed - awayWins - awayDraws);

  const homeGF = Math.max(1, Math.round(goalsFor * 0.57));
  const awayGF = Math.max(1, goalsFor - homeGF);
  const homeGA = Math.max(1, Math.round(goalsAgainst * 0.43));
  const awayGA = Math.max(1, goalsAgainst - homeGA);

  const ppg = played > 0 ? points / played : 1.35;

  return {
    id,
    name,
    shortName,
    code,
    country,
    leagueId,
    elo,
    standingsPosition: position,
    points,
    played,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    homeSplit: {
      played: homePlayed,
      wins: homeWins,
      draws: homeDraws,
      losses: homeLosses,
      goalsFor: homeGF,
      goalsAgainst: homeGA,
    },
    awaySplit: {
      played: awayPlayed,
      wins: awayWins,
      draws: awayDraws,
      losses: awayLosses,
      goalsFor: awayGF,
      goalsAgainst: awayGA,
    },
    last10Form:
      formEntries.length > 0
        ? formEntries
        : [
            {
              result: wins >= losses ? 'W' : 'L',
              goalsFor: 1,
              goalsAgainst: 1,
              isHome: true,
              opponent: 'League Opponent',
              date: matchDateKey,
            },
          ],
    absences: [],
    formTrend: standing?.formTrend ?? buildFormTrendFromPpg(ppg, formEntries),
  };
}

function mapEspnEventToMatch(
  ev: EspnEvent,
  leagueCfg: LeagueConfig | null,
  fallbackLeagueName: string | undefined,
  standingsByTeam: Map<string, TeamStandingLookup>
): MatchRecord | null {
  const competition = ev.competitions?.[0];
  const competitors = competition?.competitors;
  if (!competitors || competitors.length < 2) return null;

  const homeComp = competitors.find((c) => c.homeAway === 'home') ?? competitors[0];
  const awayComp = competitors.find((c) => c.homeAway === 'away') ?? competitors[1];
  if (!homeComp || !awayComp) return null;

  const state = ev.status?.type?.state;
  const status: MatchStatus =
    state === 'in' ? 'live' : state === 'post' ? 'finished' : 'upcoming';

  const dateKey = ev.date ? ev.date.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const country = leagueCfg?.country ?? inferCountryFromVenueOrSlug(competition?.venue?.address?.country);
  const leagueId = leagueCfg?.slug ?? (ev.season?.slug ? `intl-${ev.season.slug}` : 'intl-world');
  const leagueName =
    leagueCfg?.name ??
    fallbackLeagueName ??
    prettifySlugName(ev.season?.slug);
  const baseElo = leagueCfg?.baseElo ?? 1600;
  const avgHomeGoals = leagueCfg?.avgHomeGoals ?? 1.56;
  const avgAwayGoals = leagueCfg?.avgAwayGoals ?? 1.2;
  const homeAdvantage = leagueCfg?.homeAdvantageFactor ?? 1.15;

  const homeId = String(homeComp.team?.id || homeComp.id || '');
  const awayId = String(awayComp.team?.id || awayComp.id || '');

  const homeTeam = buildTeamProfile(
    homeComp,
    leagueId,
    country,
    baseElo,
    avgHomeGoals,
    avgAwayGoals,
    dateKey,
    standingsByTeam.get(homeId)
  );
  const awayTeam = buildTeamProfile(
    awayComp,
    leagueId,
    country,
    baseElo,
    avgHomeGoals,
    avgAwayGoals,
    dateKey,
    standingsByTeam.get(awayId)
  );

  const hasScore = status === 'live' || status === 'finished';
  const homeScore = Number(homeComp.score ?? 0);
  const awayScore = Number(awayComp.score ?? 0);

  return {
    id: `espn-${ev.id}`,
    leagueId,
    leagueSlug: leagueCfg?.slug ?? 'all',
    leagueName,
    country,
    countryCode: leagueCfg?.countryCode ?? country.slice(0, 2).toUpperCase(),
    kickoffIso: ev.date,
    dateKey,
    status,
    minute: status === 'live' ? parseMinute(ev.status?.displayClock) : undefined,
    venue: competition?.venue?.fullName || country,
    score:
      hasScore && Number.isFinite(homeScore) && Number.isFinite(awayScore)
        ? { home: homeScore, away: awayScore }
        : undefined,
    homeTeam,
    awayTeam,
    leagueAvgHomeGoals: avgHomeGoals,
    leagueAvgAwayGoals: avgAwayGoals,
    leagueHomeAdvantage: homeAdvantage,
    h2h: [],
    hasXG: false,
  };
}

export async function fetchEspnStandings(): Promise<{
  standings: LeagueStandings[];
  byTeamId: Map<string, TeamStandingLookup>;
  byTeamName: Map<string, TeamStandingLookup>;
}> {
  const standingLeagues = LIVE_LEAGUES.filter((l) => l.hasStandings);
  const byTeamId = new Map<string, TeamStandingLookup>();
  const byTeamName = new Map<string, TeamStandingLookup>();

  const settled = await Promise.allSettled(
    standingLeagues.map(async (cfg): Promise<LeagueStandings | null> => {
      const url = `https://site.api.espn.com/apis/v2/sports/soccer/${cfg.slug}/standings`;
      const json = await fetchJsonWithTimeout<{
        children?: Array<{ standings?: { entries?: EspnStandingEntry[] } }>;
        standings?: { entries?: EspnStandingEntry[] };
      }>(url);

      // Some leagues like MLS have Eastern/Western children; merge entries
      const groups = json.children ?? (json.standings ? [{ standings: json.standings }] : []);
      const rawEntries: EspnStandingEntry[] = [];
      for (const g of groups) {
        if (g.standings?.entries) {
          rawEntries.push(...g.standings.entries);
        }
      }
      if (rawEntries.length === 0) return null;

      const rows: StandingsRow[] = rawEntries
        .map((entry, idx) => {
          const teamId = String(entry.team?.id || `${cfg.slug}-${idx}`);
          const teamName = entry.team?.displayName || 'Unknown';
          const code =
            entry.team?.abbreviation ||
            teamName
              .replace(/[^A-Za-z]/g, '')
              .slice(0, 3)
              .toUpperCase() ||
            'CLB';

          const played = readStat(entry.stats, 'gamesPlayed', 0);
          const wins = readStat(entry.stats, 'wins', 0);
          const draws = readStat(entry.stats, 'ties', 0);
          const losses = readStat(entry.stats, 'losses', 0);
          const goalsFor = readStat(entry.stats, 'pointsFor', 0);
          const goalsAgainst = readStat(entry.stats, 'pointsAgainst', 0);
          const goalDifference = readStat(entry.stats, 'pointDifferential', goalsFor - goalsAgainst);
          const points = readStat(entry.stats, 'points', wins * 3 + draws);
          const rank = readStat(entry.stats, 'rank', idx + 1);
          const elo = deriveEloFromRecord(cfg.baseElo, played, points, goalDifference);
          const ppg = played > 0 ? points / played : 1.3;

          // Approximate recent 5 visual strip from season win/draw/loss ratios when table endpoint lacks per-game sequence
          const form: FormResult[] = [];
          const wRate = played > 0 ? wins / played : 0.35;
          const dRate = played > 0 ? draws / played : 0.28;
          for (let i = 0; i < 5; i += 1) {
            const threshold = ((i * 37 + rank * 13) % 100) / 100;
            if (threshold < wRate) form.push('W');
            else if (threshold < wRate + dRate) form.push('D');
            else form.push('L');
          }

          const formTrend = buildFormTrendFromPpg(ppg, []);

          // Store in global team lookup (domestic league preferred over UCL if duplicate)
          const lookupRecord: TeamStandingLookup = {
            leagueSlug: cfg.slug,
            position: rank || idx + 1,
            played,
            wins,
            draws,
            losses,
            goalsFor,
            goalsAgainst,
            points,
            elo,
            formTrend,
          };
          if (!byTeamId.has(teamId) || cfg.slug !== 'uefa.champions') {
            byTeamId.set(teamId, lookupRecord);
          }
          const normFull = normalizeTeamName(teamName);
          if (normFull && (!byTeamName.has(normFull) || cfg.slug !== 'uefa.champions')) {
            byTeamName.set(normFull, lookupRecord);
          }
          const shortDisplay = entry.team?.shortDisplayName;
          if (shortDisplay) {
            const normShort = normalizeTeamName(shortDisplay);
            if (normShort && (!byTeamName.has(normShort) || cfg.slug !== 'uefa.champions')) {
              byTeamName.set(normShort, lookupRecord);
            }
          }

          return {
            position: rank || idx + 1,
            teamId,
            teamName,
            code,
            played,
            wins,
            draws,
            losses,
            goalsFor,
            goalsAgainst,
            goalDifference,
            points,
            elo,
            form,
            formTrend,
          };
        })
        .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor)
        .map((r, idx) => ({ ...r, position: idx + 1 }));

      const leagueInfo: LeagueInfo = {
        id: cfg.slug,
        name: cfg.name,
        country: cfg.country,
        countryCode: cfg.countryCode,
        region: cfg.region,
        season: '2026/27',
        avgHomeGoals: cfg.avgHomeGoals,
        avgAwayGoals: cfg.avgAwayGoals,
        homeAdvantageFactor: cfg.homeAdvantageFactor,
      };

      return {
        league: leagueInfo,
        table: rows,
      };
    })
  );

  const standings = settled
    .filter(
      (r): r is PromiseFulfilledResult<LeagueStandings | null> =>
        r.status === 'fulfilled' && r.value !== null
    )
    .map((r) => r.value as LeagueStandings);

  return { standings, byTeamId, byTeamName };
}

export async function fetchEspnDailyMatches(
  standingsByTeam: Map<string, TeamStandingLookup>,
  targetDateIso?: string
): Promise<{
  matches: MatchRecord[];
  leagues: LeagueInfo[];
}> {
  const todayYmd = getDateOffsetYmd(0);
  const yesterdayYmd = getDateOffsetYmd(-1);
  const tomorrowYmd = getDateOffsetYmd(1);
  const requestedYmd =
    targetDateIso && /^\d{4}-\d{2}-\d{2}$/.test(targetDateIso)
      ? targetDateIso.replace(/-/g, '')
      : null;

  // Fetch all 18 major league scoreboards + today/yesterday/tomorrow (or requested date) global feed in parallel
  const [leagueResults, todayAllResult, yesterdayAllResult, tomorrowAllResult, requestedAllResult] =
    await Promise.all([
      Promise.allSettled(
        LIVE_LEAGUES.map(async (cfg) => {
          const url = requestedYmd
            ? `https://site.api.espn.com/apis/site/v2/sports/soccer/${cfg.slug}/scoreboard?dates=${requestedYmd}`
            : `https://site.api.espn.com/apis/site/v2/sports/soccer/${cfg.slug}/scoreboard`;
          const json = await fetchJsonWithTimeout<{
            leagues?: Array<{ name?: string }>;
            events?: EspnEvent[];
          }>(url);
          return { cfg, events: json.events ?? [] };
        })
      ),
      requestedYmd
        ? Promise.resolve({ events: [] as EspnEvent[] })
        : fetchJsonWithTimeout<{ events?: EspnEvent[] }>(
            `https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${todayYmd}`
          ).catch(() => ({ events: [] as EspnEvent[] })),
      requestedYmd
        ? Promise.resolve({ events: [] as EspnEvent[] })
        : fetchJsonWithTimeout<{ events?: EspnEvent[] }>(
            `https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${yesterdayYmd}`
          ).catch(() => ({ events: [] as EspnEvent[] })),
      requestedYmd
        ? Promise.resolve({ events: [] as EspnEvent[] })
        : fetchJsonWithTimeout<{ events?: EspnEvent[] }>(
            `https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${tomorrowYmd}`
          ).catch(() => ({ events: [] as EspnEvent[] })),
      requestedYmd
        ? fetchJsonWithTimeout<{ events?: EspnEvent[] }>(
            `https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${requestedYmd}`
          ).catch(() => ({ events: [] as EspnEvent[] }))
        : Promise.resolve({ events: [] as EspnEvent[] }),
    ]);

  const deduped = new Map<string, MatchRecord>();

  // 1. Add all major league fixtures first (richest league/country metadata)
  for (const res of leagueResults) {
    if (res.status !== 'fulfilled') continue;
    const { cfg, events } = res.value;
    for (const ev of events) {
      const mapped = mapEspnEventToMatch(ev, cfg, cfg.name, standingsByTeam);
      if (mapped) deduped.set(ev.id, mapped);
    }
  }

  // 2. Merge explicit requested date if provided
  for (const ev of requestedAllResult.events ?? []) {
    if (deduped.has(ev.id)) continue;
    const mapped = mapEspnEventToMatch(ev, null, undefined, standingsByTeam);
    if (mapped) deduped.set(ev.id, mapped);
  }

  // 3. Merge today's global live/scheduled slate
  for (const ev of todayAllResult.events ?? []) {
    if (deduped.has(ev.id)) continue;
    const mapped = mapEspnEventToMatch(ev, null, undefined, standingsByTeam);
    if (mapped) deduped.set(ev.id, mapped);
  }

  // 4. Merge tomorrow's global slate (up to 30 fixtures so Sabah tab is rich and real)
  let addedTomorrow = 0;
  for (const ev of tomorrowAllResult.events ?? []) {
    if (deduped.has(ev.id) || addedTomorrow >= 30) continue;
    const mapped = mapEspnEventToMatch(ev, null, undefined, standingsByTeam);
    if (mapped) {
      deduped.set(ev.id, mapped);
      addedTomorrow += 1;
    }
  }

  // 5. Merge yesterday's settled matches (up to 24 real finished results)
  let addedYesterday = 0;
  for (const ev of yesterdayAllResult.events ?? []) {
    if (deduped.has(ev.id) || addedYesterday >= 24) continue;
    const mapped = mapEspnEventToMatch(ev, null, undefined, standingsByTeam);
    if (mapped) {
      deduped.set(ev.id, mapped);
      addedYesterday += 1;
    }
  }

  const statusOrder: Record<MatchStatus, number> = {
    live: 0,
    upcoming: 1,
    finished: 2,
  };

  const matches = Array.from(deduped.values()).sort((a, b) => {
    const sDiff = statusOrder[a.status] - statusOrder[b.status];
    if (sDiff !== 0) return sDiff;
    if (a.status === 'finished') {
      return b.kickoffIso.localeCompare(a.kickoffIso);
    }
    return a.kickoffIso.localeCompare(b.kickoffIso);
  });

  const leagues: LeagueInfo[] = LIVE_LEAGUES.map((cfg) => ({
    id: cfg.slug,
    name: cfg.name,
    country: cfg.country,
    countryCode: cfg.countryCode,
    region: cfg.region,
    season: '2026/27',
    avgHomeGoals: cfg.avgHomeGoals,
    avgAwayGoals: cfg.avgAwayGoals,
    homeAdvantageFactor: cfg.homeAdvantageFactor,
  }));

  return { matches, leagues };
}

export async function fetchEspnMatchSummaryEnrichment(
  rawMatchId: string,
  leagueSlug: string = 'all'
): Promise<{
  homeLastForm?: FormEntry[];
  awayLastForm?: FormEntry[];
  h2h?: HeadToHeadEntry[];
  venue?: string;
  liveStats?: MatchLiveStats;
}> {
  const eventId = rawMatchId.replace(/^espn-/, '');
  const slug = leagueSlug || 'all';
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/summary?event=${encodeURIComponent(eventId)}`;
  const json = await fetchJsonWithTimeout<{
    gameInfo?: { venue?: { fullName?: string } };
    boxscore?: {
      teams?: Array<{
        homeAway?: 'home' | 'away';
        statistics?: Array<{ name?: string; displayValue?: string }>;
      }>;
    };
    lastFiveGames?: Array<{
      team?: { id?: string; displayName?: string };
      events?: Array<{
        gameDate?: string;
        score?: string;
        homeTeamScore?: string;
        awayTeamScore?: string;
        gameResult?: string;
        atVs?: string;
        opponent?: { displayName?: string };
      }>;
    }>;
    headToHeadGames?: Array<{
      events?: Array<{
        gameDate?: string;
        homeTeamScore?: string;
        awayTeamScore?: string;
        homeTeam?: { id?: string; displayName?: string };
        awayTeam?: { id?: string; displayName?: string };
        leagueName?: string;
      }>;
    }>;
  }>(url, 7000);

  const parseLastFive = (
    events:
      | Array<{
          gameDate?: string;
          score?: string;
          gameResult?: string;
          atVs?: string;
          opponent?: { displayName?: string };
        }>
      | undefined
  ): FormEntry[] => {
    if (!events || events.length === 0) return [];
    return events.map((e) => {
      const resChar = (e.gameResult || 'D').toUpperCase();
      const result: FormResult = resChar === 'W' ? 'W' : resChar === 'L' ? 'L' : 'D';
      const [s1, s2] = (e.score || '0-0').split('-').map((n) => Number(n) || 0);
      const isHome = e.atVs === 'vs';
      const gf = result === 'W' ? Math.max(s1, s2) : result === 'L' ? Math.min(s1, s2) : s1;
      const ga = result === 'W' ? Math.min(s1, s2) : result === 'L' ? Math.max(s1, s2) : s2;
      return {
        result,
        goalsFor: gf,
        goalsAgainst: ga,
        isHome,
        opponent: e.opponent?.displayName || 'Opponent',
        date: (e.gameDate || '').slice(0, 10),
      };
    });
  };

  const homeLastForm = parseLastFive(json.lastFiveGames?.[0]?.events);
  const awayLastForm = parseLastFive(json.lastFiveGames?.[1]?.events);

  const h2hEvents = json.headToHeadGames?.[0]?.events ?? [];
  const h2h: HeadToHeadEntry[] = h2hEvents.slice(0, 8).map((e) => ({
    date: (e.gameDate || '').slice(0, 10),
    homeTeamId: String(e.homeTeam?.id || ''),
    homeTeamName: e.homeTeam?.displayName || 'Home',
    awayTeamId: String(e.awayTeam?.id || ''),
    awayTeamName: e.awayTeam?.displayName || 'Away',
    homeGoals: Number(e.homeTeamScore || 0),
    awayGoals: Number(e.awayTeamScore || 0),
    competition: e.leagueName || 'Match',
  }));

  // Extract live / completed match boxscore statistics (possession, shots, shots on target, corners)
  let liveStats: MatchLiveStats | undefined;
  const boxTeams = json.boxscore?.teams;
  if (boxTeams && boxTeams.length >= 2) {
    const homeBox = boxTeams.find((t) => t.homeAway === 'home') ?? boxTeams[0];
    const awayBox = boxTeams.find((t) => t.homeAway === 'away') ?? boxTeams[1];
    const readBoxNum = (
      stats: Array<{ name?: string; displayValue?: string }> | undefined,
      keys: string[]
    ): number | undefined => {
      if (!stats) return undefined;
      for (const k of keys) {
        const found = stats.find((s) => s.name?.toLowerCase() === k.toLowerCase());
        if (found?.displayValue) {
          const parsed = Number.parseFloat(found.displayValue.replace('%', ''));
          if (Number.isFinite(parsed)) return parsed;
        }
      }
      return undefined;
    };

    const hPoss = readBoxNum(homeBox.statistics, ['possessionPct', 'possession']);
    const aPoss = readBoxNum(awayBox.statistics, ['possessionPct', 'possession']);
    const hShots = readBoxNum(homeBox.statistics, ['totalShots', 'shotsSummary']);
    const aShots = readBoxNum(awayBox.statistics, ['totalShots', 'shotsSummary']);
    const hSot = readBoxNum(homeBox.statistics, ['shotsOnTarget']);
    const aSot = readBoxNum(awayBox.statistics, ['shotsOnTarget']);
    const hCor = readBoxNum(homeBox.statistics, ['wonCorners', 'corners']);
    const aCor = readBoxNum(awayBox.statistics, ['wonCorners', 'corners']);

    const extracted: MatchLiveStats = {};
    if (hPoss !== undefined && aPoss !== undefined) extracted.possession = { home: Math.round(hPoss), away: Math.round(aPoss) };
    if (hShots !== undefined && aShots !== undefined) extracted.shots = { home: Math.round(hShots), away: Math.round(aShots) };
    if (hSot !== undefined && aSot !== undefined) extracted.shotsOnTarget = { home: Math.round(hSot), away: Math.round(aSot) };
    if (hCor !== undefined && aCor !== undefined) extracted.corners = { home: Math.round(hCor), away: Math.round(aCor) };
    if (Object.keys(extracted).length > 0) {
      liveStats = extracted;
    }
  }

  return {
    homeLastForm: homeLastForm.length > 0 ? homeLastForm : undefined,
    awayLastForm: awayLastForm.length > 0 ? awayLastForm : undefined,
    h2h: h2h.length > 0 ? h2h : undefined,
    venue: json.gameInfo?.venue?.fullName,
    liveStats,
  };
}

/**
 * Evaluates our real statistical prediction engine on real settled matches from the past 5 days.
 */
export async function fetchEspnRealPerformance(
  standingsByTeam: Map<string, TeamStandingLookup>
): Promise<PerformanceSummary> {
  const days = [-1, -2, -3, -4, -5];
  const dayFeeds = await Promise.allSettled(
    days.map(async (offset) => {
      const ymd = getDateOffsetYmd(offset);
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${ymd}`;
      const json = await fetchJsonWithTimeout<{ events?: EspnEvent[] }>(url, 8000);
      return json.events ?? [];
    })
  );

  const records: HistoricalPredictionRecord[] = [];
  const seen = new Set<string>();

  for (const res of dayFeeds) {
    if (res.status !== 'fulfilled') continue;
    for (const ev of res.value) {
      if (seen.has(ev.id)) continue;
      if (ev.status?.type?.state !== 'post') continue;
      seen.add(ev.id);

      const match = mapEspnEventToMatch(ev, null, undefined, standingsByTeam);
      if (!match || !match.score) continue;

      const pred = predictMatch(match);
      const actualResult: 'home' | 'draw' | 'away' =
        match.score.home > match.score.away
          ? 'home'
          : match.score.home < match.score.away
            ? 'away'
            : 'draw';
      const predictedSelection = pred.topOutcome.selection;
      const hit = predictedSelection === actualResult;

      // Multi-class Brier score for 1X2
      const yH = actualResult === 'home' ? 1 : 0;
      const yD = actualResult === 'draw' ? 1 : 0;
      const yA = actualResult === 'away' ? 1 : 0;
      const brierScore = Number(
        (
          ((pred.homeWinProb - yH) ** 2 +
            (pred.drawProb - yD) ** 2 +
            (pred.awayWinProb - yA) ** 2) /
          3
        ).toFixed(3)
      );

      records.push({
        id: match.id,
        date: match.dateKey,
        leagueId: match.leagueId,
        leagueName: match.leagueName,
        homeTeam: match.homeTeam.shortName,
        awayTeam: match.awayTeam.shortName,
        predictedSelection,
        predictedProb: pred.topOutcome.probability,
        confidenceBand: pred.confidenceBand,
        actualResult,
        actualScore: `${match.score.home}-${match.score.away}`,
        hit,
        brierScore,
      });
    }
  }

  const totalEvaluated = records.length;
  const totalHits = records.filter((r) => r.hit).length;
  const overallHitRate = totalEvaluated > 0 ? Number(((totalHits / totalEvaluated) * 100).toFixed(1)) : 0;
  const avgBrierScore =
    totalEvaluated > 0
      ? Number((records.reduce((s, r) => s + r.brierScore, 0) / totalEvaluated).toFixed(3))
      : 0;

  const highRecs = records.filter((r) => r.confidenceBand === 'high');
  const highConfidenceHitRate =
    highRecs.length > 0
      ? Number(((highRecs.filter((r) => r.hit).length / highRecs.length) * 100).toFixed(1))
      : overallHitRate;

  // Group by league
  const leagueBuckets = new Map<
    string,
    { leagueId: string; leagueName: string; total: number; hits: number; brierSum: number }
  >();
  for (const r of records) {
    const existing = leagueBuckets.get(r.leagueName);
    if (existing) {
      existing.total += 1;
      existing.hits += r.hit ? 1 : 0;
      existing.brierSum += r.brierScore;
    } else {
      leagueBuckets.set(r.leagueName, {
        leagueId: r.leagueId,
        leagueName: r.leagueName.length > 18 ? `${r.leagueName.slice(0, 17)}…` : r.leagueName,
        total: 1,
        hits: r.hit ? 1 : 0,
        brierSum: r.brierScore,
      });
    }
  }

  const byLeague = Array.from(leagueBuckets.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 7)
    .map((b) => ({
      leagueId: b.leagueId,
      leagueName: b.leagueName,
      total: b.total,
      hits: b.hits,
      hitRate: Number(((b.hits / b.total) * 100).toFixed(1)),
      avgBrier: Number((b.brierSum / b.total).toFixed(3)),
    }));

  // Group by confidence band
  const byConfidence = (['high', 'medium', 'low'] as const).map((band) => {
    const group = records.filter((r) => r.confidenceBand === band);
    const total = group.length;
    const hits = group.filter((r) => r.hit).length;
    const expectedAvgProb =
      total > 0
        ? Number(((group.reduce((s, r) => s + r.predictedProb, 0) / total) * 100).toFixed(1))
        : band === 'high'
          ? 70
          : band === 'medium'
            ? 56
            : 45;
    return {
      band,
      total,
      hits,
      hitRate: total > 0 ? Number(((hits / total) * 100).toFixed(1)) : 0,
      expectedAvgProb,
    };
  });

  // Daily trend over the evaluated days
  const dateBuckets = new Map<string, { total: number; hits: number; brierSum: number }>();
  for (const r of records) {
    const b = dateBuckets.get(r.date) ?? { total: 0, hits: 0, brierSum: 0 };
    b.total += 1;
    b.hits += r.hit ? 1 : 0;
    b.brierSum += r.brierScore;
    dateBuckets.set(r.date, b);
  }
  const monthlyTrend = Array.from(dateBuckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, b]) => ({
      month: date.slice(5), // MM-DD
      hitRate: Number(((b.hits / b.total) * 100).toFixed(1)),
      volume: b.total,
      brier: Number((b.brierSum / b.total).toFixed(3)),
    }));

  return {
    totalEvaluated,
    overallHitRate,
    avgBrierScore,
    highConfidenceHitRate,
    byLeague,
    byConfidence,
    monthlyTrend,
    recentResults: records.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15),
  };
}
