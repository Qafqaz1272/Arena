import React, { useMemo, useState } from 'react';
import type { PlatformFormItem } from '../../types/platform';

type FormResult = 'W' | 'D' | 'L';

interface MatchFormStripProps {
  homeTeamName: string;
  homeShort: string;
  homeForm: FormResult[];
  homeLastForm?: PlatformFormItem[];
  awayTeamName: string;
  awayShort: string;
  awayForm: FormResult[];
  awayLastForm?: PlatformFormItem[];
  /** 'embedded' renders a flush hairline band directly below a drawer header; 'card' renders a bordered container */
  variant?: 'embedded' | 'card';
}

interface NormalizedFormEntry {
  result: FormResult;
  opponent?: string;
  score?: string;
  date?: string;
  isHome?: boolean;
}

const RESULT_META: Record<
  FormResult,
  {
    code: FormResult;
    azLabel: string;
    points: number;
    badgeClass: string;
    latestDotClass: string;
  }
> = {
  W: {
    code: 'W',
    azLabel: 'Qələbə',
    points: 3,
    badgeClass:
      'border-[#2BD576]/45 bg-[#2BD576]/14 text-[#147A42] dark:text-[#2BD576]',
    latestDotClass: 'bg-[#168A4A] dark:bg-[#2BD576]',
  },
  D: {
    code: 'D',
    azLabel: 'Heç-heçə',
    points: 1,
    badgeClass:
      'border-[#F5A524]/45 bg-[#F5A524]/14 text-[#A5620A] dark:text-[#F5A524]',
    latestDotClass: 'bg-[#D9880F] dark:bg-[#F5A524]',
  },
  L: {
    code: 'L',
    azLabel: 'Məğlubiyyət',
    points: 0,
    badgeClass:
      'border-[#E5484D]/40 bg-[#E5484D]/12 text-[#C62A2F] dark:text-[#F07175]',
    latestDotClass: 'bg-[#DC3B40] dark:bg-[#E5484D]',
  },
};

function buildEntries(
  fallbackForm: FormResult[],
  detailedForm?: PlatformFormItem[]
): NormalizedFormEntry[] {
  if (detailedForm && detailedForm.length > 0) {
    return detailedForm.slice(-5).map((item) => ({
      result: item.result,
      opponent: item.opponent,
      score: `${item.goalsFor}–${item.goalsAgainst}`,
      date: item.date,
      isHome: item.isHome,
    }));
  }
  const source = fallbackForm.length > 0 ? fallbackForm.slice(-5) : [];
  return source.map((result) => ({ result }));
}

function sumPoints(entries: NormalizedFormEntry[]): number {
  return entries.reduce((acc, item) => acc + RESULT_META[item.result].points, 0);
}

interface TeamFormRowProps {
  teamName: string;
  shortCode: string;
  entries: NormalizedFormEntry[];
  align: 'left' | 'right';
}

const TeamFormRow: React.FC<TeamFormRowProps> = ({
  teamName,
  shortCode,
  entries,
  align,
}) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const points = useMemo(() => sumPoints(entries), [entries]);
  const maxPoints = Math.max(1, entries.length) * 3;
  const isRight = align === 'right';

  return (
    <div
      className={`flex items-center justify-between gap-2.5 ${
        isRight ? 'sm:flex-row-reverse' : ''
      }`}
    >
      {/* Team Code & Points Tally */}
      <div className={`min-w-0 ${isRight ? 'sm:text-right' : 'text-left'}`}>
        <div
          className="truncate text-xs font-semibold text-[#111827] dark:text-[#F3F6FA]"
          title={teamName}
        >
          {shortCode}
        </div>
        <div className="font-mono text-[10px] text-[#64748B] dark:text-[#8A97A8] tabular-nums">
          {entries.length > 0 ? `${points}/${maxPoints} xal` : 'Məlumat yoxdur'}
        </div>
      </div>

      {/* 5 Color-Coded W/D/L Badges */}
      <div
        className="flex items-center gap-1"
        role="list"
        aria-label={`${teamName} son ${entries.length} oyun forması`}
      >
        {entries.length === 0 ? (
          <span className="font-mono text-[10px] text-[#64748B]">—</span>
        ) : (
          entries.map((entry, idx) => {
            const meta = RESULT_META[entry.result];
            const isLatest = idx === entries.length - 1;
            const tooltipText = entry.opponent
              ? `${meta.azLabel} · ${entry.isHome ? 'Ev' : 'Səfər'} vs ${entry.opponent} (${entry.score})`
              : `${meta.azLabel} (${meta.code})${isLatest ? ' · Son oyun' : ''}`;

            return (
              <div key={idx} role="listitem" className="relative flex flex-col items-center">
                <button
                  type="button"
                  onMouseEnter={() => setActiveIdx(idx)}
                  onMouseLeave={() => setActiveIdx(null)}
                  onFocus={() => setActiveIdx(idx)}
                  onBlur={() => setActiveIdx(null)}
                  onClick={() => setActiveIdx((prev) => (prev === idx ? null : idx))}
                  aria-label={`${teamName}: ${tooltipText}`}
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-[5px] border font-mono text-[11px] font-bold leading-none tabular-nums transition-colors cursor-pointer ${meta.badgeClass}`}
                >
                  {meta.code}
                </button>
                {isLatest && (
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 h-[2px] w-3 rounded-full ${meta.latestDotClass}`}
                  />
                )}

                {activeIdx === idx && (
                  <span
                    role="tooltip"
                    className={`pointer-events-none absolute bottom-full z-40 mb-1.5 whitespace-nowrap rounded-md border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] px-2 py-1 font-mono text-[10px] text-[#111827] dark:text-[#F3F6FA] shadow-md ${
                      isRight ? 'right-0' : 'left-0'
                    }`}
                  >
                    {tooltipText}
                    {entry.date ? ` · ${entry.date}` : ''}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export const MatchFormStrip: React.FC<MatchFormStripProps> = ({
  homeTeamName,
  homeShort,
  homeForm,
  homeLastForm,
  awayTeamName,
  awayShort,
  awayForm,
  awayLastForm,
  variant = 'embedded',
}) => {
  const homeEntries = useMemo(
    () => buildEntries(homeForm, homeLastForm),
    [homeForm, homeLastForm]
  );
  const awayEntries = useMemo(
    () => buildEntries(awayForm, awayLastForm),
    [awayForm, awayLastForm]
  );

  const containerClass =
    variant === 'embedded'
      ? 'shrink-0 border-b border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0E131B] px-4 sm:px-6 py-2.5'
      : 'rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] px-4 sm:px-5 py-3';

  return (
    <section aria-label="Komandaların son 5 oyun forması" className={containerClass}>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-4">
        <TeamFormRow
          teamName={homeTeamName}
          shortCode={homeShort}
          entries={homeEntries}
          align="left"
        />

        <div className="hidden sm:flex flex-col items-center justify-center px-2 border-x border-[#DCE2EA] dark:border-[#1E2733]">
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
            FORMA
          </span>
          <span className="font-mono text-[9px] text-[#64748B] tabular-nums">Son 5</span>
        </div>

        <TeamFormRow
          teamName={awayTeamName}
          shortCode={awayShort}
          entries={awayEntries}
          align="right"
        />
      </div>
    </section>
  );
};
