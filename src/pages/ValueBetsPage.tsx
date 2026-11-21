import React, { useMemo, useState } from 'react';
import { RefreshCw, RotateCcw, Sparkles, TrendingUp } from 'lucide-react';
import type { Language, MatchWithPrediction } from '../types/football';
import type { TranslationDictionary } from '../i18n/translations';
import { proTranslations } from '../i18n/proTranslations';
import {
  computeBookmakerMargin,
  evaluateValueBet,
  type ValueBetCalculation,
  type ValueSelectionKey,
} from '../engine/valueBetEngine';
import { footballService } from '../services/footballService';
import { formatKickoffTime, formatPercent, formatShortDate } from '../utils/formatters';
import { DisclaimerBanner, TeamCrest } from '../components/AnalyticsPrimitives';

interface ValueBetsPageProps {
  matches: MatchWithPrediction[];
  lang: Language;
  t: TranslationDictionary;
  onSelectMatch: (matchId: string) => void;
}

interface MatchOddsInput {
  home: string;
  draw: string;
  away: string;
}

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export const ValueBetsPage: React.FC<ValueBetsPageProps> = ({
  matches,
  lang,
  t,
  onSelectMatch,
}) => {
  const pt = proTranslations[lang].valueBets;
  const activeMatches = useMemo(
    () => matches.filter((m) => m.status !== 'finished').slice(0, 24),
    [matches]
  );

  const [oddsByMatch, setOddsByMatch] = useState<Record<string, MatchOddsInput>>({});
  const [onlyPositive, setOnlyPositive] = useState(false);
  const [syncingApi, setSyncingApi] = useState(false);
  const [apiNotice, setApiNotice] = useState<string | null>(null);

  const handleOddsChange = (matchId: string, field: keyof MatchOddsInput, value: string) => {
    setOddsByMatch((prev) => ({
      ...prev,
      [matchId]: {
        home: prev[matchId]?.home ?? '',
        draw: prev[matchId]?.draw ?? '',
        away: prev[matchId]?.away ?? '',
        [field]: value,
      },
    }));
  };

  const handleSyncApi = async () => {
    setSyncingApi(true);
    setApiNotice(null);
    try {
      const res = await footballService.fetchBookmakerOdds(true);
      if (!res.configured) {
        setApiNotice(pt.apiNotConfigured);
      } else if (res.quotes.length === 0) {
        setApiNotice(res.error || pt.apiNotConfigured);
      } else {
        const next: Record<string, MatchOddsInput> = { ...oddsByMatch };
        let matched = 0;
        for (const m of activeMatches) {
          const hNorm = normalizeName(m.homeTeam.shortName);
          const aNorm = normalizeName(m.awayTeam.shortName);
          const quote = res.quotes.find((q) => {
            const qh = normalizeName(q.homeTeam);
            const qa = normalizeName(q.awayTeam);
            return (
              (qh.includes(hNorm) || hNorm.includes(qh)) &&
              (qa.includes(aNorm) || aNorm.includes(qa))
            );
          });
          if (quote) {
            next[m.id] = {
              home: quote.homeOdds.toFixed(2),
              draw: quote.drawOdds.toFixed(2),
              away: quote.awayOdds.toFixed(2),
            };
            matched += 1;
          }
        }
        setOddsByMatch(next);
        setApiNotice(`${pt.apiLoadedPrefix} ${matched} (${res.provider})`);
      }
    } catch {
      setApiNotice(pt.apiNotConfigured);
    } finally {
      setSyncingApi(false);
    }
  };

  // Prefills realistic bookmaker-style odds (~5% vig with slight market spread) for quick exploration
  const handlePrefillSample = () => {
    const next: Record<string, MatchOddsInput> = {};
    activeMatches.slice(0, 8).forEach((m, idx) => {
      const vig = 1.05;
      // Introduce small realistic pricing variance so user can inspect both +EV and -EV cases
      const skewHome = idx % 3 === 0 ? 0.9 : 1.04;
      const skewAway = idx % 3 === 1 ? 0.91 : 1.03;
      const hOdd = Math.max(1.12, 1 / (m.prediction.homeWinProb * vig * skewHome));
      const dOdd = Math.max(1.8, 1 / (m.prediction.drawProb * vig));
      const aOdd = Math.max(1.12, 1 / (m.prediction.awayWinProb * vig * skewAway));
      next[m.id] = {
        home: hOdd.toFixed(2),
        draw: dOdd.toFixed(2),
        away: aOdd.toFixed(2),
      };
    });
    setOddsByMatch(next);
  };

  const evaluated = useMemo(() => {
    const rows: Array<{
      match: MatchWithPrediction;
      inputs: MatchOddsInput;
      marginPct: number | null;
      picks: ValueBetCalculation[];
      bestPick: ValueBetCalculation | null;
    }> = [];

    for (const match of activeMatches) {
      const inputs = oddsByMatch[match.id] ?? { home: '', draw: '', away: '' };
      const hVal = Number.parseFloat(inputs.home);
      const dVal = Number.parseFloat(inputs.draw);
      const aVal = Number.parseFloat(inputs.away);

      const picks: ValueBetCalculation[] = [];
      const hCalc = evaluateValueBet('home', match.prediction.homeWinProb, hVal);
      const dCalc = evaluateValueBet('draw', match.prediction.drawProb, dVal);
      const aCalc = evaluateValueBet('away', match.prediction.awayWinProb, aVal);
      if (hCalc) picks.push(hCalc);
      if (dCalc) picks.push(dCalc);
      if (aCalc) picks.push(aCalc);

      const margin = computeBookmakerMargin(hVal, dVal, aVal);
      const bestPick =
        picks.length > 0 ? [...picks].sort((a, b) => b.evPercent - a.evPercent)[0] : null;

      rows.push({
        match,
        inputs,
        marginPct: margin ? margin.overroundPct : null,
        picks,
        bestPick,
      });
    }

    return rows;
  }, [activeMatches, oddsByMatch]);

  const positivePicks = useMemo(
    () =>
      evaluated
        .flatMap((row) =>
          row.picks
            .filter((p) => p.isPositiveEv)
            .map((pick) => ({ match: row.match, pick, marginPct: row.marginPct }))
        )
        .sort((a, b) => b.pick.evPercent - a.pick.evPercent),
    [evaluated]
  );

  const visibleRows = onlyPositive
    ? evaluated.filter((r) => r.picks.some((p) => p.isPositiveEv))
    : evaluated;

  const quotedMatchesCount = evaluated.filter((r) => r.picks.length > 0).length;
  const bestEvPct = positivePicks[0]?.pick.evPercent ?? null;
  const avgPositiveEdgePct =
    positivePicks.length > 0
      ? (positivePicks.reduce((acc, p) => acc + p.pick.edgeProb * 100, 0) / positivePicks.length)
      : null;

  const formatSel = (sel: ValueSelectionKey, match: MatchWithPrediction) => {
    if (sel === 'home') return `1 · ${match.homeTeam.shortName}`;
    if (sel === 'away') return `2 · ${match.awayTeam.shortName}`;
    return `X · ${t.common.draw}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
            {pt.title}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{pt.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrefillSample}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>{pt.prefillSampleOdds}</span>
          </button>
          <button
            type="button"
            onClick={handleSyncApi}
            disabled={syncingApi}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncingApi ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>{pt.apiSyncButton}</span>
          </button>
          {quotedMatchesCount > 0 && (
            <button
              type="button"
              onClick={() => setOddsByMatch({})}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{pt.resetOdds}</span>
            </button>
          )}
        </div>
      </div>

      {apiNotice && (
        <div
          role="status"
          className="rounded-xl border border-slate-200 bg-slate-100/80 px-4 py-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          {apiNotice}
        </div>
      )}

      {/* KPI Strip */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{pt.kpiScanned}</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
            {quotedMatchesCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{pt.kpiPositiveCount}</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
            {positivePicks.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{pt.kpiBestEv}</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
            {bestEvPct !== null ? `+${bestEvPct.toFixed(1)}%` : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{pt.kpiAvgEdge}</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-sky-700 dark:text-sky-400">
            {avgPositiveEdgePct !== null ? `+${avgPositiveEdgePct.toFixed(1)}%` : '—'}
          </p>
        </div>
      </section>

      {/* Highlighted Positive-EV Estimates */}
      {positivePicks.length > 0 && (
        <section
          aria-labelledby="positive-ev-heading"
          className="rounded-xl border border-emerald-500/30 bg-emerald-50/40 p-5 dark:border-emerald-500/25 dark:bg-emerald-950/15 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              id="positive-ev-heading"
              className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50"
            >
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>{pt.kpiPositiveCount}</span>
              <span className="text-xs font-normal text-amber-700 dark:text-amber-400">
                · {pt.estimateLabel}
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {positivePicks.slice(0, 6).map(({ match, pick }) => (
              <div
                key={`${match.id}-${pick.selection}`}
                className="rounded-xl border border-emerald-500/30 bg-white p-4 dark:border-emerald-500/25 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => onSelectMatch(match.id)}
                    className="truncate font-semibold text-slate-900 hover:text-emerald-600 dark:text-slate-100 dark:hover:text-emerald-400"
                  >
                    {match.homeTeam.shortName} vs {match.awayTeam.shortName}
                  </button>
                  <span className="font-mono text-xs font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                    +{pick.evPercent.toFixed(1)}% EV
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  {formatSel(pick.selection, match)} @{' '}
                  <span className="font-mono font-semibold">{pick.bookmakerOdds.toFixed(2)}</span>
                </p>
                <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] font-mono tabular-nums text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <span>
                    {pt.modelProbCol}: {formatPercent(pick.modelProb, 1)}
                  </span>
                  <span>
                    {pt.impliedProbCol}: {formatPercent(pick.impliedProb, 1)}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-amber-700 dark:text-amber-400">
                  {pt.estimateLabel} · {pt.kellyCol}: {pick.quarterKellyPct}%
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">{pt.manualHint}</p>
        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={onlyPositive}
            onChange={(e) => setOnlyPositive(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span>{pt.onlyPositiveEv}</span>
        </label>
      </div>

      {/* Odds Calculator Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-400">
              <th className="py-3 pl-4 pr-3">{pt.matchCol}</th>
              <th className="py-3 px-2 text-center">1 ({t.common.home})</th>
              <th className="py-3 px-2 text-center">X ({t.common.draw})</th>
              <th className="py-3 px-2 text-center">2 ({t.common.away})</th>
              <th className="py-3 px-3 text-right">{pt.evCol}</th>
              <th className="py-3 pl-2 pr-4 text-right">{pt.kellyCol}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
                  {pt.noPositiveYet}
                </td>
              </tr>
            ) : (
              visibleRows.map(({ match, inputs, marginPct, bestPick }) => {
                const isPos = Boolean(bestPick?.isPositiveEv);
                return (
                  <tr
                    key={match.id}
                    className={
                      isPos
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/15'
                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/25'
                    }
                  >
                    <td className="py-3.5 pl-4 pr-3">
                      <button
                        type="button"
                        onClick={() => onSelectMatch(match.id)}
                        className="text-left group"
                      >
                        <div className="flex items-center gap-2 font-medium text-slate-900 group-hover:text-emerald-600 dark:text-slate-100 dark:group-hover:text-emerald-400">
                          <TeamCrest code={match.homeTeam.code} size="sm" />
                          <span>{match.homeTeam.shortName}</span>
                          <span className="text-slate-400">vs</span>
                          <TeamCrest code={match.awayTeam.code} size="sm" />
                          <span>{match.awayTeam.shortName}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          {match.leagueName} · {formatShortDate(match.dateKey, lang)},{' '}
                          {formatKickoffTime(match.kickoffIso, lang)}
                          {marginPct !== null ? ` · ${pt.marginLabel}: ${marginPct.toFixed(1)}%` : ''}
                        </p>
                      </button>
                    </td>

                    {(['home', 'draw', 'away'] as const).map((side) => {
                      const modelP =
                        side === 'home'
                          ? match.prediction.homeWinProb
                          : side === 'draw'
                            ? match.prediction.drawProb
                            : match.prediction.awayWinProb;
                      const parsedOdd = Number.parseFloat(inputs[side]);
                      const calc = evaluateValueBet(side, modelP, parsedOdd);
                      return (
                        <td key={side} className="py-3 px-2 align-top">
                          <div className="mx-auto w-24 space-y-1">
                            <input
                              type="number"
                              step="0.01"
                              min="1.02"
                              inputMode="decimal"
                              aria-label={`${match.homeTeam.shortName} vs ${match.awayTeam.shortName} ${side} odds`}
                              placeholder={pt.enterOddsPlaceholder}
                              value={inputs[side]}
                              onChange={(e) => handleOddsChange(match.id, side, e.target.value)}
                              className={`w-full rounded-lg border px-2 py-1.5 text-center font-mono text-xs tabular-nums focus:outline-none ${
                                calc?.isPositiveEv
                                  ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 dark:border-emerald-500/70 dark:bg-emerald-950/40 dark:text-emerald-200'
                                  : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'
                              }`}
                            />
                            <div className="flex items-center justify-between font-mono text-[10px] tabular-nums text-slate-500 dark:text-slate-400">
                              <span>M:{(modelP * 100).toFixed(0)}%</span>
                              <span>{calc ? `I:${(calc.impliedProb * 100).toFixed(0)}%` : '—'}</span>
                            </div>
                          </div>
                        </td>
                      );
                    })}

                    <td className="py-3.5 px-3 text-right align-top whitespace-nowrap">
                      {bestPick ? (
                        <div>
                          <p
                            className={`font-mono text-sm font-bold tabular-nums ${
                              bestPick.isPositiveEv
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {bestPick.evPercent > 0 ? '+' : ''}
                            {bestPick.evPercent.toFixed(1)}%
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {bestPick.selection === 'home'
                              ? '1'
                              : bestPick.selection === 'away'
                                ? '2'
                                : 'X'}{' '}
                            · {bestPick.isPositiveEv ? pt.positiveBadge : pt.negativeBadge}
                          </p>
                        </div>
                      ) : (
                        <span className="font-mono text-xs text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3.5 pl-2 pr-4 text-right align-top font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                      {bestPick && bestPick.quarterKellyPct > 0 ? `${bestPick.quarterKellyPct}%` : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <DisclaimerBanner text={pt.disclaimer} />
    </div>
  );
};
