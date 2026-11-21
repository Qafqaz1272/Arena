import type { MatchRecord } from '../types/football.ts';
import type {
  PlatformArchivePick,
  PlatformBookmakerOdds,
  PlatformFormItem,
  PlatformH2HItem,
  PlatformLineupPlayer,
  PlatformMatch,
  PlatformMatchDetailPayload,
  PlatformMatchEvent,
  PlatformMatchStatBar,
  PlatformNewsArticle,
  PlatformOddsMovement,
  PlatformStandingsLeague,
  PlatformTransparencyPayload,
} from '../types/platform.ts';
import {
  detectOddsDrop,
  evaluateValueBet,
  generateSmartCoupons,
  predictMatchDixonColes,
  type CouponLeg,
  type GeneratedCoupon,
  type ValueBetSignal,
} from '../utils/bettingInsightsEngine.ts';
import {
  getMatchesData,
  getPerformanceData,
  getStandingsData,
} from './footballApiServer.ts';
import {
  fetchEspnDailyMatches,
  fetchEspnStandings,
} from './espnFootballProvider.ts';
import {
  getMultiBookmakerOddsMap,
  normalizeOddsTeamName,
  type MultiBookmakerMatchOdds,
} from './oddsApiServer.ts';
import { getLatestLiveScorePatches } from './liveScoreStreamServer.ts';
import { mergeLiveScorePatches } from '../utils/liveGoalDetector.ts';

let lastRefreshedIso = new Date().toISOString();

interface EspnPlatformCache {
  matches: MatchRecord[];
  sourceLabel: string;
  cachedAt: string;
  expiresAt: number;
}
const espnPlatformCache = new Map<string, EspnPlatformCache>();

interface NewsCache {
  articles: PlatformNewsArticle[];
  expiresAt: number;
}
let newsCache: NewsCache | null = null;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function americanToDecimal(ml: number | undefined): number | null {
  if (typeof ml !== 'number' || !Number.isFinite(ml) || ml === 0) return null;
  if (ml > 0) return round2(1 + ml / 100);
  return round2(1 + 100 / Math.abs(ml));
}

function formatUtcTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--';
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function computeDateId(dateIso: string): string {
  const now = new Date();
  const fmt = (offsetDays: number) => {
    const d = new Date(now.getTime() + offsetDays * 86_400_000);
    return d.toISOString().slice(0, 10);
  };
  if (dateIso === fmt(-1)) return 'yesterday';
  if (dateIso === fmt(0)) return 'today';
  if (dateIso === fmt(1)) return 'tomorrow';
  return dateIso;
}

function findRealOddsForMatch(
  homeName: string,
  awayName: string,
  multiByKey: Map<string, MultiBookmakerMatchOdds>
): MultiBookmakerMatchOdds | null {
  const hNorm = normalizeOddsTeamName(homeName);
  const aNorm = normalizeOddsTeamName(awayName);
  const exactKey = `${hNorm}__${aNorm}`;
  if (multiByKey.has(exactKey)) return multiByKey.get(exactKey)!;

  for (const [, entry] of multiByKey.entries()) {
    const [eh, ea] = entry.matchKey.split('__');
    const homeMatch = eh === hNorm || (eh.length >= 4 && hNorm.length >= 4 && (eh.includes(hNorm) || hNorm.includes(eh)));
    const awayMatch = ea === aNorm || (ea.length >= 4 && aNorm.length >= 4 && (ea.includes(aNorm) || aNorm.includes(ea)));
    if (homeMatch && awayMatch) {
      return entry;
    }
  }
  return null;
}

function computeLeagueShort(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('champions league')) return 'Çempionlar Liqası';
  if (n.includes('europa league')) return 'Avropa Liqası';
  if (n.includes('conference')) return 'Konfrans Liqası';
  if (n.includes('premier league') && !n.includes('russian') && !n.includes('scottish')) return 'Premyer Liqa';
  if (n.includes('la liga') || n.includes('laliga')) return 'La Liqa';
  if (n.includes('serie a')) return 'Seriya A';
  if (n.includes('bundesliga')) return 'Bundesliqa';
  if (n.includes('ligue 1')) return 'Liqa 1';
  if (n.includes('süper lig') || n.includes('super lig')) return 'Türkiyə Super Liqası';
  return name.slice(0, 26);
}

function enrichMatchRecord(
  m: MatchRecord,
  multiByKey: Map<string, MultiBookmakerMatchOdds>
): PlatformMatch {
  const homePlayed = Math.max(1, m.homeTeam.played || 10);
  const awayPlayed = Math.max(1, m.awayTeam.played || 10);
  const homeAvgFor = m.homeTeam.goalsFor / homePlayed;
  const homeAvgAgainst = m.homeTeam.goalsAgainst / homePlayed;
  const awayAvgFor = m.awayTeam.goalsFor / awayPlayed;
  const awayAvgAgainst = m.awayTeam.goalsAgainst / awayPlayed;

  const homeForm = (m.homeTeam.last10Form || []).slice(0, 5).map((f) => f.result);
  const awayForm = (m.awayTeam.last10Form || []).slice(0, 5).map((f) => f.result);

  const formPts = (arr: Array<'W' | 'D' | 'L'>) =>
    arr.length === 0
      ? 7
      : Math.round(
          (arr.reduce((sum, r) => sum + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0) / arr.length) * 5
        );

  const homeStrength = Math.max(
    0.82,
    Math.min(1.28, (homeAvgFor / 1.45) * 0.65 + (1.35 / Math.max(0.55, awayAvgAgainst)) * 0.35)
  );
  const awayStrength = Math.max(
    0.82,
    Math.min(1.28, (awayAvgFor / 1.35) * 0.65 + (1.35 / Math.max(0.55, homeAvgAgainst)) * 0.35)
  );

  const homeRank = m.homeTeam.standingsPosition || 10;
  const awayRank = m.awayTeam.standingsPosition || 10;
  const rankUrgency = (rank: number) => (rank <= 4 || rank >= 16 ? 0.85 : 0.55);

  const prediction = predictMatchDixonColes({
    matchId: m.id,
    homeName: m.homeTeam.name,
    awayName: m.awayTeam.name,
    homeElo: m.homeTeam.elo || 1600,
    awayElo: m.awayTeam.elo || 1580,
    homeFormPts: formPts(homeForm),
    awayFormPts: formPts(awayForm),
    homeHomeStrength: homeStrength,
    awayAwayStrength: awayStrength,
    h2hHomeBias: 0,
    homeInjuries: Math.min(5, m.homeTeam.absences?.length ?? 0),
    awayInjuries: Math.min(5, m.awayTeam.absences?.length ?? 0),
    homeRestDays: (() => {
      const lastIso = m.homeTeam.last10Form?.[0]?.date;
      if (!lastIso) return 4;
      const diff = Math.round(
        (new Date(m.kickoffIso).getTime() - new Date(lastIso).getTime()) / 86_400_000
      );
      return Number.isFinite(diff) ? Math.max(2, Math.min(10, diff)) : 4;
    })(),
    awayRestDays: (() => {
      const lastIso = m.awayTeam.last10Form?.[0]?.date;
      if (!lastIso) return 4;
      const diff = Math.round(
        (new Date(m.kickoffIso).getTime() - new Date(lastIso).getTime()) / 86_400_000
      );
      return Number.isFinite(diff) ? Math.max(2, Math.min(10, diff)) : 4;
    })(),
    homeMotivation: rankUrgency(homeRank),
    awayMotivation: rankUrgency(awayRank),
  });

  const fairOdds = {
    home: round2(100 / Math.max(4, prediction.homeWinProb)),
    draw: round2(100 / Math.max(4, prediction.drawProb)),
    away: round2(100 / Math.max(4, prediction.awayWinProb)),
    over25: round2(100 / Math.max(4, prediction.over25Prob)),
    bttsYes: round2(100 / Math.max(4, prediction.bttsYesProb)),
  };

  const realOddsMatch = findRealOddsForMatch(m.homeTeam.name, m.awayTeam.name, multiByKey);
  const bookmakerOdds: PlatformBookmakerOdds[] = realOddsMatch
    ? realOddsMatch.bookmakers.map((b) => ({
        bookmaker: b.bookmaker,
        home: b.homeOdds,
        draw: b.drawOdds,
        away: b.awayOdds,
      }))
    : [];

  const bestOdds =
    bookmakerOdds.length > 0
      ? {
          home: Math.max(...bookmakerOdds.map((b) => b.home)),
          draw: Math.max(...bookmakerOdds.map((b) => b.draw)),
          away: Math.max(...bookmakerOdds.map((b) => b.away)),
        }
      : null;

  const matchLabel = `${m.homeTeam.name} – ${m.awayTeam.name}`;
  const leagueShort = computeLeagueShort(m.leagueName);
  const valueBets: ValueBetSignal[] = [];
  const oddsMovements: PlatformOddsMovement[] = [];

  const statusUpper: PlatformMatch['status'] =
    m.status === 'live' ? 'LIVE' : m.status === 'finished' ? 'FINISHED' : 'UPCOMING';

  // Only compare pre-match Dixon-Coles probabilities against pre-match odds on UPCOMING games.
  // Never compare pre-match probabilities against in-play live odds (e.g. 120.00 when trailing 2-3).
  if (statusUpper === 'UPCOMING' && bestOdds && realOddsMatch) {
    valueBets.push(
      evaluateValueBet({
        matchId: m.id,
        matchLabel,
        league: leagueShort,
        market: '1X2',
        selection: `1 (${m.homeTeam.code})`,
        modelProb: prediction.homeWinProb,
        bookmakerOdds: bestOdds.home,
        confidence: prediction.confidence,
      }),
      evaluateValueBet({
        matchId: m.id,
        matchLabel,
        league: leagueShort,
        market: '1X2',
        selection: 'X (Heç-heçə)',
        modelProb: prediction.drawProb,
        bookmakerOdds: bestOdds.draw,
        confidence: prediction.confidence,
      }),
      evaluateValueBet({
        matchId: m.id,
        matchLabel,
        league: leagueShort,
        market: '1X2',
        selection: `2 (${m.awayTeam.code})`,
        modelProb: prediction.awayWinProb,
        bookmakerOdds: bestOdds.away,
        confidence: prediction.confidence,
      })
    );

    const homeMove = detectOddsDrop('1', realOddsMatch.openingBest.homeOdds, bestOdds.home);
    const drawMove = detectOddsDrop('X', realOddsMatch.openingBest.drawOdds, bestOdds.draw);
    const awayMove = detectOddsDrop('2', realOddsMatch.openingBest.awayOdds, bestOdds.away);
    oddsMovements.push(
      {
        market: '1X2',
        selection: `1 (${m.homeTeam.code})`,
        openingOdds: realOddsMatch.openingBest.homeOdds,
        currentOdds: bestOdds.home,
        dropPct: homeMove.dropPct,
        isSharpDrop: homeMove.isSharpDrop,
      },
      {
        market: '1X2',
        selection: 'X',
        openingOdds: realOddsMatch.openingBest.drawOdds,
        currentOdds: bestOdds.draw,
        dropPct: drawMove.dropPct,
        isSharpDrop: drawMove.isSharpDrop,
      },
      {
        market: '1X2',
        selection: `2 (${m.awayTeam.code})`,
        openingOdds: realOddsMatch.openingBest.awayOdds,
        currentOdds: bestOdds.away,
        dropPct: awayMove.dropPct,
        isSharpDrop: awayMove.isSharpDrop,
      }
    );
  }

  const topValueEdge = valueBets.reduce((max, v) => (v.edgePct > max ? v.edgePct : max), 0);
  const homeLogo =
    m.homeTeam.id && /^\d+$/.test(m.homeTeam.id)
      ? `https://a.espncdn.com/i/teamlogos/soccer/500/${m.homeTeam.id}.png`
      : undefined;
  const awayLogo =
    m.awayTeam.id && /^\d+$/.test(m.awayTeam.id)
      ? `https://a.espncdn.com/i/teamlogos/soccer/500/${m.awayTeam.id}.png`
      : undefined;

  return {
    id: m.id,
    leagueId: m.leagueId,
    leagueSlug: m.leagueSlug || 'all',
    leagueName: m.leagueName,
    leagueShort,
    country: m.country,
    countryCode: m.countryCode,
    dateId: computeDateId(m.dateKey),
    dateIso: m.dateKey,
    kickoffIso: m.kickoffIso,
    time: formatUtcTime(m.kickoffIso),
    status: statusUpper,
    minute:
      statusUpper === 'LIVE'
        ? m.minute && m.minute > 0
          ? `${m.minute}'`
          : 'CANLI'
        : statusUpper === 'FINISHED'
        ? 'BİTDİ'
        : formatUtcTime(m.kickoffIso),
    round: m.leagueName,
    stadium: m.venue || m.country,
    homeTeamId: m.homeTeam.id,
    homeTeamName: m.homeTeam.name,
    homeShort: m.homeTeam.code || m.homeTeam.shortName.slice(0, 3).toUpperCase(),
    homeLogo,
    awayTeamId: m.awayTeam.id,
    awayTeamName: m.awayTeam.name,
    awayShort: m.awayTeam.code || m.awayTeam.shortName.slice(0, 3).toUpperCase(),
    awayLogo,
    homeScore: m.score ? m.score.home : null,
    awayScore: m.score ? m.score.away : null,
    homeYellowCards: 0,
    awayYellowCards: 0,
    homeRedCards: 0,
    awayRedCards: 0,
    homeRank: m.homeTeam.standingsPosition || 0,
    awayRank: m.awayTeam.standingsPosition || 0,
    homeForm,
    awayForm,
    prediction,
    hasRealOdds: bookmakerOdds.length > 0,
    oddsProvider: bookmakerOdds.length > 0 ? 'The Odds API' : undefined,
    bookmakerOdds,
    bestOdds,
    fairOdds,
    oddsMovements,
    valueBets,
    hasSharpDrop: oddsMovements.some((o) => o.isSharpDrop),
    topValueEdge,
  };
}

async function loadRealBaseMatches(options?: {
  date?: string;
  forceRefresh?: boolean;
}): Promise<{ matches: MatchRecord[]; sourceLabel: string; cachedAt: string }> {
  const cacheKey = options?.date || 'multi-day';
  const existing = espnPlatformCache.get(cacheKey);
  if (!options?.forceRefresh && existing && Date.now() < existing.expiresAt) {
    return {
      matches: existing.matches,
      sourceLabel: existing.sourceLabel,
      cachedAt: existing.cachedAt,
    };
  }

  try {
    const standingsBundle = await fetchEspnStandings();
    const { matches } = await fetchEspnDailyMatches(standingsBundle.byTeamId, options?.date);
    if (matches.length > 0) {
      const nowIso = new Date().toISOString();
      const ttlMs = matches.some((m) => m.status === 'live') ? 10_000 : 90_000;
      const entry: EspnPlatformCache = {
        matches,
        sourceLabel: 'ESPN Live Worldwide Feed',
        cachedAt: nowIso,
        expiresAt: Date.now() + ttlMs,
      };
      espnPlatformCache.set(cacheKey, entry);
      return {
        matches: entry.matches,
        sourceLabel: entry.sourceLabel,
        cachedAt: entry.cachedAt,
      };
    }
  } catch {
    // Fall back to multi-provider footballApiServer if ESPN temporarily fails
  }

  const fallbackRes = await getMatchesData({
    date: options?.date,
    forceRefresh: options?.forceRefresh,
  });
  return {
    matches: fallbackRes.matches,
    sourceLabel: fallbackRes.status.sourceLabel ?? 'Live Football Feed',
    cachedAt: fallbackRes.status.cachedAt ?? new Date().toISOString(),
  };
}

export async function getLivePlatformMatches(options?: {
  date?: string;
  forceRefresh?: boolean;
}): Promise<{
  matches: PlatformMatch[];
  refreshedAt: string;
  sourceLabel: string;
  oddsConfigured: boolean;
}> {
  const [matchesRes, oddsRes] = await Promise.all([
    loadRealBaseMatches(options),
    getMultiBookmakerOddsMap(options?.forceRefresh).catch(() => ({
      configured: false,
      provider: 'none',
      cachedAt: new Date().toISOString(),
      multiByKey: new Map<string, MultiBookmakerMatchOdds>(),
    })),
  ]);

  const enrichedRaw = matchesRes.matches.map((m) => enrichMatchRecord(m, oddsRes.multiByKey));
  // Overlay the freshest 8-second real-time scores & card counts from the SSE poller
  const livePatches = getLatestLiveScorePatches();
  const enriched = mergeLiveScorePatches(enrichedRaw, livePatches);

  // Prioritize matches with real live status or real bookmaker odds at top within each status
  const statusWeight: Record<PlatformMatch['status'], number> = {
    LIVE: 0,
    UPCOMING: 1,
    FINISHED: 2,
  };
  enriched.sort((a, b) => {
    const sDiff = statusWeight[a.status] - statusWeight[b.status];
    if (sDiff !== 0) return sDiff;
    if (a.hasRealOdds !== b.hasRealOdds) return a.hasRealOdds ? -1 : 1;
    if (a.status === 'FINISHED') return b.kickoffIso.localeCompare(a.kickoffIso);
    return a.kickoffIso.localeCompare(b.kickoffIso);
  });

  lastRefreshedIso = matchesRes.cachedAt || new Date().toISOString();
  const baseSource = matchesRes.sourceLabel ?? 'ESPN Live';
  return {
    matches: enriched,
    refreshedAt: lastRefreshedIso,
    sourceLabel: oddsRes.configured ? `${baseSource} + The Odds API` : baseSource,
    oddsConfigured: oddsRes.configured,
  };
}

export function getLiveCandidateLegs(matches: PlatformMatch[]): CouponLeg[] {
  // ONLY include UPCOMING matches that have REAL pre-match bookmaker odds and realistic odds bounds!
  return matches
    .filter((m) => m.status === 'UPCOMING' && m.hasRealOdds && m.valueBets.length > 0)
    .flatMap((m) =>
      m.valueBets
        .filter((vb) => vb.bookmakerOdds >= 1.12 && vb.bookmakerOdds <= 6.5 && vb.modelProb >= 25)
        .map((vb) => ({
          id: `${m.id}-${vb.market}-${vb.selection}`,
          matchId: m.id,
          matchLabel: vb.matchLabel,
          league: vb.league,
          market: vb.market,
          selection: vb.selection,
          odds: vb.bookmakerOdds,
          modelProb: vb.modelProb,
          impliedProb: vb.impliedProb,
          edgePct: vb.edgePct,
          confidence: vb.confidence,
        }))
    );
}

export async function getLiveSmartCoupons(forceRefresh = false): Promise<{
  coupons: GeneratedCoupon[];
  refreshedAt: string;
  realOddsMatchCount: number;
}> {
  const { matches, refreshedAt } = await getLivePlatformMatches({ forceRefresh });
  const pool = getLiveCandidateLegs(matches);
  const realOddsMatchCount = matches.filter((m) => m.status === 'UPCOMING' && m.hasRealOdds).length;
  return {
    coupons: generateSmartCoupons(pool),
    refreshedAt,
    realOddsMatchCount,
  };
}

function positionStartersOnPitch(
  starters: Array<{
    number: string;
    name: string;
    position: string;
    formationPlace?: number;
  }>,
  formationStr: string | undefined,
  side: 'home' | 'away'
): PlatformLineupPlayer[] {
  // Parse formation e.g. "4-3-3" or "3-4-2-1" -> [1, 4, 3, 3]
  const parsed = (formationStr || '4-3-3')
    .split('-')
    .map((n) => Number.parseInt(n, 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  const lines = [1, ...(parsed.length > 0 ? parsed : [4, 3, 3])];

  const sorted = [...starters].sort(
    (a, b) => (a.formationPlace ?? 99) - (b.formationPlace ?? 99)
  );

  const result: PlatformLineupPlayer[] = [];
  let cursor = 0;
  const totalLines = lines.length;

  lines.forEach((count, lineIdx) => {
    const xBase =
      totalLines <= 1
        ? 10
        : 8 + (lineIdx / (totalLines - 1)) * 37; // 8..45 for home half
    const x = side === 'home' ? xBase : 100 - xBase;

    for (let i = 0; i < count && cursor < sorted.length; i += 1) {
      const p = sorted[cursor++];
      const y = count === 1 ? 50 : 16 + (i / (count - 1)) * 68;
      result.push({
        number: p.number,
        name: p.name,
        position: p.position,
        starter: true,
        x: Math.round(x),
        y: Math.round(y),
      });
    }
  });

  // Any remaining starters if formation didn't sum to 11
  while (cursor < sorted.length) {
    const p = sorted[cursor++];
    result.push({
      number: p.number,
      name: p.name,
      position: p.position,
      starter: true,
      x: side === 'home' ? 35 : 65,
      y: 20 + ((cursor * 17) % 60),
    });
  }

  return result;
}

export async function getLiveMatchDetail(
  rawMatchId: string,
  leagueSlug: string = 'all'
): Promise<PlatformMatchDetailPayload> {
  const emptyDetail: PlatformMatchDetailPayload = {
    matchId: rawMatchId,
    homeLineup: [],
    awayLineup: [],
    events: [],
    stats: [],
    homeLastForm: [],
    awayLastForm: [],
    h2h: [],
  };

  const eventId = rawMatchId.replace(/^espn-/, '');
  if (!/^\d+$/.test(eventId)) {
    return emptyDetail;
  }

  const slug = leagueSlug && leagueSlug !== 'all' ? leagueSlug : 'all';
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${encodeURIComponent(
    slug
  )}/summary?event=${encodeURIComponent(eventId)}`;

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Cache-Control': 'no-cache',
      'User-Agent': 'ArenaAzLive/1.0',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    return emptyDetail;
  }

  const json = (await res.json()) as {
    gameInfo?: {
      venue?: { fullName?: string };
      attendance?: number;
      officials?: Array<{ fullName?: string; displayName?: string }>;
    };
    boxscore?: {
      teams?: Array<{
        homeAway?: 'home' | 'away';
        team?: { displayName?: string };
        statistics?: Array<{ name?: string; label?: string; displayValue?: string }>;
      }>;
    };
    rosters?: Array<{
      homeAway?: 'home' | 'away';
      formation?: string;
      team?: { displayName?: string };
      roster?: Array<{
        starter?: boolean;
        jersey?: string;
        formationPlace?: string | number;
        athlete?: { displayName?: string; shortName?: string };
        position?: { abbreviation?: string };
      }>;
    }>;
    keyEvents?: Array<{
      id?: string;
      clock?: { displayValue?: string };
      type?: { text?: string };
      team?: { displayName?: string };
      text?: string;
    }>;
    lastFiveGames?: Array<{
      events?: Array<{
        gameDate?: string;
        score?: string;
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
        homeTeam?: { displayName?: string };
        awayTeam?: { displayName?: string };
        leagueName?: string;
      }>;
    }>;
    odds?: Array<{
      provider?: { name?: string };
      homeTeamOdds?: { moneyLine?: number };
      awayTeamOdds?: { moneyLine?: number };
      drawOdds?: { moneyLine?: number };
    }>;
  };

  // Rosters / 11v11 lineups
  const homeRosterObj =
    json.rosters?.find((r) => r.homeAway === 'home') ?? json.rosters?.[0];
  const awayRosterObj =
    json.rosters?.find((r) => r.homeAway === 'away') ?? json.rosters?.[1];

  const extractStarters = (
    rosterObj: typeof homeRosterObj
  ): Array<{ number: string; name: string; position: string; formationPlace?: number }> => {
    if (!rosterObj?.roster) return [];
    return rosterObj.roster
      .filter((p) => p.starter)
      .slice(0, 11)
      .map((p) => ({
        number: String(p.jersey || ''),
        name: p.athlete?.shortName || p.athlete?.displayName || 'Oyunçu',
        position: p.position?.abbreviation || '',
        formationPlace:
          p.formationPlace !== undefined ? Number(p.formationPlace) : undefined,
      }));
  };

  const homeLineup = positionStartersOnPitch(
    extractStarters(homeRosterObj),
    homeRosterObj?.formation,
    'home'
  );
  const awayLineup = positionStartersOnPitch(
    extractStarters(awayRosterObj),
    awayRosterObj?.formation,
    'away'
  );

  // Real key events (goals, yellow/red cards, substitutions)
  const homeNameLower = (homeRosterObj?.team?.displayName || '').toLowerCase();
  const awayNameLower = (awayRosterObj?.team?.displayName || '').toLowerCase();
  const events: PlatformMatchEvent[] = (json.keyEvents ?? [])
    .filter((ev) => {
      const t = (ev.type?.text || '').toLowerCase();
      return (
        t.includes('goal') ||
        t.includes('yellow') ||
        t.includes('red') ||
        t.includes('substitution') ||
        t.includes('penalty')
      );
    })
    .map((ev, idx) => {
      const t = (ev.type?.text || '').toLowerCase();
      const type: PlatformMatchEvent['type'] = t.includes('goal')
        ? 'goal'
        : t.includes('red')
        ? 'red'
        : t.includes('yellow')
        ? 'yellow'
        : t.includes('substitution')
        ? 'sub'
        : 'other';
      const teamName = ev.team?.displayName || '';
      const tLower = teamName.toLowerCase();
      const teamSide: PlatformMatchEvent['teamSide'] =
        homeNameLower && tLower === homeNameLower
          ? 'home'
          : awayNameLower && tLower === awayNameLower
          ? 'away'
          : 'neutral';
      return {
        id: String(ev.id || `ev-${idx}`),
        minute: ev.clock?.displayValue || '',
        type,
        teamSide,
        teamName,
        text: ev.text || ev.type?.text || '',
      };
    });

  // Real boxscore stats
  const stats: PlatformMatchStatBar[] = [];
  const boxTeams = json.boxscore?.teams;
  if (boxTeams && boxTeams.length >= 2) {
    const hBox = boxTeams.find((t) => t.homeAway === 'home') ?? boxTeams[0];
    const aBox = boxTeams.find((t) => t.homeAway === 'away') ?? boxTeams[1];
    const readNum = (
      list: Array<{ name?: string; displayValue?: string }> | undefined,
      keys: string[]
    ): number | null => {
      if (!list) return null;
      for (const k of keys) {
        const hit = list.find((s) => s.name?.toLowerCase() === k.toLowerCase());
        if (hit?.displayValue) {
          const val = Number.parseFloat(hit.displayValue.replace('%', ''));
          if (Number.isFinite(val)) return val;
        }
      }
      return null;
    };

    const metricDefs: Array<{ label: string; keys: string[]; unit: string }> = [
      { label: 'Topa Sahiblik', keys: ['possessionPct', 'possession'], unit: '%' },
      { label: 'Ümumi Zərbələr', keys: ['totalShots', 'shots'], unit: '' },
      { label: 'Qapıya Zərbə', keys: ['shotsOnTarget'], unit: '' },
      { label: 'Künc Zərbələri', keys: ['wonCorners', 'corners'], unit: '' },
      { label: 'Qayda Pozuntusu', keys: ['foulsCommitted', 'fouls'], unit: '' },
      { label: 'Sarı Vərəqələr', keys: ['yellowCards'], unit: '' },
    ];

    for (const def of metricDefs) {
      const hv = readNum(hBox.statistics, def.keys);
      const av = readNum(aBox.statistics, def.keys);
      if (hv !== null && av !== null) {
        stats.push({ label: def.label, home: hv, away: av, unit: def.unit });
      }
    }
  }

  const parseForm = (
    evs:
      | Array<{
          gameDate?: string;
          score?: string;
          gameResult?: string;
          atVs?: string;
          opponent?: { displayName?: string };
        }>
      | undefined
  ): PlatformFormItem[] =>
    (evs ?? []).slice(0, 5).map((e) => {
      const resChar = (e.gameResult || 'D').toUpperCase();
      const result: 'W' | 'D' | 'L' = resChar === 'W' ? 'W' : resChar === 'L' ? 'L' : 'D';
      const [s1, s2] = (e.score || '0-0').split('-').map((n) => Number(n) || 0);
      return {
        date: (e.gameDate || '').slice(0, 10),
        opponent: e.opponent?.displayName || 'Rəqib',
        result,
        goalsFor: result === 'W' ? Math.max(s1, s2) : result === 'L' ? Math.min(s1, s2) : s1,
        goalsAgainst: result === 'W' ? Math.min(s1, s2) : result === 'L' ? Math.max(s1, s2) : s2,
        isHome: e.atVs === 'vs',
      };
    });

  const h2h: PlatformH2HItem[] = (json.headToHeadGames?.[0]?.events ?? [])
    .slice(0, 6)
    .map((e) => ({
      date: (e.gameDate || '').slice(0, 10),
      homeTeam: e.homeTeam?.displayName || 'Ev',
      awayTeam: e.awayTeam?.displayName || 'Səfər',
      score: `${e.homeTeamScore ?? 0}-${e.awayTeamScore ?? 0}`,
      competition: e.leagueName || 'Turnir',
    }));

  // Real ESPN odds (DraftKings / Bet365) converted to decimal
  const espnOdds: PlatformBookmakerOdds[] = [];
  for (const o of json.odds ?? []) {
    const h = americanToDecimal(o.homeTeamOdds?.moneyLine);
    const d = americanToDecimal(o.drawOdds?.moneyLine);
    const a = americanToDecimal(o.awayTeamOdds?.moneyLine);
    if (h && d && a) {
      espnOdds.push({
        bookmaker: o.provider?.name || 'ESPN Odds',
        home: h,
        draw: d,
        away: a,
      });
    }
  }

  return {
    matchId: rawMatchId,
    venue: json.gameInfo?.venue?.fullName,
    attendance: json.gameInfo?.attendance,
    referee:
      json.gameInfo?.officials?.[0]?.fullName ||
      json.gameInfo?.officials?.[0]?.displayName,
    homeFormation: homeRosterObj?.formation,
    awayFormation: awayRosterObj?.formation,
    homeLineup,
    awayLineup,
    events,
    stats,
    homeLastForm: parseForm(json.lastFiveGames?.[0]?.events),
    awayLastForm: parseForm(json.lastFiveGames?.[1]?.events),
    h2h,
    espnOdds: espnOdds.length > 0 ? espnOdds : undefined,
  };
}

export async function getLiveTransparencyData(
  forceRefresh = false
): Promise<PlatformTransparencyPayload> {
  const { performance, status } = await getPerformanceData({ forceRefresh });
  const records = performance.recentResults ?? [];

  const archive: PlatformArchivePick[] = records.map((r) => {
    const modelProbPct = r.predictedProb <= 1 ? r.predictedProb * 100 : r.predictedProb;
    // Fair decimal reference odds derived transparently from pre-match probability
    const refOdds = round2(100 / Math.max(8, Math.min(92, modelProbPct)));
    const selection =
      r.predictedSelection === 'home'
        ? `1 (${r.homeTeam})`
        : r.predictedSelection === 'away'
        ? `2 (${r.awayTeam})`
        : 'X (Heç-heçə)';
    return {
      id: r.id,
      date: r.date,
      matchLabel: `${r.homeTeam} – ${r.awayTeam}`,
      league: r.leagueName,
      market: '1X2',
      selection,
      odds: refOdds,
      modelProb: Math.round(modelProbPct * 10) / 10,
      actualOutcome: r.actualScore,
      status: r.hit ? 'WON' : 'LOST',
    };
  });

  const archiveWon = archive.filter((p) => p.status === 'WON').length;
  const totalSettled = performance.totalEvaluated || archive.length;
  const wonCount =
    totalSettled > archive.length
      ? Math.round((performance.overallHitRate / 100) * totalSettled)
      : archiveWon;
  const lostCount = Math.max(0, totalSettled - wonCount);

  // Compute flat-stake ROI against 100/prob fair baseline (-5% bookmaker vig for honest conservative ROI)
  const netUnits = archive.reduce(
    (sum, p) => sum + (p.status === 'WON' ? Math.max(1.05, p.odds * 0.95) - 1 : -1),
    0
  );
  const roiPct = archive.length > 0 ? round2((netUnits / archive.length) * 100) : 0;

  // Calibration buckets from real settled predictions
  const bucketDefs = [
    { range: '35–50%', min: 0, max: 50 },
    { range: '50–60%', min: 50, max: 60 },
    { range: '60–70%', min: 60, max: 70 },
    { range: '70–95%', min: 70, max: 100 },
  ];
  const calibrationBuckets = bucketDefs
    .map((b) => {
      const items = archive.filter((p) => p.modelProb >= b.min && p.modelProb < b.max);
      if (items.length === 0) return null;
      const avgPred = items.reduce((s, p) => s + p.modelProb, 0) / items.length;
      const actual = (items.filter((p) => p.status === 'WON').length / items.length) * 100;
      return {
        range: b.range,
        predictedAvg: Math.round(avgPred * 10) / 10,
        actualRate: Math.round(actual * 10) / 10,
        count: items.length,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const byLeague = (performance.byLeague ?? []).slice(0, 10).map((l) => {
    const leagueItems = archive.filter((p) => p.league === l.leagueName);
    const lNet = leagueItems.reduce(
      (s, p) => s + (p.status === 'WON' ? Math.max(1.05, p.odds * 0.95) - 1 : -1),
      0
    );
    return {
      league: l.leagueName,
      total: l.total,
      won: l.hits,
      hitRatePct: l.hitRate,
      brierScore: l.avgBrier,
      roiPct: leagueItems.length > 0 ? round2((lNet / leagueItems.length) * 100) : 0,
    };
  });

  return {
    sourceLabel: status.sourceLabel ?? 'ESPN Live',
    updatedAt: status.cachedAt ?? new Date().toISOString(),
    metrics: {
      totalSettled,
      wonCount,
      lostCount,
      hitRatePct: performance.overallHitRate,
      highConfidenceHitRatePct: performance.highConfidenceHitRate,
      brierScore: performance.avgBrierScore,
      roiPct,
      byLeague,
      byMarket: [
        {
          market: '1X2 (Əsas Nəticə)',
          total: totalSettled,
          won: wonCount,
          hitRatePct: performance.overallHitRate,
          roiPct,
        },
      ],
      calibrationBuckets,
    },
    archive,
  };
}

export async function getLivePlatformStandings(
  forceRefresh = false
): Promise<{ standings: PlatformStandingsLeague[]; updatedAt: string }> {
  const { standings, status } = await getStandingsData({ forceRefresh });
  return {
    standings: standings.map((s) => ({
      id: s.league.id,
      name: computeLeagueShort(s.league.name),
      country: s.league.country,
      season: s.league.season,
      table: s.table.map((row) => ({
        position: row.position,
        teamId: row.teamId,
        teamName: row.teamName,
        code: row.code,
        played: row.played,
        wins: row.wins,
        draws: row.draws,
        losses: row.losses,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        goalDifference: row.goalDifference,
        points: row.points,
        elo: row.elo,
        form: row.form,
      })),
    })),
    updatedAt: status.cachedAt,
  };
}

export async function getLivePlatformNews(): Promise<PlatformNewsArticle[]> {
  if (newsCache && Date.now() < newsCache.expiresAt) {
    return newsCache.articles;
  }

  const feeds = [
    { slug: 'uefa.champions', label: 'Çempionlar Liqası' },
    { slug: 'eng.1', label: 'Premyer Liqa' },
    { slug: 'esp.1', label: 'La Liqa' },
  ];

  const settled = await Promise.allSettled(
    feeds.map(async (f) => {
      const res = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/soccer/${f.slug}/news?limit=4`,
        { signal: AbortSignal.timeout(7000) }
      );
      if (!res.ok) return [] as PlatformNewsArticle[];
      const json = (await res.json()) as {
        articles?: Array<{
          id?: number | string;
          headline?: string;
          description?: string;
          published?: string;
          images?: Array<{ url?: string }>;
          links?: { web?: { href?: string } };
        }>;
      };
      return (json.articles ?? [])
        .filter((a) => Boolean(a.headline && a.links?.web?.href))
        .map((a, idx) => ({
          id: String(a.id || `${f.slug}-${idx}`),
          headline: a.headline!,
          description: a.description || '',
          league: f.label,
          publishedIso: a.published || new Date().toISOString(),
          imageUrl: a.images?.[0]?.url,
          url: a.links!.web!.href!,
        }));
    })
  );

  const seen = new Set<string>();
  const articles: PlatformNewsArticle[] = [];
  for (const r of settled) {
    if (r.status !== 'fulfilled') continue;
    for (const art of r.value) {
      if (seen.has(art.headline)) continue;
      seen.add(art.headline);
      articles.push(art);
    }
  }

  articles.sort((a, b) => b.publishedIso.localeCompare(a.publishedIso));
  const top = articles.slice(0, 6);
  newsCache = { articles: top, expiresAt: Date.now() + 15 * 60 * 1000 };
  return top;
}

export function getLiveLastRefreshed(): string {
  return lastRefreshedIso;
}
