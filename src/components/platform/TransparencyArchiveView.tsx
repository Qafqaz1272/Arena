import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { PlatformTransparencyPayload } from '../../types/platform';
import { MANDATORY_DISCLAIMER_AZ } from '../../utils/bettingInsightsEngine';
import { TickProbabilityBar } from '../editorial/SportsViz';

interface TransparencyArchiveViewProps {
  data: PlatformTransparencyPayload | null;
  loading: boolean;
}

export const TransparencyArchiveView: React.FC<TransparencyArchiveViewProps> = ({
  data,
  loading,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'WON' | 'LOST'>('all');
  const [breakdownTab, setBreakdownTab] = useState<'league' | 'market'>('league');
  const [visibleCount, setVisibleCount] = useState<number>(30);

  const archive = data?.archive ?? [];
  const metrics = data?.metrics;

  const filteredPicks = useMemo(() => {
    if (statusFilter === 'all') return archive;
    return archive.filter((p) => p.status === statusFilter);
  }, [archive, statusFilter]);

  if (loading && !data) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-3 rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-12 text-sm text-[#64748B]">
          <Loader2 className="h-4 w-4 animate-spin text-[#2BD576]" strokeWidth={1.5} />
          <span>Tamamlanmış real matçlar üzrə model auditi yüklənir...</span>
        </div>
      </section>
    );
  }

  if (!data || !metrics) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-dashed border-[#CBD5E1] dark:border-[#263140] bg-white dark:bg-[#121821] p-10 text-center text-sm text-[#64748B]">
          Tarixi model performansı hazırda əlçatan deyil. Zəhmət olmasa bir qədər sonra yenidən
          yoxlayın.
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#168A4A] dark:text-[#2BD576]">
            TAM ŞƏFFAFLIQ VƏ AÇIQ ARXİV · {data.sourceLabel}
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-[#111827] dark:text-[#F3F6FA]">
            Model Performansı & Kalibrasiya
          </h1>
          <p className="mt-1 text-sm text-[#475569] dark:text-[#94A3B8]">
            Bütün {metrics.totalSettled} tamamlanmış real matç üzərində hesablanıb. Uduzan
            proqnozlar heç vaxt silinmir və gizlədilmir.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-lg border border-[#2BD576]/35 bg-[#2BD576]/10 px-3 py-2 font-mono text-xs font-semibold text-[#147A42] dark:text-[#2BD576] shrink-0">
          <ShieldCheck className="h-4 w-4" strokeWidth={1.5} />
          <span>100% Real ESPN Nəticələri</span>
        </span>
      </div>

      {/* Top Editorial KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#DCE2EA] dark:divide-[#1E2733] overflow-hidden rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821]">
        <div className="p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#64748B]">
            Ümumi Dəqiqlik (Hit Rate)
          </div>
          <div className="mt-1.5 font-score text-4xl font-bold text-[#168A4A] dark:text-[#2BD576] tabular-nums">
            {metrics.hitRatePct}%
          </div>
          <div className="mt-1 font-mono text-[11px] text-[#64748B] tabular-nums">
            {metrics.wonCount} qalib · {metrics.lostCount} məğlub ({metrics.totalSettled} oyun)
          </div>
        </div>

        <div className="p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#64748B]">
            Brier Balı (Aşağı = Yaxşı)
          </div>
          <div className="mt-1.5 font-score text-4xl font-bold text-[#111827] dark:text-[#F3F6FA] tabular-nums">
            {metrics.brierScore.toFixed(3)}
          </div>
          <div className="mt-1 font-mono text-[11px] text-[#64748B] tabular-nums">
            Təsadüfi baza: 0.250
          </div>
        </div>

        <div className="p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#64748B]">
            Yüksək Etibarlılıq
          </div>
          <div className="mt-1.5 font-score text-4xl font-bold text-[#111827] dark:text-[#F3F6FA] tabular-nums">
            {metrics.highConfidenceHitRatePct}%
          </div>
          <div className="mt-1 font-mono text-[11px] text-[#64748B]">
            Güclü siqnal verən seçimlər
          </div>
        </div>

        <div className="p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#64748B]">
            Sabit Vahid ROI
          </div>
          <div
            className={`mt-1.5 font-score text-4xl font-bold tabular-nums ${
              metrics.roiPct >= 0
                ? 'text-[#168A4A] dark:text-[#2BD576]'
                : 'text-[#DC3B40] dark:text-[#E5484D]'
            }`}
          >
            {metrics.roiPct >= 0 ? `+${metrics.roiPct}%` : `${metrics.roiPct}%`}
          </div>
          <div className="mt-1 font-mono text-[11px] text-[#64748B]">
            5% bukmeker marjası daxil
          </div>
        </div>
      </div>

      {/* Calibration Chart + League / Market Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
            KALİBRASİYA QRAFİKİ
          </p>
          <h2 className="mt-0.5 font-display text-2xl font-bold uppercase text-[#111827] dark:text-[#F3F6FA]">
            Model Ehtimalı vs Real Nəticə (%)
          </h2>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={metrics.calibrationBuckets}>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(148,163,184,0.16)" vertical={false} />
                <XAxis
                  dataKey="range"
                  tick={{ fontSize: 11, fill: '#8A97A8', fontFamily: 'IBM Plex Mono, monospace' }}
                  axisLine={{ stroke: '#1E2733' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#8A97A8', fontFamily: 'IBM Plex Mono, monospace' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121821',
                    borderColor: '#1E2733',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#F3F6FA',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="actualRate"
                  name="Real Dəqiqlik (%)"
                  fill="#2BD576"
                  radius={[4, 4, 0, 0]}
                  barSize={28}
                />
                <Line
                  type="monotone"
                  dataKey="predictedAvg"
                  name="Model Orta (%)"
                  stroke="#F5A524"
                  strokeWidth={2}
                  dot={{ r: 3.5, fill: '#F5A524', strokeWidth: 0 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* League & Market Hit-Rate Breakdown */}
        <div className="lg:col-span-5 rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-5 flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-xl font-bold uppercase text-[#111827] dark:text-[#F3F6FA]">
              {breakdownTab === 'league' ? 'Liqa üzrə Dəqiqlik' : 'Bazar üzrə Dəqiqlik'}
            </h3>
            <div className="inline-flex rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] p-0.5">
              <button
                type="button"
                onClick={() => setBreakdownTab('league')}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                  breakdownTab === 'league'
                    ? 'bg-[#111827] dark:bg-[#F3F6FA] text-white dark:text-[#0B0F14]'
                    : 'text-[#64748B] hover:text-[#111827] dark:hover:text-[#F3F6FA]'
                }`}
              >
                Liqa
              </button>
              <button
                type="button"
                onClick={() => setBreakdownTab('market')}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                  breakdownTab === 'market'
                    ? 'bg-[#111827] dark:bg-[#F3F6FA] text-white dark:text-[#0B0F14]'
                    : 'text-[#64748B] hover:text-[#111827] dark:hover:text-[#F3F6FA]'
                }`}
              >
                Bazar
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-2.5 text-xs max-h-72 overflow-y-auto pr-1">
            {breakdownTab === 'league'
              ? metrics.byLeague.map((row, idx) => (
                  <div
                    key={`${row.league}-${idx}`}
                    className="rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] px-3 py-2.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#111827] dark:text-[#F3F6FA] truncate">
                        {row.league}
                      </span>
                      <span className="font-mono text-[11px] text-[#475569] dark:text-[#94A3B8] shrink-0 tabular-nums">
                        {row.won}/{row.total} ({row.hitRatePct}%) · Brier {row.brierScore.toFixed(3)}
                      </span>
                    </div>
                    <TickProbabilityBar
                      value={row.hitRatePct}
                      tone={row.hitRatePct >= 60 ? 'accent' : row.hitRatePct >= 48 ? 'amber' : 'neutral'}
                      animate={false}
                    />
                  </div>
                ))
              : metrics.byMarket.map((row, idx) => (
                  <div
                    key={`${row.market}-${idx}`}
                    className="rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] px-3 py-2.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#111827] dark:text-[#F3F6FA] truncate">
                        {row.market}
                      </span>
                      <span className="font-mono text-[11px] text-[#475569] dark:text-[#94A3B8] shrink-0 tabular-nums">
                        {row.won}/{row.total} ({row.hitRatePct}%) · ROI{' '}
                        {row.roiPct >= 0 ? `+${row.roiPct}%` : `${row.roiPct}%`}
                      </span>
                    </div>
                    <TickProbabilityBar
                      value={row.hitRatePct}
                      tone={row.hitRatePct >= 60 ? 'accent' : row.hitRatePct >= 48 ? 'amber' : 'neutral'}
                      animate={false}
                    />
                  </div>
                ))}
          </div>
        </div>
      </div>

      {/* Full Public Archive Table */}
      <div className="overflow-hidden rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0E131B] px-5 py-4">
          <h2 className="font-display text-2xl font-bold uppercase text-[#111827] dark:text-[#F3F6FA]">
            İctimai Proqnoz Arxivi ({filteredPicks.length} real oyun)
          </h2>
          <div className="flex items-center gap-1.5">
            {(['all', 'WON', 'LOST'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-[#111827] dark:bg-[#F3F6FA] text-white dark:text-[#0B0F14]'
                    : 'border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] text-[#475569] dark:text-[#94A3B8]'
                }`}
              >
                {tab === 'all' ? 'Hamısı' : tab === 'WON' ? 'Qazandı' : 'Uduzdu'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto px-5 py-2">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DCE2EA] dark:border-[#1E2733] font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748B]">
                <th className="py-3 pr-3">Tarix</th>
                <th className="py-3 px-2">Oyun</th>
                <th className="py-3 px-2">Liqa</th>
                <th className="py-3 px-2">Model Seçimi</th>
                <th className="py-3 px-2">Model %</th>
                <th className="py-3 px-2">Real Hesab</th>
                <th className="py-3 pl-2 text-right">Nəticə</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE2EA] dark:divide-[#1E2733]">
              {filteredPicks.slice(0, visibleCount).map((p) => (
                <tr
                  key={p.id}
                  className="text-[#111827] dark:text-[#F3F6FA] hover:bg-[#F8FAFC] dark:hover:bg-[#171F2B] transition-colors"
                >
                  <td className="py-2.5 pr-3 font-mono text-[#64748B] tabular-nums">{p.date}</td>
                  <td className="py-2.5 px-2 font-semibold">{p.matchLabel}</td>
                  <td className="py-2.5 px-2 text-[#64748B] dark:text-[#8A97A8]">{p.league}</td>
                  <td className="py-2.5 px-2 font-medium">{p.selection}</td>
                  <td className="py-2.5 px-2 font-mono tabular-nums">{p.modelProb}%</td>
                  <td className="py-2.5 px-2 font-mono font-semibold tabular-nums">
                    {p.actualOutcome}
                  </td>
                  <td className="py-2.5 pl-2 text-right">
                    {p.status === 'WON' ? (
                      <span className="inline-flex items-center gap-1 rounded-[4px] border border-[#2BD576]/35 bg-[#2BD576]/12 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#147A42] dark:text-[#2BD576]">
                        <CheckCircle2 className="h-3 w-3" strokeWidth={1.5} /> QAZANDI
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-[4px] border border-[#E5484D]/35 bg-[#E5484D]/12 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#DC3B40] dark:text-[#E5484D]">
                        <XCircle className="h-3 w-3" strokeWidth={1.5} /> UDUZDU
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[#DCE2EA] dark:border-[#1E2733] px-5 py-4 space-y-3">
          {filteredPicks.length > visibleCount && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + 30)}
                className="rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] px-4 py-2 text-xs font-semibold text-[#111827] dark:text-[#F3F6FA] hover:border-[#168A4A] dark:hover:border-[#2BD576] cursor-pointer"
              >
                Daha çox yüklə ({filteredPicks.length - visibleCount} qalıb)
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-lg border border-[#F5A524]/35 bg-[#F5A524]/10 px-3.5 py-2.5 text-xs text-[#334155] dark:text-[#CBD5E1]">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#F5A524]" strokeWidth={1.5} />
            <span>{MANDATORY_DISCLAIMER_AZ}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
