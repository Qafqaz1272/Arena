import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Loader2,
  MapPin,
  Plus,
  Radio,
  Scale,
  Sparkles,
  TrendingDown,
  Users,
} from 'lucide-react';
import type {
  PlatformMatch,
  PlatformMatchDetailPayload,
  PlatformStandingsLeague,
} from '../../types/platform';
import {
  MANDATORY_DISCLAIMER_AZ,
  type CouponLeg,
} from '../../utils/bettingInsightsEngine';
import { ClubLogo } from './ClubLogo';
import { MatchFormStrip } from './MatchFormStrip';
import { MatchHeatmap } from '../MatchHeatmap';

interface DeepMatchDetailViewProps {
  platformMatch: PlatformMatch;
  standings: PlatformStandingsLeague[];
  onBack: () => void;
  onAddCouponLeg: (leg: CouponLeg) => void;
  customCouponLegIds: Set<string>;
  onAskAiAboutMatch: (prompt: string) => void;
}

export const DeepMatchDetailView: React.FC<DeepMatchDetailViewProps> = ({
  platformMatch,
  standings,
  onBack,
  onAddCouponLeg,
  customCouponLegIds,
  onAskAiAboutMatch,
}) => {
  const [detail, setDetail] = useState<PlatformMatchDetailPayload | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(true);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDetail = async (silent: boolean) => {
      if (!silent) {
        setLoadingDetail(true);
        setDetailError(null);
      }
      try {
        const res = await fetch(
          `/api/platform/matches/${encodeURIComponent(
            platformMatch.id
          )}?leagueSlug=${encodeURIComponent(platformMatch.leagueSlug || 'all')}`,
          { cache: 'no-store' }
        );
        if (!res.ok) throw new Error('Matçın canlı detalları yüklənmədi.');
        const payload = (await res.json()) as PlatformMatchDetailPayload;
        if (!cancelled) {
          setDetail(payload);
          setDetailError(null);
        }
      } catch (err) {
        if (!cancelled && !silent) {
          setDetailError(err instanceof Error ? err.message : 'Canlı detal xətası.');
        }
      } finally {
        if (!cancelled && !silent) setLoadingDetail(false);
      }
    };

    void loadDetail(false);

    // While watching a LIVE game, silently refresh live boxscore stats & goal events every 12s
    let intervalId: number | null = null;
    if (platformMatch.status === 'LIVE') {
      intervalId = window.setInterval(() => {
        void loadDetail(true);
      }, 12_000);
    }

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [platformMatch.id, platformMatch.leagueSlug, platformMatch.status]);

  // Immediately sync live events/boxscore when the SSE stream pushes a new score
  useEffect(() => {
    if (platformMatch.status !== 'LIVE') return;
    let cancelled = false;
    fetch(
      `/api/platform/matches/${encodeURIComponent(
        platformMatch.id
      )}?leagueSlug=${encodeURIComponent(platformMatch.leagueSlug || 'all')}`,
      { cache: 'no-store' }
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: PlatformMatchDetailPayload | null) => {
        if (!cancelled && payload) setDetail(payload);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [
    platformMatch.id,
    platformMatch.leagueSlug,
    platformMatch.status,
    platformMatch.homeScore,
    platformMatch.awayScore,
  ]);

  const { prediction, valueBets, oddsMovements, fairOdds } = platformMatch;

  // Combine The Odds API bookmakers with real ESPN odds (e.g., DraftKings) without inventing any
  const mergedBookmakers = [
    ...platformMatch.bookmakerOdds,
    ...(detail?.espnOdds ?? []).filter(
      (eo) =>
        !platformMatch.bookmakerOdds.some(
          (bo) => bo.bookmaker.toLowerCase() === eo.bookmaker.toLowerCase()
        )
    ),
  ];

  // Find relevant real league table
  const matchingLeague = standings.find(
    (s) =>
      s.id === platformMatch.leagueId ||
      s.name.toLowerCase() === platformMatch.leagueShort.toLowerCase() ||
      s.table.some(
        (r) =>
          r.teamId === platformMatch.homeTeamId || r.teamId === platformMatch.awayTeamId
      )
  );
  const relevantRows = matchingLeague
    ? matchingLeague.table.filter(
        (r) =>
          r.teamId === platformMatch.homeTeamId ||
          r.teamId === platformMatch.awayTeamId ||
          r.position <= 3
      )
    : [];

  const hasLineups =
    (detail?.homeLineup?.length ?? 0) > 0 && (detail?.awayLineup?.length ?? 0) > 0;

  const totalShotsStat = detail?.stats.find((st) => {
    const lbl = st.label.toLowerCase();
    return (
      (lbl.includes('zərbə') || lbl.includes('shot')) &&
      !lbl.includes('hədəf') &&
      !lbl.includes('target') &&
      !lbl.includes('blok')
    );
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6 pb-14">
      {/* Back Button & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-white hover:border-[#2BD576] cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Oyunlara Qayıt</span>
        </button>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-emerald-600 dark:text-[#2BD576]">
            {platformMatch.leagueName}
          </span>
          <span>·</span>
          <span>{platformMatch.dateIso}</span>
          <span>·</span>
          <span>{platformMatch.time} UTC</span>
        </div>
      </div>

      {/* Real Scoreboard Banner */}
      <div className="rounded-2xl border border-[#DCE2EA] dark:border-[#1E2733] bg-gradient-to-br from-[#0A1326] via-[#0E1830] to-[#08131E] p-6 sm:p-8 text-white shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/10 text-xs">
          <span className="inline-flex items-center gap-1.5 text-slate-300">
            <MapPin className="h-3.5 w-3.5 text-[#2BD576]" />
            <span>{detail?.venue || platformMatch.stadium}</span>
          </span>
          <div className="flex items-center gap-3">
            {detail?.referee && (
              <span className="inline-flex items-center gap-1 text-slate-300">
                <Scale className="h-3.5 w-3.5 text-[#F5A524]" />
                <span>Hakim: {detail.referee}</span>
              </span>
            )}
            {detail?.attendance ? (
              <span className="inline-flex items-center gap-1 text-slate-300">
                <Users className="h-3.5 w-3.5 text-[#2BD576]" />
                <span>{detail.attendance.toLocaleString('az-AZ')} tamaşaçı</span>
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
          <div className="flex flex-col items-center gap-2.5 min-w-0">
            <ClubLogo
              logoUrl={platformMatch.homeLogo}
              shortCode={platformMatch.homeShort}
              name={platformMatch.homeTeamName}
              size="xl"
            />
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold leading-tight">
              {platformMatch.homeTeamName}
            </h1>
            {detail?.homeFormation && (
              <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs text-[#2BD576]">
                {detail.homeFormation}
              </span>
            )}
          </div>

          <div className="flex flex-col items-center gap-2">
            {platformMatch.status === 'LIVE' ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F5A524]/20 border border-[#F5A524]/50 px-2.5 py-1 font-mono text-xs font-bold text-[#F5A524]">
                <Radio className="h-3 w-3 animate-pulse" />
                CANLI · {platformMatch.minute}
              </span>
            ) : platformMatch.status === 'FINISHED' ? (
              <span className="rounded-md bg-white/10 px-2.5 py-1 font-mono text-xs font-bold text-slate-300">
                BİTDİ
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#2BD576]/15 border border-[#2BD576]/40 px-2.5 py-1 font-mono text-xs font-bold text-[#2BD576]">
                <Calendar className="h-3 w-3" />
                {platformMatch.time} UTC
              </span>
            )}

            <div className="rounded-2xl border border-white/10 bg-[#0B0F14]/80 px-5 py-3 font-score text-5xl sm:text-6xl tracking-wider tabular-nums">
              {platformMatch.homeScore !== null && platformMatch.awayScore !== null
                ? `${platformMatch.homeScore} : ${platformMatch.awayScore}`
                : 'VS'}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2.5 min-w-0">
            <ClubLogo
              logoUrl={platformMatch.awayLogo}
              shortCode={platformMatch.awayShort}
              name={platformMatch.awayTeamName}
              size="xl"
            />
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold leading-tight">
              {platformMatch.awayTeamName}
            </h2>
            {detail?.awayFormation && (
              <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs text-[#F5A524]">
                {detail.awayFormation}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Compact Last-5 Form Visualization below Match Header */}
      <MatchFormStrip
        homeTeamName={platformMatch.homeTeamName}
        homeShort={platformMatch.homeShort}
        homeForm={platformMatch.homeForm}
        homeLastForm={detail?.homeLastForm}
        awayTeamName={platformMatch.awayTeamName}
        awayShort={platformMatch.awayShort}
        awayForm={platformMatch.awayForm}
        awayLastForm={detail?.awayLastForm}
        variant="card"
      />

      {/* Real 11v11 Pitch Lineups + Live Match Stats + Events Timeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* 11v11 Tactical Pitch */}
        <div className="lg:col-span-7 rounded-2xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-[#2BD576]">
                RƏSMİ START HEYƏTLƏRİ (ESPN LIVE)
              </p>
              <h3 className="font-display text-2xl font-extrabold text-slate-950 dark:text-white">
                Meydança Düzülüşü
              </h3>
            </div>
            {detail?.homeFormation && detail?.awayFormation && (
              <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                {detail.homeFormation} vs {detail.awayFormation}
              </span>
            )}
          </div>

          {loadingDetail ? (
            <div className="flex h-72 items-center justify-center rounded-xl bg-slate-100 dark:bg-[#0B0F14] text-xs text-slate-500 gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-[#2BD576]" />
              <span>Canlı heyətlər və statistika yüklənir...</span>
            </div>
          ) : hasLineups && detail ? (
            <div className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-[#07261A]">
              <svg
                viewBox="0 0 100 66"
                className="w-full h-auto block"
                role="img"
                aria-label="11-ə 11 rəsmi meydança düzülüşü"
              >
                {/* Grass Stripes */}
                <rect x="0" y="0" width="100" height="66" fill="#0A2E1F" />
                {[0, 20, 40, 60, 80].map((x) => (
                  <rect key={x} x={x} y="0" width="10" height="66" fill="#0D3826" />
                ))}
                {/* Pitch Markings */}
                <rect x="2" y="2" width="96" height="62" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.45" />
                <line x1="50" y1="2" x2="50" y2="64" stroke="rgba(255,255,255,0.3)" strokeWidth="0.45" />
                <circle cx="50" cy="33" r="8" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.45" />
                <rect x="2" y="16" width="13" height="34" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.45" />
                <rect x="85" y="16" width="13" height="34" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.45" />

                {/* Home Players */}
                {detail.homeLineup.map((p, idx) => {
                  const py = 5 + (p.y / 100) * 56;
                  return (
                    <g key={`h-${idx}`}>
                      <circle cx={p.x} cy={py} r="2.7" fill="#2BD576" stroke="#08140D" strokeWidth="0.6" />
                      <text
                        x={p.x}
                        y={py + 0.9}
                        textAnchor="middle"
                        fontSize="2.2"
                        fontWeight="bold"
                        fill="#08140D"
                      >
                        {p.number || idx + 1}
                      </text>
                      <text
                        x={p.x}
                        y={py + 5.2}
                        textAnchor="middle"
                        fontSize="2.1"
                        fill="#FFFFFF"
                        fontWeight="600"
                      >
                        {p.name.split(' ').slice(-1)[0].slice(0, 11)}
                      </text>
                    </g>
                  );
                })}

                {/* Away Players */}
                {detail.awayLineup.map((p, idx) => {
                  const py = 5 + (p.y / 100) * 56;
                  return (
                    <g key={`a-${idx}`}>
                      <circle cx={p.x} cy={py} r="2.7" fill="#F5A524" stroke="#08140D" strokeWidth="0.6" />
                      <text
                        x={p.x}
                        y={py + 0.9}
                        textAnchor="middle"
                        fontSize="2.2"
                        fontWeight="bold"
                        fill="#08140D"
                      >
                        {p.number || idx + 1}
                      </text>
                      <text
                        x={p.x}
                        y={py + 5.2}
                        textAnchor="middle"
                        fontSize="2.1"
                        fill="#E2E8F0"
                        fontWeight="600"
                      >
                        {p.name.split(' ').slice(-1)[0].slice(0, 11)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/70 p-8 text-center">
              <p className="text-sm font-bold text-slate-800 dark:text-white">
                Rəsmi start heyətləri hələ açıqlanmayıb
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {detailError
                  ? detailError
                  : 'Start 11-likləri oyundan təxminən 60 dəqiqə əvvəl rəsmi ESPN məlumat axınında yayımlanır. Biz heç bir saxta və ya təxmini heyət göstərmirik.'}
              </p>
            </div>
          )}
        </div>

        {/* Live Boxscore Stats + Key Events Timeline */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-[#F5A524]">
              <Activity className="h-4 w-4" />
              <span>CANLI MATÇ STATİSTİKASI</span>
            </div>
            {loadingDetail ? (
              <div className="mt-4 space-y-2.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-7 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                ))}
              </div>
            ) : detail && detail.stats.length > 0 ? (
              <div className="mt-4 space-y-3">
                {detail.stats.map((st) => {
                  const total = Math.max(1, st.home + st.away);
                  const homePct = Math.round((st.home / total) * 100);
                  return (
                    <div key={st.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-emerald-600 dark:text-[#2BD576]">
                          {st.home}
                          {st.unit}
                        </span>
                        <span className="font-sans text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          {st.label}
                        </span>
                        <span className="font-bold text-sky-600 dark:text-[#F5A524]">
                          {st.away}
                          {st.unit}
                        </span>
                      </div>
                      <div className="flex h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                        <div style={{ width: `${homePct}%` }} className="bg-[#2BD576]" />
                        <div style={{ width: `${100 - homePct}%` }} className="bg-[#F5A524]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Oyun hələ başlamayıb və ya canlı boxscore statistikası hələ açıqlanmayıb.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F5A524]">
              ƏSAS HADİSƏLƏR XRONOLOGİYASI
            </h3>
            {detail && detail.events.length > 0 ? (
              <div className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1 text-xs">
                {detail.events.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-start gap-2.5 rounded-lg border border-[#DCE2EA]/80 dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/70 px-3 py-2"
                  >
                    <span className="font-mono font-bold text-[#2BD576] shrink-0 w-9">
                      {ev.minute || '—'}
                    </span>
                    <span
                      className={`mt-0.5 h-2.5 w-2.5 rounded-sm shrink-0 ${
                        ev.type === 'goal'
                          ? 'bg-[#2BD576]'
                          : ev.type === 'red'
                          ? 'bg-red-600'
                          : ev.type === 'yellow'
                          ? 'bg-amber-400'
                          : 'bg-sky-400'
                      }`}
                    />
                    <span className="text-slate-800 dark:text-slate-200 leading-snug">
                      {ev.text}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Qeydə alınmış qol, kart və ya əvəzetmə hadisəsi hələ yoxdur.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tactical xG Shot Location & Threat Heatmap (D3) */}
      <MatchHeatmap
        matchId={platformMatch.id}
        homeTeamName={platformMatch.homeTeamName}
        homeShort={platformMatch.homeShort}
        awayTeamName={platformMatch.awayTeamName}
        awayShort={platformMatch.awayShort}
        homeXg={prediction.homeXg}
        awayXg={prediction.awayXg}
        homeScore={platformMatch.homeScore}
        awayScore={platformMatch.awayScore}
        homeShotsCount={totalShotsStat?.home}
        awayShotsCount={totalShotsStat?.away}
        lang="az"
      />

      {/* AI Prediction Engine Card */}
      <div className="rounded-2xl border border-emerald-500/30 dark:border-[#2BD576]/25 bg-white dark:bg-[#121821] p-5 sm:p-6 shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-[#2BD576]">
              AI PROQNOZ MÜHƏRRİKİ · DIXON-COLES + ELO + REAL CƏDVƏL DATASI
            </p>
            <h3 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white">
              Ehtimal Analizi və Value Bet Hesablaması
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-lg border px-3 py-1 text-xs font-bold ${
                prediction.confidence === 'Yüksək'
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-[#2BD576]'
                  : prediction.confidence === 'Orta'
                  ? 'border-sky-500/40 bg-sky-500/15 text-sky-700 dark:text-[#F5A524]'
                  : 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300'
              }`}
            >
              Etibarlılıq: {prediction.confidence}
            </span>
            <button
              type="button"
              onClick={() =>
                onAskAiAboutMatch(
                  `${platformMatch.homeTeamName} - ${platformMatch.awayTeamName} analiz et`
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2BD576] px-3 py-1.5 text-xs font-bold text-[#08140D] hover:bg-[#24be68] cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Analitikdən Soruş</span>
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/75 p-3.5 text-center">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              1 ({platformMatch.homeShort})
            </div>
            <div className="mt-1 font-score text-3xl text-emerald-600 dark:text-[#2BD576] tabular-nums">
              {prediction.homeWinProb}%
            </div>
          </div>
          <div className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/75 p-3.5 text-center">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">X (Heç-heçə)</div>
            <div className="mt-1 font-score text-3xl text-slate-900 dark:text-white tabular-nums">
              {prediction.drawProb}%
            </div>
          </div>
          <div className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/75 p-3.5 text-center">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              2 ({platformMatch.awayShort})
            </div>
            <div className="mt-1 font-score text-3xl text-sky-600 dark:text-[#F5A524] tabular-nums">
              {prediction.awayWinProb}%
            </div>
          </div>
          <div className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/75 p-3.5 text-center">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Gözlənilən xG</div>
            <div className="mt-1 font-score text-3xl text-slate-900 dark:text-white tabular-nums">
              {prediction.homeXg}–{prediction.awayXg}
            </div>
          </div>
          <div className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/75 p-3.5 text-center">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Üst 2.5 Qol</div>
            <div className="mt-1 font-score text-3xl text-slate-900 dark:text-white tabular-nums">
              {prediction.over25Prob}%
            </div>
          </div>
          <div className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/75 p-3.5 text-center">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">QQ Var (BTTS)</div>
            <div className="mt-1 font-score text-3xl text-slate-900 dark:text-white tabular-nums">
              {prediction.bttsYesProb}%
            </div>
          </div>
        </div>

        {/* Top 3 Factors + Most Likely Scorelines */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7 rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/70 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Bu Proqnozun Əsas 3 Səbəbi
            </h4>
            <ol className="mt-3 space-y-2.5 text-sm text-slate-800 dark:text-slate-200">
              {prediction.top3FactorsAz.map((factor, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2BD576]/20 font-mono text-xs font-bold text-emerald-700 dark:text-[#2BD576]">
                    {i + 1}
                  </span>
                  <span>{factor}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="lg:col-span-5 rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/70 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ən Ehtimallı Hesablar (Poisson Matrisi)
            </h4>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {prediction.topScorelines.map((s) => (
                <div
                  key={s.score}
                  className="flex items-center justify-between rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] px-3 py-2"
                >
                  <span className="font-score text-2xl text-slate-950 dark:text-white">
                    {s.score}
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-600 dark:text-[#2BD576]">
                    {s.prob}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real Value Bet Signals (only when real bookmaker odds exist) */}
        <div className="mt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Real Bukmeker vs Model Müqayisəsi (Value Bet Həddi &gt; +5%)
          </h4>
          {valueBets.length > 0 ? (
            <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {valueBets.map((vb) => {
                const leg: CouponLeg = {
                  id: `${platformMatch.id}__${vb.market}__${vb.selection}`,
                  matchId: platformMatch.id,
                  matchLabel: `${platformMatch.homeTeamName} – ${platformMatch.awayTeamName}`,
                  league: platformMatch.leagueShort,
                  market: vb.market,
                  selection: vb.selection,
                  odds: vb.bookmakerOdds,
                  modelProb: vb.modelProb,
                  impliedProb: vb.impliedProb,
                  edgePct: vb.edgePct,
                  confidence: vb.confidence,
                };
                const added = customCouponLegIds.has(leg.id);

                return (
                  <div
                    key={leg.id}
                    className={`rounded-xl border p-3.5 ${
                      vb.isValueBet
                        ? 'border-[#2BD576]/50 bg-[#2BD576]/8'
                        : 'border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50/70 dark:bg-[#0B0F14]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-950 dark:text-white">
                        {vb.selection}
                      </span>
                      {vb.isValueBet && (
                        <span className="rounded bg-[#2BD576] px-1.5 py-0.5 font-mono text-[10px] font-extrabold text-[#08140D]">
                          VALUE +{vb.edgePct}%
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-300">
                      <span>Model: {vb.modelProb}%</span>
                      <span>İmpl.: {vb.impliedProb}%</span>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="font-score text-2xl text-slate-950 dark:text-white">
                        {vb.bookmakerOdds.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onAddCouponLeg(leg)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold cursor-pointer ${
                          added
                            ? 'bg-[#2BD576] text-[#08140D]'
                            : 'bg-slate-900 dark:bg-white/10 text-white hover:bg-[#2BD576] hover:text-[#08140D]'
                        }`}
                      >
                        <Plus className="h-3 w-3" />
                        <span>{added ? 'Kuponda' : 'Kupona at'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-2.5 rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/70 p-4 text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center justify-between gap-3">
              <span>
                Bu qarşılaşma üçün canlı bukmeker əmsalı API-də mövcud deyil. Aşağıda yalnız
                Dixon-Coles modelinin riyazi ədalətli əmsalları (Fair Odds) göstərilir:
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-[#2BD576]">
                1: {fairOdds.home.toFixed(2)} · X: {fairOdds.draw.toFixed(2)} · 2:{' '}
                {fairOdds.away.toFixed(2)} · Üst2.5: {fairOdds.over25.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
          <span>{MANDATORY_DISCLAIMER_AZ}</span>
        </div>
      </div>

      {/* Real Bookmaker Odds Comparison + Sharp Drops */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-2xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-[#F5A524]">
            REAL BUKMEKER ƏMSAL MÜQAYİSƏSİ
          </p>
          <h3 className="mt-0.5 font-display text-2xl font-extrabold text-slate-950 dark:text-white">
            Canlı Bazar Əmsalları
          </h3>
          {mergedBookmakers.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#DCE2EA] dark:border-[#1E2733] text-slate-500 dark:text-slate-400">
                    <th className="py-2 pr-3 font-sans">Bukmeker</th>
                    <th className="py-2 px-2">1</th>
                    <th className="py-2 px-2">X</th>
                    <th className="py-2 px-2">2</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {mergedBookmakers.map((row) => (
                    <tr key={row.bookmaker} className="text-slate-800 dark:text-slate-200">
                      <td className="py-2.5 pr-3 font-sans font-semibold">{row.bookmaker}</td>
                      <td className="py-2.5 px-2">{row.home.toFixed(2)}</td>
                      <td className="py-2.5 px-2">{row.draw.toFixed(2)}</td>
                      <td className="py-2.5 px-2">{row.away.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              Bu qarşılaşma üçün canlı bukmeker əmsalı API-də yoxdur. Modelin ədalətli əmsalları:{' '}
              <strong className="font-mono text-slate-800 dark:text-white">
                1 ({fairOdds.home.toFixed(2)}) · X ({fairOdds.draw.toFixed(2)}) · 2 (
                {fairOdds.away.toFixed(2)})
              </strong>
              .
            </p>
          )}
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#F5A524]">
            ƏMSAL HƏRƏKƏTİ (REAL İZLƏMƏ)
          </p>
          <h3 className="mt-0.5 font-display text-2xl font-extrabold text-slate-950 dark:text-white">
            Açılış vs Cari Əmsal
          </h3>
          {oddsMovements.length > 0 ? (
            <div className="mt-4 space-y-2.5">
              {oddsMovements.map((mov) => (
                <div
                  key={`${mov.market}-${mov.selection}`}
                  className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs ${
                    mov.isSharpDrop
                      ? 'border-[#F5A524]/45 bg-[#F5A524]/10'
                      : 'border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/70'
                  }`}
                >
                  <span className="font-bold text-slate-900 dark:text-white">{mov.selection}</span>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-slate-500">{mov.openingOdds.toFixed(2)}</span>
                    <span className="font-bold text-slate-950 dark:text-white">
                      → {mov.currentOdds.toFixed(2)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-bold ${
                        mov.isSharpDrop
                          ? 'bg-[#F5A524] text-white'
                          : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {mov.isSharpDrop && <TrendingDown className="h-3 w-3" />}
                      {mov.dropPct > 0 ? `-${mov.dropPct}%` : `+${Math.abs(mov.dropPct)}%`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              Real bukmeker əmsal axını olan oyunlarda açılışdan bəri baş verən düşüşlər burada
              avtomatik qeydə alınır.
            </p>
          )}
        </div>
      </div>

      {/* Real H2H + Real Last-5 Form + Real League Table Position */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* H2H */}
        <div className="rounded-2xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-[#2BD576]">
            <Users className="h-4 w-4" />
            <span>ÜZ-ÜZƏ TARİXÇƏ (H2H)</span>
          </div>
          {detail && detail.h2h.length > 0 ? (
            <div className="mt-4 space-y-2">
              {detail.h2h.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-[#DCE2EA]/80 dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/70 px-3 py-2 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {item.homeTeam} – {item.awayTeam}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {item.date} · {item.competition}
                    </div>
                  </div>
                  <span className="font-score text-xl text-emerald-600 dark:text-[#2BD576] shrink-0">
                    {item.score}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              ESPN bazasında bu iki komanda arasında son H2H qarşılaşma qeydi tapılmadı.
            </p>
          )}
        </div>

        {/* Real Last-5 Form */}
        <div className="rounded-2xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-[#F5A524]">
            SON 5 OYUN FORMASI (REAL)
          </p>
          {[
            { name: platformMatch.homeTeamName, list: detail?.homeLastForm ?? [] },
            { name: platformMatch.awayTeamName, list: detail?.awayLastForm ?? [] },
          ].map((side) => (
            <div key={side.name} className="space-y-1.5">
              <div className="text-xs font-bold text-slate-900 dark:text-white">{side.name}</div>
              {side.list.length > 0 ? (
                <div className="space-y-1">
                  {side.list.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded bg-slate-50 dark:bg-[#0B0F14]/70 px-2.5 py-1.5 text-[11px]"
                    >
                      <span className="truncate text-slate-700 dark:text-slate-300">
                        {f.isHome ? 'Ev' : 'Səfər'} · {f.opponent}
                      </span>
                      <span className="flex items-center gap-1.5 font-mono shrink-0">
                        <span>
                          {f.goalsFor}-{f.goalsAgainst}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 font-bold ${
                            f.result === 'W'
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-[#2BD576]'
                              : f.result === 'L'
                              ? 'bg-rose-500/20 text-rose-500'
                              : 'bg-slate-400/20 text-slate-500'
                          }`}
                        >
                          {f.result === 'W' ? 'Q' : f.result === 'L' ? 'M' : 'H'}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">Son oyun məlumatı yoxdur.</p>
              )}
            </div>
          ))}
        </div>

        {/* Real Standings Snippet */}
        <div className="rounded-2xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-[#2BD576]">
            TURNİR CƏDVƏLİNDƏ MÖVQE
          </p>
          {relevantRows.length > 0 ? (
            <div className="mt-4 space-y-1.5 text-xs">
              {relevantRows.slice(0, 6).map((r) => {
                const isMatchTeam =
                  r.teamId === platformMatch.homeTeamId ||
                  r.teamId === platformMatch.awayTeamId;
                return (
                  <div
                    key={r.teamId}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                      isMatchTeam
                        ? 'bg-[#2BD576]/12 border border-[#2BD576]/35 font-bold text-emerald-800 dark:text-[#2BD576]'
                        : 'bg-slate-50 dark:bg-[#0B0F14]/70 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="truncate">
                      {r.position}. {r.teamName}
                    </span>
                    <span className="font-mono shrink-0">
                      {r.played}O · {r.points} xal
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              Bu turnir üzrə cədvəl mövqeyi canlı cədvəl axınında mövcud deyil.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
