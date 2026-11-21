import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Plus, Trash2, Wallet } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { BankrollBet, BetResultStatus, Language } from '../types/football';
import type { TranslationDictionary } from '../i18n/translations';
import { proTranslations } from '../i18n/proTranslations';
import {
  buildRoiCurve,
  computeBankrollMetrics,
  computeBetProfit,
  getTodayDateKey,
  loadBankrollBets,
  loadBankrollSettings,
  saveBankrollBets,
  saveBankrollSettings,
  type BankrollSettings,
} from '../utils/bankrollManager';
import { DisclaimerBanner } from '../components/AnalyticsPrimitives';

interface BankrollPageProps {
  lang: Language;
  t: TranslationDictionary;
  onDailyLimitTriggered?: (title: string, body: string) => void;
}

export const BankrollPage: React.FC<BankrollPageProps> = ({
  lang,
  t,
  onDailyLimitTriggered,
}) => {
  const pt = proTranslations[lang].bankroll;

  const [bets, setBets] = useState<BankrollBet[]>(() =>
    typeof window !== 'undefined' ? loadBankrollBets() : []
  );
  const [settings, setSettings] = useState<BankrollSettings>(() =>
    typeof window !== 'undefined'
      ? loadBankrollSettings()
      : { startingBankroll: 500, dailyLossLimit: 50, currency: 'AZN' }
  );

  const [matchLabel, setMatchLabel] = useState('');
  const [selection, setSelection] = useState('');
  const [stakeInput, setStakeInput] = useState('10');
  const [oddsInput, setOddsInput] = useState('1.95');
  const [result, setResult] = useState<BetResultStatus>('pending');
  const [date, setDate] = useState<string>(() => getTodayDateKey());
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    saveBankrollBets(bets);
  }, [bets]);

  useEffect(() => {
    saveBankrollSettings(settings);
  }, [settings]);

  const metrics = useMemo(() => computeBankrollMetrics(bets, settings), [bets, settings]);
  const roiCurve = useMemo(
    () => buildRoiCurve(bets, settings.startingBankroll),
    [bets, settings.startingBankroll]
  );

  const handleAddBet = (e: React.FormEvent) => {
    e.preventDefault();
    const stake = Number.parseFloat(stakeInput);
    const odds = Number.parseFloat(oddsInput);
    if (
      !matchLabel.trim() ||
      !Number.isFinite(stake) ||
      stake <= 0 ||
      !Number.isFinite(odds) ||
      odds <= 1.0
    ) {
      setFormError(pt.validationError);
      return;
    }

    setFormError(null);
    const newBet: BankrollBet = {
      id: `bet-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: date || getTodayDateKey(),
      createdAt: new Date().toISOString(),
      matchLabel: matchLabel.trim(),
      selection: selection.trim() || '1X2',
      stake: Number(stake.toFixed(2)),
      odds: Number(odds.toFixed(2)),
      result,
    };

    const nextBets = [newBet, ...bets];
    setBets(nextBets);
    setMatchLabel('');
    setSelection('');

    const nextMetrics = computeBankrollMetrics(nextBets, settings);
    if (nextMetrics.isDailyLossLimitReached && !metrics.isDailyLossLimitReached) {
      onDailyLimitTriggered?.(pt.limitWarningTitle, pt.limitWarningBody);
    }
  };

  const handleUpdateResult = (id: string, nextStatus: BetResultStatus) => {
    const nextBets = bets.map((b) => (b.id === id ? { ...b, result: nextStatus } : b));
    setBets(nextBets);
    const nextMetrics = computeBankrollMetrics(nextBets, settings);
    if (nextMetrics.isDailyLossLimitReached && !metrics.isDailyLossLimitReached) {
      onDailyLimitTriggered?.(pt.limitWarningTitle, pt.limitWarningBody);
    }
  };

  const handleDeleteBet = (id: string) => {
    setBets((prev) => prev.filter((b) => b.id !== id));
  };

  const cur = settings.currency || 'AZN';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
          <Wallet className="h-6 w-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <span>{pt.title}</span>
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{pt.subtitle}</p>
      </div>

      {/* Daily Loss Limit Warning Banner */}
      {metrics.isDailyLossLimitReached && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-500/40 bg-rose-50 p-4 text-rose-900 dark:bg-rose-950/35 dark:text-rose-200"
        >
          <AlertTriangle
            className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-bold">{pt.limitWarningTitle}</p>
            <p className="mt-0.5 text-xs opacity-90">{pt.limitWarningBody}</p>
            <p className="mt-1 font-mono text-xs font-semibold tabular-nums">
              {pt.todayLossLabel}: -{metrics.todayLossAmount.toFixed(2)} {cur} /{' '}
              {metrics.dailyLossLimit.toFixed(2)} {cur}
            </p>
          </div>
        </div>
      )}

      {/* KPI Summary Strip */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{pt.kpiBalance}</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
            {metrics.currentBankroll.toFixed(2)} <span className="text-sm font-medium">{cur}</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{pt.kpiNetProfit}</p>
          <p
            className={`mt-1.5 font-mono text-2xl font-bold tabular-nums ${
              metrics.netProfit > 0
                ? 'text-emerald-700 dark:text-emerald-400'
                : metrics.netProfit < 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-900 dark:text-slate-50'
            }`}
          >
            {metrics.netProfit > 0 ? '+' : ''}
            {metrics.netProfit.toFixed(2)} <span className="text-sm font-medium">{cur}</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{pt.kpiRoi}</p>
          <p
            className={`mt-1.5 font-mono text-2xl font-bold tabular-nums ${
              metrics.roiPct > 0
                ? 'text-emerald-700 dark:text-emerald-400'
                : metrics.roiPct < 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-900 dark:text-slate-50'
            }`}
          >
            {metrics.roiPct > 0 ? '+' : ''}
            {metrics.roiPct.toFixed(1)}%
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{pt.kpiWinRate}</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
            {metrics.settledBets > 0 ? `${metrics.winRatePct.toFixed(1)}%` : '—'}
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
            {metrics.wins}W – {metrics.losses}L · {metrics.pending}P
          </p>
        </div>
      </section>

      {/* Settings + Daily Loss Meter */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            {pt.settingsTitle}
          </h2>
          <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
            {pt.todayLossLabel}: {metrics.todayLossAmount.toFixed(2)} /{' '}
            {metrics.dailyLossLimit.toFixed(2)} {cur} ({metrics.dailyLossUsagePct.toFixed(0)}%)
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="bankroll-start-input"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              {pt.startingBankroll}
            </label>
            <input
              id="bankroll-start-input"
              type="number"
              min="0"
              step="10"
              value={settings.startingBankroll}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  startingBankroll: Math.max(0, Number.parseFloat(e.target.value) || 0),
                }))
              }
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="bankroll-limit-input"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              {pt.dailyLossLimit}
            </label>
            <input
              id="bankroll-limit-input"
              type="number"
              min="0"
              step="5"
              value={settings.dailyLossLimit}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  dailyLossLimit: Math.max(0, Number.parseFloat(e.target.value) || 0),
                }))
              }
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="bankroll-currency-input"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              {pt.currency}
            </label>
            <select
              id="bankroll-currency-input"
              value={settings.currency}
              onChange={(e) => setSettings((prev) => ({ ...prev, currency: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="AZN">AZN (₼)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="TRY">TRY (₺)</option>
            </select>
          </div>
        </div>

        {/* Daily Loss Progress Bar */}
        <div className="h-2 w-full overflow-hidden rounded-sm bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full transition-all ${
              metrics.isDailyLossLimitReached
                ? 'bg-rose-600'
                : metrics.dailyLossUsagePct >= 70
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
            }`}
            style={{ width: `${metrics.dailyLossUsagePct}%` }}
          />
        </div>
      </section>

      {/* Log Bet Form + ROI Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:col-span-5">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {pt.logBetTitle}
          </h2>
          <form onSubmit={handleAddBet} className="mt-4 space-y-3.5">
            <div>
              <label
                htmlFor="bet-match-input"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                {pt.matchLabel}
              </label>
              <input
                id="bet-match-input"
                type="text"
                value={matchLabel}
                onChange={(e) => setMatchLabel(e.target.value)}
                placeholder={pt.matchPlaceholder}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="bet-selection-input"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  {pt.selectionLabel}
                </label>
                <input
                  id="bet-selection-input"
                  type="text"
                  value={selection}
                  onChange={(e) => setSelection(e.target.value)}
                  placeholder={pt.selectionPlaceholder}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="bet-date-input"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  {pt.dateLabel}
                </label>
                <input
                  id="bet-date-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="bet-stake-input"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  {pt.stakeLabel} ({cur})
                </label>
                <input
                  id="bet-stake-input"
                  type="number"
                  step="any"
                  min="0.01"
                  value={stakeInput}
                  onChange={(e) => setStakeInput(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 font-mono text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="bet-odds-input"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  {pt.oddsLabel}
                </label>
                <input
                  id="bet-odds-input"
                  type="number"
                  step="any"
                  min="1.01"
                  value={oddsInput}
                  onChange={(e) => setOddsInput(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 font-mono text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="bet-result-select"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  {pt.resultLabel}
                </label>
                <select
                  id="bet-result-select"
                  value={result}
                  onChange={(e) => setResult(e.target.value as BetResultStatus)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="pending">{pt.statusPending}</option>
                  <option value="win">{pt.statusWin}</option>
                  <option value="loss">{pt.statusLoss}</option>
                  <option value="void">{pt.statusVoid}</option>
                </select>
              </div>
            </div>

            {formError && (
              <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
                {formError}
              </p>
            )}

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>{pt.addBet}</span>
            </button>
          </form>
        </section>

        {/* ROI Curve Chart */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:col-span-7">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {pt.roiChartTitle}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {pt.roiChartSubtitle}
          </p>

          {roiCurve.length === 0 ? (
            <div className="mt-8 flex h-56 items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              {pt.roiChartEmpty}
            </div>
          ) : (
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={roiCurve} margin={{ top: 10, right: 14, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="roiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    formatter={(value, name) => {
                      const num = Number(value ?? 0);
                      const label = String(name ?? '');
                      return [
                        label === pt.roiSeries ? `${num.toFixed(1)}%` : `${num.toFixed(2)} ${cur}`,
                        label,
                      ];
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulativeRoiPct"
                    name={pt.roiSeries}
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#roiGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      {/* Bet History Table */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {pt.historyTitle} ({bets.length})
          </h2>
          {bets.length > 0 && (
            <button
              type="button"
              onClick={() => setBets([])}
              className="text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
            >
              {pt.clearAll}
            </button>
          )}
        </div>

        {bets.length === 0 ? (
          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            {pt.noBetsYet}
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[660px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-2 pr-3 font-medium">{pt.dateLabel}</th>
                  <th className="py-2 px-2 font-medium">{pt.matchLabel}</th>
                  <th className="py-2 px-2 font-medium">{pt.selectionLabel}</th>
                  <th className="py-2 px-2 text-right font-medium">{pt.stakeLabel}</th>
                  <th className="py-2 px-2 text-right font-medium">{pt.oddsLabel}</th>
                  <th className="py-2 px-2 font-medium">{pt.resultLabel}</th>
                  <th className="py-2 px-2 text-right font-medium">P&amp;L</th>
                  <th className="py-2 pl-2 w-10" aria-label={pt.deleteBet} />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {bets.map((b) => {
                  const pnl = computeBetProfit(b);
                  return (
                    <tr key={b.id}>
                      <td className="py-2.5 pr-3 font-mono tabular-nums text-slate-500">
                        {b.date}
                      </td>
                      <td className="py-2.5 px-2 font-medium text-slate-900 dark:text-slate-100">
                        {b.matchLabel}
                      </td>
                      <td className="py-2.5 px-2 text-slate-600 dark:text-slate-300">
                        {b.selection}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                        {b.stake.toFixed(2)} {cur}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                        {b.odds.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2">
                        <select
                          aria-label={`${pt.resultLabel} ${b.matchLabel}`}
                          value={b.result}
                          onChange={(e) =>
                            handleUpdateResult(b.id, e.target.value as BetResultStatus)
                          }
                          className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        >
                          <option value="pending">{pt.statusPending}</option>
                          <option value="win">{pt.statusWin}</option>
                          <option value="loss">{pt.statusLoss}</option>
                          <option value="void">{pt.statusVoid}</option>
                        </select>
                      </td>
                      <td
                        className={`py-2.5 px-2 text-right font-mono font-semibold tabular-nums ${
                          pnl > 0
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : pnl < 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-500'
                        }`}
                      >
                        {pnl > 0 ? '+' : ''}
                        {pnl.toFixed(2)} {cur}
                      </td>
                      <td className="py-2.5 pl-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteBet(b.id)}
                          aria-label={`${pt.deleteBet} ${b.matchLabel}`}
                          className="rounded-md p-1 text-slate-400 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <DisclaimerBanner text={t.common.disclaimer} />
    </div>
  );
};
