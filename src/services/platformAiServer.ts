import {
  GoogleGenAI,
  ThinkingLevel,
  Type,
  type Content,
  type FunctionDeclaration,
} from '@google/genai';
import {
  getLiveCandidateLegs,
  getLiveMatchDetail,
  getLivePlatformMatches,
  getLiveSmartCoupons,
  getLiveTransparencyData,
} from './livePlatformServer.ts';
import {
  evaluateCustomCoupon,
  MANDATORY_DISCLAIMER_AZ,
  type CouponLeg,
} from '../utils/bettingInsightsEngine.ts';

const PRIMARY_MODEL = 'gemini-4-hydrogen';
const FALLBACK_MODEL = 'gemini-3.1-flash-lite';

export interface AssistantChatTurn {
  role: 'user' | 'model';
  text: string;
}

export interface AssistantStreamCallbacks {
  onToolUsed: (toolName: string, summary: string) => void;
  onChunk: (text: string) => void;
}

function resolveApiKey(): string | null {
  const raw = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!raw) return null;
  const cleaned = raw.trim().replace(/^['"]+|['"]+$/g, '').trim();
  if (!cleaned || cleaned === 'MY_GEMINI_API_KEY') return null;
  return cleaned;
}

function normalizeQuery(str: string): string {
  return str
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ə/g, 'e')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .trim();
}

const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'get_value_bets',
    description:
      'Returns LIVE real matches today/tomorrow that have REAL bookmaker odds from The Odds API and positive Value Bets (model edge > 5%). Never invents odds.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        leagueFilter: {
          type: Type.STRING,
          description: 'Optional league filter (e.g. "Premier League", "La Liga", "Serie A", "Ligue 1").',
        },
      },
    },
  },
  {
    name: 'analyze_match',
    description:
      'Fetches real live ESPN match data, Dixon-Coles probabilities (1X2, xG, O/U 2.5, BTTS), real bookmaker odds (if available), real last-5 form, H2H, and live boxscore stats for a real match.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'Team name(s) or match name from today live feed (e.g. "Arsenal", "PSG", "Roma", "Newcastle").',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_daily_coupons',
    description:
      'Returns non-correlated coupons built strictly from today real live matches that have real bookmaker odds.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'evaluate_user_coupon',
    description:
      'Evaluates the user active custom coupon legs for combined probability, combined odds, correlation risk, weakest leg, and safer alternative using live odds.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'get_model_transparency',
    description:
      'Returns real backtested historical accuracy, Brier score, hit rate by league, and ROI from real settled ESPN matches.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
];

async function executeLiveTool(
  toolName: string,
  args: Record<string, unknown>,
  activeCouponLegs: CouponLeg[]
): Promise<{ summaryAz: string; payload: unknown }> {
  if (toolName === 'get_value_bets') {
    const { matches, sourceLabel } = await getLivePlatformMatches();
    const leagueFilter = typeof args.leagueFilter === 'string' ? normalizeQuery(args.leagueFilter) : '';
    const allValue = matches
      .filter((m) => m.status !== 'FINISHED' && m.hasRealOdds)
      .flatMap((m) =>
        m.valueBets
          .filter((vb) => vb.isValueBet)
          .map((vb) => ({
            matchId: m.id,
            match: vb.matchLabel,
            league: m.leagueShort,
            date: m.dateIso,
            time: m.time,
            market: vb.market,
            selection: vb.selection,
            modelProbPct: vb.modelProb,
            bookmakerOdds: vb.bookmakerOdds,
            impliedProbPct: vb.impliedProb,
            edgePct: vb.edgePct,
            evPct: vb.evPct,
            confidence: vb.confidence,
            bookmakersCount: m.bookmakerOdds.length,
          }))
      )
      .filter((item) => !leagueFilter || normalizeQuery(item.league).includes(leagueFilter))
      .sort((a, b) => b.edgePct - a.edgePct)
      .slice(0, 8);

    return {
      summaryAz: `${allValue.length} real Value Bet (+5%) canlı ${sourceLabel} bazasından oxundu`,
      payload: {
        source: sourceLabel,
        totalMatchesChecked: matches.length,
        matchesWithRealOdds: matches.filter((m) => m.hasRealOdds).length,
        valueBets: allValue,
        disclaimer: MANDATORY_DISCLAIMER_AZ,
      },
    };
  }

  if (toolName === 'analyze_match') {
    const { matches, sourceLabel } = await getLivePlatformMatches();
    const q = typeof args.query === 'string' ? normalizeQuery(args.query) : '';
    const tokens = q.split(/[\s\-–,]+/).filter((t) => t.length >= 2);
    const scored = matches
      .map((m) => {
        const hay = normalizeQuery(`${m.homeTeamName} ${m.awayTeamName} ${m.leagueName} ${m.country}`);
        const hits = tokens.reduce((acc, tok) => acc + (hay.includes(tok) ? 1 : 0), 0);
        return { match: m, hits };
      })
      .sort((a, b) => b.hits - a.hits || (b.match.hasRealOdds ? 1 : 0) - (a.match.hasRealOdds ? 1 : 0));

    const best = scored[0]?.hits > 0 ? scored[0].match : matches[0];
    if (!best) {
      return {
        summaryAz: 'Hazırda aktiv real oyun tapılmadı',
        payload: { error: 'NO_LIVE_MATCHES_FOUND', source: sourceLabel },
      };
    }

    const detail = await getLiveMatchDetail(best.id, best.leagueSlug).catch(() => null);

    return {
      summaryAz: `${best.homeTeamName} – ${best.awayTeamName} canlı ESPN datası yükləndi`,
      payload: {
        source: sourceLabel,
        matchFoundExact: scored[0]?.hits > 0,
        match: `${best.homeTeamName} – ${best.awayTeamName}`,
        league: best.leagueName,
        country: best.country,
        date: best.dateIso,
        status: best.status,
        score:
          best.homeScore !== null ? `${best.homeScore}-${best.awayScore} (${best.minute})` : best.time,
        stadium: detail?.venue || best.stadium,
        referee: detail?.referee || null,
        prediction: best.prediction,
        hasRealOdds: best.hasRealOdds,
        bestOdds: best.bestOdds,
        fairOdds: best.fairOdds,
        bookmakerOdds: best.bookmakerOdds.slice(0, 5),
        valueBets: best.valueBets.filter((v) => v.isValueBet),
        liveStats: detail?.stats ?? [],
        homeLastForm: detail?.homeLastForm ?? [],
        awayLastForm: detail?.awayLastForm ?? [],
        h2h: detail?.h2h?.slice(0, 4) ?? [],
      },
    };
  }

  if (toolName === 'get_daily_coupons') {
    const { coupons, realOddsMatchCount } = await getLiveSmartCoupons();
    return {
      summaryAz: `${realOddsMatchCount} real əmsallı oyun üzərindən ${coupons.length} kupon hesablandı`,
      payload: { realOddsMatchCount, coupons },
    };
  }

  if (toolName === 'evaluate_user_coupon') {
    const { matches } = await getLivePlatformMatches();
    const pool = getLiveCandidateLegs(matches);
    const effectiveLegs =
      activeCouponLegs.length > 0
        ? activeCouponLegs
        : (await getLiveSmartCoupons()).coupons[0]?.legs ?? [];
    const evaluation = evaluateCustomCoupon(effectiveLegs, pool);
    return {
      summaryAz: `${effectiveLegs.length} real oyunluq kupon risk və zəif bənd üzrə yoxlanıldı`,
      payload: {
        source: activeCouponLegs.length > 0 ? 'user_custom_coupon' : 'live_daily_coupon',
        legs: effectiveLegs,
        evaluation,
      },
    };
  }

  if (toolName === 'get_model_transparency') {
    const data = await getLiveTransparencyData();
    return {
      summaryAz: `Real ESPN arxivi (${data.metrics.totalSettled} bitmiş oyun, Brier ${data.metrics.brierScore}) oxundu`,
      payload: {
        source: data.sourceLabel,
        metrics: data.metrics,
      },
    };
  }

  return {
    summaryAz: 'Naməlum alət',
    payload: { error: 'Unknown tool' },
  };
}

async function buildGroundedFallbackReply(
  userMessage: string,
  lang: 'az' | 'en' | 'ru',
  activeCouponLegs: CouponLeg[],
  onToolUsed: (toolName: string, summary: string) => void
): Promise<string> {
  const norm = normalizeQuery(userMessage);

  if (norm.includes('kupon') || norm.includes('coupon') || norm.includes('yoxla')) {
    const res = await executeLiveTool('evaluate_user_coupon', {}, activeCouponLegs);
    onToolUsed('evaluate_user_coupon', res.summaryAz);
    const data = res.payload as {
      legs: CouponLeg[];
      evaluation: ReturnType<typeof evaluateCustomCoupon>;
    };
    const ev = data.evaluation;
    if (data.legs.length === 0) {
      return `Hazırda real bukmeker əmsalı tapılan aktiv oyunlarla kupon yığılmayıb. Kupon konstruktorundan real əmsallı matç seçib yenidən yoxlaya bilərsiniz.\n\n> ${MANDATORY_DISCLAIMER_AZ}`;
    }
    const legsText = data.legs
      .map(
        (l) =>
          `- **${l.matchLabel}**: ${l.selection} @ ${l.odds} (Model: ${l.modelProb}%, Fərq: ${
            l.edgePct >= 0 ? '+' : ''
          }${l.edgePct}%)`
      )
      .join('\n');
    return `### Real Kupon Analizi (Canlı Data)
${legsText}

- **Ümumi əmsal:** ${ev.combinedOdds}x
- **Ümumi keçid ehtimalı:** ${ev.combinedProb}%
- **Risk səviyyəsi:** ${ev.riskLevelAz}
- **Ən zəif bənd:** ${
      ev.weakestLeg
        ? `${ev.weakestLeg.matchLabel} — ${ev.weakestLeg.selection} (${ev.weakestLeg.modelProb}%)`
        : '—'
    }
${
  ev.saferAlternative
    ? `- **Daha təhlükəsiz alternativ:** ${ev.saferAlternative.matchLabel} — ${ev.saferAlternative.selection} @ ${ev.saferAlternative.odds} (${ev.saferAlternative.modelProb}%)`
    : ''
}

**Nəticə:** ${ev.verdictAz}

> ${MANDATORY_DISCLAIMER_AZ}`;
  }

  if (
    norm.includes('tehlukesiz') ||
    norm.includes('en yuksek') ||
    norm.includes('top 5') ||
    norm.includes('top 10') ||
    norm.includes('safest')
  ) {
    const live = await getLivePlatformMatches({ forceRefresh: false });
    const upcoming = live.matches.filter((m) => m.status !== 'FINISHED');
    const ranked = upcoming
      .map((m) => ({
        match: `${m.homeTeamName} – ${m.awayTeamName}`,
        league: m.leagueShort,
        pick: m.prediction.topPick,
      }))
      .sort((a, b) => b.pick.prob - a.pick.prob)
      .slice(0, 5);

    onToolUsed(
      'get_safest_picks',
      `${upcoming.length} real oyundan ən yüksək ehtimallı ${ranked.length} seçim sıralandı`
    );

    if (ranked.length === 0) {
      return `Hazırda bu gün üçün aktiv və ya qarşıdan gələn oyun tapılmadı.\n\n> ${MANDATORY_DISCLAIMER_AZ}`;
    }

    const rows = ranked
      .map(
        (item, idx) =>
          `${idx + 1}. **${item.match}** (${item.league}) — **${item.pick.shortLabel}** · **${item.pick.prob}%** (Ədalətli əmsal: ${item.pick.fairOdds.toFixed(
            2
          )} · Etibarlılıq: ${item.pick.confidence})\n   - ${item.pick.reasonAz}`
      )
      .join('\n');

    return `### Bu günün ən yüksək ehtimallı 5 seçimi (${live.sourceLabel})
${rows}

**Qeyd:** Ehtimallar Poisson/Dixon-Coles modeli əsasında hesablanıb və maksimum 95% ilə məhdudlaşdırılır.

> ${MANDATORY_DISCLAIMER_AZ}`;
  }

  if (
    norm.includes('deyer') ||
    norm.includes('value') ||
    norm.includes('bugun') ||
    norm.includes('bu gun')
  ) {
    const res = await executeLiveTool('get_value_bets', {}, activeCouponLegs);
    onToolUsed('get_value_bets', res.summaryAz);
    const data = res.payload as {
      source: string;
      totalMatchesChecked: number;
      matchesWithRealOdds: number;
      valueBets: Array<{
        match: string;
        league: string;
        selection: string;
        modelProbPct: number;
        bookmakerOdds: number;
        impliedProbPct: number;
        edgePct: number;
        confidence: string;
      }>;
    };

    if (data.valueBets.length === 0) {
      return `Canlı **${data.source}** axınında ${data.totalMatchesChecked} oyun (${data.matchesWithRealOdds} real bukmeker əmsallı) yoxlanıldı, lakin hazırda +5% üstü Value Bet şərtini ödəyən oyun tapılmadı. Real əmsallar dəyişdikcə siyahı avtomatik yenilənir.\n\n> ${MANDATORY_DISCLAIMER_AZ}`;
    }

    const rows = data.valueBets
      .slice(0, 6)
      .map(
        (v, i) =>
          `${i + 1}. **${v.match}** (${v.league}) — **${v.selection}** @ **${v.bookmakerOdds}**\n   - Model: **${v.modelProbPct}%** vs Bukmeker: ${v.impliedProbPct}% · Fərq: **+${v.edgePct}%** · Etibarlılıq: ${v.confidence}`
      )
      .join('\n');
    return `### Bu günün real Value Bet (+5% üstü) seçimləri (${data.source})
${rows}

**Qeyd:** Yalnız canlı bukmeker əmsalı mövcud olan real matçlar qiymətləndirilib; heç bir əmsal uydurulmayıb.

> ${MANDATORY_DISCLAIMER_AZ}`;
  }

  if (
    norm.includes('deqiq') ||
    norm.includes('tarix') ||
    norm.includes('seffaf') ||
    norm.includes('brier') ||
    norm.includes('arxiv')
  ) {
    const res = await executeLiveTool('get_model_transparency', {}, activeCouponLegs);
    onToolUsed('get_model_transparency', res.summaryAz);
    const data = res.payload as {
      source: string;
      metrics: Awaited<ReturnType<typeof getLiveTransparencyData>>['metrics'];
    };
    const m = data.metrics;
    return `### Real Model Şəffaflığı və Bitmiş Matç Arxivi (${data.source})
- **Yoxlanılmış real matçlar:** ${m.totalSettled} bitmiş oyun (${m.wonCount} qalib · ${m.lostCount} məğlub — uduzanlar gizlədilmir)
- **Ümumi Dəqiqlik (Hit Rate):** ${m.hitRatePct}% (Yüksək etibarlılıqlı oyunlarda: ${m.highConfidenceHitRatePct}%)
- **Brier Balı:** ${m.brierScore} (0.250 təsadüfi etalondan aşağı = daha dəqiq kalibrasiya)
- **Sabit Vahid ROI (5% marja ilə):** ${m.roiPct >= 0 ? '+' : ''}${m.roiPct}%

> ${MANDATORY_DISCLAIMER_AZ}`;
  }

  const res = await executeLiveTool('analyze_match', { query: userMessage }, activeCouponLegs);
  onToolUsed('analyze_match', res.summaryAz);
  const m = res.payload as {
    error?: string;
    match: string;
    league: string;
    score: string;
    stadium: string;
    hasRealOdds: boolean;
    bestOdds: { home: number; draw: number; away: number } | null;
    fairOdds: { home: number; draw: number; away: number };
    prediction: Awaited<ReturnType<typeof getLivePlatformMatches>>['matches'][0]['prediction'];
    valueBets: Array<{ selection: string; bookmakerOdds: number; edgePct: number }>;
  };

  if (m.error) {
    return `Hazırda sorğunuza uyğun canlı oyun tapılmadı.\n\n> ${MANDATORY_DISCLAIMER_AZ}`;
  }

  const oddsLine =
    m.hasRealOdds && m.bestOdds
      ? `Real bukmeker (ən yaxşı): 1 @ ${m.bestOdds.home} · X @ ${m.bestOdds.draw} · 2 @ ${m.bestOdds.away}`
      : `Real bukmeker əmsalı bu oyun üçün API-də yoxdur · Modelin ədalətli əmsalı: 1 @ ${m.fairOdds.home} · X @ ${m.fairOdds.draw} · 2 @ ${m.fairOdds.away}`;

  const vbLine =
    m.valueBets.length > 0
      ? m.valueBets.map((v) => `${v.selection} @ ${v.bookmakerOdds} (+${v.edgePct}%)`).join(', ')
      : 'Hazırda +5% üstü real Value Bet yoxdur';

  if (lang === 'en') {
    return `### ${m.match} (${m.league})
- **Status/Score:** ${m.score} · ${m.stadium}
- **1X2 Probabilities:** Home ${m.prediction.homeWinProb}% · Draw ${m.prediction.drawProb}% · Away ${m.prediction.awayWinProb}%
- **Expected Goals (xG):** ${m.prediction.homeXg} – ${m.prediction.awayXg} | **Over 2.5:** ${m.prediction.over25Prob}% | **BTTS:** ${m.prediction.bttsYesProb}%
- **Odds:** ${oddsLine}
- **Value Signals (>5%):** ${vbLine}

> Predictions are probability-based; there is no guarantee of profit.`;
  }

  return `### ${m.match} · Real Canlı Analiz (${m.league})
- **Status / Hesab:** ${m.score} · ${m.stadium}
- **1X2 Ehtimalları:** Ev **${m.prediction.homeWinProb}%** · Heç-heçə **${m.prediction.drawProb}%** · Səfər **${m.prediction.awayWinProb}%**
- **Gözlənilən Qol (xG):** **${m.prediction.homeXg}** – **${m.prediction.awayXg}**
- **Üst 2.5:** ${m.prediction.over25Prob}% · **QQ Var (BTTS):** ${m.prediction.bttsYesProb}%
- **Əmsallar:** ${oddsLine}
- **Value Bet (+5%):** ${vbLine}

**Əsas 3 statistik səbəb:**
1. ${m.prediction.top3FactorsAz[0]}
2. ${m.prediction.top3FactorsAz[1]}
3. ${m.prediction.top3FactorsAz[2]}

> ${MANDATORY_DISCLAIMER_AZ}`;
}

export async function runPlatformAssistantStream(params: {
  message: string;
  history?: AssistantChatTurn[];
  lang?: 'az' | 'en' | 'ru';
  activeCouponLegs?: CouponLeg[];
  signal?: AbortSignal;
  callbacks: AssistantStreamCallbacks;
}): Promise<string> {
  const lang = params.lang ?? 'az';
  const activeCouponLegs = Array.isArray(params.activeCouponLegs) ? params.activeCouponLegs : [];
  const apiKey = resolveApiKey();

  if (!apiKey) {
    const fallback = await buildGroundedFallbackReply(
      params.message,
      lang,
      activeCouponLegs,
      params.callbacks.onToolUsed
    );
    params.callbacks.onChunk(fallback);
    return fallback;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: { 'User-Agent': 'aistudio-build' },
    },
  });

  const langRule =
    lang === 'en'
      ? 'Respond in clear English.'
      : lang === 'ru'
      ? 'Respond in clear Russian.'
      : 'Bütün cavabları təmiz, səlis və peşəkar Azərbaycan dilində yaz.';

  const systemInstruction = `Sən ARENA AZ platformasının rəsmi AI Futbol Analitikisən.
QAYDALAR (MƏCBURİ):
1. ${langRule}
2. Rəqəmləri, matçları, əmsalları, xG və ehtimalları HEÇ VAXT uydurma! Yalnız canlı alətlərdən (get_value_bets, analyze_match, get_daily_coupons, evaluate_user_coupon, get_model_transparency) gələn REAL ESPN + The Odds API datasına istinad et.
3. Əgər soruşulan komanda bu günün canlı təqvimində yoxdursa və ya oyun üçün real bukmeker əmsalı API-də yoxdursa, bunu dürüst bildir — heç vaxt demo və ya saxta oyun/əmsal yaratma.
4. "Zəmanətli qələbə", "100% dəqiq", "sure bet" ifadələrini HEÇ VAXT işlətmə.
5. Hər cavabın sonunda mütləq bu xəbərdarlığı yaz: "${MANDATORY_DISCLAIMER_AZ}"`;

  const sanitizedHistory: Content[] = (params.history ?? []).slice(-6).map((h) => ({
    role: h.role === 'model' ? 'model' : 'user',
    parts: [{ text: String(h.text).slice(0, 1200) }],
  }));

  const modelsToTry = [
    { name: PRIMARY_MODEL, timeoutMs: 7500, thinkingLevel: ThinkingLevel.LOW },
    { name: FALLBACK_MODEL, timeoutMs: 5500, thinkingLevel: ThinkingLevel.MINIMAL },
  ];

  for (const modelSpec of modelsToTry) {
    const attemptAbort = new AbortController();
    const timer = setTimeout(() => attemptAbort.abort(), modelSpec.timeoutMs);
    const onParentAbort = () => attemptAbort.abort();
    params.signal?.addEventListener('abort', onParentAbort, { once: true });

    try {
      const contents: Content[] = [
        ...sanitizedHistory,
        { role: 'user', parts: [{ text: params.message.slice(0, 1200) }] },
      ];

      for (let round = 0; round < 2; round += 1) {
        const res = await ai.models.generateContent({
          model: modelSpec.name,
          contents,
          config: {
            systemInstruction,
            tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
            thinkingConfig: { thinkingLevel: modelSpec.thinkingLevel },
            abortSignal: attemptAbort.signal,
          },
        });

        const calls = res.functionCalls;
        const modelContent = res.candidates?.[0]?.content;

        if (calls && calls.length > 0 && modelContent) {
          contents.push(modelContent);
          const responseParts = await Promise.all(
            calls.map(async (call) => {
              const toolResult = await executeLiveTool(
                call.name ?? '',
                (call.args as Record<string, unknown>) ?? {},
                activeCouponLegs
              );
              params.callbacks.onToolUsed(call.name ?? 'data_tool', toolResult.summaryAz);
              return {
                functionResponse: {
                  id: call.id,
                  name: call.name ?? 'data_tool',
                  response: { result: toolResult.payload },
                },
              };
            })
          );
          contents.push({ role: 'user', parts: responseParts });
          continue;
        }

        const finalText = res.text?.trim();
        if (finalText) {
          clearTimeout(timer);
          const step = 48;
          for (let i = 0; i < finalText.length; i += step) {
            params.callbacks.onChunk(finalText.slice(i, i + step));
          }
          return finalText;
        }
        break;
      }
    } catch {
      // Try next model or live grounded fallback
    } finally {
      clearTimeout(timer);
      params.signal?.removeEventListener('abort', onParentAbort);
    }
  }

  const fallback = await buildGroundedFallbackReply(
    params.message,
    lang,
    activeCouponLegs,
    params.callbacks.onToolUsed
  );
  params.callbacks.onChunk(fallback);
  return fallback;
}

const matchSummaryCache = new Map<string, { summaryAz: string; expiresAt: number }>();

/**
 * Generates a concise 3-4 sentence plain-Azerbaijani AI match summary using Gemini server-side,
 * strictly grounded in the match's real live data and Dixon-Coles market probabilities.
 */
export async function generateMatchAiSummary(matchId: string): Promise<{
  matchId: string;
  summaryAz: string;
  modelUsed: string;
}> {
  const cached = matchSummaryCache.get(matchId);
  if (cached && Date.now() < cached.expiresAt) {
    return { matchId, summaryAz: cached.summaryAz, modelUsed: PRIMARY_MODEL };
  }

  const { matches } = await getLivePlatformMatches();
  const match = matches.find((m) => m.id === matchId);
  if (!match) {
    return {
      matchId,
      summaryAz:
        'Bu matç üçün hazırda canlı statistika bazasında məlumat tapılmadı. Digər aktiv oyunlara baxa bilərsiniz.',
      modelUsed: 'none',
    };
  }

  const p = match.prediction;
  const top1 = p.topSafePicks?.[0] ?? p.topPick;
  const top2 = p.topSafePicks?.[1];

  const deterministicSummary = `${match.homeTeamName} – ${match.awayTeamName} (${match.leagueShort}) qarşılaşmasında Dixon-Coles modeli ev sahibi üçün ${p.homeXg.toFixed(
    2
  )} xG, qonaq üçün isə ${p.awayXg.toFixed(
    2
  )} xG gözləyir (1X2: ${p.homeWinProb}% / ${p.drawProb}% / ${p.awayWinProb}%). Statistik göstəricilərə əsasən ən yüksək ehtimallı bazar "${
    top1.selection
  }" (${top1.prob}%)${
    top2 ? ` və "${top2.selection}" (${top2.prob}%)` : ''
  } hesab olunur. ${p.top3FactorsAz[0] ?? ''} ${p.riskWarningsAz[0] ?? ''}`.trim();

  const apiKey = resolveApiKey();
  if (!apiKey) {
    return { matchId, summaryAz: deterministicSummary, modelUsed: 'statistical-model' };
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const prompt = `Aşağıdakı real futbol matçı statistikasını təhlil et və sadə, aydın Azərbaycan dilində cəmi 3-4 cümləlik peşəkar analitik xülasə yaz.
QAYDALAR:
- Yalnız verilən rəqəmlərdən istifadə et, heç bir statistika uydurma.
- Heç vaxt "zəmanətli", "100%", "dəqiq uduş" kimi ifadələr işlətmə.
- Nə üçün əsas təklifin yüksək ehtimallı olduğunu və əsas risk faktorunu qısa izah et.
- Markdown başlıq və ya siyahı istifadə etmə, sadəcə 3-4 səlis cümlə yaz.

MATÇ: ${match.homeTeamName} vs ${match.awayTeamName} (${match.leagueName})
Cədvəl yeri: Ev #${match.homeRank || '-'} | Qonaq #${match.awayRank || '-'}
Son 5 forma: Ev [${match.homeForm.join('-') || 'məlumat yoxdur'}] | Qonaq [${match.awayForm.join('-') || 'məlumat yoxdur'}]
Gözlənilən qollar (xG): Ev ${p.homeXg} - Qonaq ${p.awayXg}
1X2 Ehtimalları: Ev ${p.homeWinProb}% | Heç-heçə ${p.drawProb}% | Qonaq ${p.awayWinProb}%
Üst 2.5: ${p.over25Prob}% | QQ (BTTS) Bəli: ${p.bttsYesProb}%
Ən yüksək 3 ehtimal: ${(p.topSafePicks ?? [])
    .map((x) => `${x.selection} (${x.prob}%)`)
    .join(', ')}
Əsas faktorlar: ${p.top3FactorsAz.join(' ')}
Risk xəbərdarlığı: ${p.riskWarningsAz.join(' ')}`;

  for (const modelName of [PRIMARY_MODEL, FALLBACK_MODEL]) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          thinkingConfig: {
            thinkingLevel:
              modelName === 'gemini-3.1-flash-lite'
                ? ThinkingLevel.MINIMAL
                : ThinkingLevel.LOW,
          },
        },
      });
      const text = response.text
        ?.trim()
        .replace(/100%/g, '95%')
        .replace(/zəmanətli/gi, 'yüksək ehtimallı');
      if (text && text.length > 40) {
        matchSummaryCache.set(matchId, {
          summaryAz: text,
          expiresAt: Date.now() + 15 * 60_000,
        });
        return { matchId, summaryAz: text, modelUsed: modelName };
      }
    } catch {
      // Fall through to fallback model or deterministic statistical summary
    }
  }

  return { matchId, summaryAz: deterministicSummary, modelUsed: 'statistical-model' };
}
