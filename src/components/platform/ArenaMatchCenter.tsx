import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Award,
  BarChart2,
  Calendar,
  Check,
  HelpCircle,
  Plus,
  RefreshCw,
  Scale,
  Search,
  ShieldCheck,
  Star,
  Target,
  TrendingDown,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import type { PlatformMatch } from '../../types/platform';
import type { RecentGoalFlash } from '../../hooks/useLiveScoreStream';
import {
  MANDATORY_DISCLAIMER_AZ,
  type ConfidenceTier,
  type CouponLeg,
  type MarketOption,
} from '../../utils/bettingInsightsEngine';
import { ClubLogo } from './ClubLogo';
import { FlipScoreDigit } from '../portal/FlipScoreDigit';
import { marketOptionToCouponLeg } from './MatchAnalysisDrawer';
import { FormSparkline, TickProbabilityBar } from '../editorial/SportsViz';

export type MatchCenterFilter =
  | 'all'
  | 'live'
  | 'finished'
  | 'upcoming'
  | 'my-leagues'
  | 'my-teams';

export type SmartPresetId = 'all' | 'safe' | 'balanced' | 'value' | 'top10';

interface ArenaMatchCenterProps {
  matches: PlatformMatch[];
  loading: boolean;
  sourceLabel: string;
  selectedCalendarDate: string;
  onSelectCalendarDate: (isoDate: string) => void;
  favoriteTeams: string[];
  favoriteLeagues: string[];
  onToggleFavoriteTeam: (teamId: string) => void;
  onToggleFavoriteLeague: (leagueId: string) => void;
  onSelectMatch: (matchId: string) => void;
  onAddCouponLeg: (leg: CouponLeg) => void;
  customCouponLegIds: Set<string>;
  autoRefreshEnabled: boolean;
  onToggleAutoRefresh: () => void;
  onManualRefresh: () => void;
  refreshing: boolean;
  showValueBadges: boolean;
  showSharpDropBadges: boolean;
  recentGoalFlashes?: Record<string, RecentGoalFlash>;
  goalSoundEnabled?: boolean;
  onToggleGoalSound?: () => void;
  onOpenHowItWorks?: () => void;
}

const DATE_TABS = [
  { id: 'all', label: 'Bütün günlər' },
  { id: 'yesterday', label: 'Dünən' },
  { id: 'today', label: 'Bu gün' },
  { id: 'tomorrow', label: 'Sabah' },
] as const;

const FILTER_TABS: Array<{ id: MatchCenterFilter; label: string }> = [
  { id: 'all', label: 'Hamısı' },
  { id: 'live', label: 'Canlı' },
  { id: 'upcoming', label: 'Gələcək' },
  { id: 'finished', label: 'Bitdi' },
  { id: 'my-leagues', label: 'Liqalarım' },
  { id: 'my-teams', label: 'Mənim oyunlarım' },
];

const SMART_PRESETS: Array<{
  id: SmartPresetId;
  label: string;
  sublabel: string;
}> = [
  { id: 'all', label: 'Bütün oyunlar', sublabel: 'Tam proqram' },
  { id: 'safe', label: 'Təhlükəsiz (80%+)', sublabel: 'Ən yüksək ehtimal' },
  { id: 'balanced', label: 'Balanslı (65–80%)', sublabel: 'Optimal əmsal balansı' },
  { id: 'value', label: 'Dəyərli (+5%)', sublabel: 'Model vs bazar fərqi' },
  { id: 'top10', label: 'Günün TOP 10', sublabel: 'Ən yüksək 10 seçim' },
];

function confidenceTone(confidence: ConfidenceTier): 'accent' | 'amber' | 'neutral' {
  if (confidence === 'Yüksək') return 'accent';
  if (confidence === 'Orta') return 'amber';
  return 'neutral';
}

function confidenceChipClass(confidence: ConfidenceTier): string {
  if (confidence === 'Yüksək') {
    return 'border-[#2BD576]/35 bg-[#2BD576]/10 text-[#147A42] dark:text-[#2BD576]';
  }
  if (confidence === 'Orta') {
    return 'border-[#F5A524]/35 bg-[#F5A524]/10 text-[#A5620A] dark:text-[#F5A524]';
  }
  return 'border-[#DCE2EA] dark:border-[#1E2733] bg-[#EEF1F5] dark:bg-[#171F2B] text-[#64748B] dark:text-[#94A3B8]';
}

function getBalancedPick(m: PlatformMatch): MarketOption | undefined {
  return (m.prediction.markets ?? [])
    .filter((opt) => opt.prob >= 65 && opt.prob <= 80)
    .sort((a, b) => b.prob - a.prob)[0];
}

export const ArenaMatchCenter: React.FC<ArenaMatchCenterProps> = ({
  matches,
  loading,
  sourceLabel,
  selectedCalendarDate,
  onSelectCalendarDate,
  favoriteTeams,
  favoriteLeagues,
  onToggleFavoriteTeam,
  onToggleFavoriteLeague,
  onSelectMatch,
  onAddCouponLeg,
  customCouponLegIds,
  autoRefreshEnabled,
  onToggleAutoRefresh,
  onManualRefresh,
  refreshing,
  showValueBadges,
  showSharpDropBadges,
  recentGoalFlashes = {},
  goalSoundEnabled = true,
  onToggleGoalSound,
  onOpenHowItWorks,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<MatchCenterFilter>('all');
  const [smartPreset, setSmartPreset] = useState<SmartPresetId>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const favTeamSet = useMemo(() => new Set(favoriteTeams), [favoriteTeams]);
  const favLeagueSet = useMemo(() => new Set(favoriteLeagues), [favoriteLeagues]);

  const baseDateAndStatusMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return matches.filter((m) => {
      if (selectedCalendarDate) {
        if (m.dateIso !== selectedCalendarDate) return false;
      } else if (selectedDate !== 'all' && m.dateId !== selectedDate) {
        return false;
      }

      if (statusFilter === 'live' && m.status !== 'LIVE') return false;
      if (statusFilter === 'finished' && m.status !== 'FINISHED') return false;
      if (statusFilter === 'upcoming' && m.status !== 'UPCOMING') return false;
      if (statusFilter === 'my-leagues' && !favLeagueSet.has(m.leagueId)) return false;
      if (
        statusFilter === 'my-teams' &&
        !favTeamSet.has(m.homeTeamId) &&
        !favTeamSet.has(m.awayTeamId) &&
        !favLeagueSet.has(m.leagueId)
      ) {
        return false;
      }

      if (q) {
        const hay = `${m.homeTeamName} ${m.awayTeamName} ${m.leagueName} ${m.country}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [
    matches,
    selectedDate,
    selectedCalendarDate,
    statusFilter,
    searchQuery,
    favTeamSet,
    favLeagueSet,
  ]);

  const filteredMatches = useMemo(() => {
    if (smartPreset === 'safe') {
      return baseDateAndStatusMatches.filter(
        (m) => m.status !== 'FINISHED' && m.prediction.topPick.prob >= 80
      );
    }
    if (smartPreset === 'balanced') {
      return baseDateAndStatusMatches.filter(
        (m) => m.status !== 'FINISHED' && Boolean(getBalancedPick(m))
      );
    }
    if (smartPreset === 'value') {
      return baseDateAndStatusMatches.filter(
        (m) =>
          m.status !== 'FINISHED' &&
          m.hasRealOdds &&
          m.valueBets.some((v) => v.isValueBet)
      );
    }
    return baseDateAndStatusMatches;
  }, [baseDateAndStatusMatches, smartPreset]);

  const top10Picks = useMemo(() => {
    return baseDateAndStatusMatches
      .filter((m) => m.status !== 'FINISHED' && m.prediction.topPick)
      .map((m) => ({
        match: m,
        pick: m.prediction.topPick,
        leg: marketOptionToCouponLeg(m, m.prediction.topPick),
      }))
      .sort((a, b) => b.pick.prob - a.pick.prob)
      .slice(0, 10);
  }, [baseDateAndStatusMatches]);

  const { pinnedFavorites, leagueGroups } = useMemo(() => {
    const pinned: PlatformMatch[] = [];
    const regular: PlatformMatch[] = [];

    for (const m of filteredMatches) {
      const isFav =
        favTeamSet.has(m.homeTeamId) ||
        favTeamSet.has(m.awayTeamId) ||
        favLeagueSet.has(m.leagueId);
      if (isFav) pinned.push(m);
      else regular.push(m);
    }

    const groupMap = new Map<
      string,
      {
        leagueId: string;
        country: string;
        countryCode: string;
        leagueName: string;
        items: PlatformMatch[];
      }
    >();

    for (const m of regular) {
      const key = `${m.country}::${m.leagueId}`;
      const existing = groupMap.get(key);
      if (existing) {
        existing.items.push(m);
      } else {
        groupMap.set(key, {
          leagueId: m.leagueId,
          country: m.country,
          countryCode: m.countryCode,
          leagueName: m.leagueName,
          items: [m],
        });
      }
    }

    return {
      pinnedFavorites: pinned,
      leagueGroups: Array.from(groupMap.values()),
    };
  }, [filteredMatches, favTeamSet, favLeagueSet]);

  const liveCount = matches.filter((m) => m.status === 'LIVE').length;
  const safeCount = matches.filter(
    (m) => m.status !== 'FINISHED' && m.prediction.topPick.prob >= 80
  ).length;
  const valueCount = matches.reduce(
    (sum, m) =>
      sum +
      (m.status !== 'FINISHED' && m.hasRealOdds
        ? m.valueBets.filter((v) => v.isValueBet).length
        : 0),
    0
  );

  const renderMatchRow = (m: PlatformMatch) => {
    const isHomeFav = favTeamSet.has(m.homeTeamId);
    const isAwayFav = favTeamSet.has(m.awayTeamId);
    const topValue = m.hasRealOdds
      ? m.valueBets.filter((v) => v.isValueBet).sort((a, b) => b.edgePct - a.edgePct)[0]
      : undefined;

    const activePick =
      smartPreset === 'balanced'
        ? getBalancedPick(m) ?? m.prediction.topPick
        : m.prediction.topPick;
    const quickLeg = marketOptionToCouponLeg(m, activePick);
    const isInCoupon = customCouponLegIds.has(quickLeg.id);
    const goalFlash = recentGoalFlashes[m.id];

    return (
      <div
        key={m.id}
        className={`group transition-colors duration-150 ${
          goalFlash
            ? 'bg-[#F5A524]/10'
            : 'bg-white dark:bg-[#121821] hover:bg-[#F8FAFC] dark:hover:bg-[#171F2B]'
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-[84px_1fr_290px_auto] items-center gap-3 px-4 py-3.5">
          {/* Status / Kickoff Column */}
          <div className="flex md:flex-col items-center md:items-start justify-between gap-1">
            {goalFlash ? (
              <span className="inline-flex items-center gap-1 rounded-[4px] bg-[#F5A524] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#0B0F14] tabular-nums">
                QOL · {goalFlash.minute || m.minute}
              </span>
            ) : m.status === 'LIVE' ? (
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#A5620A] dark:text-[#F5A524] tabular-nums">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F5A524]" />
                {m.minute}
              </span>
            ) : m.status === 'FINISHED' ? (
              <span className="font-mono text-[11px] font-medium text-[#64748B]">BİTDİ</span>
            ) : (
              <span className="font-mono text-xs font-semibold text-[#111827] dark:text-[#F3F6FA] tabular-nums">
                {m.time}
              </span>
            )}
            <span className="font-mono text-[10px] text-[#64748B] truncate max-w-[140px] md:max-w-[78px] tabular-nums">
              {goalFlash?.scorerName ? goalFlash.scorerName : m.dateIso.slice(5)}
            </span>
          </div>

          {/* Teams, Sparkline Form & Tabular Score */}
          <button
            type="button"
            onClick={() => onSelectMatch(m.id)}
            className="flex min-h-[44px] items-center justify-between gap-3 text-left cursor-pointer min-w-0"
            aria-label={`${m.homeTeamName} - ${m.awayTeamName} analizini aç`}
          >
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <ClubLogo
                  logoUrl={m.homeLogo}
                  shortCode={m.homeShort}
                  name={m.homeTeamName}
                  size="xs"
                />
                <span className="truncate text-sm font-semibold text-[#111827] dark:text-[#F3F6FA] group-hover:text-[#168A4A] dark:group-hover:text-[#2BD576] transition-colors">
                  {m.homeTeamName}
                </span>
                {m.homeRedCards > 0 && (
                  <span
                    title={`Qırmızı vərəqə: ${m.homeRedCards}`}
                    className="inline-flex h-3.5 min-w-[11px] items-center justify-center rounded-[2px] bg-[#E5484D] px-1 font-mono text-[9px] font-bold text-white"
                  >
                    {m.homeRedCards}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 min-w-0">
                <ClubLogo
                  logoUrl={m.awayLogo}
                  shortCode={m.awayShort}
                  name={m.awayTeamName}
                  size="xs"
                />
                <span className="truncate text-sm font-semibold text-[#111827] dark:text-[#F3F6FA] group-hover:text-[#168A4A] dark:group-hover:text-[#2BD576] transition-colors">
                  {m.awayTeamName}
                </span>
                {m.awayRedCards > 0 && (
                  <span
                    title={`Qırmızı vərəqə: ${m.awayRedCards}`}
                    className="inline-flex h-3.5 min-w-[11px] items-center justify-center rounded-[2px] bg-[#E5484D] px-1 font-mono text-[9px] font-bold text-white"
                  >
                    {m.awayRedCards}
                  </span>
                )}
              </div>
            </div>

            {/* Subtle Form Sparkline on Desktop */}
            <div className="hidden lg:flex flex-col items-end gap-0.5 shrink-0 pr-2">
              <FormSparkline form={m.homeForm} />
              <span className="font-mono text-[10px] text-[#64748B] tabular-nums">
                xG {m.prediction.homeXg.toFixed(1)}–{m.prediction.awayXg.toFixed(1)}
              </span>
            </div>

            {/* Score */}
            <div className="flex flex-col items-end font-score text-2xl font-bold leading-tight tabular-nums text-[#111827] dark:text-[#F3F6FA] min-w-[26px]">
              {m.homeScore !== null && m.awayScore !== null ? (
                <>
                  <FlipScoreDigit value={m.homeScore} flash={goalFlash?.side === 'home'} />
                  <FlipScoreDigit value={m.awayScore} flash={goalFlash?.side === 'away'} />
                </>
              ) : (
                <span className="font-mono text-[11px] font-medium text-[#64748B]">VS</span>
              )}
            </div>
          </button>

          {/* Top Təklif Readout — Best Pick Visible in <1 Second */}
          <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-[#DCE2EA] dark:border-[#1E2733] pt-2.5 md:pt-0 md:pl-4">
            <div className="flex items-baseline justify-between gap-2">
              <button
                type="button"
                onClick={() => onSelectMatch(m.id)}
                className="flex items-center gap-2 min-w-0 text-left cursor-pointer"
              >
                <span className="truncate text-xs font-semibold text-[#111827] dark:text-[#F3F6FA]">
                  {activePick.shortLabel}
                </span>
                <span
                  className={`rounded-full border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide shrink-0 ${confidenceChipClass(
                    activePick.confidence
                  )}`}
                >
                  {activePick.confidence}
                </span>
              </button>
              <span
                className={`font-display text-2xl font-extrabold leading-none tabular-nums shrink-0 ${
                  activePick.confidence === 'Yüksək'
                    ? 'text-[#168A4A] dark:text-[#2BD576]'
                    : activePick.confidence === 'Orta'
                    ? 'text-[#A5620A] dark:text-[#F5A524]'
                    : 'text-[#64748B] dark:text-[#94A3B8]'
                }`}
              >
                {activePick.prob}%
              </span>
            </div>

            <TickProbabilityBar
              value={activePick.prob}
              tone={confidenceTone(activePick.confidence)}
              animate={false}
            />

            <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-[#64748B] tabular-nums">
              <span>
                1: {m.prediction.homeWinProb}% · X: {m.prediction.drawProb}% · 2:{' '}
                {m.prediction.awayWinProb}%
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {showValueBadges && topValue && m.status !== 'FINISHED' && (
                  <span className="font-semibold text-[#168A4A] dark:text-[#2BD576]">
                    +{topValue.edgePct}%
                  </span>
                )}
                {showSharpDropBadges && m.hasSharpDrop && (
                  <span
                    title="Kəskin əmsal düşüşü"
                    className="inline-flex items-center gap-0.5 font-semibold text-[#B4690E] dark:text-[#F5A524]"
                  >
                    <TrendingDown className="h-3 w-3" strokeWidth={1.5} />
                    <span>Eniş</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions: Favorite + Quick Add to Coupon + Analysis */}
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => onToggleFavoriteTeam(m.homeTeamId)}
              aria-label={`${m.homeTeamName} favoritlərə əlavə et`}
              title="Favorit"
              className={`inline-flex h-10 w-10 md:h-9 md:w-9 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                isHomeFav || isAwayFav
                  ? 'border-[#F5A524]/45 bg-[#F5A524]/10 text-[#B4690E] dark:text-[#F5A524]'
                  : 'border-[#DCE2EA] dark:border-[#1E2733] text-[#64748B] hover:text-[#111827] dark:hover:text-[#F3F6FA]'
              }`}
            >
              <Star
                className={`h-3.5 w-3.5 ${isHomeFav || isAwayFav ? 'fill-current' : ''}`}
                strokeWidth={1.5}
              />
            </button>

            {m.status !== 'FINISHED' && (
              <button
                type="button"
                onClick={() => onAddCouponLeg(quickLeg)}
                title={`Kupona əlavə et: ${activePick.shortLabel} (${activePick.prob}%)`}
                className={`inline-flex h-10 md:h-9 items-center gap-1 rounded-lg border px-2.5 font-mono text-xs font-semibold tabular-nums transition-colors cursor-pointer whitespace-nowrap ${
                  isInCoupon
                    ? 'border-[#168A4A] dark:border-[#2BD576] bg-[#168A4A] dark:bg-[#2BD576] text-white dark:text-[#08140D]'
                    : 'border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] text-[#111827] dark:text-[#F3F6FA] hover:border-[#168A4A] dark:hover:border-[#2BD576]'
                }`}
              >
                {isInCoupon ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={1.75} />
                ) : (
                  <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                )}
                <span>{quickLeg.odds.toFixed(2)}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onSelectMatch(m.id)}
              className="h-10 md:h-9 rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#171F2B] px-3 text-xs font-semibold text-[#111827] dark:text-[#F3F6FA] hover:border-[#168A4A] dark:hover:border-[#2BD576] transition-colors cursor-pointer whitespace-nowrap"
            >
              Analiz
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section id="oyunlar" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Editorial Section Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#168A4A] dark:text-[#2BD576]">
            MATÇ MƏRKƏZİ · {sourceLabel || 'REAL DATA'}
          </p>
          <h2 className="mt-1 font-display text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-[#111827] dark:text-[#F3F6FA]">
            Günün Oyunları & Top Təkliflər
          </h2>
          <p className="mt-1 font-mono text-xs text-[#64748B] dark:text-[#8A97A8] tabular-nums">
            {matches.length} matç · {liveCount} canlı · {safeCount} təhlükəsiz (80%+) ·{' '}
            {valueCount} dəyər siqnalı
          </p>
        </div>

        {/* Search + Utility Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]"
              strokeWidth={1.5}
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Komanda və ya liqa axtar..."
              aria-label="Komanda və ya liqa axtar"
              className="h-10 w-full rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] pl-9 pr-3 text-sm text-[#111827] dark:text-[#F3F6FA] placeholder:text-[#64748B] focus:border-[#2BD576] focus:outline-none"
            />
          </div>

          {onOpenHowItWorks && (
            <button
              type="button"
              onClick={onOpenHowItWorks}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] px-3 text-xs font-semibold text-[#111827] dark:text-[#F3F6FA] hover:border-[#94A3B8] dark:hover:border-[#334155] transition-colors cursor-pointer whitespace-nowrap"
            >
              <HelpCircle className="h-3.5 w-3.5 text-[#64748B]" strokeWidth={1.5} />
              <span>Necə hesablanır?</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleAutoRefresh}
            aria-pressed={autoRefreshEnabled}
            className={`inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              autoRefreshEnabled
                ? 'border-[#2BD576]/40 bg-[#2BD576]/10 text-[#147A42] dark:text-[#2BD576]'
                : 'border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] text-[#64748B]'
            }`}
          >
            <Zap className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>{autoRefreshEnabled ? 'Anlıq Axın' : 'Avto-yenilə'}</span>
          </button>

          {onToggleGoalSound && (
            <button
              type="button"
              onClick={onToggleGoalSound}
              aria-pressed={goalSoundEnabled}
              title={goalSoundEnabled ? 'Qol səsi aktivdir' : 'Qol səsi bağlıdır'}
              className={`inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                goalSoundEnabled
                  ? 'border-[#F5A524]/40 bg-[#F5A524]/10 text-[#A5620A] dark:text-[#F5A524]'
                  : 'border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] text-[#64748B]'
              }`}
            >
              {goalSoundEnabled ? (
                <Volume2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              ) : (
                <VolumeX className="h-3.5 w-3.5" strokeWidth={1.5} />
              )}
              <span className="hidden sm:inline">Qol Səsi</span>
            </button>
          )}

          <button
            type="button"
            onClick={onManualRefresh}
            disabled={refreshing}
            aria-label="Oyunları yenilə"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] text-[#475569] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F3F6FA] cursor-pointer shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* SMART PRESETS — Segmented Editorial Strip */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-2">
        {SMART_PRESETS.map((preset) => {
          const active = smartPreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => setSmartPreset(preset.id)}
              className={`flex min-h-[54px] flex-col justify-center rounded-lg border px-3.5 py-2.5 text-left transition-colors duration-150 cursor-pointer ${
                active
                  ? preset.id === 'top10'
                    ? 'border-[#168A4A] dark:border-[#2BD576] bg-[#168A4A] dark:bg-[#2BD576] text-white dark:text-[#08140D]'
                    : 'border-[#168A4A]/60 dark:border-[#2BD576]/55 bg-[#2BD576]/10 text-[#111827] dark:text-[#F3F6FA]'
                  : 'border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] text-[#111827] dark:text-[#F3F6FA] hover:border-[#94A3B8] dark:hover:border-[#334155]'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap">
                {preset.id === 'all' && <BarChart2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />}
                {preset.id === 'safe' && <ShieldCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />}
                {preset.id === 'balanced' && <Scale className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />}
                {preset.id === 'value' && <Target className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />}
                {preset.id === 'top10' && <Award className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />}
                <span>{preset.label}</span>
              </div>
              <span
                className={`mt-0.5 text-[11px] ${
                  active && preset.id === 'top10'
                    ? 'text-white/85 dark:text-[#08140D]/80'
                    : 'text-[#64748B] dark:text-[#8A97A8]'
                }`}
              >
                {preset.sublabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Date Strip + Calendar Picker + Status Filters (Compact Single Band) */}
      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1">
            {DATE_TABS.map((d) => {
              const active = !selectedCalendarDate && selectedDate === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    onSelectCalendarDate('');
                    setSelectedDate(d.id);
                  }}
                  className={`min-h-[36px] rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#111827] dark:bg-[#F3F6FA] text-white dark:text-[#0B0F14]'
                      : 'text-[#475569] dark:text-[#94A3B8] hover:bg-[#EEF1F5] dark:hover:bg-[#171F2B]'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>

          <label className="inline-flex h-9 items-center gap-2 rounded-md border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] px-2.5 text-xs text-[#475569] dark:text-[#94A3B8]">
            <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span className="sr-only">Təqvim tarixi seç</span>
            <input
              type="date"
              value={selectedCalendarDate}
              onChange={(e) => onSelectCalendarDate(e.target.value)}
              className="bg-transparent font-mono text-xs text-[#111827] dark:text-[#F3F6FA] focus:outline-none"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-t border-[#DCE2EA] dark:border-[#1E2733] pt-2.5">
          {FILTER_TABS.map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? tab.id === 'live'
                      ? 'border-[#F5A524]/50 bg-[#F5A524]/12 text-[#A5620A] dark:text-[#F5A524] font-semibold'
                      : 'border-[#168A4A]/50 dark:border-[#2BD576]/45 bg-[#2BD576]/10 text-[#147A42] dark:text-[#2BD576] font-semibold'
                    : 'border-transparent bg-transparent text-[#475569] dark:text-[#94A3B8] hover:bg-[#EEF1F5] dark:hover:bg-[#171F2B]'
                }`}
              >
                {tab.id === 'live' && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#F5A524]" />
                )}
                <span>{tab.label}</span>
                {tab.id === 'live' && (
                  <span className="font-mono text-[11px] tabular-nums">({liveCount})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area: Skeletons / TOP 10 Editorial Table / Grouped Match Lists */}
      <div className="mt-6 space-y-6">
        {loading && matches.length === 0 ? (
          <div className="overflow-hidden rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] divide-y divide-[#DCE2EA] dark:divide-[#1E2733] bg-white dark:bg-[#121821]">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-[84px_1fr_290px_auto] gap-3 p-4 animate-pulse">
                <div className="h-5 w-14 rounded bg-[#E2E7EE] dark:bg-[#1E2733]" />
                <div className="space-y-2">
                  <div className="h-4 w-44 rounded bg-[#E2E7EE] dark:bg-[#1E2733]" />
                  <div className="h-4 w-36 rounded bg-[#E2E7EE] dark:bg-[#1E2733]" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full rounded bg-[#E2E7EE] dark:bg-[#1E2733]" />
                  <div className="h-1.5 w-full rounded bg-[#E2E7EE] dark:bg-[#1E2733]" />
                </div>
                <div className="h-9 w-24 rounded bg-[#E2E7EE] dark:bg-[#1E2733]" />
              </div>
            ))}
          </div>
        ) : smartPreset === 'top10' ? (
          /* GÜNÜN TOP 10 — Clean Ranked Editorial List (NOT a generic identical card grid) */
          <div className="overflow-hidden rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0E131B] px-4 py-3">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-[#168A4A] dark:text-[#2BD576]" strokeWidth={1.5} />
                <h3 className="font-display text-xl font-bold uppercase tracking-wide text-[#111827] dark:text-[#F3F6FA]">
                  Günün TOP 10 Ən Yüksək Ehtimallı Seçimi
                </h3>
              </div>
              <span className="font-mono text-[11px] text-[#64748B]">
                Ehtimala görə sıralanıb · maks. 95%
              </span>
            </div>

            {top10Picks.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#64748B]">
                Seçilmiş tarix və filtrdə qarşıdan gələn oyun yoxdur.
              </div>
            ) : (
              <div className="divide-y divide-[#DCE2EA] dark:divide-[#1E2733]">
                {top10Picks.map(({ match: m, pick, leg }, idx) => {
                  const inCoupon = customCouponLegIds.has(leg.id);
                  return (
                    <motion.div
                      key={`${m.id}-${pick.id}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.16, delay: idx * 0.025, ease: 'easeOut' }}
                      className="grid grid-cols-1 md:grid-cols-[44px_1fr_240px_auto] items-center gap-3 px-4 py-3.5 hover:bg-[#F8FAFC] dark:hover:bg-[#171F2B] transition-colors"
                    >
                      <span className="font-mono text-xs font-semibold text-[#64748B] tabular-nums">
                        {String(idx + 1).padStart(2, '0')}
                      </span>

                      <button
                        type="button"
                        onClick={() => onSelectMatch(m.id)}
                        className="text-left min-w-0 cursor-pointer"
                      >
                        <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748B]">
                          {m.leagueName} · {m.status === 'LIVE' ? `CANLI ${m.minute}` : m.time}
                        </div>
                        <div className="mt-0.5 truncate text-sm font-semibold text-[#111827] dark:text-[#F3F6FA]">
                          {m.homeTeamName} – {m.awayTeamName}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-[#64748B] dark:text-[#8A97A8]">
                          {pick.reasonAz}
                        </p>
                      </button>

                      <div className="space-y-1.5">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-xs font-semibold text-[#111827] dark:text-[#F3F6FA]">
                            {pick.shortLabel}
                          </span>
                          <span className="font-display text-2xl font-extrabold leading-none text-[#168A4A] dark:text-[#2BD576] tabular-nums">
                            {pick.prob}%
                          </span>
                        </div>
                        <TickProbabilityBar value={pick.prob} tone={confidenceTone(pick.confidence)} />
                        <div className="flex items-center justify-between font-mono text-[10px] text-[#64748B] tabular-nums">
                          <span>Etibarlılıq: {pick.confidence}</span>
                          <span>Əmsal ~{leg.odds.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectMatch(m.id)}
                          className="h-10 md:h-9 rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] px-3 text-xs font-medium text-[#111827] dark:text-[#F3F6FA] hover:border-[#94A3B8] cursor-pointer"
                        >
                          Detallar
                        </button>
                        <button
                          type="button"
                          onClick={() => onAddCouponLeg(leg)}
                          className={`inline-flex h-10 md:h-9 items-center gap-1 rounded-lg px-3 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
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
                              <span>Kupona</span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Pinned Favorites Group */}
            {pinnedFavorites.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-[#F5A524]/35 bg-white dark:bg-[#121821]">
                <div className="flex items-center justify-between border-b border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0E131B] px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Star className="h-3.5 w-3.5 fill-[#F5A524] text-[#F5A524]" strokeWidth={1.5} />
                    <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#111827] dark:text-[#F3F6FA]">
                      Mənim oyunlarım ({pinnedFavorites.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#64748B]">Bərkidilmiş klub və liqalar</span>
                </div>
                <div className="divide-y divide-[#DCE2EA] dark:divide-[#1E2733]">
                  {pinnedFavorites.map(renderMatchRow)}
                </div>
              </div>
            )}

            {/* Country & League Hairline Tables */}
            {leagueGroups.map((group) => {
              const isLeagueFav = favLeagueSet.has(group.leagueId);
              return (
                <div
                  key={`${group.country}-${group.leagueId}`}
                  className="overflow-hidden rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821]"
                >
                  <div className="flex items-center justify-between border-b border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0E131B] px-4 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="inline-flex h-5 min-w-[26px] items-center justify-center rounded-[4px] border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] px-1.5 font-mono text-[10px] font-semibold text-[#475569] dark:text-[#94A3B8]">
                        {group.countryCode}
                      </span>
                      <div className="flex items-baseline gap-2 min-w-0">
                        <h3 className="truncate font-display text-lg font-bold uppercase tracking-wide text-[#111827] dark:text-[#F3F6FA]">
                          {group.leagueName}
                        </h3>
                        <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748B]">
                          {group.country}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleFavoriteLeague(group.leagueId)}
                      aria-label={`${group.leagueName} liqasını favoritlərə bərkit`}
                      className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium cursor-pointer transition-colors ${
                        isLeagueFav
                          ? 'border-[#F5A524]/45 bg-[#F5A524]/10 text-[#A5620A] dark:text-[#F5A524]'
                          : 'border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] text-[#64748B] hover:text-[#111827] dark:hover:text-[#F3F6FA]'
                      }`}
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${isLeagueFav ? 'fill-current' : ''}`}
                        strokeWidth={1.5}
                      />
                      <span className="hidden sm:inline">
                        {isLeagueFav ? 'Bərkidilib' : 'Bərkit'}
                      </span>
                    </button>
                  </div>
                  <div className="divide-y divide-[#DCE2EA] dark:divide-[#1E2733]">
                    {group.items.map(renderMatchRow)}
                  </div>
                </div>
              );
            })}

            {filteredMatches.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#CBD5E1] dark:border-[#263140] bg-white dark:bg-[#121821] p-10 text-center">
                <p className="font-display text-2xl font-bold uppercase text-[#111827] dark:text-[#F3F6FA]">
                  Bu filtrdə uyğun matç tapılmadı
                </p>
                <p className="mt-1 text-sm text-[#64748B] dark:text-[#8A97A8]">
                  Tarixi, preset seçimini və ya axtarış sözünü sıfırlayaraq tam təqvimə qayıdın.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSmartPreset('all');
                    setSelectedDate('all');
                    onSelectCalendarDate('');
                    setStatusFilter('all');
                    setSearchQuery('');
                  }}
                  className="mt-4 inline-flex min-h-[40px] items-center rounded-lg bg-[#168A4A] dark:bg-[#2BD576] px-4 py-2 text-xs font-semibold text-white dark:text-[#08140D] cursor-pointer"
                >
                  Filtrləri sıfırla
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mandatory Responsible Use Disclaimer */}
      <p className="mt-6 text-center text-xs text-[#64748B] dark:text-[#8A97A8]">
        {MANDATORY_DISCLAIMER_AZ}
      </p>
    </section>
  );
};
