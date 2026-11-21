import React, { useMemo, useState } from 'react';
import { Bookmark, BookmarkCheck, Download, FileText } from 'lucide-react';
import type {
  ConfidenceBand,
  Language,
  MarketFilter,
  MatchWithPrediction,
} from '../types/football';
import type { TranslationDictionary } from '../i18n/translations';
import { formatSelectionLabel } from '../i18n/translations';
import { proTranslations } from '../i18n/proTranslations';
import { formatKickoffTime, formatPercent, formatShortDate } from '../utils/formatters';
import { downloadPredictionsCsv, downloadPredictionsPdf } from '../utils/exportPredictions';
import {
  ConfidenceIndicator,
  DisclaimerBanner,
  TeamCrest,
} from '../components/AnalyticsPrimitives';

interface PredictionsPageProps {
  matches: MatchWithPrediction[];
  lang: Language;
  t: TranslationDictionary;
  onSelectMatch: (matchId: string) => void;
  isSaved: (matchId: string) => boolean;
  onToggleWatchlist: (match: MatchWithPrediction) => void;
  onNotify?: (message: string) => void;
}

const CONFIDENCE_RANK: Record<ConfidenceBand, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

function getMarketProjection(match: MatchWithPrediction, market: MarketFilter) {
  const p = match.prediction;
  if (market === '1x2') {
    return {
      selection: p.topOutcome.selection,
      probability: p.topOutcome.probability,
    };
  }
  if (market === 'over25') {
    return p.over25Prob >= p.under25Prob
      ? { selection: 'over25', probability: p.over25Prob }
      : { selection: 'under25', probability: p.under25Prob };
  }
  if (market === 'btts') {
    return p.bttsYesProb >= p.bttsNoProb
      ? { selection: 'btts_yes', probability: p.bttsYesProb }
      : { selection: 'btts_no', probability: p.bttsNoProb };
  }
  return {
    selection: p.bestMarketPick.selection,
    probability: p.bestMarketPick.probability,
  };
}

export const PredictionsPage: React.FC<PredictionsPageProps> = ({
  matches,
  lang,
  t,
  onSelectMatch,
  isSaved,
  onToggleWatchlist,
  onNotify,
}) => {
  const [leagueFilter, setLeagueFilter] = useState('all');
  const [minConfidence, setMinConfidence] = useState<'all' | ConfidenceBand>('all');
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('1x2');
  const pt = proTranslations[lang];

  const leagues = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of matches) {
      map.set(m.leagueId, m.leagueName);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [matches]);

  const ranked = useMemo(() => {
    return matches
      .filter((m) => m.status !== 'finished')
      .filter((m) => (leagueFilter === 'all' ? true : m.leagueId === leagueFilter))
      .filter((m) => {
        if (minConfidence === 'all') return true;
        return CONFIDENCE_RANK[m.prediction.confidenceBand] >= CONFIDENCE_RANK[minConfidence];
      })
      .map((match) => ({
        match,
        projection: getMarketProjection(match, marketFilter),
      }))
      .sort(
        (a, b) =>
          b.projection.probability - a.projection.probability ||
          b.match.prediction.confidenceScore - a.match.prediction.confidenceScore
      );
  }, [matches, leagueFilter, minConfidence, marketFilter]);

  const handleExportCsv = () => {
    downloadPredictionsCsv(ranked.map((r) => r.match));
    onNotify?.(pt.export.exportedCsvToast);
  };

  const handleExportPdf = () => {
    downloadPredictionsPdf(
      ranked.map((r) => r.match),
      lang
    );
    onNotify?.(pt.export.exportedPdfToast);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
            {t.predictions.title}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {t.predictions.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={ranked.length === 0}
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{pt.export.csvButton}</span>
          </button>
          <button
            type="button"
            disabled={ranked.length === 0}
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 whitespace-nowrap"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{pt.export.pdfButton}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <section
        aria-label="Prediction filters"
        className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* League */}
          <div>
            <label htmlFor="pred-league-filter" className="sr-only">
              {t.common.allLeagues}
            </label>
            <select
              id="pred-league-filter"
              value={leagueFilter}
              onChange={(e) => setLeagueFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="all">{t.common.allLeagues}</option>
              {leagues.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Min Confidence */}
          <div
            role="group"
            aria-label={t.common.minConfidence}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-950"
          >
            {(['all', 'medium', 'high'] as const).map((band) => {
              const active = minConfidence === band;
              const label =
                band === 'all'
                  ? t.common.allStatuses.replace('statuslar', 'səviyyələr').replace('statuses', 'levels').replace('статусы', 'уровни')
                  : band === 'medium'
                    ? `${t.common.medium}+`
                    : t.common.high;
              return (
                <button
                  key={band}
                  type="button"
                  onClick={() => setMinConfidence(band)}
                  aria-pressed={active}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
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
        </div>

        {/* Market Type */}
        <div
          role="group"
          aria-label={t.common.marketType}
          className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-950"
        >
          {(
            [
              ['1x2', t.common.market1x2],
              ['over25', t.common.marketOver25],
              ['btts', t.common.marketBtts],
              ['all', t.common.allMarkets],
            ] as const
          ).map(([key, label]) => {
            const active = marketFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setMarketFilter(key)}
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
      </section>

      {/* Ranked Predictions Table */}
      {ranked.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          {t.common.noResults}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-400">
                <th className="py-3 pl-4 pr-2 w-10">{t.predictions.rank}</th>
                <th className="py-3 px-3">{t.predictions.match}</th>
                <th className="py-3 px-3">{t.predictions.recommendedPick}</th>
                <th className="py-3 px-3 text-right">{t.predictions.calibratedProb}</th>
                <th className="py-3 px-3 text-right">{t.predictions.scoreline}</th>
                <th className="py-3 px-3 text-right">{t.predictions.confidenceCol}</th>
                <th className="py-3 pl-2 pr-4 w-12" aria-label="Watchlist" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {ranked.map(({ match, projection }, idx) => {
                const saved = isSaved(match.id);
                return (
                  <tr
                    key={match.id}
                    className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                  >
                    <td className="py-3.5 pl-4 pr-2 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-3">
                      <button
                        type="button"
                        onClick={() => onSelectMatch(match.id)}
                        className="text-left group"
                      >
                        <div className="flex items-center gap-2 font-medium text-slate-900 group-hover:text-emerald-600 dark:text-slate-100 dark:group-hover:text-emerald-400">
                          <TeamCrest code={match.homeTeam.code} size="sm" />
                          <span>{match.homeTeam.shortName}</span>
                          <span className="text-slate-400 dark:text-slate-500">vs</span>
                          <TeamCrest code={match.awayTeam.code} size="sm" />
                          <span>{match.awayTeam.shortName}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {match.leagueName} · {formatShortDate(match.dateKey, lang)},{' '}
                          {formatKickoffTime(match.kickoffIso, lang)}
                        </p>
                      </button>
                    </td>
                    <td className="py-3.5 px-3 text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {formatSelectionLabel(projection.selection, t)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                        {formatPercent(projection.probability, 1)}
                      </span>
                      <span className="ml-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        ±{(match.prediction.uncertaintyMargin * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                      {match.prediction.topScorelines[0]?.score}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <ConfidenceIndicator
                        band={match.prediction.confidenceBand}
                        score={match.prediction.confidenceScore}
                        t={t}
                      />
                    </td>
                    <td className="py-3.5 pl-2 pr-4 text-right">
                      <button
                        type="button"
                        onClick={() => onToggleWatchlist(match)}
                        aria-label={
                          saved
                            ? `${t.common.removeFromWatchlist} ${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`
                            : `${t.common.saveToWatchlist} ${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`
                        }
                        className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                      >
                        {saved ? (
                          <BookmarkCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Bookmark className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <DisclaimerBanner text={t.common.disclaimer} />
    </div>
  );
};
