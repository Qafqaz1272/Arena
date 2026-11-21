import React from 'react';
import { BookOpen, Info, ShieldAlert } from 'lucide-react';
import type { Language } from '../types/football';
import type { TranslationDictionary } from '../i18n/translations';
import { proTranslations } from '../i18n/proTranslations';
import { DisclaimerBanner } from '../components/AnalyticsPrimitives';

interface ModelTransparencyPageProps {
  lang: Language;
  t: TranslationDictionary;
}

const FACTOR_WEIGHTS = [
  { key: 'poisson_attack_defense' as const, weight: 30 },
  { key: 'elo_rating' as const, weight: 22 },
  { key: 'recent_form' as const, weight: 16 },
  { key: 'home_advantage' as const, weight: 11 },
  { key: 'head_to_head' as const, weight: 7 },
  { key: 'squad_availability' as const, weight: 7 },
  { key: 'fatigue_congestion' as const, weight: 7 },
];

export const ModelTransparencyPage: React.FC<ModelTransparencyPageProps> = ({ lang, t }) => {
  const pt = proTranslations[lang].howItWorks;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
          <BookOpen className="h-6 w-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <span>{pt.title}</span>
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{pt.subtitle}</p>
      </div>

      {/* 7 Weighted Factors Table */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
          {pt.factorsTitle}
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-2.5 pr-4 font-medium">{pt.factorCol}</th>
                <th className="py-2.5 px-3 text-right font-medium w-24">{pt.weightCol}</th>
                <th className="py-2.5 pl-4 font-medium">{pt.methodCol}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {FACTOR_WEIGHTS.map((f) => (
                <tr key={f.key}>
                  <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {t.matchDetail.factors[f.key]}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {f.weight}%
                  </td>
                  <td className="py-3 pl-4 leading-relaxed text-slate-600 dark:text-slate-300">
                    {t.matchDetail.factorTooltips.explanations[f.key]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Calibration & Metrics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-50">
            <Info className="h-4 w-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />
            <span>{pt.calibrationTitle}</span>
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {pt.calibrationBody}
          </p>
          <div className="rounded-lg bg-slate-50 p-3.5 font-mono text-xs text-slate-700 dark:bg-slate-950 dark:text-slate-300 space-y-1">
            <p>P(X = h, Y = a) = Pois(h; λH) · Pois(a; λA) · τ(h, a; ρ = −0.085)</p>
            <p>E_home = 1 / (1 + 10^(−(Elo_H + 45 − Elo_A) / 400))</p>
            <p>EV = (ModelProb × DecimalOdds) − 1</p>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {pt.metricsTitle}
          </h2>
          <ul className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <li>{pt.brierExplain}</li>
            <li>{pt.logLossExplain}</li>
            <li>{pt.evExplain}</li>
          </ul>
        </section>
      </div>

      {/* Limitations */}
      <section className="rounded-xl border border-amber-500/30 bg-amber-50/50 p-6 dark:border-amber-500/25 dark:bg-amber-950/15 space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-50">
          <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <span>{pt.limitationsTitle}</span>
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {pt.limitations.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </section>

      <DisclaimerBanner text={t.common.disclaimer} />
    </div>
  );
};
