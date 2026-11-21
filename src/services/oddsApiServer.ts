import type { BookmakerOddsQuote } from '../types/football';

export interface MultiBookmakerMatchOdds {
  matchKey: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime?: string;
  bookmakers: Array<{
    bookmaker: string;
    homeOdds: number;
    drawOdds: number;
    awayOdds: number;
  }>;
  openingBest: {
    homeOdds: number;
    drawOdds: number;
    awayOdds: number;
  };
}

interface OddsCacheEntry {
  quotes: BookmakerOddsQuote[];
  multiByKey: Map<string, MultiBookmakerMatchOdds>;
  fetchedAt: number;
}

const ODDS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
let cachedOdds: OddsCacheEntry | null = null;
const openingBestRegistry = new Map<
  string,
  { homeOdds: number; drawOdds: number; awayOdds: number }
>();

export function normalizeOddsTeamName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(fc|cf|sc|ac|as|afc|fk|pfk|sk|sv|vfb|tsv|cd|ud|rcd|rc|sd|ca|club|de|futbol)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export interface BookmakerOddsResponse {
  configured: boolean;
  provider: string;
  cachedAt: string;
  quotes: BookmakerOddsQuote[];
  error?: string;
}

interface TheOddsApiEvent {
  home_team?: string;
  away_team?: string;
  commence_time?: string;
  bookmakers?: Array<{
    title?: string;
    markets?: Array<{
      key?: string;
      outcomes?: Array<{ name?: string; price?: number }>;
    }>;
  }>;
}

const SPORT_KEYS = [
  'soccer_epl',
  'soccer_spain_la_liga',
  'soccer_germany_bundesliga',
  'soccer_italy_serie_a',
  'soccer_france_ligue_one',
  'soccer_uefa_champs_league',
];

async function fetchLiveOddsInternal(forceRefresh = false): Promise<{
  configured: boolean;
  provider: string;
  cachedAt: string;
  quotes: BookmakerOddsQuote[];
  multiByKey: Map<string, MultiBookmakerMatchOdds>;
  error?: string;
}> {
  const apiKey = (process.env.THE_ODDS_API_KEY || '').trim();
  if (!apiKey) {
    return {
      configured: false,
      provider: 'none',
      cachedAt: new Date().toISOString(),
      quotes: [],
      multiByKey: new Map(),
    };
  }

  if (!forceRefresh && cachedOdds && Date.now() - cachedOdds.fetchedAt < ODDS_CACHE_TTL_MS) {
    return {
      configured: true,
      provider: 'the-odds-api',
      cachedAt: new Date(cachedOdds.fetchedAt).toISOString(),
      quotes: cachedOdds.quotes,
      multiByKey: cachedOdds.multiByKey,
    };
  }

  const quotes: BookmakerOddsQuote[] = [];
  const multiByKey = new Map<string, MultiBookmakerMatchOdds>();
  let lastError: string | undefined;

  const settled = await Promise.allSettled(
    SPORT_KEYS.map(async (sportKey) => {
      const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${encodeURIComponent(
        apiKey
      )}&regions=eu&markets=h2h&oddsFormat=decimal`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const events = (await res.json()) as TheOddsApiEvent[];
      return Array.isArray(events) ? events : [];
    })
  );

  for (const result of settled) {
    if (result.status === 'rejected') {
      lastError = result.reason instanceof Error ? result.reason.message : 'Odds fetch failed';
      continue;
    }
    for (const ev of result.value) {
      if (!ev.home_team || !ev.away_team || !Array.isArray(ev.bookmakers)) continue;
      const matchKey = `${normalizeOddsTeamName(ev.home_team)}__${normalizeOddsTeamName(ev.away_team)}`;
      const collected: MultiBookmakerMatchOdds['bookmakers'] = [];

      for (const bm of ev.bookmakers) {
        const h2h = bm.markets?.find((m) => m.key === 'h2h');
        if (!h2h?.outcomes) continue;
        const homeOut = h2h.outcomes.find((o) => o.name === ev.home_team);
        const awayOut = h2h.outcomes.find((o) => o.name === ev.away_team);
        const drawOut = h2h.outcomes.find((o) => o.name?.toLowerCase() === 'draw');
        if (
          homeOut?.price &&
          drawOut?.price &&
          awayOut?.price &&
          homeOut.price > 1 &&
          drawOut.price > 1 &&
          awayOut.price > 1
        ) {
          collected.push({
            bookmaker: bm.title || 'EU Bookmaker',
            homeOdds: Number(homeOut.price.toFixed(2)),
            drawOdds: Number(drawOut.price.toFixed(2)),
            awayOdds: Number(awayOut.price.toFixed(2)),
          });
        }
      }

      if (collected.length === 0) continue;

      const bestHome = Math.max(...collected.map((c) => c.homeOdds));
      const bestDraw = Math.max(...collected.map((c) => c.drawOdds));
      const bestAway = Math.max(...collected.map((c) => c.awayOdds));

      if (!openingBestRegistry.has(matchKey)) {
        openingBestRegistry.set(matchKey, {
          homeOdds: bestHome,
          drawOdds: bestDraw,
          awayOdds: bestAway,
        });
      }
      const openingBest = openingBestRegistry.get(matchKey)!;

      multiByKey.set(matchKey, {
        matchKey,
        homeTeam: ev.home_team,
        awayTeam: ev.away_team,
        commenceTime: ev.commence_time,
        bookmakers: collected.slice(0, 8),
        openingBest,
      });

      const first = collected[0];
      quotes.push({
        matchKey,
        homeTeam: ev.home_team,
        awayTeam: ev.away_team,
        commenceTime: ev.commence_time,
        bookmaker: first.bookmaker,
        homeOdds: first.homeOdds,
        drawOdds: first.drawOdds,
        awayOdds: first.awayOdds,
      });
    }
  }

  cachedOdds = { quotes, multiByKey, fetchedAt: Date.now() };
  return {
    configured: true,
    provider: 'the-odds-api',
    cachedAt: new Date(cachedOdds.fetchedAt).toISOString(),
    quotes,
    multiByKey,
    ...(quotes.length === 0 && lastError ? { error: lastError } : {}),
  };
}

export async function getBookmakerOdds(forceRefresh = false): Promise<BookmakerOddsResponse> {
  const res = await fetchLiveOddsInternal(forceRefresh);
  return {
    configured: res.configured,
    provider: res.provider,
    cachedAt: res.cachedAt,
    quotes: res.quotes,
    ...(res.error ? { error: res.error } : {}),
  };
}

export async function getMultiBookmakerOddsMap(forceRefresh = false): Promise<{
  configured: boolean;
  provider: string;
  cachedAt: string;
  multiByKey: Map<string, MultiBookmakerMatchOdds>;
}> {
  const res = await fetchLiveOddsInternal(forceRefresh);
  return {
    configured: res.configured,
    provider: res.provider,
    cachedAt: res.cachedAt,
    multiByKey: res.multiByKey,
  };
}
