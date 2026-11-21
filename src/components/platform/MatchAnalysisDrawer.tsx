import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  HelpCircle,
  Loader2,
  MapPin,
  MessageSquare,
  Plus,
  ShieldCheck,
  TrendingDown,
  Users,
  X,
} from 'lucide-react';
import type {
  PlatformMatch,
  PlatformMatchDetailPayload,
  PlatformStandingsLeague,
} from '../../types/platform';
import {
  MANDATORY_DISCLAIMER_AZ,
  type ConfidenceTier,
  type CouponLeg,
  type MarketGroupId,
  type MarketOption,
} from '../../utils/bettingInsightsEngine';
import { ClubLogo } from './ClubLogo';
import { MatchFormStrip } from './MatchFormStrip';
import {
  FormSparkline,
  MinimalPitchDiagram,
  TermTooltip,
  TickProbabilityBar,
} from '../editorial/SportsViz';

interface MatchAnalysisDrawerProps {
  match: PlatformMatch | null;
  standings: PlatformStandingsLeague[];
  customCouponLegIds: Set<string>;
  onClose: () => void;
  onAddCouponLeg: (leg: CouponLeg) => void;
  onOpenFullMatchCenter: (matchId: string) => void;
  onOpenHowItWorks: () => void;
  onAskAiAboutMatch: (prompt: string) => void;
}

const MARKET_GROUPS: Array<{ id: MarketGroupId; titleAz: string; shortAz: string }> = [
  { id: 'result', titleAz: 'Nəticə & İkiqat Şans (1X2 / 1X / X2 / 12)', shortAz: 'Nəticə' },
  { id: 'goals', titleAz: 'Qol Sayı (Üst/Alt 0.5 – 3.5) & QQ (BTTS)', shortAz: 'Qollar & QQ' },
  { id: 'team_goals', titleAz: 'Komanda Qolları (Üst 0.5 / 1.5)', shortAz: 'Komanda' },
  { id: 'handicap', titleAz: 'Handikap (+1.5 / -1.5)', shortAz: 'Handikap' },
  { id: 'first_half', titleAz: 'İlk Yarı Bazarları (1H)', shortAz: 'İlk Yarı' },
];

export function marketOptionToCouponLeg(
  match: PlatformMatch,
  option: MarketOption
): CouponLeg {
  let odds = option.fairOdds;
  if (match.hasRealOdds && match.bestOdds) {
    if ((option.id === '1x2-home' || option.id === 'res_home') && match.bestOdds.home) {
      odds = match.bestOdds.home;
    } else if ((option.id === '1x2-draw' || option.id === 'res_draw') && match.bestOdds.draw) {
      odds = match.bestOdds.draw;
    } else if ((option.id === '1x2-away' || option.id === 'res_away') && match.bestOdds.away) {
      odds = match.bestOdds.away;
    } else if (
      (option.id === 'ou-25-over' || option.id === 'goals_over_25') &&
      match.bestOdds.over25
    ) {
      odds = match.bestOdds.over25;
    } else if ((option.id === 'btts-yes' || option.id === 'btts_yes') && match.bestOdds.bttsYes) {
      odds = match.bestOdds.bttsYes;
    }
  }

  const impliedProb = Number(((1 / Math.max(1.03, odds)) * 100).toFixed(1));
  const edgePct = Number((option.prob - impliedProb).toFixed(1));

  return {
    id: `${match.id}__${option.id}`,
    matchId: match.id,
    matchLabel: `${match.homeTeamName} – ${match.awayTeamName}`,
    league: match.leagueShort,
    market: option.market,
    selection: option.shortLabel,
    odds: Number(odds.toFixed(2)),
    modelProb: option.prob,
    impliedProb,
    edgePct,
    confidence: option.confidence,
  };
}

function confidenceBadgeClass(tier: ConfidenceTier): string {
  if (tier === 'Yüksək') {
    return 'border-[#2BD576]/35 bg-[#2BD576]/10 text-[#147A42] dark:text-[#2BD576]';
  }
  if (tier === 'Orta') {
    return 'border-[#F5A524]/35 bg-[#F5A524]/10 text-[#A5620A] dark:text-[#F5A524]';
  }
  return 'border-[#DCE2EA] dark:border-[#1E2733] bg-[#EEF1F5] dark:bg-[#171F2B] text-[#64748B]';
}

function barToneForProb(prob: number): 'accent' | 'amber' | 'neutral' {
  if (prob >= 72) return 'accent';
  if (prob >= 52) return 'amber';
  return 'neutral';
}

export const MatchAnalysisDrawer: React.FC<MatchAnalysisDrawerProps> = ({
  match,
  standings,
  customCouponLegIds,
  onClose,
  onAddCouponLeg,
  onOpenFullMatchCenter,
  onOpenHowItWorks,
  onAskAiAboutMatch,
}) => {
  const [aiSummary, setAiSummary] = useState<string>('');
  const [aiSummaryLoading, setAiSummaryLoading] = useState<boolean>(false);
  const [detail, setDetail] = useState<PlatformMatchDetailPayload | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [activeGroup, setActiveGroup] = useState<MarketGroupId | 'all'>('all');

  useEffect(() => {
    if (!match) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [match, onClose]);

  useEffect(() => {
    if (!match) return;
    let cancelled = false;

    setAiSummary('');
    setAiSummaryLoading(true);
    setDetail(null);
    setDetailLoading(true);
    setActiveGroup('all');

    fetch(`/api/ai/match-summary/${encodeURIComponent(match.id)}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { summaryAz?: string } | null) => {
        if (!cancelled && json?.summaryAz) setAiSummary(json.summaryAz);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setAiSummaryLoading(false);
      });

    fetch(
      `/api/platform/matches/${encodeURIComponent(match.id)}?leagueSlug=${encodeURIComponent(
        match.leagueSlug || 'all'
      )}`,
      { cache: 'no-store' }
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: PlatformMatchDetailPayload | null) => {
        if (!cancelled && payload) setDetail(payload);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [match?.id, match?.leagueSlug]);

  const standingsPair = useMemo(() => {
    if (!match) return { homeRow: null, awayRow: null };
    const league = standings.find(
      (l) =>
        l.id === match.leagueId ||
        l.name.toLowerCase().includes(match.leagueName.toLowerCase().slice(0, 8))
    );
    if (!league) return { homeRow: null, awayRow: null };
    const findRow = (teamId: string, teamName: string) =>
      league.table.find(
        (r) =>
          r.teamId === teamId ||
          r.teamName.toLowerCase().includes(teamName.toLowerCase().slice(0, 6))
      ) ?? null;
    return {
      homeRow: findRow(match.homeTeamId, match.homeTeamName),
      awayRow: findRow(match.awayTeamId, match.awayTeamName),
    };
  }, [match, standings]);

  const groupedMarkets = useMemo(() => {
    if (!match) return [];
    const list = match.prediction.markets ?? [];
    return MARKET_GROUPS.filter((g) => activeGroup === 'all' || activeGroup === g.id)
      .map((group) => ({
        ...group,
        items: list.filter((m) => m.group === group.id),
      }))
      .filter((g) => g.items.length > 0);
  }, [match, activeGroup]);

  const lineupsConfirmed =
    (detail?.homeLineup?.length ?? 0) >= 11 && (detail?.awayLineup?.length ?? 0) >= 11;

  const cornersAndCardsStats = useMemo(() => {
    const out: Array<{ label: string; home: number; away: number; unit: string }> = [];
    const stats = detail?.stats ?? [];
    for (const s of stats) {
      const lower = s.label.toLowerCase();
      if (
        lower.includes('künc') ||
        lower.includes('corner') ||
        lower.includes('kart') ||
        lower.includes('vərəq') ||
        lower.includes('card') ||
        lower.includes('faul') ||
        lower.includes('foul')
      ) {
        out.push(s);
      }
    }
    if (
      match &&
      (match.homeYellowCards > 0 ||
        match.awayYellowCards > 0 ||
        match.homeRedCards > 0 ||
        match.awayRedCards > 0) &&
      !out.some((s) => s.label.toLowerCase().includes('vərəq') || s.label.toLowerCase().includes('card'))
    ) {
      out.push({
        label: 'Sarı vərəqələr',
        home: match.homeYellowCards,
        away: match.awayYellowCards,
        unit: '',
      });
      if (match.homeRedCards > 0 || match.awayRedCards > 0) {
        out.push({
          label: 'Qırmızı vərəqələr',
          home: match.homeRedCards,
          away: match.awayRedCards,
          unit: '',
        });
      }
    }
    return out;
  }, [detail?.stats, match]);

  return (
    <AnimatePresence>
      {match && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="match-drawer-title"
          className="fixed inset-0 z-[90] flex items-end md:items-stretch md:justify-end"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0B0F14]/70"
          />

          {/* Bottom sheet on mobile, right editorial side panel on desktop */}
          <motion.div
            initial={{ y: 40, opacity: 0.9 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex max-h-[92vh] md:max-h-none md:h-full w-full md:w-[680px] lg:w-[740px] flex-col overflow-hidden rounded-t-xl md:rounded-t-none md:rounded-l-xl border-t md:border-t-0 md:border-l border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] text-[#111827] dark:text-[#F3F6FA]"
          >
            {/* Mobile Drag Handle */}
            <div className="flex justify-center pt-2.5 pb-1 md:hidden bg-white dark:bg-[#121821]">
              <span className="h-1 w-10 rounded-full bg-[#CBD5E1] dark:bg-[#263140]" />
            </div>

            {/* 1. HEADER */}
            <div className="shrink-0 border-b border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="rounded-[4px] border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#475569] dark:text-[#94A3B8] shrink-0">
                    {match.leagueShort}
                  </span>
                  <span className="truncate text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
                    {match.leagueName}
                  </span>
                  {match.status === 'LIVE' && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#F5A524]/40 bg-[#F5A524]/12 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#A5620A] dark:text-[#F5A524] shrink-0 tabular-nums">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#F5A524]" />
                      CANLI {match.minute}
                    </span>
                  )}
                  {lineupsConfirmed && (
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-[#2BD576]/35 bg-[#2BD576]/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#147A42] dark:text-[#2BD576] shrink-0">
                      <Users className="h-2.5 w-2.5" strokeWidth={1.5} />
                      Heyətlər hazırdır
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={onOpenHowItWorks}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] px-2.5 text-[11px] font-medium text-[#475569] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F3F6FA] cursor-pointer whitespace-nowrap"
                  >
                    <HelpCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <span className="hidden sm:inline">Necə hesablanır?</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Analiz panelini bağla"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] text-[#475569] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F3F6FA] cursor-pointer"
                  >
                    <X className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Matchup Scoreboard */}
              <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <ClubLogo
                    logoUrl={match.homeLogo}
                    shortCode={match.homeShort}
                    name={match.homeTeamName}
                    size="md"
                  />
                  <div className="min-w-0">
                    <h2
                      id="match-drawer-title"
                      className="truncate text-sm sm:text-base font-bold text-[#111827] dark:text-[#F3F6FA]"
                    >
                      {match.homeTeamName}
                    </h2>
                    <p className="font-mono text-[11px] text-[#64748B] tabular-nums">
                      #{standingsPair.homeRow?.position ?? match.homeRank} · xG{' '}
                      {match.prediction.homeXg.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="text-center px-2">
                  {match.homeScore !== null && match.awayScore !== null ? (
                    <div className="font-score text-3xl sm:text-4xl font-bold leading-none tabular-nums text-[#111827] dark:text-[#F3F6FA]">
                      {match.homeScore} : {match.awayScore}
                    </div>
                  ) : (
                    <div className="font-mono text-base font-semibold text-[#111827] dark:text-[#F3F6FA] tabular-nums">
                      {match.time}
                    </div>
                  )}
                  <p className="mt-1 font-mono text-[10px] text-[#64748B] tabular-nums">
                    {match.dateIso}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 min-w-0 text-right">
                  <div className="min-w-0">
                    <div className="truncate text-sm sm:text-base font-bold text-[#111827] dark:text-[#F3F6FA]">
                      {match.awayTeamName}
                    </div>
                    <p className="font-mono text-[11px] text-[#64748B] tabular-nums">
                      xG {match.prediction.awayXg.toFixed(2)} · #
                      {standingsPair.awayRow?.position ?? match.awayRank}
                    </p>
                  </div>
                  <ClubLogo
                    logoUrl={match.awayLogo}
                    shortCode={match.awayShort}
                    name={match.awayTeamName}
                    size="md"
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#DCE2EA] dark:border-[#1E2733] pt-2.5 text-[11px] text-[#64748B]">
                <span className="inline-flex items-center gap-1.5 truncate">
                  <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                  <span className="truncate">{detail?.venue || match.stadium || match.country}</span>
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      onAskAiAboutMatch(
                        `${match.homeTeamName} - ${match.awayTeamName} oyununu ətraflı izah et`
                      )
                    }
                    className="inline-flex items-center gap-1 font-medium text-[#111827] dark:text-[#F3F6FA] hover:text-[#168A4A] dark:hover:text-[#2BD576] cursor-pointer whitespace-nowrap"
                  >
                    <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <span>AI-dan soruş</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenFullMatchCenter(match.id);
                    }}
                    className="inline-flex items-center gap-1 font-semibold text-[#168A4A] dark:text-[#2BD576] hover:underline cursor-pointer whitespace-nowrap"
                  >
                    <span>Tam Matç Mərkəzi</span>
                    <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>

            {/* Compact Last-5 Form Strip (W/D/L badges for both teams) */}
            <MatchFormStrip
              homeTeamName={match.homeTeamName}
              homeShort={match.homeShort}
              homeForm={match.homeForm}
              homeLastForm={detail?.homeLastForm}
              awayTeamName={match.awayTeamName}
              awayShort={match.awayShort}
              awayForm={match.awayForm}
              awayLastForm={detail?.awayLastForm}
              variant="embedded"
            />

            {/* Lineup-Confirmed & Injury/Card Status Strip */}
            <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 border-b border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0E131B] px-4 sm:px-6 py-2 text-[11px]">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-[4px] border px-2 py-0.5 font-mono text-[10px] font-semibold ${
                    lineupsConfirmed
                      ? 'border-[#2BD576]/40 bg-[#2BD576]/10 text-[#147A42] dark:text-[#2BD576]'
                      : 'border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] text-[#64748B]'
                  }`}
                >
                  <Users className="h-3 w-3" strokeWidth={1.5} />
                  {lineupsConfirmed
                    ? `Heyətlər təsdiqlənib (${detail?.homeFormation || '11'} vs ${detail?.awayFormation || '11'})`
                    : 'Heyətlər gözlənilir'}
                </span>

                {(match.homeRedCards > 0 || match.awayRedCards > 0) && (
                  <span className="inline-flex items-center gap-1 rounded-[4px] border border-[#E5484D]/40 bg-[#E5484D]/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#DC3B40] dark:text-[#E5484D] tabular-nums">
                    Qırmızı vərəqə: {match.homeShort} {match.homeRedCards} – {match.awayRedCards}{' '}
                    {match.awayShort}
                  </span>
                )}
              </div>

              {match.hasSharpDrop && (
                <span className="inline-flex items-center gap-1 rounded-[4px] border border-[#F5A524]/40 bg-[#F5A524]/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#A5620A] dark:text-[#F5A524]">
                  <TrendingDown className="h-3 w-3" strokeWidth={1.5} />
                  Kəskin əmsal hərəkəti
                </span>
              )}
            </div>

            {/* Scrollable Editorial Analysis Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-6">
              {/* 4. ƏN YÜKSƏK EHTİMALLAR (TOP 3 SAFEST PICKS) */}
              <section>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck
                      className="h-4 w-4 text-[#168A4A] dark:text-[#2BD576]"
                      strokeWidth={1.5}
                    />
                    <h3 className="font-display text-xl font-bold uppercase tracking-wide text-[#111827] dark:text-[#F3F6FA]">
                      Ən Yüksək Ehtimallar (TOP 3)
                    </h3>
                  </div>
                  <TermTooltip
                    term="Maks. 95%"
                    explanation="Futbolda heç bir nəticə tam qəti deyil. Model bütün bazar ehtimallarını 95% ilə məhdudlaşdırır."
                  />
                </div>

                <div className="mt-3 overflow-hidden rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] divide-y divide-[#DCE2EA] dark:divide-[#1E2733]">
                  {match.prediction.topSafePicks.map((pick, idx) => {
                    const leg = marketOptionToCouponLeg(match, pick);
                    const inCoupon = customCouponLegIds.has(leg.id);
                    return (
                      <div
                        key={pick.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4"
                      >
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[11px] font-semibold text-[#64748B]">
                              0{idx + 1}
                            </span>
                            <span className="text-sm font-bold text-[#111827] dark:text-[#F3F6FA]">
                              {pick.market}: {pick.shortLabel}
                            </span>
                            <span
                              className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${confidenceBadgeClass(
                                pick.confidence
                              )}`}
                            >
                              {pick.confidence}
                            </span>
                          </div>
                          <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-snug">
                            {pick.reasonAz}
                          </p>
                          <TickProbabilityBar
                            value={pick.prob}
                            tone={idx === 0 ? 'accent' : barToneForProb(pick.prob)}
                            height="md"
                          />
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 sm:pl-4">
                          <div className="flex items-baseline gap-2 sm:flex-col sm:items-end sm:gap-0">
                            <span
                              className={`font-display text-3xl font-extrabold leading-none tabular-nums ${
                                idx === 0
                                  ? 'text-[#168A4A] dark:text-[#2BD576]'
                                  : 'text-[#111827] dark:text-[#F3F6FA]'
                              }`}
                            >
                              {pick.prob}%
                            </span>
                            <span className="font-mono text-[11px] text-[#64748B] tabular-nums">
                              @{leg.odds.toFixed(2)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => onAddCouponLeg(leg)}
                            className={`inline-flex min-h-[38px] items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                              inCoupon
                                ? 'bg-[#168A4A] dark:bg-[#2BD576] text-white dark:text-[#08140D]'
                                : 'border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] text-[#111827] dark:text-[#F3F6FA] hover:border-[#168A4A] dark:hover:border-[#2BD576]'
                            }`}
                          >
                            {inCoupon ? (
                              <>
                                <Check className="h-3.5 w-3.5" strokeWidth={1.75} />
                                <span>Kuponda</span>
                              </>
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                                <span>Kupona əlavə et</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* 2. AI ANALİZ SUMMARY (3-4 sentences from server Gemini endpoint) */}
              <section className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#168A4A] dark:text-[#2BD576]">
                    AI ANALİZ XÜLASƏSİ
                  </span>
                  <TermTooltip
                    term={`xG ${match.prediction.homeXg.toFixed(2)}–${match.prediction.awayXg.toFixed(2)}`}
                    explanation="Gözlənilən Qol (Expected Goals) — hər komandanın hücum və müdafiə göstəricilərinə görə ortalama qol ehtimalı."
                  />
                </div>
                {aiSummaryLoading ? (
                  <div className="flex items-center gap-2 py-1 text-xs text-[#64748B]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#2BD576]" strokeWidth={1.5} />
                    <span>Matç məlumatları xülasə edilir...</span>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-[#334155] dark:text-[#CBD5E1]">
                    {aiSummary || match.prediction.top3FactorsAz.join(' ')}
                  </p>
                )}
              </section>

              {/* Pitch xG Pressure Diagram */}
              <MinimalPitchDiagram
                homeShort={match.homeShort}
                awayShort={match.awayShort}
                homeXg={match.prediction.homeXg}
                awayXg={match.prediction.awayXg}
              />

              {/* 3. FULL MARKET PROBABILITY TABLE */}
              <section>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-xl font-bold uppercase tracking-wide text-[#111827] dark:text-[#F3F6FA]">
                    Bütün Bazar Ehtimalları
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => setActiveGroup('all')}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-semibold cursor-pointer transition-colors ${
                        activeGroup === 'all'
                          ? 'bg-[#111827] dark:bg-[#F3F6FA] text-white dark:text-[#0B0F14]'
                          : 'border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] text-[#475569] dark:text-[#94A3B8]'
                      }`}
                    >
                      Hamısı
                    </button>
                    {MARKET_GROUPS.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setActiveGroup(g.id)}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-semibold cursor-pointer transition-colors ${
                          activeGroup === g.id
                            ? 'bg-[#111827] dark:bg-[#F3F6FA] text-white dark:text-[#0B0F14]'
                            : 'border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] text-[#475569] dark:text-[#94A3B8]'
                        }`}
                      >
                        {g.shortAz}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-3 space-y-4">
                  {groupedMarkets.map((group) => (
                    <div
                      key={group.id}
                      className="overflow-hidden rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821]"
                    >
                      <div className="flex items-center justify-between border-b border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0E131B] px-4 py-2 text-[11px] font-mono uppercase tracking-[0.1em] text-[#64748B]">
                        <span>{group.titleAz}</span>
                        <TermTooltip
                          term="Ədalətli əmsal"
                          explanation="Modelin ehtimalına uyğun bukmeker marjasız riyazi əmsal (100 / ehtimal)."
                        />
                      </div>
                      <div className="divide-y divide-[#DCE2EA] dark:divide-[#1E2733]">
                        {group.items.map((opt) => {
                          const leg = marketOptionToCouponLeg(match, opt);
                          const inCoupon = customCouponLegIds.has(leg.id);
                          return (
                            <div
                              key={opt.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-3 hover:bg-[#F8FAFC] dark:hover:bg-[#171F2B] transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs sm:text-sm font-semibold text-[#111827] dark:text-[#F3F6FA]">
                                    {opt.selection}
                                  </span>
                                  <span
                                    className={`rounded-full border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase ${confidenceBadgeClass(
                                      opt.confidence
                                    )}`}
                                  >
                                    {opt.confidence}
                                  </span>
                                </div>
                                <p className="mt-0.5 text-[11px] text-[#64748B] dark:text-[#8A97A8]">
                                  {opt.reasonAz}
                                </p>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                <div className="w-32">
                                  <div className="flex items-center justify-between font-mono text-[11px] tabular-nums">
                                    <span className="font-semibold text-[#111827] dark:text-[#F3F6FA]">
                                      {opt.prob}%
                                    </span>
                                    <span className="text-[#64748B]">@{leg.odds.toFixed(2)}</span>
                                  </div>
                                  <TickProbabilityBar
                                    value={opt.prob}
                                    tone={barToneForProb(opt.prob)}
                                    className="mt-1"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => onAddCouponLeg(leg)}
                                  className={`inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                                    inCoupon
                                      ? 'bg-[#168A4A] dark:bg-[#2BD576] text-white dark:text-[#08140D]'
                                      : 'border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] text-[#111827] dark:text-[#F3F6FA] hover:border-[#168A4A] dark:hover:border-[#2BD576]'
                                  }`}
                                >
                                  {inCoupon ? (
                                    <>
                                      <Check className="h-3 w-3" strokeWidth={1.75} />
                                      <span>Seçilib</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-3 w-3" strokeWidth={1.5} />
                                      <span>Kupona</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 6. SMALL MULTIPLES TEAM STATS + SPARKLINES + H2H */}
              <section className="space-y-3">
                <h3 className="font-display text-xl font-bold uppercase tracking-wide text-[#111827] dark:text-[#F3F6FA]">
                  Komanda Göstəriciləri & H2H
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      label: 'Ev Sahibi',
                      name: match.homeTeamName,
                      rank: standingsPair.homeRow?.position ?? match.homeRank,
                      xg: match.prediction.homeXg,
                      form: match.homeForm,
                      row: standingsPair.homeRow,
                    },
                    {
                      label: 'Qonaq',
                      name: match.awayTeamName,
                      rank: standingsPair.awayRow?.position ?? match.awayRank,
                      xg: match.prediction.awayXg,
                      form: match.awayForm,
                      row: standingsPair.awayRow,
                    },
                  ].map((side) => (
                    <div
                      key={side.label}
                      className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-[#111827] dark:text-[#F3F6FA]">
                          {side.name}
                        </span>
                        <span className="font-mono text-[11px] text-[#64748B] tabular-nums">
                          #{side.rank}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748B]">
                          Son 5
                        </span>
                        <FormSparkline form={side.form} showLetters />
                      </div>

                      <div className="grid grid-cols-3 divide-x divide-[#DCE2EA] dark:divide-[#1E2733] rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] py-2 text-center font-mono tabular-nums">
                        <div>
                          <div className="text-[9px] uppercase text-[#64748B]">Model xG</div>
                          <div className="mt-0.5 text-xs font-semibold text-[#111827] dark:text-[#F3F6FA]">
                            {side.xg.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase text-[#64748B]">Vurulan</div>
                          <div className="mt-0.5 text-xs font-semibold text-[#111827] dark:text-[#F3F6FA]">
                            {side.row && side.row.played > 0
                              ? (side.row.goalsFor / side.row.played).toFixed(2)
                              : side.xg.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase text-[#64748B]">Buraxılan</div>
                          <div className="mt-0.5 text-xs font-semibold text-[#111827] dark:text-[#F3F6FA]">
                            {side.row && side.row.played > 0
                              ? (side.row.goalsAgainst / side.row.played).toFixed(2)
                              : (side.label === 'Ev Sahibi'
                                  ? match.prediction.awayXg
                                  : match.prediction.homeXg
                                ).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {detailLoading ? (
                  <div className="flex items-center gap-2 text-xs text-[#64748B]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />
                    <span>H2H və stadion detalları yüklənir...</span>
                  </div>
                ) : detail?.h2h && detail.h2h.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821]">
                    <div className="border-b border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0E131B] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#64748B]">
                      Son Şəxsi Görüşlər (H2H)
                    </div>
                    <div className="divide-y divide-[#DCE2EA] dark:divide-[#1E2733] text-xs">
                      {detail.h2h.slice(0, 5).map((h, i) => (
                        <div key={i} className="flex items-center justify-between gap-2 px-4 py-2.5">
                          <span className="font-mono text-[10px] text-[#64748B] shrink-0 tabular-nums">
                            {h.date}
                          </span>
                          <span className="truncate text-[#334155] dark:text-[#CBD5E1]">
                            {h.homeTeam} – {h.awayTeam}
                          </span>
                          <span className="font-mono font-semibold text-[#111827] dark:text-[#F3F6FA] shrink-0 tabular-nums">
                            {h.score}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Odds Movement Strip (Real Market Delta) */}
                {match.oddsMovements.length > 0 && (
                  <div className="overflow-hidden rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821]">
                    <div className="flex items-center justify-between border-b border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0E131B] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#64748B]">
                      <span>Əmsal Hərəkəti (Açılış → Cari)</span>
                      <span>{match.oddsProvider || 'Real Bazar'}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#DCE2EA] dark:divide-[#1E2733]">
                      {match.oddsMovements.slice(0, 3).map((mv, i) => (
                        <div key={`${mv.market}-${i}`} className="p-3">
                          <div className="font-mono text-[10px] text-[#64748B] truncate">
                            {mv.market} · {mv.selection}
                          </div>
                          <div className="mt-1 flex items-baseline justify-between gap-2 font-mono tabular-nums">
                            <span className="text-xs text-[#64748B] line-through">
                              {mv.openingOdds.toFixed(2)}
                            </span>
                            <span className="text-sm font-bold text-[#111827] dark:text-[#F3F6FA]">
                              {mv.currentOdds.toFixed(2)}
                            </span>
                            <span
                              className={`text-[10px] font-semibold ${
                                mv.isSharpDrop
                                  ? 'text-[#A5620A] dark:text-[#F5A524]'
                                  : mv.dropPct > 0
                                  ? 'text-[#168A4A] dark:text-[#2BD576]'
                                  : 'text-[#64748B]'
                              }`}
                            >
                              {mv.dropPct > 0 ? `-${mv.dropPct}%` : `+${Math.abs(mv.dropPct)}%`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Corners & Cards Real Stats (when available) */}
                {cornersAndCardsStats.length > 0 && (
                  <div className="overflow-hidden rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821]">
                    <div className="border-b border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0E131B] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#64748B]">
                      Künc, Faul və Kart Göstəriciləri
                    </div>
                    <div className="divide-y divide-[#DCE2EA] dark:divide-[#1E2733] px-4">
                      {cornersAndCardsStats.map((s) => {
                        const total = Math.max(1, s.home + s.away);
                        const homePct = Math.round((s.home / total) * 100);
                        return (
                          <div key={s.label} className="py-2.5 space-y-1.5">
                            <div className="flex items-center justify-between font-mono text-xs tabular-nums">
                              <span className="font-semibold text-[#111827] dark:text-[#F3F6FA]">
                                {s.home}
                                {s.unit}
                              </span>
                              <span className="font-sans text-[11px] text-[#64748B]">
                                {s.label}
                              </span>
                              <span className="font-semibold text-[#111827] dark:text-[#F3F6FA]">
                                {s.away}
                                {s.unit}
                              </span>
                            </div>
                            <div className="flex h-1.5 w-full overflow-hidden rounded-[2px] bg-[#E2E7EE] dark:bg-[#1E2733]">
                              <div
                                style={{ width: `${homePct}%` }}
                                className="bg-[#168A4A] dark:bg-[#2BD576]"
                              />
                              <div
                                style={{ width: `${100 - homePct}%` }}
                                className="bg-[#64748B]/60"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Most Likely Scorelines */}
                <div className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#64748B]">
                    Ən Çox Gözlənilən Hesablar
                  </div>
                  <div className="mt-2.5 grid grid-cols-4 gap-2">
                    {match.prediction.topScorelines.map((s) => (
                      <div
                        key={s.score}
                        className="rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] py-2 text-center"
                      >
                        <div className="font-score text-xl font-bold text-[#111827] dark:text-[#F3F6FA] tabular-nums">
                          {s.score}
                        </div>
                        <div className="font-mono text-[10px] font-medium text-[#168A4A] dark:text-[#2BD576] tabular-nums">
                          {s.prob}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* 7. RİSK XƏBƏRDARLIĞI */}
              <section className="rounded-xl border border-[#F5A524]/40 bg-[#F5A524]/[0.07] p-4">
                <div className="flex items-center gap-2 text-[#A5620A] dark:text-[#F5A524]">
                  <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.12em]">
                    Risk Xəbərdarlığı
                  </h3>
                </div>
                <ul className="mt-2 space-y-1.5 text-xs text-[#334155] dark:text-[#CBD5E1] list-disc pl-4 leading-relaxed">
                  {match.prediction.riskWarningsAz.map((warn, i) => (
                    <li key={i}>{warn}</li>
                  ))}
                  {!lineupsConfirmed && match.status === 'UPCOMING' && (
                    <li>
                      Rəsmi start heyətləri hələ açıqlanmayıb — son dəqiqə itkiləri ehtimalları
                      dəyişə bilər.
                    </li>
                  )}
                </ul>
              </section>

              <p className="pb-2 text-center text-[11px] text-[#64748B]">
                {MANDATORY_DISCLAIMER_AZ}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
