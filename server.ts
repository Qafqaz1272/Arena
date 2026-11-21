import 'dotenv/config';
import http from 'http';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getApiStatus,
  getMatchDetailEnrichment,
  getMatchesData,
  getPerformanceData,
  getStandingsData,
  RateLimitError,
} from './src/services/footballApiServer.ts';
import {
  MatchChatConfigError,
  streamMatchAnalystReply,
} from './src/services/matchChatServer.ts';
import { getBookmakerOdds } from './src/services/oddsApiServer.ts';
import {
  getLiveCandidateLegs,
  getLiveMatchDetail,
  getLivePlatformMatches,
  getLivePlatformNews,
  getLivePlatformStandings,
  getLiveSmartCoupons,
  getLiveTransparencyData,
} from './src/services/livePlatformServer.ts';
import {
  attachLiveScoreSseClient,
  pollLiveScoresOnce,
} from './src/services/liveScoreStreamServer.ts';
import {
  generateMatchAiSummary,
  runPlatformAssistantStream,
} from './src/services/platformAiServer.ts';
import {
  evaluateCustomCoupon,
  type CouponLeg,
} from './src/utils/bettingInsightsEngine.ts';
import type { Language, MatchWithPrediction } from './src/types/football.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = Number(process.env.PORT || 3000);

  // Periodic background live data cache refresh (every 5 min)
  const refreshJob = setInterval(() => {
    void getLivePlatformMatches({ forceRefresh: true }).catch(() => {});
  }, 5 * 60 * 1000);
  refreshJob.unref?.();

  app.use(express.json({ limit: '8mb' }));

  // Ensure malformed or oversized JSON bodies return JSON rather than Express HTML
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      if (err && typeof err === 'object' && 'status' in err) {
        const errStatus = (err as { status?: number }).status;
        if (errStatus === 413) {
          res.status(413).json({
            error: 'PAYLOAD_TOO_LARGE',
            message: 'Uploaded screenshot is too large. Please upload an image under 5MB.',
          });
          return;
        }
        if (errStatus === 400) {
          res.status(400).json({ error: 'INVALID_JSON', message: 'Invalid JSON request body.' });
          return;
        }
      }
      next(err);
    }
  );

  // Health & API provider status
  app.get('/api/football/status', (_req, res) => {
    res.json(getApiStatus());
  });

  // Real-time Server-Sent Events stream for instant live score, minute, card & goal push alerts
  app.get('/api/platform/live-stream', (req, res) => {
    attachLiveScoreSseClient(req, res);
  });

  // ARENA AZ Unified Live Real Match Center API (ESPN Live + The Odds API + Dixon-Coles)
  app.get('/api/platform/matches', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === '1';
      const dateFilter = typeof req.query.date === 'string' ? req.query.date.trim() : '';
      const statusFilter =
        typeof req.query.status === 'string' ? req.query.status.trim().toUpperCase() : '';
      const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';

      const explicitDate = /^\d{4}-\d{2}-\d{2}$/.test(dateFilter) ? dateFilter : undefined;
      if (forceRefresh) {
        await pollLiveScoresOnce().catch(() => {});
      }
      const liveBundle = await getLivePlatformMatches({
        date: explicitDate,
        forceRefresh,
      });

      let list = liveBundle.matches;
      if (dateFilter && dateFilter !== 'all') {
        list = list.filter((m) => m.dateId === dateFilter || m.dateIso === dateFilter);
      }
      if (statusFilter && ['LIVE', 'FINISHED', 'UPCOMING'].includes(statusFilter)) {
        list = list.filter((m) => m.status === statusFilter);
      }
      if (q) {
        list = list.filter(
          (m) =>
            m.homeTeamName.toLowerCase().includes(q) ||
            m.awayTeamName.toLowerCase().includes(q) ||
            m.leagueName.toLowerCase().includes(q) ||
            m.country.toLowerCase().includes(q)
        );
      }

      res.setHeader('Cache-Control', 'no-store');
      res.json({
        matches: list,
        refreshedAt: liveBundle.refreshedAt,
        sourceLabel: liveBundle.sourceLabel,
        oddsConfigured: liveBundle.oddsConfigured,
        total: list.length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Canlı matç məlumatı yüklənmədi.';
      res.status(502).json({ error: 'LIVE_FEED_ERROR', message });
    }
  });

  // Live ESPN match detail enrichment (11v11 rosters, events, boxscore stats, H2H, last-5 form, referee)
  app.get('/api/platform/matches/:id', async (req, res) => {
    try {
      const leagueSlug = typeof req.query.leagueSlug === 'string' ? req.query.leagueSlug : 'all';
      const detail = await getLiveMatchDetail(req.params.id, leagueSlug);
      res.setHeader('Cache-Control', 'no-store');
      res.json(detail);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Matç detalları yüklənmədi.';
      res.status(502).json({ error: 'MATCH_DETAIL_ERROR', message });
    }
  });

  app.get('/api/platform/coupons', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === '1';
      const result = await getLiveSmartCoupons(forceRefresh);
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Canlı kuponlar hesablanmadı.';
      res.status(502).json({ error: 'COUPON_ERROR', message });
    }
  });

  app.post('/api/platform/coupons/evaluate', async (req, res) => {
    try {
      const body = req.body as { legs?: unknown };
      if (!Array.isArray(body?.legs) || body.legs.length > 15) {
        res
          .status(400)
          .json({ error: 'INVALID_REQUEST', message: 'Valid coupon legs array (1-15) required.' });
        return;
      }
      const sanitizedLegs: CouponLeg[] = body.legs
        .filter((l): l is CouponLeg =>
          Boolean(l && typeof l === 'object' && typeof (l as CouponLeg).matchId === 'string')
        )
        .map((l) => ({
          id: String(l.id ?? `${l.matchId}-${l.selection}`).slice(0, 100),
          matchId: String(l.matchId).slice(0, 80),
          matchLabel: String(l.matchLabel ?? '').slice(0, 120),
          league: String(l.league ?? '').slice(0, 60),
          market: String(l.market ?? '1X2').slice(0, 40),
          selection: String(l.selection ?? '').slice(0, 80),
          odds: Math.max(1.01, Math.min(1000, Number(l.odds) || 1.5)),
          modelProb: Math.max(1, Math.min(99, Number(l.modelProb) || 50)),
          impliedProb: Math.max(1, Math.min(99, Number(l.impliedProb) || 50)),
          edgePct: Math.max(-99, Math.min(99, Number(l.edgePct) || 0)),
          confidence:
            l.confidence === 'Yüksək' || l.confidence === 'Aşağı' ? l.confidence : 'Orta',
        }));

      const { matches } = await getLivePlatformMatches();
      const pool = getLiveCandidateLegs(matches);
      const evaluation = evaluateCustomCoupon(sanitizedLegs, pool);
      res.json({ evaluation });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kupon analizi xətası.';
      res.status(500).json({ error: 'EVALUATE_ERROR', message });
    }
  });

  app.get('/api/platform/transparency', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === '1';
      const data = await getLiveTransparencyData(forceRefresh);
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.json(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Tarixi performans yüklənmədi.';
      res.status(502).json({ error: 'TRANSPARENCY_ERROR', message });
    }
  });

  app.get('/api/platform/standings', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === '1';
      const data = await getLivePlatformStandings(forceRefresh);
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.json(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Turnir cədvəlləri yüklənmədi.';
      res.status(502).json({ error: 'STANDINGS_ERROR', message });
    }
  });

  app.get('/api/platform/news', async (_req, res) => {
    try {
      const articles = await getLivePlatformNews();
      res.setHeader('Cache-Control', 'public, max-age=600');
      res.json({ articles });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Xəbərlər yüklənmədi.';
      res.status(502).json({ error: 'NEWS_ERROR', message });
    }
  });

  // Server-side @google/genai 3-4 sentence Azerbaijani Match Summary
  app.get('/api/ai/match-summary/:id', async (req, res) => {
    try {
      const matchId = String(req.params.id || '').slice(0, 80);
      if (!matchId) {
        res.status(400).json({ error: 'INVALID_REQUEST', message: 'Match ID required.' });
        return;
      }
      const result = await generateMatchAiSummary(matchId);
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI analiz xülasəsi hazırlana bilmədi.';
      res.status(502).json({ error: 'SUMMARY_ERROR', message });
    }
  });

  // Server-side @google/genai Tool-Calling AI Assistant (SSE streaming)
  app.post('/api/ai/assistant', async (req, res) => {
    const body = req.body as {
      message?: unknown;
      history?: unknown;
      lang?: unknown;
      activeCouponLegs?: unknown;
    };

    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    if (!message || message.length > 1500) {
      res.status(400).json({ error: 'INVALID_REQUEST', message: 'Sual mətni tələb olunur (maks 1500 simvol).' });
      return;
    }

    const lang = body?.lang === 'en' || body?.lang === 'ru' ? body.lang : 'az';
    const history = Array.isArray(body?.history)
      ? body.history
          .filter(
            (h): h is { role: 'user' | 'model'; text: string } =>
              Boolean(h && typeof h === 'object' && typeof (h as { text?: unknown }).text === 'string')
          )
          .slice(-8)
      : [];

    const activeCouponLegs = Array.isArray(body?.activeCouponLegs)
      ? (body.activeCouponLegs as CouponLeg[]).slice(0, 12)
      : [];

    const controller = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) controller.abort();
    });

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();
    res.write(': connected\n\n');

    try {
      await runPlatformAssistantStream({
        message,
        history,
        lang,
        activeCouponLegs,
        signal: controller.signal,
        callbacks: {
          onToolUsed: (toolName, summary) => {
            if (!res.writableEnded) {
              res.write(`data: ${JSON.stringify({ tool: { name: toolName, summary } })}\n\n`);
            }
          },
          onChunk: (text) => {
            if (!res.writableEnded) {
              res.write(`data: ${JSON.stringify({ text })}\n\n`);
            }
          },
        },
      });

      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      }
    } catch (err) {
      if (!res.writableEnded) {
        const msg = err instanceof Error ? err.message : 'AI cavabı yaradılarkən xəta baş verdi.';
        res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
        res.end();
      }
    }
  });

  // Live daily matches endpoint
  app.get('/api/football/matches', async (req, res) => {
    try {
      const date = typeof req.query.date === 'string' ? req.query.date : undefined;
      const forceRefresh = req.query.refresh === '1';
      const result = await getMatchesData({ date, forceRefresh });
      res.setHeader('Cache-Control', `public, max-age=${result.status.cacheTtlSeconds}`);
      res.json(result);
    } catch (err) {
      if (err instanceof RateLimitError) {
        res.status(429).json({
          error: 'RATE_LIMITED',
          message: err.message,
          retryAfterSeconds: err.resetSeconds,
        });
        return;
      }
      const message = err instanceof Error ? err.message : 'Unexpected server error';
      res.status(500).json({ error: 'UPSTREAM_ERROR', message });
    }
  });

  // On-demand real match summary enrichment (last 5 games with opponents/scores, H2H, venue)
  app.get('/api/football/match/:id', async (req, res) => {
    try {
      const leagueSlug =
        typeof req.query.leagueSlug === 'string' ? req.query.leagueSlug : 'all';
      const enrichment = await getMatchDetailEnrichment(req.params.id, leagueSlug);
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.json(enrichment);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to fetch match details';
      res.status(500).json({ error: 'UPSTREAM_ERROR', message });
    }
  });

  // Live league standings & team metrics endpoint
  app.get('/api/football/standings', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === '1';
      const result = await getStandingsData({ forceRefresh });
      res.setHeader('Cache-Control', 'public, max-age=900');
      res.json(result);
    } catch (err) {
      if (err instanceof RateLimitError) {
        res.status(429).json({
          error: 'RATE_LIMITED',
          message: err.message,
          retryAfterSeconds: err.resetSeconds,
        });
        return;
      }
      const message = err instanceof Error ? err.message : 'Unexpected server error';
      res.status(500).json({ error: 'UPSTREAM_ERROR', message });
    }
  });

  // Real settled-match performance & calibration endpoint
  app.get('/api/football/performance', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === '1';
      const result = await getPerformanceData({ forceRefresh });
      res.setHeader('Cache-Control', 'public, max-age=900');
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected server error';
      res.status(500).json({ error: 'SERVER_ERROR', message });
    }
  });

  // Optional bookmaker odds endpoint (uses THE_ODDS_API_KEY if set; returns configured:false otherwise)
  app.get('/api/football/odds', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === '1';
      const result = await getBookmakerOdds(forceRefresh);
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to fetch odds';
      res.status(500).json({ error: 'ODDS_ERROR', message });
    }
  });

  // Match-aware AI Analyst chat endpoint (server-side @google/genai, multimodal screenshots + SSE streaming + JSON mode)
  app.post('/api/football/chat', async (req, res) => {
    const body = req.body as {
      match?: MatchWithPrediction;
      message?: string;
      history?: unknown;
      lang?: Language;
      images?: unknown;
      couponConcept?: unknown;
    };

    if (!body?.match || !body.match.homeTeam || !body.match.awayTeam || !body.match.prediction) {
      res.status(400).json({ error: 'INVALID_REQUEST', message: 'Valid match context is required.' });
      return;
    }
    const hasMessage = typeof body.message === 'string' && body.message.trim().length > 0;
    const hasImages = Array.isArray(body.images) && body.images.length > 0;
    if (!hasMessage && !hasImages) {
      res.status(400).json({ error: 'INVALID_REQUEST', message: 'Message or screenshot is required.' });
      return;
    }

    const lang: Language =
      body.lang === 'az' || body.lang === 'en' || body.lang === 'ru' ? body.lang : 'az';
    const jsonMode = req.query.mode === 'json';

    const requestAbort = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) {
        requestAbort.abort();
      }
    });

    if (jsonMode) {
      try {
        const text = await streamMatchAnalystReply({
          match: body.match,
          message: body.message ?? '',
          history: body.history,
          lang,
          images: body.images,
          couponConcept: body.couponConcept,
          signal: requestAbort.signal,
          onChunk: () => {
            // Buffer full reply in JSON fallback mode
          },
        });
        if (!res.writableEnded) {
          res.status(200).json({ text });
        }
      } catch (err) {
        if (requestAbort.signal.aborted || res.writableEnded) return;
        const rawStatus = err instanceof MatchChatConfigError ? err.statusCode : 500;
        const status = [403, 502, 503, 504].includes(rawStatus) ? 500 : rawStatus;
        const message = err instanceof Error ? err.message : 'Unable to generate response';
        res.status(status).json({ error: 'CHAT_ERROR', message });
      }
      return;
    }

    let headersSentAsStream = false;
    const ensureStreamHeaders = () => {
      if (headersSentAsStream || res.writableEnded) return;
      headersSentAsStream = true;
      res.status(200);
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();
    };

    try {
      await streamMatchAnalystReply({
        match: body.match,
        message: body.message ?? '',
        history: body.history,
        lang,
        images: body.images,
        couponConcept: body.couponConcept,
        signal: requestAbort.signal,
        onChunk: (text) => {
          if (res.writableEnded) return;
          ensureStreamHeaders();
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        },
      });

      if (!res.writableEnded) {
        ensureStreamHeaders();
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      }
    } catch (err) {
      if (requestAbort.signal.aborted || res.writableEnded) return;
      const rawStatus = err instanceof MatchChatConfigError ? err.statusCode : 500;
      const status = [403, 502, 503, 504].includes(rawStatus) ? 500 : rawStatus;
      const message = err instanceof Error ? err.message : 'Unable to generate response';
      if (!headersSentAsStream) {
        res.status(status).json({ error: 'CHAT_ERROR', message });
      } else {
        res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
        res.end();
      }
    }
  });

  // Never let unmatched /api/* requests fall through to Vite SPA HTML
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'NOT_FOUND', message: 'API route not found.' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer,
        },
        watch: process.env.DISABLE_HMR === 'true' ? null : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`MatchEdge server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
