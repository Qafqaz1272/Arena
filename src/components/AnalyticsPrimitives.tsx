import React from 'react';
import { Info, ShieldAlert } from 'lucide-react';
import type { ConfidenceBand, FormResult } from '../types/football';
import type { TranslationDictionary } from '../i18n/translations';
import { formatConfidenceLabel } from '../i18n/translations';

export const DisclaimerBanner: React.FC<{ text: string }> = ({ text }) => (
  <aside
    aria-label="Disclaimer"
    className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-100/80 px-4 py-3 text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400"
  >
    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden="true" />
    <p>{text}</p>
  </aside>
);

export const DemoModeNotice: React.FC<{ title: string; description: string }> = ({
  title,
  description,
}) => (
  <div
    role="status"
    className="flex items-start gap-3 rounded-lg border border-amber-300/60 bg-amber-50/80 px-4 py-3 text-xs text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200"
  >
    <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
    <div className="space-y-0.5">
      <p className="font-semibold">{title}</p>
      <p className="text-amber-900/80 dark:text-amber-200/80">{description}</p>
    </div>
  </div>
);

export const TeamCrest: React.FC<{ code: string; size?: 'sm' | 'md' | 'lg' }> = ({
  code,
  size = 'sm',
}) => {
  const dims =
    size === 'lg'
      ? 'h-11 w-11 text-sm'
      : size === 'md'
        ? 'h-8 w-8 text-xs'
        : 'h-6 w-6 text-[10px]';

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-100 font-mono font-semibold tracking-tight text-slate-700 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-200 ${dims}`}
    >
      {code.slice(0, 3)}
    </span>
  );
};

export const FormBadgeStrip: React.FC<{
  form: FormResult[];
  compact?: boolean;
}> = ({ form, compact = false }) => {
  return (
    <div className="inline-flex items-center gap-1" aria-label={`Form ${form.join(' ')}`}>
      {form.map((res, idx) => {
        const cls =
          res === 'W'
            ? 'bg-emerald-600/15 text-emerald-700 border-emerald-600/30 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30'
            : res === 'D'
              ? 'bg-slate-200/80 text-slate-700 border-slate-300 dark:bg-slate-700/60 dark:text-slate-300 dark:border-slate-600'
              : 'bg-rose-600/15 text-rose-700 border-rose-600/30 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30';
        const sizeCls = compact ? 'h-5 w-5 text-[10px]' : 'h-6 w-6 text-[11px]';
        return (
          <span
            key={`${res}-${idx}`}
            className={`inline-flex items-center justify-center rounded border font-mono font-semibold ${sizeCls} ${cls}`}
          >
            {res}
          </span>
        );
      })}
    </div>
  );
};

export const ProbabilityBar: React.FC<{
  homeProb: number;
  drawProb: number;
  awayProb: number;
  showLabels?: boolean;
  compact?: boolean;
}> = ({ homeProb, drawProb, awayProb, showLabels = true, compact = false }) => {
  const hPct = Math.round(homeProb * 100);
  const dPct = Math.round(drawProb * 100);
  const aPct = Math.max(0, 100 - hPct - dPct);

  return (
    <div className="w-full space-y-1.5">
      {showLabels && (
        <div className="flex items-center justify-between font-mono text-xs tabular-nums">
          <span className="font-medium text-emerald-700 dark:text-emerald-400">
            1 · {hPct}%
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            X · {dPct}%
          </span>
          <span className="font-medium text-sky-700 dark:text-sky-400">
            2 · {aPct}%
          </span>
        </div>
      )}
      <div
        className={`flex w-full overflow-hidden rounded-sm bg-slate-200 dark:bg-slate-800 ${
          compact ? 'h-1.5' : 'h-2'
        }`}
        role="img"
        aria-label={`Home ${hPct}%, Draw ${dPct}%, Away ${aPct}%`}
      >
        <div
          className="h-full bg-emerald-500 dark:bg-emerald-500 transition-all duration-300"
          style={{ width: `${hPct}%` }}
        />
        <div
          className="h-full bg-slate-400 dark:bg-slate-500 transition-all duration-300"
          style={{ width: `${dPct}%` }}
        />
        <div
          className="h-full bg-sky-500 dark:bg-sky-500 transition-all duration-300"
          style={{ width: `${aPct}%` }}
        />
      </div>
    </div>
  );
};

export const ConfidenceIndicator: React.FC<{
  band: ConfidenceBand;
  score: number;
  t: TranslationDictionary;
}> = ({ band, score, t }) => {
  const color =
    band === 'high'
      ? 'text-emerald-700 dark:text-emerald-400'
      : band === 'medium'
        ? 'text-amber-700 dark:text-amber-400'
        : 'text-slate-600 dark:text-slate-400';

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${color}`}>
      <span>{formatConfidenceLabel(band, t)}</span>
      <span aria-hidden="true" className="text-slate-400 dark:text-slate-600">·</span>
      <span className="font-mono tabular-nums">{score}/100</span>
    </span>
  );
};

export const Sparkline: React.FC<{
  values: number[];
  width?: number;
  height?: number;
}> = ({ values, width = 76, height = 24 }) => {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values, 0.5);
  const max = Math.max(...values, 2.8);
  const range = Math.max(0.1, max - min);
  const pad = 2;

  const points = values.map((v, idx) => {
    const x = pad + (idx / (values.length - 1)) * (width - pad * 2);
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const trendingUp = values[values.length - 1] >= values[0];
  const stroke = trendingUp ? '#10b981' : '#f43f5e';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points.join(' ')}
      />
      <circle
        cx={points[points.length - 1].split(',')[0]}
        cy={points[points.length - 1].split(',')[1]}
        r="2.2"
        fill={stroke}
      />
    </svg>
  );
};

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading">
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-24 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mt-4 h-7 w-16 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-44 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mt-4 h-5 w-48 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mt-6 h-2 w-full rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mt-4 h-3 w-36 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      ))}
    </div>
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-4">
      <div className="h-4 w-44 rounded bg-slate-200 dark:bg-slate-800" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-14 rounded-lg bg-slate-100 dark:bg-slate-800/60" />
      ))}
    </div>
  </div>
);
