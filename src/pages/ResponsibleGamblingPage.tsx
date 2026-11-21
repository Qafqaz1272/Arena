import React from 'react';
import { ExternalLink, HeartHandshake, ShieldCheck } from 'lucide-react';
import type { Language } from '../types/football';
import { proTranslations } from '../i18n/proTranslations';

interface ResponsibleGamblingPageProps {
  lang: Language;
}

export const ResponsibleGamblingPage: React.FC<ResponsibleGamblingPageProps> = ({ lang }) => {
  const pt = proTranslations[lang].responsibleGambling;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
          <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <span>{pt.title}</span>
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{pt.subtitle}</p>
      </div>

      {/* 18+ Compliance Notice */}
      <div className="rounded-xl border border-amber-500/35 bg-amber-50/60 p-4 text-sm font-medium text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/20 dark:text-amber-200">
        {pt.ageNotice}
      </div>

      {/* Core Principles */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
          {pt.principlesTitle}
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {pt.principles.map((p, idx) => (
            <article
              key={idx}
              className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-1.5"
            >
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{p.title}</h3>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Self-Check & Help Resources */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-5 space-y-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {pt.selfCheckTitle}
          </h2>
          <ul className="list-disc space-y-2.5 pl-5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {pt.selfCheckQuestions.map((q, idx) => (
              <li key={idx}>{q}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-7 space-y-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-50">
              <HeartHandshake className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>{pt.helpResourcesTitle}</span>
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {pt.helpResourcesSubtitle}
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {pt.resources.map((res) => (
              <div
                key={res.name}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {res.name}{' '}
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                      · {res.region}
                    </span>
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{res.desc}</p>
                </div>
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-950 dark:text-emerald-400 dark:hover:bg-slate-800"
                >
                  <span>{lang === 'az' ? 'Keçid' : lang === 'ru' ? 'Перейти' : 'Visit'}</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
            ))}
          </div>
        </section>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">{pt.closingNote}</p>
    </div>
  );
};
