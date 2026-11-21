import type {
  ApiStatusInfo,
  BookmakerOddsQuote,
  FormEntry,
  HeadToHeadEntry,
  LeagueInfo,
  LeagueStandings,
  MatchRecord,
  MatchWithPrediction,
  PerformanceSummary,
} from '../types/football';
import { predictMatch } from '../engine/predictionEngine';
import type { ChatImageAttachment, CouponConceptConfig } from '../engine/couponAnalyzer';

export class FootballServiceError extends Error {
  code: 'RATE_LIMITED' | 'NETWORK_ERROR' | 'UPSTREAM_ERROR';
  retryAfterSeconds?: number;

  constructor(
    code: 'RATE_LIMITED' | 'NETWORK_ERROR' | 'UPSTREAM_ERROR',
    message: string,
    retryAfterSeconds?: number
  ) {
    super(message);
    this.name = 'FootballServiceError';
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

interface ClientCacheEntry<T> {
  data: T;
  expiresAt: number;
}

const CLIENT_TTL_MS = 60_000;
const clientCache = new Map<string, ClientCacheEntry<unknown>>();

function readClientCache<T>(key: string): T | null {
  const entry = clientCache.get(key) as ClientCacheEntry<T> | undefined;
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry.data;
}

const OFFLINE_KEYS = {
  matches: 'matchedge_offline_matches_v1',
  standings: 'matchedge_offline_standings_v1',
  performance: 'matchedge_offline_performance_v1',
} as const;

function writeClientCache<T>(key: string, data: T): void {
  clientCache.set(key, {
    data,
    expiresAt: Date.now() + CLIENT_TTL_MS,
  });
}

function readOfflineSnapshot<T>(storageKey: string): T | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeOfflineSnapshot<T>(storageKey: string, data: T): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, JSON.stringify(data));
  } catch {
    // Ignore quota errors gracefully
  }
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    throw new FootballServiceError(
      'NETWORK_ERROR',
      err instanceof Error ? err.message : 'Network error'
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const rawText = await response.text();
  const trimmed = rawText.trimStart();
  const looksLikeHtml =
    contentType.includes('text/html') ||
    trimmed.startsWith('<!doctype') ||
    trimmed.startsWith('<!DOCTYPE') ||
    trimmed.startsWith('<html');

  if (response.status === 429) {
    let message = 'API rate limit reached';
    let retryAfterSeconds = 60;
    if (!looksLikeHtml && trimmed) {
      try {
        const body = JSON.parse(rawText) as {
          message?: string;
          retryAfterSeconds?: number;
        };
        if (body.message) message = body.message;
        if (body.retryAfterSeconds) retryAfterSeconds = body.retryAfterSeconds;
      } catch {
        // ignore
      }
    }
    throw new FootballServiceError('RATE_LIMITED', message, retryAfterSeconds);
  }

  if (looksLikeHtml) {
    throw new FootballServiceError(
      'UPSTREAM_ERROR',
      'Live data server temporarily unavailable. Please retry.'
    );
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    if (trimmed) {
      try {
        const body = JSON.parse(rawText) as { message?: string };
        if (body.message) message = body.message;
      } catch {
        // ignore
      }
    }
    throw new FootballServiceError('UPSTREAM_ERROR', message);
  }

  try {
    return JSON.parse(rawText) as T;
  } catch {
    throw new FootballServiceError('UPSTREAM_ERROR', `Invalid JSON payload from ${url}`);
  }
}

export interface MatchesPayload {
  matches: MatchWithPrediction[];
  leagues: LeagueInfo[];
  status: ApiStatusInfo;
  fromStaleCache?: boolean;
}

export interface StandingsPayload {
  standings: LeagueStandings[];
  status: ApiStatusInfo;
}

export interface PerformancePayload {
  performance: PerformanceSummary;
  status: ApiStatusInfo;
}

export interface MatchDetailEnrichment {
  homeLastForm?: FormEntry[];
  awayLastForm?: FormEntry[];
  h2h?: HeadToHeadEntry[];
  homeAbsences?: MatchRecord['homeTeam']['absences'];
  awayAbsences?: MatchRecord['awayTeam']['absences'];
  venue?: string;
  liveStats?: MatchRecord['liveStats'];
}

export const footballService = {
  async fetchMatches(options?: {
    forceRefresh?: boolean;
    signal?: AbortSignal;
  }): Promise<MatchesPayload> {
    const cacheKey = 'client:matches';
    if (!options?.forceRefresh) {
      const hit = readClientCache<MatchesPayload>(cacheKey);
      if (hit) return hit;
    }

    const query = options?.forceRefresh ? '?refresh=1' : '';
    try {
      const raw = await fetchJson<{
        matches: MatchRecord[];
        leagues: LeagueInfo[];
        status: ApiStatusInfo;
        fromStaleCache?: boolean;
      }>(`/api/football/matches${query}`, options?.signal);

      const enriched: MatchWithPrediction[] = raw.matches.map((m) => ({
        ...m,
        prediction: predictMatch(m),
      }));

      const payload: MatchesPayload = {
        matches: enriched,
        leagues: raw.leagues,
        status: raw.status,
        fromStaleCache: raw.fromStaleCache,
      };
      writeClientCache(cacheKey, payload);
      writeOfflineSnapshot(OFFLINE_KEYS.matches, payload);
      return payload;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      const offline = readOfflineSnapshot<MatchesPayload>(OFFLINE_KEYS.matches);
      if (offline) {
        return { ...offline, fromStaleCache: true };
      }
      throw err;
    }
  },

  async fetchMatchDetail(
    match: MatchWithPrediction,
    signal?: AbortSignal
  ): Promise<MatchWithPrediction> {
    if (
      !match.id.startsWith('espn-') &&
      !match.id.startsWith('af-') &&
      !match.id.startsWith('fd-')
    ) {
      return match;
    }
    const cacheKey = `client:detail:${match.id}:${match.minute ?? 'pre'}`;
    const hit = readClientCache<MatchWithPrediction>(cacheKey);
    if (hit) return hit;

    const slug = match.leagueSlug || 'all';
    const enrichment = await fetchJson<MatchDetailEnrichment>(
      `/api/football/match/${encodeURIComponent(match.id)}?leagueSlug=${encodeURIComponent(slug)}`,
      signal
    );

    const updatedRecord: MatchRecord = {
      ...match,
      venue: enrichment.venue || match.venue,
      liveStats: enrichment.liveStats || match.liveStats,
      h2h: enrichment.h2h && enrichment.h2h.length > 0 ? enrichment.h2h : match.h2h,
      homeTeam: {
        ...match.homeTeam,
        last10Form:
          enrichment.homeLastForm && enrichment.homeLastForm.length > 0
            ? enrichment.homeLastForm
            : match.homeTeam.last10Form,
        absences:
          enrichment.homeAbsences && enrichment.homeAbsences.length > 0
            ? enrichment.homeAbsences
            : match.homeTeam.absences,
      },
      awayTeam: {
        ...match.awayTeam,
        last10Form:
          enrichment.awayLastForm && enrichment.awayLastForm.length > 0
            ? enrichment.awayLastForm
            : match.awayTeam.last10Form,
        absences:
          enrichment.awayAbsences && enrichment.awayAbsences.length > 0
            ? enrichment.awayAbsences
            : match.awayTeam.absences,
      },
    };

    const enrichedMatch: MatchWithPrediction = {
      ...updatedRecord,
      prediction: predictMatch(updatedRecord),
    };
    writeClientCache(cacheKey, enrichedMatch);
    return enrichedMatch;
  },

  async fetchStandings(options?: {
    forceRefresh?: boolean;
    signal?: AbortSignal;
  }): Promise<StandingsPayload> {
    const cacheKey = 'client:standings';
    if (!options?.forceRefresh) {
      const hit = readClientCache<StandingsPayload>(cacheKey);
      if (hit) return hit;
    }

    const query = options?.forceRefresh ? '?refresh=1' : '';
    try {
      const payload = await fetchJson<StandingsPayload>(
        `/api/football/standings${query}`,
        options?.signal
      );
      writeClientCache(cacheKey, payload);
      writeOfflineSnapshot(OFFLINE_KEYS.standings, payload);
      return payload;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      const offline = readOfflineSnapshot<StandingsPayload>(OFFLINE_KEYS.standings);
      if (offline) return offline;
      throw err;
    }
  },

  async fetchPerformance(options?: {
    forceRefresh?: boolean;
    signal?: AbortSignal;
  }): Promise<PerformancePayload> {
    const cacheKey = 'client:performance';
    if (!options?.forceRefresh) {
      const hit = readClientCache<PerformancePayload>(cacheKey);
      if (hit) return hit;
    }

    const query = options?.forceRefresh ? '?refresh=1' : '';
    try {
      const payload = await fetchJson<PerformancePayload>(
        `/api/football/performance${query}`,
        options?.signal
      );
      writeClientCache(cacheKey, payload);
      writeOfflineSnapshot(OFFLINE_KEYS.performance, payload);
      return payload;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      const offline = readOfflineSnapshot<PerformancePayload>(OFFLINE_KEYS.performance);
      if (offline) return offline;
      throw err;
    }
  },

  async fetchBookmakerOdds(forceRefresh = false): Promise<{
    configured: boolean;
    provider: string;
    cachedAt: string;
    quotes: BookmakerOddsQuote[];
    error?: string;
  }> {
    const query = forceRefresh ? '?refresh=1' : '';
    return fetchJson(`/api/football/odds${query}`);
  },

  async streamMatchChat(params: {
    match: MatchWithPrediction;
    message: string;
    history: Array<{ role: 'user' | 'model'; text: string }>;
    lang: 'az' | 'en' | 'ru';
    images?: ChatImageAttachment[];
    couponConcept?: CouponConceptConfig | null;
    onChunk: (chunk: string) => void;
    signal?: AbortSignal;
  }): Promise<string> {
    const localizedUnavailable =
      params.lang === 'az'
        ? 'Çat xidməti ilə əlaqə müvəqqəti kəsildi. Zəhmət olmasa yenidən cəhd edin.'
        : params.lang === 'ru'
          ? 'Связь с чат-сервисом временно прервана. Пожалуйста, повторите попытку.'
          : 'Chat service temporarily unavailable. Please retry.';

    const payloadBody = JSON.stringify({
      match: params.match,
      message: params.message,
      history: params.history,
      lang: params.lang,
      ...(params.images && params.images.length > 0 ? { images: params.images } : {}),
      ...(params.couponConcept ? { couponConcept: params.couponConcept } : {}),
    });

    const sendRequest = async (useJsonMode: boolean): Promise<Response> => {
      const url = useJsonMode ? '/api/football/chat?mode=json' : '/api/football/chat';
      try {
        return await fetch(url, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
            Accept: useJsonMode ? 'application/json' : 'text/event-stream, application/json',
          },
          body: payloadBody,
          signal: params.signal,
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          throw err;
        }
        throw new FootballServiceError(
          'NETWORK_ERROR',
          err instanceof Error ? err.message : 'Network error'
        );
      }
    };

    const looksLikeHtmlText = (raw: string, contentType: string): boolean => {
      const t = raw.trimStart().toLowerCase();
      return (
        contentType.toLowerCase().includes('text/html') ||
        t.startsWith('<!doctype') ||
        t.startsWith('<html')
      );
    };

    const parseJsonFallback = async (response: Response): Promise<string> => {
      const contentType = response.headers.get('content-type') || '';
      const rawText = await response.text();
      if (!response.ok) {
        let message = `HTTP ${response.status}`;
        if (!looksLikeHtmlText(rawText, contentType) && rawText.trim()) {
          try {
            const errBody = JSON.parse(rawText) as { message?: string };
            if (errBody.message) message = errBody.message;
          } catch {
            // ignore
          }
        } else {
          message = localizedUnavailable;
        }
        throw new FootballServiceError(
          response.status === 429 ? 'RATE_LIMITED' : 'UPSTREAM_ERROR',
          message
        );
      }

      if (looksLikeHtmlText(rawText, contentType)) {
        throw new FootballServiceError('UPSTREAM_ERROR', localizedUnavailable);
      }

      const parsed = JSON.parse(rawText) as { text?: string; message?: string };
      if (parsed.text) {
        params.onChunk(parsed.text);
        return parsed.text;
      }
      throw new FootballServiceError('UPSTREAM_ERROR', parsed.message || 'Empty response');
    };

    let response = await sendRequest(false);

    // If SSE endpoint hit a transient proxy/restart HTML or 502/503/504 response, retry once in JSON mode
    const initialContentType = response.headers.get('content-type') || '';
    const shouldRetryJson =
      initialContentType.toLowerCase().includes('text/html') ||
      response.status === 502 ||
      response.status === 503 ||
      response.status === 504;

    if (shouldRetryJson) {
      await new Promise((r) => setTimeout(r, 450));
      response = await sendRequest(true);
      return parseJsonFallback(response);
    }

    if (!response.ok) {
      return parseJsonFallback(response);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/event-stream') || !response.body) {
      const text = await response.text();
      if (looksLikeHtmlText(text, contentType)) {
        // Retry once cleanly over JSON mode before surfacing an error
        await new Promise((r) => setTimeout(r, 450));
        const retryRes = await sendRequest(true);
        return parseJsonFallback(retryRes);
      }
      const parsed = JSON.parse(text) as { text?: string; message?: string };
      if (parsed.text) {
        params.onChunk(parsed.text);
        return parsed.text;
      }
      throw new FootballServiceError('UPSTREAM_ERROR', parsed.message || 'Empty response');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let accumulated = '';

    const processEventBlock = (rawEvent: string) => {
      const lines = rawEvent
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trim())
        .filter(Boolean);
      for (const jsonStr of lines) {
        const payload = JSON.parse(jsonStr) as { text?: string; error?: string; done?: boolean };
        if (payload.error) {
          throw new FootballServiceError('UPSTREAM_ERROR', payload.error);
        }
        if (payload.text) {
          accumulated += payload.text;
          params.onChunk(payload.text);
        }
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';

      for (const rawEvent of events) {
        processEventBlock(rawEvent);
      }
    }

    if (buffer.trim()) {
      processEventBlock(buffer);
    }

    return accumulated;
  },

  clearCache(): void {
    clientCache.clear();
  },
};
