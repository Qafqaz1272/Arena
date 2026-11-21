import React, { useMemo, useState } from 'react';
import { ArrowRight, Bookmark, BookmarkCheck } from 'lucide-react';
import type { Language, MatchWithPrediction } from '../types/football';
import type { TranslationDictionary } from '../i18n/translations';
import { formatSelectionLabel } from '../i18n/translations';
import {
  formatCountryName,
  formatKickoffTime,
  formatPercent,
  formatShortDate,
  getRelativeDateKeys,
} from '../utils/formatters';
import {
  ConfidenceIndicator,
  DisclaimerBanner,
  ProbabilityBar,
  TeamCrest,
} from '../components/AnalyticsPrimitives';

interface DashboardPageProps {
  matches: MatchWithPrediction[];
  lang: Language;
  t: TranslationDictionary;
  onSelectMatch: (matchId: string) => void;
  onNavigatePredictions: () => void;
  isSaved: (matchId: string) => boolean;
  onToggleWatchlist: (match: MatchWithPrediction) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  matches,
  lang,
  t,
  onSelectMatch,
  onNavigatePredictions,
  isSaved,
  onToggleWatchlist,
}) => {
  const { today, tomorrow } = useMemo(() => getRelativeDateKeys(), []);
  const [slateMode, setSlateMode] = useState<'today' | 'upcoming'>('today');

  const todaysMatches = useMemo(() => {
    const todayOnly = matches.filter(
      (m) => m.status === 'live' || m.dateKey === today || m.dateKey === tomorrow
    );
    return todayOnly.length > 0 ? todayOnly : matches;
  }, [matches, today, tomorrow]);

  const activeSlateMatches = useMemo(() => {
    if (slateMode === 'today') return todaysMatches;
    return matches.filter((m) => m.status !== 'finished');
  }, [slateMode, todaysMatches, matches]);

  const liveMatches = useMemo(
    () => matches.filter((m) => m.status === 'live'),
    [matches]
  );

  const topPicks = useMemo(() => {
    const upcomingOnly = matches.filter((m) => m.status === 'upcoming');
    const pool = upcomingOnly.length >= 3 ? upcomingOnly : matches.filter((m) => m.status !== 'finished');
    return [...pool]
      .sort(
        (a, b) =>
          b.prediction.topOutcome.probability - a.prediction.topOutcome.probability ||
          b.prediction.confidenceScore - a.prediction.confidenceScore
      )
      .slice(0, 3);
  }, [matches]);

  const highConfCount = useMemo(
    () => todaysMatches.filter((m) => m.prediction.confidenceBand === 'high').length,
    [todaysMatches]
  );

  const avgTopProb = useMemo(() => {
    if (todaysMatches.length === 0) return 0;
    const sum = todaysMatches.reduce((acc, m) => acc + m.prediction.topOutcome.probability, 0);
    return sum / todaysMatches.length;
  }, [todaysMatches]);

  const groupedByLeague = useMemo(() => {
    const groups = new Map<
      string,
      { leagueId: string; leagueName: string; country: string; items: MatchWithPrediction[] }
    >();
    for (const m of activeSlateMatches) {
      const existing = groups.get(m.leagueId);
      if (existing) {
        existing.items.push(m);
      } else {
        groups.set(m.leagueId, {
          leagueId: m.leagueId,
          leagueName: m.leagueName,
          country: m.country,
          items: [m],
        });
      }
    }
    return Array.from(groups.values());
  }, [activeSlateMatches]);

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
            {t.dashboard.title}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {t.dashboard.subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigatePredictions}
          className="inline-flex items-center gap-1.5 self-start rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 whitespace-nowrap shrink-0 sm:self-auto"
        >
          <span>{t.dashboard.viewAllPredictions}</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* 4-column KPI strip */}
      <section aria-label="Summary metrics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.dashboard.kpiTotalToday}
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-50">
            {todaysMatches.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.dashboard.kpiLiveCount}
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-rose-600 dark:text-rose-400">
            {liveMatches.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.dashboard.kpiHighConf}
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
            {highConfCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.dashboard.kpiAvgModelEdge}
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-50">
            {formatPercent(avgTopProb, 1)}
          </p>
        </div>
      </section>

      {/* Live Matches In-Play Analysis (shown whenever real matches are currently live) */}
      {liveMatches.length > 0 && (
        <section aria-labelledby="live-inplay-heading" className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2
                id="live-inplay-heading"
                className="text-lg font-semibold text-slate-900 dark:text-slate-50"
              >
                {lang === 'az'
                  ? 'Hazırda Oynanan Oyunların Canlı Analizi'
                  : lang === 'ru'
                    ? 'Живой анализ текущих матчей'
                    : 'Live In-Play Match Analysis'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'az'
                  ? 'Cari hesab və qalan dəqiqəyə görə yenilənən Poisson ehtimalları'
                  : lang === 'ru'
                    ? 'Вероятности Пуассона, пересчитанные по текущему счёту и минуте'
                    : 'Poisson probabilities dynamically adjusted for live score and remaining minutes'}
              </p>
            </div>
            <span className="font-mono text-xs font-semibold tabular-nums text-rose-600 dark:text-rose-400">
              {liveMatches.length} {t.common.live}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {liveMatches.slice(0, 6).map((match) => {
              const pred = match.prediction;
              const topScore = pred.topScorelines[0];
              return (
                <article
                  key={match.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate text-slate-500 dark:text-slate-400">
                        {match.leagueName}
                      </span>
                      <span className="font-mono font-semibold tabular-nums text-rose-600 dark:text-rose-400 shrink-0">
                        {t.dashboard.liveNow} {match.minute ?? 0}&apos;
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectMatch(match.id)}
                      className="mt-3 block w-full text-left group space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <TeamCrest code={match.homeTeam.code} size="sm" />
                          <span className="truncate text-sm font-semibold text-slate-900 group-hover:text-emerald-600 dark:text-slate-50 dark:group-hover:text-emerald-400">
                            {match.homeTeam.name}
                          </span>
                        </div>
                        <span className="font-mono text-base font-bold tabular-nums text-slate-900 dark:text-slate-50">
                          {match.score?.home ?? 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <TeamCrest code={match.awayTeam.code} size="sm" />
                          <span className="truncate text-sm font-semibold text-slate-900 group-hover:text-emerald-600 dark:text-slate-50 dark:group-hover:text-emerald-400">
                            {match.awayTeam.name}
                          </span>
                        </div>
                        <span className="font-mono text-base font-bold tabular-nums text-slate-900 dark:text-slate-50">
                          {match.score?.away ?? 0}
                        </span>
                      </div>
                    </button>

                    <div className="mt-3.5">
                      <ProbabilityBar
                        homeProb={pred.homeWinProb}
                        drawProb={pred.drawProb}
                        awayProb={pred.awayWinProb}
                        compact
                      />
                    </div>
                  </div>

                  <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs dark:border-slate-800/80">
                    <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {topScore ? `${t.common.mostLikelyScore}: ${topScore.score}` : ''}
                      {pred.remainingExpectedGoals
                        ? ` · +λ ${pred.remainingExpectedGoals.home.toFixed(1)}-${pred.remainingExpectedGoals.away.toFixed(1)}`
                        : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectMatch(match.id)}
                      className="font-medium text-emerald-700 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300 whitespace-nowrap"
                    >
                      {t.common.viewDetails} →
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Top Picks Section */}
      <section aria-labelledby="top-picks-heading" className="space-y-4">
        <div>
          <h2
            id="top-picks-heading"
            className="text-lg font-semibold text-slate-900 dark:text-slate-50"
          >
            {t.dashboard.topPicksTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t.dashboard.topPicksSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {topPicks.map((match) => {
            const saved = isSaved(match.id);
            const pred = match.prediction;
            const pickTeamName =
              pred.topOutcome.selection === 'home'
                ? match.homeTeam.shortName
                : pred.topOutcome.selection === 'away'
                  ? match.awayTeam.shortName
                  : t.common.draw;

            return (
              <article
                key={match.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div>
                  {/* Quiet metadata line (zero pills) */}
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="truncate">
                      {match.leagueName} · {match.status === 'live' ? `${t.common.live} ${match.minute ?? 0}'` : formatKickoffTime(match.kickoffIso, lang)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleWatchlist(match)}
                      aria-label={
                        saved
                          ? `${t.common.removeFromWatchlist} ${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`
                          : `${t.common.saveToWatchlist} ${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`
                      }
                      className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    >
                      {saved ? (
                        <BookmarkCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Teams & optional live score */}
                  <button
                    type="button"
                    onClick={() => onSelectMatch(match.id)}
                    className="mt-3 block w-full text-left group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <TeamCrest code={match.homeTeam.code} size="sm" />
                        <span className="truncate text-sm font-semibold text-slate-900 group-hover:text-emerald-600 dark:text-slate-50 dark:group-hover:text-emerald-400">
                          {match.homeTeam.name}
                        </span>
                      </div>
                      {match.score && (
                        <span className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                          {match.score.home}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <TeamCrest code={match.awayTeam.code} size="sm" />
                        <span className="truncate text-sm font-semibold text-slate-900 group-hover:text-emerald-600 dark:text-slate-50 dark:group-hover:text-emerald-400">
                          {match.awayTeam.name}
                        </span>
                      </div>
                      {match.score && (
                        <span className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                          {match.score.away}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Primary Statistical Pick */}
                  <div className="mt-4 border-t border-slate-100 pt-3.5 dark:border-slate-800/80">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatSelectionLabel(pred.topOutcome.selection, t)}
                        </p>
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {pickTeamName}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                          {formatPercent(pred.topOutcome.probability, 1)}
                        </p>
                        <p className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                          ±{(pred.uncertaintyMargin * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <ProbabilityBar
                        homeProb={pred.homeWinProb}
                        drawProb={pred.drawProb}
                        awayProb={pred.awayWinProb}
                        compact
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800/80">
                  <ConfidenceIndicator
                    band={pred.confidenceBand}
                    score={pred.confidenceScore}
                    t={t}
                  />
                  <button
                    type="button"
                    onClick={() => onSelectMatch(match.id)}
                    className="font-medium text-emerald-700 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300 whitespace-nowrap"
                  >
                    {t.common.viewDetails} →
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Today's Matches Grouped by League */}
      <section aria-labelledby="league-matches-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="league-matches-heading"
            className="text-lg font-semibold text-slate-900 dark:text-slate-50"
          >
            {t.dashboard.todaysMatchesTitle}
          </h2>
          <div
            role="group"
            aria-label="Match schedule range"
            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-900"
          >
            <button
              type="button"
              onClick={() => setSlateMode('today')}
              aria-pressed={slateMode === 'today'}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                slateMode === 'today'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-50'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {lang === 'az' ? 'Bu gün və Sabah' : lang === 'ru' ? 'Сегодня и Завтра' : 'Today & Tomorrow'}
            </button>
            <button
              type="button"
              onClick={() => setSlateMode('upcoming')}
              aria-pressed={slateMode === 'upcoming'}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                slateMode === 'upcoming'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-50'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {lang === 'az' ? 'Bütün qarşıdakı turlar' : lang === 'ru' ? 'Все ближайшие туры' : 'All Upcoming Rounds'}
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {groupedByLeague.map((group) => (
            <div
              key={group.leagueId}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/90">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <span>{group.leagueName}</span>
                  <span aria-hidden="true" className="text-slate-400 dark:text-slate-600">·</span>
                  <span className="font-normal text-slate-500 dark:text-slate-400">
                    {formatCountryName(group.country, lang)}
                  </span>
                </div>
                <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                  {group.items.length}
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {group.items.map((match) => {
                  const saved = isSaved(match.id);
                  return (
                    <div
                      key={match.id}
                      className="flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30 sm:flex-row sm:items-center sm:justify-between"
                    >
                      {/* Time / Status */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-20 shrink-0 font-mono text-xs tabular-nums">
                          {match.status === 'live' ? (
                            <span className="font-semibold text-rose-600 dark:text-rose-400">
                              {t.dashboard.liveNow} {match.minute ?? 0}&apos;
                            </span>
                          ) : match.status === 'finished' ? (
                            <span className="text-slate-500 dark:text-slate-400">FT</span>
                          ) : (
                            <div className="text-slate-600 dark:text-slate-300">
                              <div>{formatKickoffTime(match.kickoffIso, lang)}</div>
                              {match.dateKey !== today && (
                                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                  {formatShortDate(match.dateKey, lang)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => onSelectMatch(match.id)}
                          className="flex flex-1 items-center justify-between gap-3 text-left min-w-0 group"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <TeamCrest code={match.homeTeam.code} size="sm" />
                              <span className="truncate text-sm font-medium text-slate-900 group-hover:text-emerald-600 dark:text-slate-100 dark:group-hover:text-emerald-400">
                                {match.homeTeam.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TeamCrest code={match.awayTeam.code} size="sm" />
                              <span className="truncate text-sm font-medium text-slate-900 group-hover:text-emerald-600 dark:text-slate-100 dark:group-hover:text-emerald-400">
                                {match.awayTeam.name}
                              </span>
                            </div>
                          </div>

                          {match.score ? (
                            <div className="flex flex-col items-end font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-50 pr-2">
                              <span>{match.score.home}</span>
                              <span>{match.score.away}</span>
                            </div>
                          ) : (
                            <div className="hidden text-right font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400 sm:block pr-2">
                              <div>λ {match.prediction.expectedGoals.home.toFixed(2)}</div>
                              <div>λ {match.prediction.expectedGoals.away.toFixed(2)}</div>
                            </div>
                          )}
                        </button>
                      </div>

                      {/* Right Probability & Watchlist */}
                      <div className="flex items-center gap-4 sm:w-64 sm:shrink-0">
                        <div className="flex-1">
                          <ProbabilityBar
                            homeProb={match.prediction.homeWinProb}
                            drawProb={match.prediction.drawProb}
                            awayProb={match.prediction.awayWinProb}
                            compact
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => onToggleWatchlist(match)}
                          aria-label={
                            saved
                              ? `${t.common.removeFromWatchlist} ${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`
                              : `${t.common.saveToWatchlist} ${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`
                          }
                          className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-200/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 shrink-0"
                        >
                          {saved ? (
                            <BookmarkCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Bookmark className="h-4 w-4" />
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

      <DisclaimerBanner text={t.common.disclaimer} />
    </div>
  );
};
