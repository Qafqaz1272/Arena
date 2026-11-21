import React, { useMemo, useState } from 'react';
import { Bookmark, BookmarkCheck, RotateCcw, Search } from 'lucide-react';
import type { Language, MatchStatus, MatchWithPrediction } from '../types/football';
import type { TranslationDictionary } from '../i18n/translations';
import {
  formatCountryName,
  formatKickoffTime,
  formatShortDate,
  getRelativeDateKeys,
} from '../utils/formatters';
import {
  ConfidenceIndicator,
  FormBadgeStrip,
  ProbabilityBar,
  TeamCrest,
} from '../components/AnalyticsPrimitives';

interface MatchesPageProps {
  matches: MatchWithPrediction[];
  lang: Language;
  t: TranslationDictionary;
  onSelectMatch: (matchId: string) => void;
  isSaved: (matchId: string) => boolean;
  onToggleWatchlist: (match: MatchWithPrediction) => void;
}

export const MatchesPage: React.FC<MatchesPageProps> = ({
  matches,
  lang,
  t,
  onSelectMatch,
  isSaved,
  onToggleWatchlist,
}) => {
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [leagueFilter, setLeagueFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | MatchStatus>('all');

  const dateKeys = useMemo(() => getRelativeDateKeys(), []);

  const availableDates = useMemo(() => {
    return Array.from(new Set(matches.map((m) => m.dateKey))).sort();
  }, [matches]);

  const countries = useMemo(
    () => Array.from(new Set(matches.map((m) => m.country))).sort(),
    [matches]
  );

  const leagues = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of matches) {
      if (countryFilter === 'all' || m.country === countryFilter) {
        map.set(m.leagueId, m.leagueName);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [matches, countryFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return matches.filter((m) => {
      if (countryFilter !== 'all' && m.country !== countryFilter) return false;
      if (leagueFilter !== 'all' && m.leagueId !== leagueFilter) return false;
      if (dateFilter !== 'all' && m.dateKey !== dateFilter) return false;
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (q) {
        const hay = `${m.homeTeam.name} ${m.awayTeam.name} ${m.leagueName} ${m.country} ${m.venue}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [matches, search, countryFilter, leagueFilter, dateFilter, statusFilter]);

  const hasActiveFilters =
    search !== '' ||
    countryFilter !== 'all' ||
    leagueFilter !== 'all' ||
    dateFilter !== 'all' ||
    statusFilter !== 'all';

  const resetFilters = () => {
    setSearch('');
    setCountryFilter('all');
    setLeagueFilter('all');
    setDateFilter('all');
    setStatusFilter('all');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
          {t.matches.title}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {t.matches.subtitle}
        </p>
      </div>

      {/* Filter Toolbar */}
      <section
        aria-label="Match filters"
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          {/* Search */}
          <div className="relative md:col-span-5">
            <label htmlFor="matches-search" className="sr-only">
              {t.common.searchPlaceholder}
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="matches-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.common.searchPlaceholder}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          {/* Country */}
          <div className="md:col-span-2">
            <label htmlFor="country-filter" className="sr-only">
              {t.common.allCountries}
            </label>
            <select
              id="country-filter"
              value={countryFilter}
              onChange={(e) => {
                setCountryFilter(e.target.value);
                setLeagueFilter('all');
              }}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="all">{t.common.allCountries}</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {formatCountryName(c, lang)}
                </option>
              ))}
            </select>
          </div>

          {/* League */}
          <div className="md:col-span-3">
            <label htmlFor="league-filter" className="sr-only">
              {t.common.allLeagues}
            </label>
            <select
              id="league-filter"
              value={leagueFilter}
              onChange={(e) => setLeagueFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="all">{t.common.allLeagues}</option>
              {leagues.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="md:col-span-2">
            <label htmlFor="date-filter" className="sr-only">
              {t.common.allDates}
            </label>
            <select
              id="date-filter"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="all">{t.common.allDates}</option>
              {availableDates.map((d) => {
                const suffix =
                  d === dateKeys.today
                    ? ` (${t.matches.dateFilterToday})`
                    : d === dateKeys.tomorrow
                      ? ` (${t.matches.dateFilterTomorrow})`
                      : d === dateKeys.yesterday
                        ? ` (${t.matches.dateFilterYesterday})`
                        : '';
                return (
                  <option key={d} value={d}>
                    {formatShortDate(d, lang)}
                    {suffix}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Status segmented controls + count */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div
            role="group"
            aria-label={t.common.allStatuses}
            className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-950"
          >
            {(['all', 'live', 'upcoming', 'finished'] as const).map((st) => {
              const label =
                st === 'all'
                  ? t.common.allStatuses
                  : st === 'live'
                    ? t.common.live
                    : st === 'upcoming'
                      ? t.common.upcoming
                      : t.common.finished;
              const active = statusFilter === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  aria-pressed={active}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-50'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono tabular-nums">
              {filtered.length} {t.matches.resultsCount}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:text-emerald-600 dark:text-emerald-400"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t.common.clearFilters}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Match Results List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-400">{t.common.noResults}</p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            <RotateCcw className="h-4 w-4" />
            {t.common.clearFilters}
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:divide-slate-800/80">
          {filtered.map((match) => {
            const saved = isSaved(match.id);
            return (
              <div
                key={match.id}
                className="flex flex-col gap-4 p-4 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Quiet metadata header */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {match.leagueName}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{formatCountryName(match.country, lang)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {formatShortDate(match.dateKey, lang)}, {formatKickoffTime(match.kickoffIso, lang)}
                    </span>
                    {match.status === 'live' && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                          {t.common.live} {match.minute ?? 0}&apos;
                        </span>
                      </>
                    )}
                    {match.status === 'finished' && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{t.common.finished}</span>
                      </>
                    )}
                  </div>

                  {/* Teams + Score + Recent 5 form */}
                  <button
                    type="button"
                    onClick={() => onSelectMatch(match.id)}
                    className="grid w-full grid-cols-1 gap-2 text-left sm:grid-cols-2 sm:items-center group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 pr-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <TeamCrest code={match.homeTeam.code} size="sm" />
                          <span className="truncate text-sm font-semibold text-slate-900 group-hover:text-emerald-600 dark:text-slate-100 dark:group-hover:text-emerald-400">
                            {match.homeTeam.name}
                          </span>
                        </div>
                        {match.score && (
                          <span className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-slate-50">
                            {match.score.home}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 pr-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <TeamCrest code={match.awayTeam.code} size="sm" />
                          <span className="truncate text-sm font-semibold text-slate-900 group-hover:text-emerald-600 dark:text-slate-100 dark:group-hover:text-emerald-400">
                            {match.awayTeam.name}
                          </span>
                        </div>
                        {match.score && (
                          <span className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-slate-50">
                            {match.score.away}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="hidden sm:flex flex-col gap-1.5 items-start lg:items-center">
                      <FormBadgeStrip
                        form={match.homeTeam.last10Form.slice(0, 5).map((f) => f.result)}
                        compact
                      />
                      <FormBadgeStrip
                        form={match.awayTeam.last10Form.slice(0, 5).map((f) => f.result)}
                        compact
                      />
                    </div>
                  </button>
                </div>

                {/* Probability + Confidence + Watchlist */}
                <div className="flex items-center gap-4 lg:w-80 lg:shrink-0">
                  <div className="flex-1 space-y-1.5">
                    <ProbabilityBar
                      homeProb={match.prediction.homeWinProb}
                      drawProb={match.prediction.drawProb}
                      awayProb={match.prediction.awayWinProb}
                      compact
                    />
                    <div className="flex items-center justify-between text-xs">
                      <ConfidenceIndicator
                        band={match.prediction.confidenceBand}
                        score={match.prediction.confidenceScore}
                        t={t}
                      />
                      <span className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                        {t.common.mostLikelyScore}: {match.prediction.topScorelines[0]?.score}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleWatchlist(match)}
                    aria-label={
                      saved
                        ? `${t.common.removeFromWatchlist} ${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`
                        : `${t.common.saveToWatchlist} ${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`
                    }
                    className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 shrink-0"
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
      )}
    </div>
  );
};
