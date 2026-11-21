import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Radio, RefreshCw } from 'lucide-react';
import type { Language, LiveProbSnapshot, MatchWithPrediction } from '../types/football';
import type { TranslationDictionary } from '../i18n/translations';
import { proTranslations } from '../i18n/proTranslations';
import { formatKickoffTime, formatPercent, formatShortDate } from '../utils/formatters';
import {
  ConfidenceIndicator,
  DisclaimerBanner,
  ProbabilityBar,
  TeamCrest,
} from '../components/AnalyticsPrimitives';

interface LivePanelPageProps {
  matches: MatchWithPrediction[];
  previousSnapshots: Record<string, LiveProbSnapshot>;
  lastUpdatedAt: string | null;
  refreshing: boolean;
  onRefreshLive: () => Promise<void>;
  onSelectMatch: (matchId: string) => void;
  lang: Language;
  t: TranslationDictionary;
}

const DeltaIndicator: React.FC<{ deltaPct: number }> = ({ deltaPct }) => {
  if (Math.abs(deltaPct) < 0.2) {
    return <span className="font-mono text-[10px] text-slate-400">0.0%</span>;
  }
  const positive = deltaPct > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 font-mono text-[11px] font-semibold tabular-nums ${
        positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
      }`}
    >
      {positive ? (
        <ArrowUp className="h-3 w-3" aria-hidden="true" />
      ) : (
        <ArrowDown className="h-3 w-3" aria-hidden="true" />
      )}
      {positive ? '+' : ''}
      {deltaPct.toFixed(1)}%
    </span>
  );
};

export const LivePanelPage: React.FC<LivePanelPageProps> = ({
  matches,
  previousSnapshots,
  lastUpdatedAt,
  refreshing,
  onRefreshLive,
  onSelectMatch,
  lang,
  t,
}) => {
  const pt = proTranslations[lang].livePanel;
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [intervalSec, setIntervalSec] = useState<15 | 30 | 60>(30);
  const [countdown, setCountdown] = useState<number>(30);

  const liveMatches = matches.filter((m) => m.status === 'live');
  const upcomingMatches = matches.filter((m) => m.status === 'upcoming').slice(0, 8);

  useEffect(() => {
    setCountdown(intervalSec);
  }, [intervalSec]);

  useEffect(() => {
    if (!autoRefresh) return;
    const ticker = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onRefreshLive();
          return intervalSec;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(ticker);
  }, [autoRefresh, intervalSec, onRefreshLive]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
            <Radio className="h-6 w-6 text-rose-600 dark:text-rose-400" aria-hidden="true" />
            <span>{pt.title}</span>
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{pt.subtitle}</p>
        </div>

        {/* Auto-Refresh Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={autoRefresh}
            onClick={() => setAutoRefresh((prev) => !prev)}
            className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
              autoRefresh
                ? 'border-emerald-600/40 bg-emerald-600/10 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300'
                : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            {pt.autoRefresh}: {autoRefresh ? `${countdown}s` : 'OFF'}
          </button>

          <div
            role="group"
            aria-label={pt.intervalLabel}
            className="inline-flex items-center rounded-lg bg-slate-100 p-0.5 dark:bg-slate-900"
          >
            {([15, 30, 60] as const).map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setIntervalSec(sec)}
                aria-pressed={intervalSec === sec}
                className={`rounded-md px-2.5 py-1.5 font-mono text-xs font-semibold transition-colors ${
                  intervalSec === sec
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-emerald-400'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={refreshing}
            onClick={() => {
              setCountdown(intervalSec);
              onRefreshLive();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>{pt.refreshNow}</span>
          </button>
        </div>
      </div>

      {/* Live Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>
          <strong className="font-mono font-semibold text-slate-900 dark:text-slate-100">
            {liveMatches.length}
          </strong>{' '}
          {pt.liveCountLabel}
          {lastUpdatedAt
            ? ` · ${pt.lastUpdated}: ${new Date(lastUpdatedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}`
            : ''}
        </span>
        <span>{pt.deltaLegend}</span>
      </div>

      {/* Live Matches Grid */}
      {liveMatches.length === 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <Radio className="mx-auto h-7 w-7 text-slate-400 dark:text-slate-600" aria-hidden="true" />
          <h2 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">
            {pt.noLiveMatchesTitle}
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-xs text-slate-500 dark:text-slate-400">
            {pt.noLiveMatchesDesc}
          </p>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {liveMatches.map((match) => {
            const prev = previousSnapshots[match.id];
            const deltaHome = prev ? (match.prediction.homeWinProb - prev.homeWinProb) * 100 : 0;
            const deltaDraw = prev ? (match.prediction.drawProb - prev.drawProb) * 100 : 0;
            const deltaAway = prev ? (match.prediction.awayWinProb - prev.awayWinProb) * 100 : 0;
            const deltaO25 = prev ? (match.prediction.over25Prob - prev.over25Prob) * 100 : 0;

            return (
              <article
                key={match.id}
                className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-4"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-slate-500 dark:text-slate-400">
                    {match.leagueName}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-rose-600 dark:text-rose-400">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    {t.common.live} {match.minute ?? 0}&apos;
                  </span>
                </div>

                {/* Scoreline */}
                <div className="grid grid-cols-3 items-center gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <TeamCrest code={match.homeTeam.code} size="sm" />
                    <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {match.homeTeam.shortName}
                    </span>
                  </div>
                  <div className="text-center font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                    {match.score?.home ?? 0} – {match.score?.away ?? 0}
                  </div>
                  <div className="flex items-center justify-end gap-2 min-w-0">
                    <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {match.awayTeam.shortName}
                    </span>
                    <TeamCrest code={match.awayTeam.code} size="sm" />
                  </div>
                </div>

                {/* 1X2 Probabilities with Delta Arrows */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/70">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">1</p>
                    <p className="font-mono text-sm font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {formatPercent(match.prediction.homeWinProb, 1)}
                    </p>
                    <DeltaIndicator deltaPct={deltaHome} />
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/70">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">X</p>
                    <p className="font-mono text-sm font-bold tabular-nums text-slate-700 dark:text-slate-200">
                      {formatPercent(match.prediction.drawProb, 1)}
                    </p>
                    <DeltaIndicator deltaPct={deltaDraw} />
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/70">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">2</p>
                    <p className="font-mono text-sm font-bold tabular-nums text-sky-700 dark:text-sky-400">
                      {formatPercent(match.prediction.awayWinProb, 1)}
                    </p>
                    <DeltaIndicator deltaPct={deltaAway} />
                  </div>
                </div>

                <ProbabilityBar
                  homeProb={match.prediction.homeWinProb}
                  drawProb={match.prediction.drawProb}
                  awayProb={match.prediction.awayWinProb}
                  showLabels={false}
                  compact
                />

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <ConfidenceIndicator
                      band={match.prediction.confidenceBand}
                      score={match.prediction.confidenceScore}
                      t={t}
                    />
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      O2.5: {formatPercent(match.prediction.over25Prob, 0)}{' '}
                      <DeltaIndicator deltaPct={deltaO25} />
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectMatch(match.id)}
                    className="font-medium text-emerald-700 hover:text-emerald-600 dark:text-emerald-400"
                  >
                    {pt.openAnalysis} →
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Upcoming Next Fixtures Strip */}
      {upcomingMatches.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            {pt.upcomingSoonTitle}
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {upcomingMatches.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-xs"
              >
                <button
                  type="button"
                  onClick={() => onSelectMatch(m.id)}
                  className="flex items-center gap-2 font-medium text-slate-900 hover:text-emerald-600 dark:text-slate-100 dark:hover:text-emerald-400"
                >
                  <TeamCrest code={m.homeTeam.code} size="sm" />
                  <span>{m.homeTeam.shortName}</span>
                  <span className="text-slate-400">vs</span>
                  <TeamCrest code={m.awayTeam.code} size="sm" />
                  <span>{m.awayTeam.shortName}</span>
                </button>
                <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {m.leagueName} · {formatShortDate(m.dateKey, lang)},{' '}
                  {formatKickoffTime(m.kickoffIso, lang)} · 1:{formatPercent(m.prediction.homeWinProb, 0)} / X:{formatPercent(m.prediction.drawProb, 0)} / 2:{formatPercent(m.prediction.awayWinProb, 0)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <DisclaimerBanner text={t.common.disclaimer} />
    </div>
  );
};
