import React from 'react';
import type { PlatformMatch } from '../../types/platform';
import type { RecentGoalFlash } from '../../hooks/useLiveScoreStream';
import { ClubLogo } from '../platform/ClubLogo';
import { FlipScoreDigit } from './FlipScoreDigit';

interface LiveScoresTickerProps {
  matches: PlatformMatch[];
  loading: boolean;
  recentGoalFlashes?: Record<string, RecentGoalFlash>;
  onSelectMatch: (matchId: string) => void;
}

export const LiveScoresTicker: React.FC<LiveScoresTickerProps> = ({
  matches,
  loading,
  recentGoalFlashes = {},
  onSelectMatch,
}) => {
  const tickerList = matches
    .filter((m) => m.status === 'LIVE' || m.status === 'UPCOMING' || m.status === 'FINISHED')
    .slice(0, 14);
  const liveCount = matches.filter((m) => m.status === 'LIVE').length;
  const doubled = tickerList.length > 0 ? [...tickerList, ...tickerList] : [];

  return (
    <section
      aria-label="Canlı hesablar lenti"
      className="relative z-30 border-b border-[#DCE2EA] dark:border-[#1E2733] bg-[#EEF1F5] dark:bg-[#0E131B]"
    >
      <div className="mx-auto flex max-w-[1600px] items-center">
        {/* Left Fixed Status Label */}
        <div className="flex shrink-0 items-center gap-2 border-r border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#0B0F14] px-3 sm:px-4 py-2">
          <span className="relative flex h-2 w-2">
            {liveCount > 0 && (
              <span className="animate-live-beacon absolute inline-flex h-full w-full rounded-full bg-[#F5A524]" />
            )}
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                liveCount > 0 ? 'bg-[#F5A524]' : 'bg-[#2BD576]'
              }`}
            />
          </span>
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#111827] dark:text-[#F3F6FA] whitespace-nowrap tabular-nums">
            {liveCount > 0 ? `CANLI · ${liveCount}` : 'MATÇ LENTİ'}
          </span>
        </div>

        {/* Scrolling Hairline Scoreboard Track */}
        <div className="relative flex-1 overflow-hidden py-1.5">
          {loading && tickerList.length === 0 ? (
            <div className="flex items-center gap-2 px-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-7 w-44 shrink-0 animate-pulse rounded-md bg-[#DCE2EA] dark:bg-[#171F2B]"
                />
              ))}
            </div>
          ) : tickerList.length === 0 ? (
            <div className="px-4 font-mono text-[11px] text-[#64748B]">
              Canlı hesablar sinxronlaşdırılır...
            </div>
          ) : (
            <div className="ticker-track gap-2 px-3">
              {doubled.map((m, index) => {
                const goalFlash = recentGoalFlashes[m.id];
                return (
                  <button
                    key={`${m.id}-${index}`}
                    type="button"
                    onClick={() => onSelectMatch(m.id)}
                    aria-label={`${m.homeTeamName} - ${m.awayTeamName}, ${m.minute}`}
                    className={`flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                      goalFlash
                        ? 'border-[#F5A524] bg-[#F5A524]/15'
                        : m.status === 'LIVE'
                        ? 'border-[#F5A524]/40 bg-white dark:bg-[#121821] hover:border-[#F5A524]'
                        : 'border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] hover:border-[#94A3B8] dark:hover:border-[#334155]'
                    }`}
                  >
                    <span
                      className={`font-mono text-[10px] font-semibold uppercase tabular-nums ${
                        goalFlash
                          ? 'rounded-[3px] bg-[#F5A524] px-1.5 py-0.5 text-[#0B0F14]'
                          : m.status === 'LIVE'
                          ? 'text-[#B4690E] dark:text-[#F5A524]'
                          : 'text-[#64748B]'
                      }`}
                    >
                      {goalFlash ? 'QOL' : m.status === 'LIVE' ? m.minute : m.time}
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#111827] dark:text-[#F3F6FA]">
                      <ClubLogo
                        logoUrl={m.homeLogo}
                        shortCode={m.homeShort}
                        name={m.homeTeamName}
                        size="xs"
                      />
                      <span>{m.homeShort}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-[4px] bg-[#EEF1F5] dark:bg-[#0B0F14] px-1.5 py-0.5 font-score text-sm font-bold leading-none text-[#111827] dark:text-[#F3F6FA] tabular-nums">
                      {m.homeScore !== null && m.awayScore !== null ? (
                        <>
                          <FlipScoreDigit
                            value={m.homeScore}
                            flash={goalFlash?.side === 'home'}
                          />
                          <span className="text-[#64748B] text-[10px]">:</span>
                          <FlipScoreDigit
                            value={m.awayScore}
                            flash={goalFlash?.side === 'away'}
                          />
                        </>
                      ) : (
                        <span className="font-mono text-[10px] font-medium text-[#64748B]">–</span>
                      )}
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#111827] dark:text-[#F3F6FA]">
                      <span>{m.awayShort}</span>
                      <ClubLogo
                        logoUrl={m.awayLogo}
                        shortCode={m.awayShort}
                        name={m.awayTeamName}
                        size="xs"
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
