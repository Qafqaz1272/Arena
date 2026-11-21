import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  Calculator,
  CheckCircle2,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  calculateFractionalKelly,
  evaluateCustomCoupon,
  MANDATORY_DISCLAIMER_AZ,
  type CouponLeg,
  type GeneratedCoupon,
} from '../../utils/bettingInsightsEngine';
import type { PersistedBankrollBet } from '../../services/firestorePlatform';

interface CouponBankrollViewProps {
  smartCoupons: GeneratedCoupon[];
  candidateLegs: CouponLeg[];
  customLegs: CouponLeg[];
  onAddLeg: (leg: CouponLeg) => void;
  onRemoveLeg: (legId: string) => void;
  onReplaceLeg: (oldId: string, nextLeg: CouponLeg) => void;
  onLoadCouponIntoBuilder: (legs: CouponLeg[]) => void;
  onClearCustomCoupon: () => void;
  onSaveCustomCoupon: (title: string, combinedOdds: number, combinedProb: number) => void;
  onAskAiToAuditCoupon: () => void;
  bets: PersistedBankrollBet[];
  onAddBet: (bet: Omit<PersistedBankrollBet, 'id' | 'createdAtIso'>) => void;
  onSettleBet: (betId: string, status: 'won' | 'lost' | 'void') => void;
}

export const CouponBankrollView: React.FC<CouponBankrollViewProps> = ({
  smartCoupons,
  candidateLegs,
  customLegs,
  onAddLeg,
  onRemoveLeg,
  onReplaceLeg,
  onLoadCouponIntoBuilder,
  onClearCustomCoupon,
  onSaveCustomCoupon,
  onAskAiToAuditCoupon,
  bets,
  onAddBet,
  onSettleBet,
}) => {
  const [bankroll, setBankroll] = useState<number>(500);
  const [dailyLossLimit, setDailyLossLimit] = useState<number>(50);
  const [couponTitle, setCouponTitle] = useState<string>('Mənim Günün Kuponum');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // New bet form state
  const [betMatch, setBetMatch] = useState<string>('');
  const [betSelection, setBetSelection] = useState<string>('');
  const [betStake, setBetStake] = useState<number>(20);
  const [betOdds, setBetOdds] = useState<number>(1.85);

  const evaluation = useMemo(
    () => evaluateCustomCoupon(customLegs, candidateLegs),
    [customLegs, candidateLegs]
  );

  const kellyResult = useMemo(
    () =>
      calculateFractionalKelly({
        bankroll,
        modelProbPct: customLegs.length > 0 ? evaluation.combinedProb : 58,
        decimalOdds: customLegs.length > 0 ? evaluation.combinedOdds : 1.95,
        fraction: 0.25,
        maxCapPct: 5,
      }),
    [bankroll, customLegs.length, evaluation.combinedProb, evaluation.combinedOdds]
  );

  // Bankroll stats & P/L cumulative chart
  const bankrollStats = useMemo(() => {
    let cumulative = 0;
    let totalStaked = 0;
    let won = 0;
    let lost = 0;
    let todayLoss = 0;
    const todayPrefix = new Date().toISOString().slice(0, 10);

    const chartPoints = [{ name: 'Başlanğıc', pl: 0 }];
    bets.forEach((b, idx) => {
      if (b.status === 'pending' || b.status === 'void') return;
      totalStaked += b.stake;
      if (b.status === 'won') {
        won += 1;
        cumulative += b.stake * (b.odds - 1);
      } else {
        lost += 1;
        cumulative -= b.stake;
        if (b.createdAtIso.startsWith(todayPrefix)) {
          todayLoss += b.stake;
        }
      }
      chartPoints.push({
        name: `#${idx + 1}`,
        pl: Math.round(cumulative * 100) / 100,
      });
    });

    const settled = won + lost;
    const winRate = settled > 0 ? Math.round((won / settled) * 1000) / 10 : 0;
    const roi = totalStaked > 0 ? Math.round((cumulative / totalStaked) * 1000) / 10 : 0;

    return {
      cumulative: Math.round(cumulative * 100) / 100,
      winRate,
      roi,
      settled,
      todayLoss: Math.round(todayLoss * 100) / 100,
      limitExceeded: todayLoss >= dailyLossLimit,
      chartPoints,
    };
  }, [bets, dailyLossLimit]);

  const handleSaveCoupon = () => {
    if (customLegs.length === 0) return;
    onSaveCustomCoupon(couponTitle.trim() || 'Mənim Kuponum', evaluation.combinedOdds, evaluation.combinedProb);
    setSavedNotice('Kupon yadda saxlandı!');
    window.setTimeout(() => setSavedNotice(null), 2600);
  };

  const handleLogBet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!betMatch.trim() || !betSelection.trim() || betStake <= 0 || betOdds < 1.01) return;
    onAddBet({
      matchLabel: betMatch.trim(),
      selection: betSelection.trim(),
      stake: betStake,
      odds: betOdds,
      status: 'pending',
    });
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-[#2BD576]">
            KUPON KONSTRUKTORU VƏ BANKROLL İDARƏETMƏSİ
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-5xl font-extrabold text-slate-950 dark:text-white">
            Ağıllı Kuponlar və AI Risk Yoxlanışı
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Korrelyasiyasız avtomatik kuponlar, öz kuponunun AI analizi və Fraksional Kelli məbləğ
            hesablayıcısı.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-amber-400/35 bg-amber-400/10 px-3.5 py-2 text-xs text-amber-800 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
          <span>{MANDATORY_DISCLAIMER_AZ}</span>
        </div>
      </div>

      {/* 4 Auto-Generated Non-Correlated Coupons */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {smartCoupons.map((coupon) => {
          const accent =
            coupon.category === 'safe'
              ? 'border-emerald-500/40 dark:border-[#2BD576]/35'
              : coupon.category === 'value'
              ? 'border-sky-500/40 dark:border-[#0EA5E9]/40'
              : coupon.category === 'risk'
              ? 'border-[#F5A524]/40'
              : 'border-[#DCE2EA] dark:border-[#1E2733]';

          return (
            <div
              key={coupon.id}
              className={`flex flex-col justify-between rounded-2xl border ${accent} bg-white dark:bg-[#121821] p-5 shadow-lg`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-block rounded bg-slate-100 dark:bg-white/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-slate-700 dark:text-slate-300">
                      {coupon.riskLabelAz} · Korrelyasiyasız
                    </span>
                    <h2 className="mt-1.5 font-display text-2xl font-extrabold text-slate-950 dark:text-white">
                      {coupon.titleAz}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                      {coupon.subtitleAz}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-score text-3xl text-emerald-600 dark:text-[#2BD576] tabular-nums">
                      {coupon.combinedOdds.toFixed(2)}x
                    </div>
                    <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      Ehtimal: {coupon.combinedProb}%
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {coupon.legs.map((leg) => (
                    <div
                      key={leg.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[#DCE2EA]/80 dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/70 px-3.5 py-2.5 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {leg.matchLabel}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {leg.league} · <strong className="text-emerald-700 dark:text-[#2BD576]">{leg.selection}</strong>
                        </div>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        <div className="font-bold text-slate-950 dark:text-white">
                          {leg.odds.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {leg.modelProb}% ({leg.edgePct >= 0 ? `+${leg.edgePct}%` : `${leg.edgePct}%`})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#DCE2EA] dark:border-[#1E2733] flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {coupon.disclaimerAz}
                </span>
                <button
                  type="button"
                  onClick={() => onLoadCouponIntoBuilder(coupon.legs)}
                  className="rounded-lg bg-slate-900 dark:bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-[#2BD576] hover:text-[#08140D] transition-colors cursor-pointer"
                >
                  Konstruktora Yüklə
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Coupon Builder + AI Evaluator */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Available Picks Selector */}
        <div className="lg:col-span-6 rounded-2xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-[#F5A524]">
            SEÇİM BAZASI
          </p>
          <h2 className="mt-0.5 font-display text-2xl font-extrabold text-slate-950 dark:text-white">
            Öz Kuponunu Qur
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            İstənilən oyun bazarını əlavə et — AI mühərriki korrelyasiya, ümumi ehtimal və ən zəif
            bəndi anında qiymətləndirir.
          </p>

          <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {candidateLegs.slice(0, 18).map((leg) => {
              const selected = customLegs.some((c) => c.id === leg.id);
              return (
                <div
                  key={leg.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-[#DCE2EA]/80 dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/70 px-3.5 py-2.5 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 dark:text-white truncate">
                      {leg.matchLabel}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {leg.market} · <strong>{leg.selection}</strong> · Model {leg.modelProb}%
                      {leg.edgePct > 5 && (
                        <span className="ml-1.5 font-mono font-bold text-emerald-600 dark:text-[#2BD576]">
                          VALUE +{leg.edgePct}%
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => (selected ? onRemoveLeg(leg.id) : onAddLeg(leg))}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold cursor-pointer shrink-0 ${
                      selected
                        ? 'bg-[#2BD576] text-[#08140D]'
                        : 'bg-slate-900 dark:bg-white/10 text-white hover:bg-[#2BD576] hover:text-[#08140D]'
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{leg.odds.toFixed(2)}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Custom Coupon & AI Audit */}
        <div className="lg:col-span-6 rounded-2xl border border-emerald-500/35 dark:border-[#2BD576]/30 bg-white dark:bg-[#121821] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-[#2BD576]">
                  AI KUPON QİYMƏTLƏNDİRİCİSİ
                </p>
                <h2 className="mt-0.5 font-display text-2xl font-extrabold text-slate-950 dark:text-white">
                  Sənin Kuponun ({customLegs.length} oyun)
                </h2>
              </div>
              {customLegs.length > 0 && (
                <button
                  type="button"
                  onClick={onClearCustomCoupon}
                  className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
                >
                  Təmizlə
                </button>
              )}
            </div>

            {customLegs.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-slate-300 dark:border-[#1E2733] p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Soldakı siyahıdan və ya Matç Mərkəzindən seçim əlavə edərək kuponunuzu yoxlayın.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {customLegs.map((leg) => {
                    const isWeakest = evaluation.weakestLeg?.id === leg.id;
                    return (
                      <div
                        key={leg.id}
                        className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs ${
                          isWeakest
                            ? 'border-[#F5A524]/50 bg-[#F5A524]/10'
                            : 'border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/70'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            {leg.matchLabel}
                            {isWeakest && (
                              <span className="ml-2 rounded bg-[#F5A524] px-1.5 py-0.5 text-[10px] text-white">
                                ƏN ZƏİF BƏND
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {leg.selection} · Model {leg.modelProb}% · Əmsal {leg.odds.toFixed(2)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveLeg(leg.id)}
                          aria-label={`${leg.matchLabel} seçimini sil`}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/15 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Metrics Strip */}
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/70 p-3">
                    <div className="text-[10px] uppercase text-slate-500">Ümumi Əmsal</div>
                    <div className="font-score text-2xl text-slate-950 dark:text-white">
                      {evaluation.combinedOdds.toFixed(2)}x
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/70 p-3">
                    <div className="text-[10px] uppercase text-slate-500">Keçid Ehtimalı</div>
                    <div className="font-score text-2xl text-emerald-600 dark:text-[#2BD576]">
                      {evaluation.combinedProb}%
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/70 p-3">
                    <div className="text-[10px] uppercase text-slate-500">Risk / EV</div>
                    <div className="font-mono text-sm font-bold text-slate-900 dark:text-white mt-1">
                      {evaluation.riskLevelAz} ({evaluation.expectedValuePct >= 0 ? `+${evaluation.expectedValuePct}%` : `${evaluation.expectedValuePct}%`})
                    </div>
                  </div>
                </div>

                {/* AI Verdict + Safer Alternative */}
                <div className="rounded-xl border border-sky-500/30 bg-sky-500/8 p-3.5 text-xs space-y-2">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {evaluation.verdictAz}
                  </p>
                  {evaluation.saferAlternative && evaluation.weakestLeg && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-sky-500/20">
                      <span className="text-slate-700 dark:text-slate-300">
                        Daha təhlükəsiz alternativ:{' '}
                        <strong>
                          {evaluation.saferAlternative.matchLabel} — {evaluation.saferAlternative.selection} @{' '}
                          {evaluation.saferAlternative.odds.toFixed(2)} ({evaluation.saferAlternative.modelProb}%)
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onReplaceLeg(evaluation.weakestLeg!.id, evaluation.saferAlternative!)
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-[#2BD576] px-2.5 py-1 text-[11px] font-bold text-[#08140D] cursor-pointer"
                      >
                        <ArrowRightLeft className="h-3 w-3" />
                        <span>Əvəz et</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Save & Deep AI Audit Controls */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={couponTitle}
                    onChange={(e) => setCouponTitle(e.target.value)}
                    aria-label="Kupon adı"
                    className="flex-1 min-w-[140px] rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14] px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCoupon}
                    className="rounded-xl bg-slate-900 dark:bg-white/10 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-600 cursor-pointer"
                  >
                    Yadda saxla
                  </button>
                  <button
                    type="button"
                    onClick={onAskAiToAuditCoupon}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#2BD576] px-3.5 py-2 text-xs font-bold text-[#08140D] hover:bg-[#24be68] cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>AI ilə Yoxla</span>
                  </button>
                </div>
                {savedNotice && (
                  <p className="text-xs font-semibold text-emerald-600 dark:text-[#2BD576] flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {savedNotice}
                  </p>
                )}
              </div>
            )}
          </div>

          <p className="mt-4 text-[11px] text-slate-500 dark:text-slate-400">
            {MANDATORY_DISCLAIMER_AZ}
          </p>
        </div>
      </div>

      {/* Bankroll Tools: Fractional Kelly + Bet Tracker + P/L Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Fractional Kelly Stake Calculator */}
        <div className="lg:col-span-5 rounded-2xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-[#2BD576]">
            <Calculator className="h-4 w-4" />
            <span>FRAKSİONAL KELLİ (1/4 · MAKS 5% LİMİT)</span>
          </div>
          <h3 className="font-display text-2xl font-extrabold text-slate-950 dark:text-white">
            Məbləğ Tövsiyəsi və Gündəlik Limit
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-slate-600 dark:text-slate-400">
              Ümumi Bankroll (AZN)
              <input
                type="number"
                min={10}
                max={100000}
                value={bankroll}
                onChange={(e) => setBankroll(Math.max(10, Number(e.target.value) || 10))}
                className="mt-1 w-full rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14] px-3 py-2 font-mono text-sm font-bold text-slate-900 dark:text-white"
              />
            </label>
            <label className="text-xs text-slate-600 dark:text-slate-400">
              Gündəlik Zərər Limiti (AZN)
              <input
                type="number"
                min={5}
                max={50000}
                value={dailyLossLimit}
                onChange={(e) => setDailyLossLimit(Math.max(5, Number(e.target.value) || 5))}
                className="mt-1 w-full rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14] px-3 py-2 font-mono text-sm font-bold text-slate-900 dark:text-white"
              />
            </label>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-4">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span>Tövsiyə olunan məbləğ (1/4 Kelli):</span>
              <span className="font-mono font-bold text-emerald-700 dark:text-[#2BD576]">
                {kellyResult.recommendedPct}% bankroll
              </span>
            </div>
            <div className="mt-1 font-score text-4xl text-slate-950 dark:text-white">
              {kellyResult.recommendedStake.toFixed(2)} AZN
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {kellyResult.isPositiveEv
                ? `Gözlənilən dəyər müsbətdir (EV +${kellyResult.expectedValuePct}%). Maksimum 5% təhlükəsizlik tavanı tətbiq edilib.`
                : `Gözlənilən dəyər mənfidir (EV ${kellyResult.expectedValuePct}%). Riyazi olaraq 0 AZN tövsiyə olunur.`}
            </p>
          </div>

          {bankrollStats.limitExceeded && (
            <div
              role="alert"
              className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2"
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>
                Gündəlik zərər limitinə ({dailyLossLimit} AZN) çatdınız. Məsuliyyətli oyun üçün bu
                gün fasilə verin.
              </span>
            </div>
          )}

          {/* Add Bet Tracker Form */}
          <form onSubmit={handleLogBet} className="space-y-2.5 pt-2 border-t border-[#DCE2EA] dark:border-[#1E2733]">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Yeni Qeydiyyat Əlavə Et
            </p>
            <input
              type="text"
              value={betMatch}
              onChange={(e) => setBetMatch(e.target.value)}
              placeholder="Oyun (məs. Qarabağ - Neftçi)"
              aria-label="Oyun adı"
              className="w-full rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14] px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={betSelection}
                onChange={(e) => setBetSelection(e.target.value)}
                placeholder="Seçim"
                aria-label="Seçim"
                className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14] px-2.5 py-2 text-xs text-slate-900 dark:text-white"
              />
              <input
                type="number"
                step="1"
                min={1}
                value={betStake}
                onChange={(e) => setBetStake(Number(e.target.value) || 0)}
                placeholder="AZN"
                aria-label="Məbləğ AZN"
                className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14] px-2.5 py-2 font-mono text-xs text-slate-900 dark:text-white"
              />
              <input
                type="number"
                step="0.05"
                min={1.01}
                value={betOdds}
                onChange={(e) => setBetOdds(Number(e.target.value) || 1.5)}
                placeholder="Əmsal"
                aria-label="Əmsal"
                className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14] px-2.5 py-2 font-mono text-xs text-slate-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-[#2BD576] py-2.5 text-xs font-bold text-[#08140D] hover:bg-[#24be68] cursor-pointer"
            >
              Bankroll İzləyicisinə Əlavə Et
            </button>
          </form>
        </div>

        {/* Right: Profit/Loss Chart & Bet Log */}
        <div className="lg:col-span-7 rounded-2xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-[#F5A524]">
                <Wallet className="h-4 w-4" />
                <span>BANKROLL STATİSTİKASI VƏ MƏNFƏƏT/ZƏRƏR QRAFİKİ</span>
              </div>
              <h3 className="mt-0.5 font-display text-2xl font-extrabold text-slate-950 dark:text-white">
                Tarixçə və Performans
              </h3>
            </div>
            <div className="flex items-center gap-4 text-right font-mono">
              <div>
                <div className="text-[10px] text-slate-500">Xalis Nəticə</div>
                <div
                  className={`text-sm font-bold ${
                    bankrollStats.cumulative >= 0
                      ? 'text-emerald-600 dark:text-[#2BD576]'
                      : 'text-rose-500'
                  }`}
                >
                  {bankrollStats.cumulative >= 0 ? '+' : ''}
                  {bankrollStats.cumulative} AZN
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">Uduş %</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {bankrollStats.winRate}%
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">ROI</div>
                <div className="text-sm font-bold text-sky-600 dark:text-[#F5A524]">
                  {bankrollStats.roi >= 0 ? `+${bankrollStats.roi}%` : `${bankrollStats.roi}%`}
                </div>
              </div>
            </div>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bankrollStats.chartPoints}>
                <defs>
                  <linearGradient id="plGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2BD576" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2BD576" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121821',
                    borderColor: 'rgba(255,255,255,0.15)',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="pl"
                  name="Xalis P/L (AZN)"
                  stroke="#2BD576"
                  strokeWidth={2.5}
                  fill="url(#plGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Logged Bets Table */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {bets.map((b) => (
              <div
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/70 px-3.5 py-2.5 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{b.matchLabel}</div>
                  <div className="font-mono text-[11px] text-slate-500">
                    {b.selection} · {b.stake} AZN @ {b.odds.toFixed(2)}
                  </div>
                </div>
                {b.status === 'pending' ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSettleBet(b.id, 'won')}
                      className="rounded bg-emerald-500/20 px-2 py-1 font-bold text-emerald-600 dark:text-[#2BD576] hover:bg-emerald-500/30 cursor-pointer"
                    >
                      Qazandı
                    </button>
                    <button
                      type="button"
                      onClick={() => onSettleBet(b.id, 'lost')}
                      className="rounded bg-rose-500/20 px-2 py-1 font-bold text-rose-500 hover:bg-rose-500/30 cursor-pointer"
                    >
                      Uduzdu
                    </button>
                  </div>
                ) : (
                  <span
                    className={`rounded px-2 py-0.5 font-mono text-[11px] font-bold uppercase ${
                      b.status === 'won'
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-[#2BD576]'
                        : b.status === 'lost'
                        ? 'bg-rose-500/20 text-rose-500'
                        : 'bg-slate-500/20 text-slate-400'
                    }`}
                  >
                    {b.status === 'won' ? 'QAZANDI' : b.status === 'lost' ? 'UDUZDU' : 'LƏĞV'}
                  </span>
                )}
              </div>
            ))}
            {bets.length === 0 && (
              <p className="text-center text-xs text-slate-500 py-4">
                Hələ bankroll qeydiyyatı yoxdur. Soldakı formadan əlavə edin.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
