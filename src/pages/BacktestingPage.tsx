import React, { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Language, MatchWithPrediction, PerformanceSummary } from '../types/football';
import type { TranslationDictionary } from '../i18n/translations';
import { formatSelectionLabel } from '../i18n/translations';
import { proTranslations } from '../i18n/proTranslations';
import { runBacktestEvaluation } from '../engine/backtestEngine';
import { formatPercent, formatShortDate } from '../utils/formatters';
import { DisclaimerBanner } from '../components/AnalyticsPrimitives';

interface BacktestingPageProps {
  performance: PerformanceSummary | null;
  matches: MatchWithPrediction[];
  lang: Language;
  t: TranslationDictionary;
}

export const BacktestingPage: React.FC<BacktestingPageProps> = ({
  performance,
  matches,
  lang,
  t,
}) => {
  const pt = proTranslations[lang].backtesting;
  const [leagueFilter, setLeagueFilter] = useState('all');

  const fullReport = useMemo(
    () => runBacktestEvaluation(performance, matches, 'all'),
    [performance, matches]
  );

  const report = useMemo(
    () => runBacktestEvaluation(performance, matches, leagueFilter),
    [performance, matches, leagueFilter]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
            {pt.title}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{pt.subtitle}</p>
        </div>

        <div>
          <label htmlFor="backtest-league-filter" className="sr-only">
            {t.common.allLeagues}
          </label>
          <select
            id="backtest-league-filter"
            value={leagueFilter}
            onChange={(e) => setLeagueFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="all">{t.common.allLeagues}</option>
            {fullReport.byLeague.map((l) => (
              <option key={l.leagueId} value={l.leagueId}>
                {l.leagueName} ({l.total})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{pt.kpiEvaluated}</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
            {report.totalMatches}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{pt.kpiBrier}</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
            {report.totalMatches > 0 ? report.avgBrierScore.toFixed(3) : '—'}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{pt.brierBenchmark}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{pt.kpiLogLoss}</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-sky-700 dark:text-sky-400">
            {report.totalMatches > 0 ? report.avgLogLoss.toFixed(3) : '—'}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{pt.logLossBenchmark}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{pt.kpiHitRate}</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
            {report.totalMatches > 0 ? formatPercent(report.hitRate, 1) : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 col-span-2 lg:col-span-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{pt.kpiEce}</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
            {report.totalMatches > 0 ? `${report.calibrationErrorEce.toFixed(1)}%` : '—'}
          </p>
        </div>
      </section>

      {report.totalMatches === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          {pt.noData}
        </div>
      ) : (
        <>
          {/* Calibration Chart + League Breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <section
              aria-labelledby="calibration-chart-heading"
              className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-7"
            >
              <h2
                id="calibration-chart-heading"
                className="text-base font-semibold text-slate-900 dark:text-slate-50"
              >
                {pt.calibrationTitle}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {pt.calibrationSubtitle}
              </p>

              <div className="mt-5 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={report.calibrationBins}
                    margin={{ top: 10, right: 16, left: -10, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                    <XAxis
                      dataKey="binLabel"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                      formatter={(val, name) => [
                        `${Number(val ?? 0).toFixed(1)}%`,
                        String(name ?? ''),
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line
                      type="monotone"
                      dataKey="perfectPct"
                      name={pt.perfectLine}
                      stroke="#94a3b8"
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="actualPct"
                      name={pt.modelLine}
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#10b981' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* League Breakdown */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-5">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                {pt.leagueBreakdownTitle}
              </h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      <th className="py-2 pr-2 font-medium">{pt.leagueCol}</th>
                      <th className="py-2 px-1.5 text-right font-medium">{pt.samplesCol}</th>
                      <th className="py-2 px-1.5 text-right font-medium">{pt.hitRateCol}</th>
                      <th className="py-2 px-1.5 text-right font-medium">{pt.brierCol}</th>
                      <th className="py-2 pl-1.5 text-right font-medium">{pt.logLossCol}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono tabular-nums dark:divide-slate-800/80">
                    {report.byLeague.map((row) => (
                      <tr key={row.leagueId}>
                        <td className="py-2.5 pr-2 font-sans font-medium text-slate-800 dark:text-slate-200">
                          {row.leagueName}
                        </td>
                        <td className="py-2.5 px-1.5 text-right text-slate-500">{row.total}</td>
                        <td className="py-2.5 px-1.5 text-right font-semibold text-emerald-700 dark:text-emerald-400">
                          {formatPercent(row.hitRate, 0)}
                        </td>
                        <td className="py-2.5 px-1.5 text-right text-slate-700 dark:text-slate-300">
                          {row.avgBrier.toFixed(3)}
                        </td>
                        <td className="py-2.5 pl-1.5 text-right text-slate-700 dark:text-slate-300">
                          {row.avgLogLoss.toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Recent Evaluated Matches Table */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              {pt.recentEvaluatedTitle}
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <th className="py-2.5 pr-3 font-medium">{t.predictions.match}</th>
                    <th className="py-2.5 px-2 font-medium">{t.performance.predicted}</th>
                    <th className="py-2.5 px-2 font-medium">{t.performance.actual}</th>
                    <th className="py-2.5 px-2 text-right font-medium">{pt.brierCol}</th>
                    <th className="py-2.5 px-2 text-right font-medium">{pt.logLossCol}</th>
                    <th className="py-2.5 pl-2 text-right font-medium">{t.performance.outcome}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {report.samples.slice(0, 20).map((s) => (
                    <tr key={s.id}>
                      <td className="py-2.5 pr-3">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {s.homeTeam} vs {s.awayTeam}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {s.leagueName} · {formatShortDate(s.date, lang)}
                        </p>
                      </td>
                      <td className="py-2.5 px-2 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {formatSelectionLabel(s.predictedSelection, t)} ({formatPercent(s.predictedProb, 0)})
                      </td>
                      <td className="py-2.5 px-2 font-mono tabular-nums text-slate-900 dark:text-slate-100">
                        {s.actualScore} · {formatSelectionLabel(s.actualResult, t)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {s.brierScore.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {s.logLoss.toFixed(3)}
                      </td>
                      <td className="py-2.5 pl-2 text-right font-semibold">
                        <span
                          className={
                            s.hit
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }
                        >
                          {s.hit ? t.performance.hit : t.performance.miss}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <DisclaimerBanner text={t.common.disclaimer} />
    </div>
  );
};
