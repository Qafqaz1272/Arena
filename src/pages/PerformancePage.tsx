import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Language, PerformanceSummary } from '../types/football';
import type { TranslationDictionary } from '../i18n/translations';
import { formatConfidenceLabel, formatSelectionLabel } from '../i18n/translations';
import { formatPercent, formatShortDate } from '../utils/formatters';
import { DisclaimerBanner } from '../components/AnalyticsPrimitives';

interface PerformancePageProps {
  performance: PerformanceSummary;
  lang: Language;
  t: TranslationDictionary;
}

export const PerformancePage: React.FC<PerformancePageProps> = ({
  performance,
  lang,
  t,
}) => {
  const confidenceChartData = performance.byConfidence.map((row) => ({
    band: formatConfidenceLabel(row.band, t),
    actualHitRate: row.hitRate,
    expectedAvgProb: row.expectedAvgProb,
    total: row.total,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
          {t.performance.title}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {t.performance.subtitle}
        </p>
      </div>

      {/* KPI Strip */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.performance.kpiHitRate}</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
            {performance.overallHitRate.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t.performance.kpiHighConfHit}
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-50">
            {performance.highConfidenceHitRate.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.performance.kpiEvaluated}</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-50">
            {performance.totalEvaluated}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.performance.kpiBrier}</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-50">
            {performance.avgBrierScore.toFixed(3)}
          </p>
        </div>
      </section>

      <p className="text-xs text-slate-500 dark:text-slate-400">{t.performance.brierNote}</p>

      {/* Hit Rate by League & Calibration by Confidence Band */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {t.performance.hitRateByLeague}
          </h2>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={performance.byLeague}
                layout="vertical"
                margin={{ top: 4, right: 18, left: 12, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis
                  dataKey="leagueName"
                  type="category"
                  width={108}
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
                />
                <Bar
                  dataKey="hitRate"
                  name={t.performance.actualHitRate}
                  fill="#10b981"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {t.performance.calibrationByBand}
          </h2>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={confidenceChartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="band" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="actualHitRate"
                  name={t.performance.actualHitRate}
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expectedAvgProb"
                  name={t.performance.expectedProb}
                  fill="#64748b"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Monthly Trend */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
          {t.performance.monthlyTrendTitle}
        </h2>
        <div className="mt-4 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={performance.monthlyTrend}
              margin={{ top: 8, right: 16, left: -12, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis domain={[40, 75]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="hitRate"
                name={t.performance.actualHitRate}
                stroke="#10b981"
                fill="rgba(16, 185, 129, 0.16)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Recent Resolved Predictions Table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {t.performance.recentResolvedTitle}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[660px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                <th className="py-3 pl-5 pr-3 font-medium">
                  {lang === 'az' ? 'Tarix' : lang === 'ru' ? 'Дата' : 'Date'}
                </th>
                <th className="py-3 px-3 font-medium">{t.predictions.match}</th>
                <th className="py-3 px-3 font-medium">{t.performance.predicted}</th>
                <th className="py-3 px-3 font-medium text-right">{t.performance.actual}</th>
                <th className="py-3 pl-3 pr-5 font-medium text-right">{t.performance.outcome}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {performance.recentResults.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                  <td className="py-3 pl-5 pr-3 font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    {formatShortDate(row.date, lang)}
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {row.homeTeam} vs {row.awayTeam}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {row.leagueName} · {formatConfidenceLabel(row.confidenceBand, t)}
                    </p>
                  </td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                    {formatSelectionLabel(row.predictedSelection, t)}{' '}
                    <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      ({formatPercent(row.predictedProb, 0)})
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {row.actualScore}
                  </td>
                  <td className="py-3 pl-3 pr-5 text-right">
                    <span
                      className={`inline-flex items-center gap-1 font-medium ${
                        row.hit
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {row.hit ? (
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      <span>{row.hit ? t.performance.hit : t.performance.miss}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <DisclaimerBanner text={t.common.disclaimer} />
    </div>
  );
};
