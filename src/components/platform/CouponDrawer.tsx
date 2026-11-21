import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowRightLeft,
  BookmarkCheck,
  ImageDown,
  MessageSquare,
  ReceiptText,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import {
  evaluateCustomCoupon,
  MANDATORY_DISCLAIMER_AZ,
  type CouponLeg,
} from '../../utils/bettingInsightsEngine';

interface CouponDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  legs: CouponLeg[];
  candidatePool: CouponLeg[];
  onRemoveLeg: (legId: string) => void;
  onReplaceLeg: (oldLegId: string, nextLeg: CouponLeg) => void;
  onClear: () => void;
  onSaveCoupon: (title: string, combinedOdds: number, combinedProb: number) => void;
  onAskAiToAudit: () => void;
}

function downloadCouponImage(
  legs: CouponLeg[],
  combinedProb: number,
  combinedOdds: number,
  riskLevelAz: string
): boolean {
  try {
    const width = 900;
    const rowHeight = 72;
    const height = Math.max(420, 236 + legs.length * rowHeight + 88);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    // Flat editorial deep ink background (#0B0F14)
    ctx.fillStyle = '#0B0F14';
    ctx.fillRect(0, 0, width, height);

    // Subtle pitch-green top rule
    ctx.fillStyle = '#2BD576';
    ctx.fillRect(0, 0, width, 4);

    // Header
    ctx.fillStyle = '#2BD576';
    ctx.font = '600 13px monospace';
    ctx.fillText('ARENA AZ  /  STATİSTİK KUPON TƏHLİLİ', 44, 48);

    ctx.fillStyle = '#F3F6FA';
    ctx.font = '700 32px sans-serif';
    ctx.fillText(`Seçilmiş Kupon (${legs.length} oyun)`, 44, 90);

    // Summary row with 1px hairline border (#1E2733)
    const summaryY = 114;
    const cards = [
      { label: 'ÜMUMİ EHTİMAL', value: `${combinedProb}%`, color: '#2BD576' },
      { label: 'ƏDALƏTLİ ƏMSAL', value: `${combinedOdds.toFixed(2)}x`, color: '#F3F6FA' },
      {
        label: 'RİSK SƏVİYYƏSİ',
        value: riskLevelAz,
        color:
          riskLevelAz === 'Aşağı'
            ? '#2BD576'
            : riskLevelAz === 'Orta'
            ? '#F5A524'
            : '#E5484D',
      },
    ];
    cards.forEach((c, idx) => {
      const x = 44 + idx * 276;
      ctx.fillStyle = '#121821';
      ctx.fillRect(x, summaryY, 260, 66);
      ctx.strokeStyle = '#1E2733';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, summaryY, 260, 66);

      ctx.fillStyle = '#8A97A8';
      ctx.font = '600 11px monospace';
      ctx.fillText(c.label, x + 16, summaryY + 23);

      ctx.fillStyle = c.color;
      ctx.font = '700 24px monospace';
      ctx.fillText(c.value, x + 16, summaryY + 52);
    });

    // Legs rows
    let y = 208;
    legs.forEach((leg) => {
      ctx.fillStyle = '#121821';
      ctx.fillRect(44, y, width - 88, 60);
      ctx.strokeStyle = '#1E2733';
      ctx.strokeRect(44, y, width - 88, 60);

      ctx.fillStyle = '#F3F6FA';
      ctx.font = '600 17px sans-serif';
      ctx.fillText(leg.matchLabel, 60, y + 26);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '13px sans-serif';
      ctx.fillText(`${leg.league} · ${leg.market}: ${leg.selection}`, 60, y + 47);

      ctx.fillStyle = '#2BD576';
      ctx.font = '600 18px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${leg.modelProb}%   @${leg.odds.toFixed(2)}`, width - 60, y + 36);
      ctx.textAlign = 'left';

      y += rowHeight;
    });

    ctx.fillStyle = '#8A97A8';
    ctx.font = '12px sans-serif';
    ctx.fillText(MANDATORY_DISCLAIMER_AZ, 44, height - 30);

    const link = document.createElement('a');
    link.download = `arena-az-kupon-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    return true;
  } catch {
    return false;
  }
}

export const CouponDrawer: React.FC<CouponDrawerProps> = ({
  open,
  onOpenChange,
  legs,
  candidatePool,
  onRemoveLeg,
  onReplaceLeg,
  onClear,
  onSaveCoupon,
  onAskAiToAudit,
}) => {
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const evaluation = useMemo(
    () => evaluateCustomCoupon(legs, candidatePool),
    [legs, candidatePool]
  );

  const riskMeterTier: 'Aşağı' | 'Orta' | 'Yüksək' =
    evaluation.riskLevelAz === 'Aşağı'
      ? 'Aşağı'
      : evaluation.riskLevelAz === 'Orta'
      ? 'Orta'
      : 'Yüksək';

  const riskBarWidth =
    riskMeterTier === 'Aşağı' ? '33%' : riskMeterTier === 'Orta' ? '66%' : '96%';
  const riskFillColor =
    riskMeterTier === 'Aşağı'
      ? 'bg-[#168A4A] dark:bg-[#2BD576]'
      : riskMeterTier === 'Orta'
      ? 'bg-[#D9880F] dark:bg-[#F5A524]'
      : 'bg-[#DC3B40] dark:bg-[#E5484D]';
  const riskTextColor =
    riskMeterTier === 'Aşağı'
      ? 'text-[#147A42] dark:text-[#2BD576]'
      : riskMeterTier === 'Orta'
      ? 'text-[#A5620A] dark:text-[#F5A524]'
      : 'text-[#DC3B40] dark:text-[#E5484D]';

  const handleShareAsImage = () => {
    const ok = downloadCouponImage(
      legs,
      evaluation.combinedProb,
      evaluation.combinedOdds,
      riskMeterTier
    );
    setShareFeedback(ok ? 'Kupon şəkli (PNG) endirildi.' : 'Şəkil yaradıla bilmədi.');
    window.setTimeout(() => setShareFeedback(null), 2800);
  };

  return (
    <>
      {/* Compact Thumb-Friendly Sticky Bar on Mobile (48px height, visible only when picks added) */}
      {legs.length > 0 && !open && (
        <div className="fixed bottom-3 left-3 right-16 sm:left-6 sm:right-auto z-40">
          <button
            type="button"
            onClick={() => onOpenChange(true)}
            className="flex min-h-[48px] w-full sm:w-auto items-center justify-between gap-3 rounded-xl border border-[#2BD576]/45 bg-[#121821] px-3.5 py-2 text-left text-[#F3F6FA] shadow-lg hover:border-[#2BD576] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#2BD576] font-mono text-xs font-bold text-[#08140D] tabular-nums">
                {legs.length}
              </span>
              <div className="min-w-0">
                <div className="text-xs font-semibold leading-tight truncate tabular-nums">
                  Kuponum · <span className="text-[#2BD576]">{evaluation.combinedProb}%</span> ehtimal
                </div>
                <div className="font-mono text-[10px] text-[#94A3B8] tabular-nums">
                  Əmsal {evaluation.combinedOdds.toFixed(2)}x · Risk: {riskMeterTier}
                </div>
              </div>
            </div>
            <span className="rounded-md border border-[#1E2733] bg-[#0B0F14] px-2.5 py-1 text-[11px] font-semibold text-[#F3F6FA] whitespace-nowrap shrink-0">
              Aç →
            </span>
          </button>
        </div>
      )}

      {/* Slide-over Editorial Coupon Slip */}
      <AnimatePresence>
        {open && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="coupon-drawer-title"
            className="fixed inset-0 z-[92] flex justify-end"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={() => onOpenChange(false)}
              className="fixed inset-0 bg-[#0B0F14]/70"
            />

            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] text-[#111827] dark:text-[#F3F6FA]"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2 border-b border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] text-[#168A4A] dark:text-[#2BD576]">
                    <ReceiptText className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                  <div>
                    <h2
                      id="coupon-drawer-title"
                      className="font-display text-2xl font-bold uppercase leading-none text-[#111827] dark:text-[#F3F6FA]"
                    >
                      Kupon Konstruktoru
                    </h2>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748B] tabular-nums">
                      {legs.length} seçim · Yalnız statistik analiz
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  aria-label="Kupon panelini bağla"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] text-[#475569] dark:text-[#94A3B8] cursor-pointer"
                >
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {legs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#CBD5E1] dark:border-[#263140] bg-white dark:bg-[#121821] p-8 text-center">
                    <ReceiptText className="mx-auto h-7 w-7 text-[#64748B]" strokeWidth={1.5} />
                    <p className="mt-3 text-sm font-semibold text-[#111827] dark:text-[#F3F6FA]">
                      Kuponunuz hazırda boşdur
                    </p>
                    <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
                      İstənilən matça toxunub bazar cədvəlindən “Kupona əlavə et” düyməsini sıxın.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Summary KPI Strip */}
                    <div className="grid grid-cols-3 divide-x divide-[#DCE2EA] dark:divide-[#1E2733] rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] text-center">
                      <div className="py-3 px-2">
                        <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#64748B]">
                          Seçim
                        </div>
                        <div className="mt-0.5 font-display text-2xl font-bold text-[#111827] dark:text-[#F3F6FA] tabular-nums">
                          {legs.length}
                        </div>
                      </div>
                      <div className="py-3 px-2">
                        <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#64748B]">
                          Ehtimal
                        </div>
                        <div className="mt-0.5 font-display text-2xl font-bold text-[#168A4A] dark:text-[#2BD576] tabular-nums">
                          {evaluation.combinedProb}%
                        </div>
                      </div>
                      <div className="py-3 px-2">
                        <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#64748B]">
                          Əmsal
                        </div>
                        <div className="mt-0.5 font-display text-2xl font-bold text-[#111827] dark:text-[#F3F6FA] tabular-nums">
                          {evaluation.combinedOdds.toFixed(2)}x
                        </div>
                      </div>
                    </div>

                    {/* Risk Meter */}
                    <div className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-3.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748B]">
                          Risk Ölçəri
                        </span>
                        <span className={riskTextColor}>{riskMeterTier}</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-[2px] bg-[#E2E7EE] dark:bg-[#1E2733]">
                        <div
                          style={{ width: riskBarWidth }}
                          className={`h-full transition-all duration-200 ${riskFillColor}`}
                        />
                      </div>
                      <div className="mt-1.5 flex justify-between font-mono text-[10px] text-[#64748B]">
                        <span>Aşağı</span>
                        <span>Orta</span>
                        <span>Yüksək</span>
                      </div>
                    </div>

                    {/* Correlation Warning */}
                    {evaluation.hasCorrelationWarning && (
                      <div className="flex items-start gap-2 rounded-xl border border-[#F5A524]/40 bg-[#F5A524]/10 p-3 text-xs text-[#334155] dark:text-[#CBD5E1]">
                        <AlertTriangle
                          className="h-4 w-4 shrink-0 mt-0.5 text-[#F5A524]"
                          strokeWidth={1.5}
                        />
                        <span>
                          <strong className="text-[#A5620A] dark:text-[#F5A524]">
                            Korrelyasiya xəbərdarlığı:
                          </strong>{' '}
                          Eyni oyundan bir neçə seçim əlavə olunub; faktiki risk artır.
                        </span>
                      </div>
                    )}

                    {/* Legs List */}
                    <div className="overflow-hidden rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] divide-y divide-[#DCE2EA] dark:divide-[#1E2733]">
                      {legs.map((leg) => {
                        const isWeakest =
                          legs.length > 1 && evaluation.weakestLeg?.id === leg.id;
                        return (
                          <div
                            key={leg.id}
                            className={`p-3.5 transition-colors ${
                              isWeakest ? 'bg-[#E5484D]/[0.07]' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="truncate text-xs font-bold text-[#111827] dark:text-[#F3F6FA]">
                                    {leg.matchLabel}
                                  </span>
                                  {isWeakest && (
                                    <span className="inline-flex items-center gap-1 rounded-[4px] bg-[#E5484D] px-1.5 py-0.5 font-mono text-[9px] font-semibold text-white uppercase">
                                      <ShieldAlert className="h-2.5 w-2.5" strokeWidth={1.5} />
                                      Ən zəif bənd
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 text-xs font-semibold text-[#168A4A] dark:text-[#2BD576]">
                                  {leg.market}: {leg.selection}
                                </div>
                                <div className="mt-1 flex items-center gap-2 font-mono text-[11px] text-[#64748B] tabular-nums">
                                  <span>Ehtimal: {leg.modelProb}%</span>
                                  <span>·</span>
                                  <span>@{leg.odds.toFixed(2)}</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => onRemoveLeg(leg.id)}
                                aria-label={`${leg.matchLabel} seçimini sil`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#64748B] hover:bg-[#E5484D]/10 hover:text-[#E5484D] cursor-pointer shrink-0"
                              >
                                <X className="h-4 w-4" strokeWidth={1.5} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* AI Coupon Audit + Safer Alternative */}
                    <div className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-4 space-y-3">
                      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#168A4A] dark:text-[#2BD576]">
                        AI Kupon Qiymətləndirməsi
                      </div>
                      <p className="text-xs leading-relaxed text-[#334155] dark:text-[#CBD5E1]">
                        {evaluation.verdictAz}
                      </p>

                      {evaluation.weakestLeg && evaluation.saferAlternative && (
                        <div className="rounded-lg border border-[#2BD576]/35 bg-[#2BD576]/[0.06] p-3">
                          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748B]">
                            Daha təhlükəsiz alternativ
                          </div>
                          <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
                            <span className="font-semibold text-[#111827] dark:text-[#F3F6FA] tabular-nums">
                              {evaluation.saferAlternative.selection} (
                              <span className="text-[#168A4A] dark:text-[#2BD576]">
                                {evaluation.saferAlternative.modelProb}%
                              </span>
                              )
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                onReplaceLeg(evaluation.weakestLeg!.id, evaluation.saferAlternative!)
                              }
                              className="inline-flex h-8 items-center gap-1 rounded-md bg-[#168A4A] dark:bg-[#2BD576] px-2.5 text-[11px] font-semibold text-white dark:text-[#08140D] cursor-pointer whitespace-nowrap"
                            >
                              <ArrowRightLeft className="h-3 w-3" strokeWidth={1.5} />
                              <span>Əvəz et</span>
                            </button>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          onOpenChange(false);
                          onAskAiToAudit();
                        }}
                        className="inline-flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] text-xs font-semibold text-[#111827] dark:text-[#F3F6FA] hover:border-[#94A3B8] transition-colors cursor-pointer"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-[#64748B]" strokeWidth={1.5} />
                        <span>AI Çatda ətraflı yoxla</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Footer Actions */}
              <div className="shrink-0 border-t border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] px-5 py-4 space-y-2.5">
                {legs.length > 0 && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onSaveCoupon(
                            `Kuponum (${legs.length} oyun)`,
                            evaluation.combinedOdds,
                            evaluation.combinedProb
                          )
                        }
                        className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg bg-[#168A4A] dark:bg-[#2BD576] px-3 text-xs font-semibold text-white dark:text-[#08140D] hover:opacity-90 cursor-pointer"
                      >
                        <BookmarkCheck className="h-4 w-4" strokeWidth={1.5} />
                        <span>Yadda saxla</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleShareAsImage}
                        className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] px-3 text-xs font-semibold text-[#111827] dark:text-[#F3F6FA] hover:border-[#94A3B8] cursor-pointer"
                      >
                        <ImageDown className="h-4 w-4" strokeWidth={1.5} />
                        <span>Şəkil kimi paylaş</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={onClear}
                      className="inline-flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] text-xs font-medium text-[#DC3B40] dark:text-[#E5484D] hover:bg-[#E5484D]/10 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      <span>Kuponu təmizlə</span>
                    </button>

                    {shareFeedback && (
                      <p className="text-center text-[11px] font-medium text-[#168A4A] dark:text-[#2BD576]">
                        {shareFeedback}
                      </p>
                    )}
                  </>
                )}

                <p className="text-center text-[10px] leading-relaxed text-[#64748B]">
                  {MANDATORY_DISCLAIMER_AZ} Sayt mərc qəbul etmir.
                </p>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
