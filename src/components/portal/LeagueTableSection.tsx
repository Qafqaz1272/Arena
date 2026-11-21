import React, { useEffect, useState } from 'react';
import type { PlatformStandingsLeague } from '../../types/platform';
import { formatGoalDifference } from '../../utils/portalLogic';
import { ClubLogo } from '../platform/ClubLogo';
import { FormSparkline } from '../editorial/SportsViz';

interface LeagueTableSectionProps {
  standings: PlatformStandingsLeague[];
  loading: boolean;
}

export const LeagueTableSection: React.FC<LeagueTableSectionProps> = ({
  standings,
  loading,
}) => {
  const [leagueId, setLeagueId] = useState<string>('');

  useEffect(() => {
    if (standings.length > 0 && !standings.some((s) => s.id === leagueId)) {
      setLeagueId(standings[0].id);
    }
  }, [standings, leagueId]);

  const activeLeague = standings.find((l) => l.id === leagueId) ?? standings[0];
  const rows = activeLeague?.table ?? [];
  const totalTeams = rows.length;

  return (
    <section id="cedvel" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#168A4A] dark:text-[#2BD576]">
            TURNİR CƏDVƏLLƏRİ
          </p>
          <h2 className="mt-1 font-display text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-[#111827] dark:text-[#F3F6FA]">
            Liqa Sıralaması
          </h2>
          {activeLeague && (
            <p className="mt-1 font-mono text-xs text-[#64748B]">
              {activeLeague.country} · {activeLeague.name} · Mövsüm {activeLeague.season}
            </p>
          )}
        </div>

        <div
          role="tablist"
          aria-label="Turnir cədvəli liqaları"
          className="flex items-center gap-1.5 overflow-x-auto pb-1"
        >
          {standings.map((league) => {
            const active = league.id === activeLeague?.id;
            return (
              <button
                key={league.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setLeagueId(league.id)}
                className={`min-h-[38px] rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'border-[#111827] dark:border-[#F3F6FA] bg-[#111827] dark:bg-[#F3F6FA] text-white dark:text-[#0B0F14]'
                    : 'border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] text-[#475569] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F3F6FA]'
                }`}
              >
                {league.name}
              </button>
            );
          })}
        </div>
      </div>

      {loading && standings.length === 0 ? (
        <div className="mt-6 overflow-hidden rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] divide-y divide-[#DCE2EA] dark:divide-[#1E2733] bg-white dark:bg-[#121821]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 w-full animate-pulse bg-[#F6F7F9] dark:bg-[#171F2B]/50" />
          ))}
        </div>
      ) : activeLeague ? (
        <div className="mt-6 overflow-hidden rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0E131B] font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">
                  <th className="py-3 pl-4 pr-2 w-12">#</th>
                  <th className="py-3 px-3">Klub</th>
                  <th className="py-3 px-2.5 text-center">O</th>
                  <th className="py-3 px-2.5 text-center">Q</th>
                  <th className="py-3 px-2.5 text-center">H</th>
                  <th className="py-3 px-2.5 text-center">M</th>
                  <th className="py-3 px-2.5 text-center">T-F</th>
                  <th className="py-3 px-3 text-center">Son 5 Forma</th>
                  <th className="py-3 pl-2 pr-5 text-right">Xal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE2EA] dark:divide-[#1E2733]">
                {rows.map((row) => {
                  const zoneBar =
                    row.position <= 4
                      ? 'bg-[#168A4A] dark:bg-[#2BD576]'
                      : row.position <= 6
                      ? 'bg-[#D9880F] dark:bg-[#F5A524]'
                      : totalTeams >= 14 && row.position >= totalTeams - 2
                      ? 'bg-[#DC3B40] dark:bg-[#E5484D]'
                      : 'bg-transparent';
                  const logoUrl = /^\d+$/.test(row.teamId)
                    ? `https://a.espncdn.com/i/teamlogos/soccer/500/${row.teamId}.png`
                    : undefined;

                  return (
                    <tr
                      key={`${activeLeague.id}-${row.teamId}`}
                      className="transition-colors hover:bg-[#F8FAFC] dark:hover:bg-[#171F2B]"
                    >
                      <td className="relative py-2.5 pl-4 pr-2 font-mono text-xs font-semibold tabular-nums text-[#475569] dark:text-[#94A3B8]">
                        <span
                          aria-hidden="true"
                          className={`absolute left-0 top-1.5 bottom-1.5 w-[2px] ${zoneBar}`}
                        />
                        {row.position}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <ClubLogo
                            logoUrl={logoUrl}
                            shortCode={row.code}
                            name={row.teamName}
                            size="sm"
                          />
                          <span className="font-semibold text-[#111827] dark:text-[#F3F6FA]">
                            {row.teamName}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2.5 text-center font-mono text-xs tabular-nums text-[#64748B] dark:text-[#94A3B8]">
                        {row.played}
                      </td>
                      <td className="py-2.5 px-2.5 text-center font-mono text-xs tabular-nums text-[#64748B] dark:text-[#94A3B8]">
                        {row.wins}
                      </td>
                      <td className="py-2.5 px-2.5 text-center font-mono text-xs tabular-nums text-[#64748B] dark:text-[#94A3B8]">
                        {row.draws}
                      </td>
                      <td className="py-2.5 px-2.5 text-center font-mono text-xs tabular-nums text-[#64748B] dark:text-[#94A3B8]">
                        {row.losses}
                      </td>
                      <td className="py-2.5 px-2.5 text-center font-mono text-xs tabular-nums font-medium text-[#111827] dark:text-[#F3F6FA]">
                        {formatGoalDifference(row.goalsFor, row.goalsAgainst)}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex justify-center">
                          <FormSparkline form={row.form} showLetters />
                        </div>
                      </td>
                      <td className="py-2.5 pl-2 pr-5 text-right font-score text-2xl font-bold leading-none tabular-nums text-[#111827] dark:text-[#F3F6FA]">
                        {row.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-5 border-t border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0E131B] px-5 py-3 font-mono text-[11px] text-[#64748B]">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-[2px] bg-[#168A4A] dark:bg-[#2BD576]" />
              <span>İlk 4 · Çempionlar Liqası</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-[2px] bg-[#D9880F] dark:bg-[#F5A524]" />
              <span>Avropa kubokları</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-[2px] bg-[#DC3B40] dark:bg-[#E5484D]" />
              <span>Düşmə zonası</span>
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-[#CBD5E1] dark:border-[#263140] bg-white dark:bg-[#121821] p-8 text-center text-sm text-[#64748B]">
          Canlı turnir cədvəlləri hazırda yenilənir.
        </div>
      )}
    </section>
  );
};
