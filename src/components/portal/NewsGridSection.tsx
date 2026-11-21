import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Newspaper } from 'lucide-react';
import type { PlatformNewsArticle } from '../../types/platform';

interface NewsGridSectionProps {
  articles: PlatformNewsArticle[];
  loading: boolean;
}

function formatPublishedDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('az-AZ', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const NewsGridSection: React.FC<NewsGridSectionProps> = ({ articles, loading }) => {
  const [selectedLeague, setSelectedLeague] = useState<string>('Hamısı');

  const categories = useMemo(() => {
    const unique = Array.from(new Set(articles.map((a) => a.league)));
    return ['Hamısı', ...unique];
  }, [articles]);

  const filteredNews = useMemo(() => {
    if (selectedLeague === 'Hamısı') return articles;
    return articles.filter((a) => a.league === selectedLeague);
  }, [articles, selectedLeague]);

  const featured = filteredNews[0];
  const secondary = filteredNews.slice(1, 6);

  return (
    <section id="xeberler" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#168A4A] dark:text-[#2BD576]">
            REDƏKSİYA & XƏBƏR LENTİ
          </p>
          <h2 className="mt-1 font-display text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-[#111827] dark:text-[#F3F6FA]">
            Əsas Futbol Xəbərləri
          </h2>
        </div>

        {categories.length > 1 && (
          <div
            role="tablist"
            aria-label="Xəbər kateqoriyaları"
            className="flex items-center gap-1.5 overflow-x-auto pb-1"
          >
            {categories.map((cat) => {
              const active = selectedLeague === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedLeague(cat)}
                  className={`min-h-[36px] rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'border-[#111827] dark:border-[#F3F6FA] bg-[#111827] dark:bg-[#F3F6FA] text-white dark:text-[#0B0F14]'
                      : 'border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] text-[#475569] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F3F6FA]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {loading && articles.length === 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7 h-96 animate-pulse rounded-xl bg-[#E2E7EE] dark:bg-[#171F2B]" />
          <div className="lg:col-span-5 space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-20 animate-pulse rounded-xl bg-[#E2E7EE] dark:bg-[#171F2B]"
              />
            ))}
          </div>
        </div>
      ) : featured ? (
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Asymmetric Editorial Lead Story */}
          <a
            href={featured.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`group flex flex-col overflow-hidden rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] text-left transition-colors hover:border-[#94A3B8] dark:hover:border-[#334155] ${
              secondary.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12'
            }`}
          >
            <div className="relative h-60 sm:h-72 w-full overflow-hidden bg-[#171F2B]">
              {featured.imageUrl ? (
                <img
                  src={featured.imageUrl}
                  alt={featured.headline}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[#64748B]">
                  <Newspaper className="h-10 w-10" strokeWidth={1.5} />
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
              <div>
                <div className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.1em]">
                  <span className="font-semibold text-[#168A4A] dark:text-[#2BD576]">
                    {featured.league}
                  </span>
                  <span className="text-[#64748B]">/</span>
                  <span className="text-[#64748B]">
                    {formatPublishedDate(featured.publishedIso)}
                  </span>
                </div>

                <h3 className="mt-2.5 font-display text-2xl sm:text-4xl font-bold leading-[1.08] tracking-tight text-[#111827] dark:text-[#F3F6FA] group-hover:text-[#168A4A] dark:group-hover:text-[#2BD576] transition-colors">
                  {featured.headline}
                </h3>

                {featured.description && (
                  <p className="mt-3 text-sm leading-relaxed text-[#475569] dark:text-[#94A3B8] line-clamp-3">
                    {featured.description}
                  </p>
                )}
              </div>

              <div className="mt-5 inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-[#111827] dark:text-[#F3F6FA] group-hover:text-[#168A4A] dark:group-hover:text-[#2BD576]">
                <span>Mənbədə oxu</span>
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
              </div>
            </div>
          </a>

          {/* Right Column: Hairline Editorial Wire List */}
          {secondary.length > 0 && (
            <div className="lg:col-span-5 overflow-hidden rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] divide-y divide-[#DCE2EA] dark:divide-[#1E2733]">
              {secondary.map((story) => (
                <a
                  key={story.id}
                  href={story.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3.5 p-4 text-left transition-colors hover:bg-[#F8FAFC] dark:hover:bg-[#171F2B]"
                >
                  <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md bg-[#EEF1F5] dark:bg-[#171F2B] border border-[#DCE2EA] dark:border-[#1E2733]">
                    {story.imageUrl ? (
                      <img
                        src={story.imageUrl}
                        alt={story.headline}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#64748B]">
                        <Newspaper className="h-5 w-5" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em]">
                      <span className="font-semibold text-[#168A4A] dark:text-[#2BD576]">
                        {story.league}
                      </span>
                      <span className="text-[#64748B] truncate">
                        {formatPublishedDate(story.publishedIso)}
                      </span>
                    </div>
                    <h3 className="mt-1 text-sm font-semibold leading-snug text-[#111827] dark:text-[#F3F6FA] group-hover:text-[#168A4A] dark:group-hover:text-[#2BD576] transition-colors line-clamp-2">
                      {story.headline}
                    </h3>
                  </div>
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 text-[#64748B] group-hover:text-[#168A4A] dark:group-hover:text-[#2BD576]"
                    strokeWidth={1.5}
                  />
                </a>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-[#CBD5E1] dark:border-[#263140] bg-white dark:bg-[#121821] p-8 text-center text-sm text-[#64748B]">
          Canlı xəbər lenti hazırda yenilənir.
        </div>
      )}
    </section>
  );
};
