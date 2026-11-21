import React from 'react';
import { ArrowLeft, Bookmark, BookmarkCheck, MessageSquare, Share2, ShieldAlert } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Language, MatchWithPrediction, PredictionFactor } from '../types/football';
import type { TranslationDictionary } from '../i18n/translations';
import {
  formatCountryName,
  formatKickoffTime,
  formatPercent,
  formatShortDate,
} from '../utils/formatters';
import {
  ConfidenceIndicator,
  DisclaimerBanner,
  FormBadgeStrip,
  ProbabilityBar,
  TeamCrest,
} from '../components/AnalyticsPrimitives';
import { FactorTooltip } from '../components/FactorTooltip';
import { MatchHeatmap } from '../components/MatchHeatmap';

interface MatchDetailPageProps {
  match: MatchWithPrediction;
  lang: Language;
  t: TranslationDictionary;
  onBack: () => void;
  isSaved: boolean;
  onToggleWatchlist: () => void;
  isChatOpen: boolean;
  onToggleChatSidebar: () => void;
  onShareToGoogleChat: () => void;
}

function formatFactorMetrics(factor: PredictionFactor): string {
  const m = factor.metrics;
  switch (factor.key) {
    case 'poisson_attack_defense':
      return `λ ${m.homeXG} vs ${m.awayXG}`;
    case 'elo_rating':
      return `${m.homeElo} vs ${m.awayElo} (${Number(m.diff) >= 0 ? '+' : ''}${m.diff})`;
    case 'recent_form':
      return `${m.homeFormPct}% vs ${m.awayFormPct}%`;
    case 'home_advantage':
      return `${m.homePpg} PPG vs ${m.awayPpg} PPG (×${m.leagueFactor})`;
    case 'head_to_head':
      return `${m.homeWins}W-${m.draws}D-${m.awayWins}L (n=${m.sampleSize})`;
    case 'squad_availability':
      return `${m.homeAbsences} vs ${m.awayAbsences} (${m.homeKeyAbsences}/${m.awayKeyAbsences} key)`;
    case 'fatigue_congestion':
      return `${m.homeMatches7d} vs ${m.awayMatches7d} (7d · rest ${m.homeRestDays}d/${m.awayRestDays}d)`;
    default:
      return '';
  }
}

export const MatchDetailPage: React.FC<MatchDetailPageProps> = ({
  match,
  lang,
  t,
  onBack,
  isSaved,
  onToggleWatchlist,
  isChatOpen,
  onToggleChatSidebar,
  onShareToGoogleChat,
}) => {
  const pred = match.prediction;
  const { homeTeam, awayTeam } = match;

  const metricLabels =
    lang === 'az'
      ? { gf: 'Qol / O', ga: 'Buraxılan / O', xgf: 'xG / O', xga: 'xGA / O' }
      : lang === 'ru'
        ? { gf: 'Голы / И', ga: 'Проп. / И', xgf: 'xG / И', xga: 'xGA / И' }
        : { gf: 'Goals / G', ga: 'Conceded / G', xgf: 'xG / G', xga: 'xGA / G' };

  const comparisonChartData = [
    {
      metric: metricLabels.gf,
      [homeTeam.shortName]: Number((homeTeam.goalsFor / Math.max(1, homeTeam.played)).toFixed(2)),
      [awayTeam.shortName]: Number((awayTeam.goalsFor / Math.max(1, awayTeam.played)).toFixed(2)),
    },
    {
      metric: metricLabels.ga,
      [homeTeam.shortName]: Number((homeTeam.goalsAgainst / Math.max(1, homeTeam.played)).toFixed(2)),
      [awayTeam.shortName]: Number((awayTeam.goalsAgainst / Math.max(1, awayTeam.played)).toFixed(2)),
    },
    ...(match.hasXG && homeTeam.xGFor !== undefined && awayTeam.xGFor !== undefined
      ? [
          {
            metric: metricLabels.xgf,
            [homeTeam.shortName]: Number((homeTeam.xGFor / Math.max(1, homeTeam.played)).toFixed(2)),
            [awayTeam.shortName]: Number((awayTeam.xGFor / Math.max(1, awayTeam.played)).toFixed(2)),
          },
          {
            metric: metricLabels.xga,
            [homeTeam.shortName]: Number(
              ((homeTeam.xGAgainst ?? 0) / Math.max(1, homeTeam.played)).toFixed(2)
            ),
            [awayTeam.shortName]: Number(
              ((awayTeam.xGAgainst ?? 0) / Math.max(1, awayTeam.played)).toFixed(2)
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Top Back & Watchlist Action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{t.common.backToMatches}</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleChatSidebar}
            aria-expanded={isChatOpen}
            aria-controls="match-chat-sidebar"
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              isChatOpen
                ? 'border border-emerald-600/40 bg-emerald-600/10 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            <span>{t.matchChat.askButton}</span>
          </button>

          <button
            type="button"
            onClick={onShareToGoogleChat}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            <span>{t.googleChat.shareMatchButton}</span>
          </button>

          <button
            type="button"
            onClick={onToggleWatchlist}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              isSaved
                ? 'border-emerald-600/40 bg-emerald-600/10 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300'
                : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
                <span>{t.common.saved}</span>
              </>
            ) : (
              <>
                <Bookmark className="h-4 w-4" aria-hidden="true" />
                <span>{t.common.saveToWatchlist}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Match Header Banner */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>
            {match.leagueName} · {formatCountryName(match.country, lang)} · {match.venue}
          </span>
          <span className="font-mono tabular-nums">
            {formatShortDate(match.dateKey, lang)}, {formatKickoffTime(match.kickoffIso, lang)}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 items-center gap-6 md:grid-cols-3">
          {/* Home Team */}
          <div className="flex items-center gap-3 md:justify-start">
            <TeamCrest code={homeTeam.code} size="lg" />
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                {homeTeam.name}
              </h1>
              <p className="mt-0.5 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                #{homeTeam.standingsPosition} · Elo {homeTeam.elo}
              </p>
            </div>
          </div>

          {/* Center Score / Kickoff */}
          <div className="text-center">
            {match.score ? (
              <div>
                <p className="font-mono text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                  {match.score.home} – {match.score.away}
                </p>
                <p className="mt-1 font-mono text-xs font-medium text-rose-600 dark:text-rose-400">
                  {match.status === 'live'
                    ? `${t.common.live} ${match.minute ?? 0}'`
                    : t.common.finished}
                </p>
              </div>
            ) : (
              <div>
                <p className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                  {formatKickoffTime(match.kickoffIso, lang)}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t.common.upcoming} · λ {pred.expectedGoals.home.toFixed(2)} –{' '}
                  {pred.expectedGoals.away.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex items-center gap-3 md:flex-row-reverse md:text-right">
            <TeamCrest code={awayTeam.code} size="lg" />
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                {awayTeam.name}
              </h2>
              <p className="mt-0.5 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                #{awayTeam.standingsPosition} · Elo {awayTeam.elo}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Prediction Panel + Scorelines */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section
          aria-labelledby="prediction-panel-heading"
          className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-7 space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2
                id="prediction-panel-heading"
                className="text-base font-semibold text-slate-900 dark:text-slate-50"
              >
                {t.matchDetail.predictionPanel}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {pred.isLiveAdjusted ? (
                  <>
                    <span className="font-medium text-rose-600 dark:text-rose-400">
                      {t.matchDetail.liveAdjustedLabel} ({pred.liveMinute ?? match.minute ?? 0}&apos;)
                    </span>
                    {' · '}
                  </>
                ) : (
                  <>
                    {match.hasXG ? t.matchDetail.xgAvailable : t.matchDetail.xgEstimated}
                    {' · '}
                  </>
                )}
                {t.common.uncertainty}: ±{(pred.uncertaintyMargin * 100).toFixed(1)}%
              </p>
            </div>
            <ConfidenceIndicator
              band={pred.confidenceBand}
              score={pred.confidenceScore}
              t={t}
            />
          </div>

          {/* 1X2 Probabilities */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950/70">
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {homeTeam.shortName}
                </p>
                <p className="mt-1 font-mono text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                  {formatPercent(pred.homeWinProb, 1)}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950/70">
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.common.draw}</p>
                <p className="mt-1 font-mono text-xl font-bold tabular-nums text-slate-700 dark:text-slate-200">
                  {formatPercent(pred.drawProb, 1)}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950/70">
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {awayTeam.shortName}
                </p>
                <p className="mt-1 font-mono text-xl font-bold tabular-nums text-sky-700 dark:text-sky-400">
                  {formatPercent(pred.awayWinProb, 1)}
                </p>
              </div>
            </div>

            <ProbabilityBar
              homeProb={pred.homeWinProb}
              drawProb={pred.drawProb}
              awayProb={pred.awayWinProb}
              showLabels={false}
            />
          </div>

          {/* Over/Under 2.5 and BTTS */}
          <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 dark:border-slate-800 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {t.common.over25}
                </span>
                <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {formatPercent(pred.over25Prob, 1)} / {formatPercent(pred.under25Prob, 1)}
                </span>
              </div>
              <div className="flex h-2 w-full overflow-hidden rounded-sm bg-slate-200 dark:bg-slate-800">
                <div
                  className="bg-emerald-500"
                  style={{ width: `${Math.round(pred.over25Prob * 100)}%` }}
                />
                <div
                  className="bg-slate-400 dark:bg-slate-600"
                  style={{ width: `${Math.round(pred.under25Prob * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>{t.common.over25}</span>
                <span>{t.common.under25}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {t.common.marketBtts}
                </span>
                <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {formatPercent(pred.bttsYesProb, 1)} / {formatPercent(pred.bttsNoProb, 1)}
                </span>
              </div>
              <div className="flex h-2 w-full overflow-hidden rounded-sm bg-slate-200 dark:bg-slate-800">
                <div
                  className="bg-sky-500"
                  style={{ width: `${Math.round(pred.bttsYesProb * 100)}%` }}
                />
                <div
                  className="bg-slate-400 dark:bg-slate-600"
                  style={{ width: `${Math.round(pred.bttsNoProb * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>{t.common.bttsYes}</span>
                <span>{t.common.bttsNo}</span>
              </div>
            </div>
          </div>

          {/* Expected Goals */}
          <div className="space-y-2 border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-600 dark:text-slate-400">
                {t.common.expectedGoals}
              </span>
              <span className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {homeTeam.shortName} {pred.expectedGoals.home.toFixed(2)} —{' '}
                {pred.expectedGoals.away.toFixed(2)} {awayTeam.shortName}
              </span>
            </div>
            {pred.isLiveAdjusted && pred.remainingExpectedGoals && (
              <div className="flex items-center justify-between">
                <span className="font-medium text-rose-600 dark:text-rose-400">
                  {t.matchDetail.remainingXG}
                </span>
                <span className="font-mono text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                  +{pred.remainingExpectedGoals.home.toFixed(2)} — +
                  {pred.remainingExpectedGoals.away.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Top 5 Most Likely Scorelines */}
        <section
          aria-labelledby="scorelines-heading"
          className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-5"
        >
          <h2
            id="scorelines-heading"
            className="text-base font-semibold text-slate-900 dark:text-slate-50"
          >
            {pred.isLiveAdjusted
              ? t.matchDetail.finalScorelinesTitle
              : t.matchDetail.scorelinesTitle}
          </h2>
          <div className="mt-5 space-y-3.5">
            {pred.topScorelines.map((s) => {
              const pct = s.probability * 100;
              return (
                <div key={s.score} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {s.score}
                    </span>
                    <span className="font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-sm bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full bg-emerald-500/80 dark:bg-emerald-500"
                      style={{ width: `${Math.min(100, pct * 4.5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Tactical xG Shot Location & Threat Heatmap (D3) */}
      <MatchHeatmap
        matchId={match.id}
        homeTeamName={homeTeam.name}
        homeShort={homeTeam.shortName}
        awayTeamName={awayTeam.name}
        awayShort={awayTeam.shortName}
        homeXg={pred.expectedGoals.home}
        awayXg={pred.expectedGoals.away}
        homeScore={match.score?.home ?? null}
        awayScore={match.score?.away ?? null}
        homeShotsCount={match.liveStats?.shots?.home}
        awayShotsCount={match.liveStats?.shots?.away}
        lang={lang}
      />

      {/* Real In-Play / Match Statistics (when available from live feed or API-Football) */}
      {match.liveStats && (
        <section
          aria-labelledby="live-stats-heading"
          className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <h2
              id="live-stats-heading"
              className="text-base font-semibold text-slate-900 dark:text-slate-50"
            >
              {t.matchDetail.liveStatsTitle}
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {homeTeam.shortName} vs {awayTeam.shortName}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(
              [
                match.liveStats.possession && {
                  label: t.matchDetail.possession,
                  home: match.liveStats.possession.home,
                  away: match.liveStats.possession.away,
                  suffix: '%',
                },
                match.liveStats.shots && {
                  label: t.matchDetail.shots,
                  home: match.liveStats.shots.home,
                  away: match.liveStats.shots.away,
                  suffix: '',
                },
                match.liveStats.shotsOnTarget && {
                  label: t.matchDetail.shotsOnTarget,
                  home: match.liveStats.shotsOnTarget.home,
                  away: match.liveStats.shotsOnTarget.away,
                  suffix: '',
                },
                match.liveStats.corners && {
                  label: t.matchDetail.corners,
                  home: match.liveStats.corners.home,
                  away: match.liveStats.corners.away,
                  suffix: '',
                },
              ].filter(Boolean) as Array<{
                label: string;
                home: number;
                away: number;
                suffix: string;
              }>
            ).map((row) => {
              const total = Math.max(1, row.home + row.away);
              const homePct = Math.round((row.home / total) * 100);
              return (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {row.home}
                      {row.suffix}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">{row.label}</span>
                    <span className="font-mono font-semibold tabular-nums text-sky-700 dark:text-sky-400">
                      {row.away}
                      {row.suffix}
                    </span>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden rounded-sm bg-slate-100 dark:bg-slate-800">
                    <div className="bg-emerald-500" style={{ width: `${homePct}%` }} />
                    <div className="bg-sky-500" style={{ width: `${100 - homePct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Why This Prediction? Factor Breakdown */}
      <section
        aria-labelledby="why-prediction-heading"
        className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <div>
          <h2
            id="why-prediction-heading"
            className="text-base font-semibold text-slate-900 dark:text-slate-50"
          >
            {t.matchDetail.whyTitle}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {t.matchDetail.whySubtitle} · {t.matchDetail.factorTooltips.hoverHint}
          </p>
        </div>

        <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800/80">
          {pred.factors.map((factor) => {
            const directionLabel =
              factor.homeEdge > 0.08
                ? `${t.matchDetail.favorsHome} (${homeTeam.shortName})`
                : factor.homeEdge < -0.08
                  ? `${t.matchDetail.favorsAway} (${awayTeam.shortName})`
                  : t.matchDetail.balanced;

            const directionColor =
              factor.homeEdge > 0.08
                ? 'text-emerald-700 dark:text-emerald-400'
                : factor.homeEdge < -0.08
                  ? 'text-sky-700 dark:text-sky-400'
                  : 'text-slate-500 dark:text-slate-400';

            const meterWidth = Math.min(50, Math.abs(factor.homeEdge) * 50);

            return (
              <div
                key={factor.key}
                className="grid grid-cols-1 gap-3 py-4 md:grid-cols-12 md:items-center"
              >
                <div className="md:col-span-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <FactorTooltip factor={factor} match={match} t={t} />
                    <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                      ({t.matchDetail.factorWeight}: {factor.weight}%)
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {t.matchDetail.factorDescriptions[factor.key]}
                  </p>
                </div>

                {/* Centered directional edge bar */}
                <div className="md:col-span-4 space-y-1">
                  <div className="relative h-2 w-full rounded-sm bg-slate-100 dark:bg-slate-800">
                    <div
                      className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-300 dark:bg-slate-600"
                      aria-hidden="true"
                    />
                    {factor.homeEdge >= 0 ? (
                      <div
                        className="absolute top-0 bottom-0 left-1/2 rounded-r-sm bg-emerald-500"
                        style={{ width: `${meterWidth}%` }}
                      />
                    ) : (
                      <div
                        className="absolute top-0 bottom-0 rounded-l-sm bg-sky-500"
                        style={{
                          left: `${50 - meterWidth}%`,
                          width: `${meterWidth}%`,
                        }}
                      />
                    )}
                  </div>
                  <p className={`text-[11px] font-medium ${directionColor}`}>{directionLabel}</p>
                </div>

                <div className="font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300 md:col-span-3 md:text-right">
                  {formatFactorMetrics(factor)}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Last 10 Form & Home/Away Splits */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Last 10 Form */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-5">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {t.matchDetail.last10Form}
          </h2>

          {[homeTeam, awayTeam].map((team) => (
            <div key={team.id} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {team.name}
                </span>
                <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {team.wins}W-{team.draws}D-{team.losses}L · {team.points} pts
                </span>
              </div>
              <div className="overflow-x-auto pb-1">
                <FormBadgeStrip form={team.last10Form.slice(0, 10).map((f) => f.result)} />
              </div>
            </div>
          ))}
        </section>

        {/* Home / Away Splits */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {t.matchDetail.homeAwaySplits}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-2 pr-3 font-medium">{t.teamsLeagues.team}</th>
                  <th className="py-2 px-2 font-medium text-right">{t.teamsLeagues.played}</th>
                  <th className="py-2 px-2 font-medium text-right">W-D-L</th>
                  <th className="py-2 px-2 font-medium text-right">{t.teamsLeagues.goals}</th>
                  <th className="py-2 pl-2 font-medium text-right">xG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums dark:divide-slate-800/80">
                <tr>
                  <td className="py-2.5 pr-3 font-sans font-medium text-slate-900 dark:text-slate-100">
                    {homeTeam.shortName} ({t.matchDetail.homeRecord})
                  </td>
                  <td className="py-2.5 px-2 text-right">{homeTeam.homeSplit.played}</td>
                  <td className="py-2.5 px-2 text-right">
                    {homeTeam.homeSplit.wins}-{homeTeam.homeSplit.draws}-{homeTeam.homeSplit.losses}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    {homeTeam.homeSplit.goalsFor}:{homeTeam.homeSplit.goalsAgainst}
                  </td>
                  <td className="py-2.5 pl-2 text-right">
                    {homeTeam.homeSplit.xGFor !== undefined
                      ? `${homeTeam.homeSplit.xGFor}:${homeTeam.homeSplit.xGAgainst}`
                      : '—'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 font-sans font-medium text-slate-900 dark:text-slate-100">
                    {awayTeam.shortName} ({t.matchDetail.awayRecord})
                  </td>
                  <td className="py-2.5 px-2 text-right">{awayTeam.awaySplit.played}</td>
                  <td className="py-2.5 px-2 text-right">
                    {awayTeam.awaySplit.wins}-{awayTeam.awaySplit.draws}-{awayTeam.awaySplit.losses}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    {awayTeam.awaySplit.goalsFor}:{awayTeam.awaySplit.goalsAgainst}
                  </td>
                  <td className="py-2.5 pl-2 text-right">
                    {awayTeam.awaySplit.xGFor !== undefined
                      ? `${awayTeam.awaySplit.xGFor}:${awayTeam.awaySplit.xGAgainst}`
                      : '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Goals & xG Chart + H2H + Squad Availability */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-5">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {t.matchDetail.goalsAndXg}
          </h2>
          <div className="mt-4 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonChartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey={homeTeam.shortName} fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey={awayTeam.shortName} fill="#0ea5e9" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* H2H History */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {t.matchDetail.h2hTitle}
          </h2>
          {match.h2h.length === 0 ? (
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">{t.matchDetail.noH2H}</p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800/80">
              {match.h2h.map((h, i) => (
                <div key={`${h.date}-${i}`} className="flex items-center justify-between py-2.5 text-xs">
                  <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    {formatShortDate(h.date, lang)}
                  </span>
                  <span className="truncate px-2 text-slate-800 dark:text-slate-200">
                    {h.homeTeamName} vs {h.awayTeamName}
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                    {h.homeGoals} – {h.awayGoals}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Squad Availability */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-3 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {t.matchDetail.squadAvailability}
          </h2>
          {[homeTeam, awayTeam].map((team) => (
            <div key={team.id} className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {team.shortName}
              </p>
              {team.absences.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.matchDetail.noAbsences}
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {team.absences.map((a) => (
                    <li
                      key={`${team.id}-${a.playerName}`}
                      className="flex items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <ShieldAlert
                          className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400"
                          aria-hidden="true"
                        />
                        <span className="truncate">{a.playerName}</span>
                      </span>
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {a.position} ·{' '}
                        {a.reason === 'injury' ? t.matchDetail.injury : t.matchDetail.suspension}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      </div>

      <DisclaimerBanner text={t.common.disclaimer} />
    </div>
  );
};
