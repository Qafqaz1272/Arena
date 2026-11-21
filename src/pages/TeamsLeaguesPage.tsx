import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Language, LeagueStandings } from '../types/football';
import type { TranslationDictionary } from '../i18n/translations';
import { formatCountryName } from '../utils/formatters';
import { FormBadgeStrip, Sparkline, TeamCrest } from '../components/AnalyticsPrimitives';

interface TeamsLeaguesPageProps {
  standings: LeagueStandings[];
  lang: Language;
  t: TranslationDictionary;
}

export const TeamsLeaguesPage: React.FC<TeamsLeaguesPageProps> = ({ standings, lang, t }) => {
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(
    standings[0]?.league.id ?? 'az-pl'
  );

  const activeLeague = useMemo(
    () => standings.find((s) => s.league.id === selectedLeagueId) ?? standings[0],
    [standings, selectedLeagueId]
  );

  if (!activeLeague) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        {t.common.noResults}
      </div>
    );
  }

  const eloChartData = activeLeague.table.map((row) => ({
    team: row.code,
    name: row.teamName,
    elo: row.elo,
    gd: row.goalDifference,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
          {t.teamsLeagues.title}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {t.teamsLeagues.subtitle}
        </p>
      </div>

      {/* League Selector Tabs */}
      <div
        role="tablist"
        aria-label={t.teamsLeagues.selectLeague}
        className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900"
      >
        {standings.map(({ league }) => {
          const active = league.id === activeLeague.league.id;
          return (
            <button
              key={league.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedLeagueId(league.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                active
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              }`}
            >
              {league.name}
            </button>
          );
        })}
      </div>

      {/* Selected League Metadata Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formatCountryName(activeLeague.league.country, lang)} · {activeLeague.league.season}
          </p>
          <p className="mt-1.5 text-base font-semibold text-slate-900 dark:text-slate-50">
            {activeLeague.league.name}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t.teamsLeagues.leagueAvgGoals}
          </p>
          <p className="mt-1.5 font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-50">
            {activeLeague.league.avgHomeGoals.toFixed(2)} / {activeLeague.league.avgAwayGoals.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t.teamsLeagues.homeAdvMultiplier}
          </p>
          <p className="mt-1.5 font-mono text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
            ×{activeLeague.league.homeAdvantageFactor.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Standings Table */}
      <section
        aria-labelledby="standings-table-heading"
        className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
          <h2
            id="standings-table-heading"
            className="text-base font-semibold text-slate-900 dark:text-slate-50"
          >
            {t.teamsLeagues.standingsTitle}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                <th className="py-3 pl-5 pr-2 w-10">{t.teamsLeagues.pos}</th>
                <th className="py-3 px-3">{t.teamsLeagues.team}</th>
                <th className="py-3 px-2 text-right">{t.teamsLeagues.played}</th>
                <th className="py-3 px-2 text-right">{t.teamsLeagues.won}</th>
                <th className="py-3 px-2 text-right">{t.teamsLeagues.drawn}</th>
                <th className="py-3 px-2 text-right">{t.teamsLeagues.lost}</th>
                <th className="py-3 px-2 text-right">{t.teamsLeagues.goals}</th>
                <th className="py-3 px-2 text-right">{t.teamsLeagues.gd}</th>
                <th className="py-3 px-2 text-right">{t.teamsLeagues.xgDiff}</th>
                <th className="py-3 px-2 text-right">Elo</th>
                <th className="py-3 px-3 text-right">{t.teamsLeagues.pts}</th>
                <th className="py-3 px-3">{t.teamsLeagues.form}</th>
                <th className="py-3 pl-2 pr-5 text-right">{t.teamsLeagues.trend}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs tabular-nums dark:divide-slate-800/80">
              {activeLeague.table.map((row) => {
                const xgDiff =
                  row.xGFor !== undefined && row.xGAgainst !== undefined
                    ? row.xGFor - row.xGAgainst
                    : null;
                return (
                  <tr
                    key={row.teamId}
                    className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                  >
                    <td className="py-3 pl-5 pr-2 text-slate-500 dark:text-slate-400">
                      {row.position}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <div className="flex items-center gap-2.5">
                        <TeamCrest code={row.code} size="sm" />
                        <span className="font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {row.teamName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right text-slate-700 dark:text-slate-300">
                      {row.played}
                    </td>
                    <td className="py-3 px-2 text-right text-slate-700 dark:text-slate-300">
                      {row.wins}
                    </td>
                    <td className="py-3 px-2 text-right text-slate-700 dark:text-slate-300">
                      {row.draws}
                    </td>
                    <td className="py-3 px-2 text-right text-slate-700 dark:text-slate-300">
                      {row.losses}
                    </td>
                    <td className="py-3 px-2 text-right text-slate-700 dark:text-slate-300">
                      {row.goalsFor}:{row.goalsAgainst}
                    </td>
                    <td
                      className={`py-3 px-2 text-right font-medium ${
                        row.goalDifference > 0
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : row.goalDifference < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-500'
                      }`}
                    >
                      {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                    </td>
                    <td className="py-3 px-2 text-right text-slate-600 dark:text-slate-400">
                      {xgDiff !== null ? `${xgDiff >= 0 ? '+' : ''}${xgDiff.toFixed(1)}` : '—'}
                    </td>
                    <td className="py-3 px-2 text-right text-slate-700 dark:text-slate-300">
                      {row.elo}
                    </td>
                    <td className="py-3 px-3 text-right text-sm font-bold text-slate-900 dark:text-slate-50">
                      {row.points}
                    </td>
                    <td className="py-3 px-3">
                      <FormBadgeStrip form={row.form} compact />
                    </td>
                    <td className="py-3 pl-2 pr-5">
                      <div className="flex justify-end">
                        <Sparkline values={row.formTrend} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Elo Distribution Chart */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
          {t.teamsLeagues.teamStatsTitle} — Elo
        </h2>
        <div className="mt-4 h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={eloChartData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="team" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis
                domain={['dataMin - 60', 'dataMax + 30']}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="elo" name="Elo" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
};
