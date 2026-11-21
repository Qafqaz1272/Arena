import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, BarChart2, MapPin, MessageSquare } from 'lucide-react';
import type { PlatformMatch } from '../../types/platform';
import { computeCountdownParts } from '../../utils/portalLogic';
import { ClubLogo } from '../platform/ClubLogo';
import { FlipScoreDigit } from './FlipScoreDigit';
import {
  CountUpNumber,
  MinimalPitchDiagram,
  TickProbabilityBar,
} from '../editorial/SportsViz';

interface HeroSectionProps {
  featuredMatch: PlatformMatch | null;
  totalMatches: number;
  liveCount: number;
  valueBetCount: number;
  sourceLabel: string;
  loading: boolean;
  onOpenMatchCenter: (matchId: string) => void;
  onScrollToFixtures: () => void;
  onAskAiAboutMatch: (prompt: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  featuredMatch,
  totalMatches,
  liveCount,
  valueBetCount,
  sourceLabel,
  loading,
  onOpenMatchCenter,
  onScrollToFixtures,
  onAskAiAboutMatch,
}) => {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const kickoffMs = featuredMatch ? new Date(featuredMatch.kickoffIso).getTime() : 0;
  const remainingSeconds =
    featuredMatch && featuredMatch.status === 'UPCOMING' && Number.isFinite(kickoffMs)
      ? Math.max(0, Math.floor((kickoffMs - nowMs) / 1000))
      : 0;
  const countdown = computeCountdownParts(remainingSeconds);

  const todayFormatted = new Date().toLocaleDateString('az-AZ', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const featuredTopPick = featuredMatch?.prediction.topPick;

  return (
    <section className="border-b border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] text-[#111827] dark:text-[#F3F6FA]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left 7 Columns — Asymmetric Editorial Masthead */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[#64748B] dark:text-[#8A97A8]">
                <span className="font-semibold text-[#168A4A] dark:text-[#2BD576]">
                  MATÇ ANALİTİKASI
                </span>
                <span aria-hidden="true">/</span>
                <span>{todayFormatted}</span>
                <span aria-hidden="true">/</span>
                <span className="truncate">{sourceLabel || 'ESPN LIVE'}</span>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="font-display text-4xl sm:text-6xl lg:text-[64px] font-extrabold uppercase leading-[0.98] tracking-[-0.01em] text-[#111827] dark:text-[#F3F6FA]"
              >
                Hər oyunun ən yüksək ehtimallı seçimi bir baxışda
              </motion.h1>

              <p className="max-w-xl text-sm sm:text-base leading-relaxed text-[#475569] dark:text-[#94A3B8]">
                Avropa və dünya liqalarının canlı nəticələri, Dixon-Coles qol matrisi, xG hücum
                balansı və 26 bazar üzrə hesablanmış ehtimallar. Sayt mərc qəbul etmir — yalnız
                şəffaf statistika təqdim edir.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={onScrollToFixtures}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#168A4A] dark:bg-[#2BD576] px-5 py-2.5 text-sm font-semibold text-white dark:text-[#08140D] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
                >
                  <span>Günün Oyunlarına Bax</span>
                  <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </button>

                {featuredMatch && (
                  <button
                    type="button"
                    onClick={() => onOpenMatchCenter(featuredMatch.id)}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] px-4 py-2.5 text-sm font-medium text-[#111827] dark:text-[#F3F6FA] hover:border-[#94A3B8] dark:hover:border-[#334155] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <BarChart2 className="h-4 w-4 text-[#64748B]" strokeWidth={1.5} />
                    <span>Seçilmiş Matçı Aç</span>
                  </button>
                )}
              </div>
            </div>

            {/* Hairline Editorial Metric Strip */}
            <div className="grid grid-cols-3 divide-x divide-[#DCE2EA] dark:divide-[#1E2733] rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821]">
              <div className="px-4 py-3.5">
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#64748B] dark:text-[#8A97A8]">
                  Təhlil Edilən
                </div>
                <div className="mt-1 font-display text-3xl sm:text-4xl font-bold leading-none text-[#111827] dark:text-[#F3F6FA]">
                  {loading && totalMatches === 0 ? '—' : <CountUpNumber value={totalMatches} />}
                </div>
                <div className="mt-1 text-[11px] text-[#64748B] dark:text-[#8A97A8]">
                  real oyun
                </div>
              </div>

              <div className="px-4 py-3.5">
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#64748B] dark:text-[#8A97A8]">
                  Hazırda Canlı
                </div>
                <div className="mt-1 font-display text-3xl sm:text-4xl font-bold leading-none text-[#B4690E] dark:text-[#F5A524]">
                  {loading && totalMatches === 0 ? '—' : <CountUpNumber value={liveCount} />}
                </div>
                <div className="mt-1 text-[11px] text-[#64748B] dark:text-[#8A97A8]">
                  8 san. yenilənmə
                </div>
              </div>

              <div className="px-4 py-3.5">
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#64748B] dark:text-[#8A97A8]">
                  Dəyər Siqnalı
                </div>
                <div className="mt-1 font-display text-3xl sm:text-4xl font-bold leading-none text-[#168A4A] dark:text-[#2BD576]">
                  {loading && totalMatches === 0 ? '—' : <CountUpNumber value={valueBetCount} />}
                </div>
                <div className="mt-1 text-[11px] text-[#64748B] dark:text-[#8A97A8]">
                  +5% model fərqi
                </div>
              </div>
            </div>
          </div>

          {/* Right 5 Columns — Featured Match Analytical Dossier */}
          <div className="lg:col-span-5">
            {loading && !featuredMatch ? (
              <div className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-5 space-y-4 animate-pulse">
                <div className="flex justify-between">
                  <div className="h-4 w-36 rounded bg-[#E2E7EE] dark:bg-[#1E2733]" />
                  <div className="h-4 w-16 rounded bg-[#E2E7EE] dark:bg-[#1E2733]" />
                </div>
                <div className="h-20 rounded-lg bg-[#EEF1F5] dark:bg-[#171F2B]" />
                <div className="h-24 rounded-lg bg-[#EEF1F5] dark:bg-[#171F2B]" />
                <div className="h-14 rounded-lg bg-[#EEF1F5] dark:bg-[#171F2B]" />
              </div>
            ) : featuredMatch ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-5 space-y-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-2 border-b border-[#DCE2EA] dark:border-[#1E2733] pb-3">
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#64748B] dark:text-[#8A97A8]">
                      GÜNÜN SEÇİLMİŞ MATÇI
                    </div>
                    <div className="truncate text-xs font-semibold text-[#111827] dark:text-[#F3F6FA]">
                      {featuredMatch.leagueName}
                    </div>
                  </div>
                  {featuredMatch.status === 'LIVE' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F5A524]/40 bg-[#F5A524]/12 px-2.5 py-1 font-mono text-[11px] font-semibold text-[#A5620A] dark:text-[#F5A524] shrink-0 tabular-nums">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#F5A524]" />
                      CANLI · {featuredMatch.minute}
                    </span>
                  ) : featuredMatch.status === 'FINISHED' ? (
                    <span className="rounded-full border border-[#DCE2EA] dark:border-[#1E2733] px-2.5 py-1 font-mono text-[11px] font-medium text-[#64748B] shrink-0">
                      BİTDİ
                    </span>
                  ) : (
                    <span className="rounded-full border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] px-2.5 py-1 font-mono text-[11px] font-semibold text-[#111827] dark:text-[#F3F6FA] shrink-0 tabular-nums">
                      {featuredMatch.time}
                    </span>
                  )}
                </div>

                {/* Teams & Scoreboard */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div className="flex flex-col items-center text-center gap-2 min-w-0">
                    <ClubLogo
                      logoUrl={featuredMatch.homeLogo}
                      shortCode={featuredMatch.homeShort}
                      name={featuredMatch.homeTeamName}
                      size="lg"
                    />
                    <span className="text-sm font-semibold text-[#111827] dark:text-[#F3F6FA] leading-tight line-clamp-2">
                      {featuredMatch.homeTeamName}
                    </span>
                  </div>

                  <div className="flex flex-col items-center px-2">
                    {featuredMatch.homeScore !== null && featuredMatch.awayScore !== null ? (
                      <div className="flex items-center gap-2 rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] px-3.5 py-1.5">
                        <FlipScoreDigit
                          value={featuredMatch.homeScore}
                          flash={false}
                          className="text-4xl font-bold leading-none text-[#111827] dark:text-[#F3F6FA]"
                        />
                        <span className="font-score text-2xl text-[#64748B]">:</span>
                        <FlipScoreDigit
                          value={featuredMatch.awayScore}
                          flash={false}
                          className="text-4xl font-bold leading-none text-[#111827] dark:text-[#F3F6FA]"
                        />
                      </div>
                    ) : (
                      <div className="rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] px-3.5 py-2 font-mono text-sm font-semibold text-[#64748B]">
                        VS
                      </div>
                    )}
                    {featuredMatch.status === 'UPCOMING' && remainingSeconds > 0 && (
                      <span className="mt-1.5 font-mono text-[11px] text-[#64748B] tabular-nums">
                        {countdown.hours}:{countdown.minutes}:{countdown.seconds}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col items-center text-center gap-2 min-w-0">
                    <ClubLogo
                      logoUrl={featuredMatch.awayLogo}
                      shortCode={featuredMatch.awayShort}
                      name={featuredMatch.awayTeamName}
                      size="lg"
                    />
                    <span className="text-sm font-semibold text-[#111827] dark:text-[#F3F6FA] leading-tight line-clamp-2">
                      {featuredMatch.awayTeamName}
                    </span>
                  </div>
                </div>

                {/* Minimal Architectural Pitch Diagram (xG Pressure) */}
                <MinimalPitchDiagram
                  homeShort={featuredMatch.homeShort}
                  awayShort={featuredMatch.awayShort}
                  homeXg={featuredMatch.prediction.homeXg}
                  awayXg={featuredMatch.prediction.awayXg}
                />

                {/* Single Most Important Number on Screen: Top Təklif */}
                {featuredTopPick && (
                  <div className="rounded-lg border border-[#2BD576]/35 bg-[#2BD576]/[0.06] dark:bg-[#2BD576]/[0.07] p-3.5 space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#147A42] dark:text-[#2BD576]">
                          TOP TƏKLİF · {featuredTopPick.confidence.toUpperCase()} ETİBARLILIQ
                        </div>
                        <div className="mt-0.5 truncate text-sm font-bold text-[#111827] dark:text-[#F3F6FA]">
                          {featuredTopPick.market}: {featuredTopPick.shortLabel}
                        </div>
                      </div>
                      <span className="font-display text-4xl font-extrabold leading-none text-[#168A4A] dark:text-[#2BD576] tabular-nums shrink-0">
                        {featuredTopPick.prob}%
                      </span>
                    </div>
                    <TickProbabilityBar value={featuredTopPick.prob} tone="accent" height="md" />
                    <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-snug">
                      {featuredTopPick.reasonAz}
                    </p>
                  </div>
                )}

                {/* Venue & Actions */}
                <div className="flex items-center justify-between gap-2 text-[11px] text-[#64748B] dark:text-[#8A97A8]">
                  <span className="inline-flex items-center gap-1.5 truncate">
                    <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                    <span className="truncate">{featuredMatch.stadium}</span>
                  </span>
                  <span className="font-mono tabular-nums shrink-0">
                    1:{featuredMatch.prediction.homeWinProb}% · X:{featuredMatch.prediction.drawProb}% · 2:{featuredMatch.prediction.awayWinProb}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onOpenMatchCenter(featuredMatch.id)}
                    className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-[#168A4A] dark:bg-[#2BD576] px-3 py-2 text-xs font-semibold text-white dark:text-[#08140D] hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <span>26 Bazar Analizi</span>
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onAskAiAboutMatch(
                        `${featuredMatch.homeTeamName} - ${featuredMatch.awayTeamName} oyununu analiz et`
                      )
                    }
                    className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] px-3 py-2 text-xs font-semibold text-[#111827] dark:text-[#F3F6FA] hover:border-[#94A3B8] dark:hover:border-[#334155] transition-colors cursor-pointer"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-[#64748B]" strokeWidth={1.5} />
                    <span>AI İzahı</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-6 text-center text-sm text-[#64748B]">
                Canlı matç bazası sinxronlaşdırılır...
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
