import React, { useEffect, useId, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import type { MatchWithPrediction, PredictionFactor } from '../types/football';
import type { TranslationDictionary } from '../i18n/translations';
import { computeFactorConfidenceBreakdown } from '../engine/factorConfidence';

interface FactorTooltipProps {
  factor: PredictionFactor;
  match: MatchWithPrediction;
  t: TranslationDictionary;
}

function formatSignedPts(val: number): string {
  if (val > 0) return `+${val.toFixed(1)}%`;
  if (val < 0) return `${val.toFixed(1)}%`;
  return '0.0%';
}

export const FactorTooltip: React.FC<FactorTooltipProps> = ({
  factor,
  match,
  t,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [placement, setPlacement] = useState<'top' | 'bottom'>('top');
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const tooltipId = useId();

  const open = isPinned || isHovered || isFocused;
  const breakdown = computeFactorConfidenceBreakdown(factor, match);
  const tt = t.matchDetail.factorTooltips;

  const updatePlacement = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // Flip below if less than 290px above the trigger
    setPlacement(rect.top < 290 ? 'bottom' : 'top');
  };

  const handleMouseEnter = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    updatePlacement();
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      setIsHovered(false);
    }, 110);
  };

  const closeAll = () => {
    setIsPinned(false);
    setIsHovered(false);
    setIsFocused(false);
  };

  // Dismiss on Escape or outside pointer interaction
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAll();
    };
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeAll();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const netTone =
    breakdown.netImpactPts > 0.2
      ? 'text-emerald-600 dark:text-emerald-400'
      : breakdown.netImpactPts < -0.2
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-slate-600 dark:text-slate-300';

  const alignmentLabel =
    breakdown.alignment === 'reinforces'
      ? tt.alignmentReinforces
      : breakdown.alignment === 'opposes'
        ? tt.alignmentOpposes
        : tt.alignmentNeutral;

  const alignmentTone =
    breakdown.alignment === 'reinforces'
      ? 'text-emerald-700 dark:text-emerald-400'
      : breakdown.alignment === 'opposes'
        ? 'text-amber-700 dark:text-amber-400'
        : 'text-slate-500 dark:text-slate-400';

  const modifierNote = tt.modifierReasons[breakdown.directModifierReason];

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        onFocus={() => {
          updatePlacement();
          setIsFocused(true);
        }}
        onBlur={(e) => {
          if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            setIsFocused(false);
          }
        }}
        onClick={() => {
          updatePlacement();
          setIsPinned((prev) => !prev);
        }}
        className="group inline-flex items-center gap-1.5 rounded text-left text-sm font-semibold text-slate-900 decoration-slate-400/70 decoration-dotted underline-offset-4 transition-colors hover:text-emerald-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:text-slate-100 dark:hover:text-emerald-400"
      >
        <span>{t.matchDetail.factors[factor.key]}</span>
        <Info
          className={`h-3.5 w-3.5 shrink-0 transition-colors ${
            open
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-400 group-hover:text-emerald-600 dark:text-slate-500 dark:group-hover:text-emerald-400'
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          id={tooltipId}
          role="tooltip"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`absolute left-0 z-40 w-[310px] max-w-[calc(100vw-3rem)] sm:w-[360px] rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xl ring-1 ring-slate-950/5 dark:border-slate-700 dark:bg-slate-900 dark:ring-white/10 ${
            placement === 'top' ? 'bottom-full mb-2.5' : 'top-full mt-2.5'
          }`}
        >
          {/* Tooltip Header */}
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5 dark:border-slate-800">
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-50">
                {t.matchDetail.factors[factor.key]}
              </p>
              <p className={`mt-0.5 text-[11px] font-medium ${alignmentTone}`}>
                {alignmentLabel} · {t.matchDetail.factorWeight} {factor.weight}%
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {tt.confidenceImpact}
              </p>
              <p className={`font-mono text-sm font-bold tabular-nums ${netTone}`}>
                {formatSignedPts(breakdown.netImpactPts)}
              </p>
            </div>
          </div>

          {/* Quantified 2-Part Impact Breakdown */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-slate-950/70">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                {tt.signalImpactLabel}
              </p>
              <p className="mt-0.5 font-mono text-xs font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {formatSignedPts(breakdown.signalImpactPts)}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-slate-950/70">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                {tt.directModifierLabel}
              </p>
              <p
                className={`mt-0.5 font-mono text-xs font-semibold tabular-nums ${
                  breakdown.directModifierPts > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : breakdown.directModifierPts < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {formatSignedPts(breakdown.directModifierPts)}
              </p>
            </div>
          </div>

          {/* Direct Modifier Note */}
          <p className="mt-2 text-[11px] font-medium text-slate-700 dark:text-slate-300">
            {modifierNote}
          </p>

          {/* How This Metric Influences Final Confidence */}
          <p className="mt-2 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
            {tt.explanations[factor.key]}
          </p>

          {/* Live Model Confidence Equation Reference */}
          <div className="mt-3 border-t border-slate-100 pt-2.5 dark:border-slate-800">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">{tt.finalConfidenceLabel}</span>
              <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {breakdown.modelContext.finalConfidence}%
              </span>
            </div>
            <p className="mt-1 font-mono text-[10px] tabular-nums text-slate-500 dark:text-slate-400">
              {tt.formulaPrefix}: {breakdown.modelContext.baseConfidence}% +{' '}
              {breakdown.modelContext.totalSignalPoolPts.toFixed(1)}% +{' '}
              {breakdown.modelContext.totalDataBonusPts}% −{' '}
              {breakdown.modelContext.totalSquadPenaltyPts.toFixed(1)}%
              {breakdown.modelContext.isClamped
                ? ` → max ${breakdown.modelContext.capPct}%`
                : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
