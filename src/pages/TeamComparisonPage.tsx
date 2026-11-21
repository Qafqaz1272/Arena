import React, { useMemo, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  HeadToHeadEntry,
  Language,
  LeagueStandings,
  MatchRecord,
  MatchWithPrediction,
  TeamProfile,
} from '../types/football';
import type { TranslationDictionary } from '../i18n/translations';
import { proTranslations } from '../i18n/proTranslations';
import { predictMatch } from '../engine/predictionEngine';
import { formatPercent, formatShortDate } from '../utils/formatters';
import {
  DisclaimerBanner,
  FormBadgeStrip,
  ProbabilityBar,
  TeamCrest,
} from '../components/AnalyticsPrimitives';

interface TeamComparisonPageProps {
  matches: MatchWithPrediction[];
  standings: LeagueStandings[];
  lang: Language;
  t: TranslationDictionary;
}

function buildTeamDirectory(
  matches: MatchWithPrediction[],
  standings: LeagueStandings[]
): TeamProfile[] {
  const map = new Map<string, TeamProfile>();

  for (const m of matches) {
    if (!map.has(m.homeTeam.id)) map.set(m.homeTeam.id, m.homeTeam);
    if (!map.has(m.awayTeam.id)) map.set(m.awayTeam.id, m.awayTeam);
  }

  for (const ls of standings) {
    for (const row of ls.table) {
      if (map.has(row.teamId)) continue;
      const halfPlayed = Math.max(1, Math.round(row.played / 2));
      map.set(row.teamId, {
        id: row.teamId,
        name: row.teamName,
        shortName: row.teamName,
        code: row.code,
        country: ls.league.country,
        leagueId: ls.league.id,
        elo: row.elo,
        standingsPosition: row.position,
        points: row.points,
        played: Math.max(1, row.played),
        wins: row.wins,
        draws: row.draws,
        losses: row.losses,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        xGFor: row.xGFor,
        xGAgainst: row.xGAgainst,
        homeSplit: {
          played: halfPlayed,
          wins: Math.ceil(row.wins * 0.58),
          draws: Math.floor(row.draws * 0.5),
          losses: Math.max(0, halfPlayed - Math.ceil(row.wins * 0.58) - Math.floor(row.draws * 0.5)),
          goalsFor: Math.round(row.goalsFor * 0.56),
          goalsAgainst: Math.round(row.goalsAgainst * 0.44),
          xGFor: row.xGFor !== undefined ? Number((row.xGFor * 0.56).toFixed(1)) : undefined,
          xGAgainst:
            row.xGAgainst !== undefined ? Number((row.xGAgainst * 0.44).toFixed(1)) : undefined,
        },
        awaySplit: {
          played: Math.max(1, row.played - halfPlayed),
          wins: Math.max(0, row.wins - Math.ceil(row.wins * 0.58)),
          draws: Math.max(0, row.draws - Math.floor(row.draws * 0.5)),
          losses: Math.max(0, row.losses - Math.max(0, halfPlayed - Math.ceil(row.wins * 0.58) - Math.floor(row.draws * 0.5))),
          goalsFor: Math.max(0, row.goalsFor - Math.round(row.goalsFor * 0.56)),
          goalsAgainst: Math.max(0, row.goalsAgainst - Math.round(row.goalsAgainst * 0.44)),
          xGFor: row.xGFor !== undefined ? Number((row.xGFor * 0.44).toFixed(1)) : undefined,
          xGAgainst:
            row.xGAgainst !== undefined ? Number((row.xGAgainst * 0.56).toFixed(1)) : undefined,
        },
        last10Form: row.form.map((res, idx) => ({
          result: res,
          goalsFor: res === 'W' ? 2 : res === 'D' ? 1 : 0,
          goalsAgainst: res === 'W' ? 0 : res === 'D' ? 1 : 2,
          isHome: idx % 2 === 0,
          opponent: 'League',
          date: '',
        })),
        absences: [],
        formTrend: row.formTrend,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.elo - a.elo || a.name.localeCompare(b.name));
}

function computeRatings(team: TeamProfile) {
  const played = Math.max(1, team.played);
  const gfPg = team.goalsFor / played;
  const gaPg = team.goalsAgainst / played;
  const xgfPg = team.xGFor !== undefined ? team.xGFor / played : gfPg;
  const xgaPg = team.xGAgainst !== undefined ? team.xGAgainst / played : gaPg;
  const ppg = team.points / played;
  const winRate = (team.wins / played) * 100;

  // Normalized 0-100 ratings for clear side-by-side comparison
  const attackRating = Math.round(Math.min(99, Math.max(30, 42 + ((gfPg * 0.5 + xgfPg * 0.5) / 2.6) * 52)));
  const defenseRating = Math.round(Math.min(99, Math.max(30, 96 - ((gaPg * 0.5 + xgaPg * 0.5) / 2.4) * 58)));

  return {
    gfPg: Number(gfPg.toFixed(2)),
    gaPg: Number(gaPg.toFixed(2)),
    xgfPg: Number(xgfPg.toFixed(2)),
    xgaPg: Number(xgaPg.toFixed(2)),
    ppg: Number(ppg.toFixed(2)),
    winRate: Number(winRate.toFixed(1)),
    attackRating,
    defenseRating,
  };
}

export const TeamComparisonPage: React.FC<TeamComparisonPageProps> = ({
  matches,
  standings,
  lang,
  t,
}) => {
  const pt = proTranslations[lang].teamCompare;
  const teams = useMemo(() => buildTeamDirectory(matches, standings), [matches, standings]);

  const [teamAId, setTeamAId] = useState<string>(() => teams[0]?.id ?? '');
  const [teamBId, setTeamBId] = useState<string>(() => teams[1]?.id ?? teams[0]?.id ?? '');

  const resolvedA = teams.find((x) => x.id === teamAId) ?? teams[0];
  const resolvedB = teams.find((x) => x.id === teamBId) ?? teams[1] ?? teams[0];

  // Collect any H2H entries from loaded matches involving these two teams
  const h2hList: HeadToHeadEntry[] = useMemo(() => {
    if (!resolvedA || !resolvedB || resolvedA.id === resolvedB.id) return [];
    const found: HeadToHeadEntry[] = [];
    for (const m of matches) {
      const pairMatch =
        (m.homeTeam.id === resolvedA.id && m.awayTeam.id === resolvedB.id) ||
        (m.homeTeam.id === resolvedB.id && m.awayTeam.id === resolvedA.id);
      if (pairMatch) {
        found.push(...m.h2h);
      }
    }
    return found;
  }, [matches, resolvedA, resolvedB]);

  const statsA = resolvedA ? computeRatings(resolvedA) : null;
  const statsB = resolvedB ? computeRatings(resolvedB) : null;

  // Run full 7-factor head-to-head Poisson + Elo simulation
  const simulatedPrediction = useMemo(() => {
    if (!resolvedA || !resolvedB || resolvedA.id === resolvedB.id) return null;
    const synthetic: MatchRecord = {
      id: `sim-${resolvedA.id}-${resolvedB.id}`,
      leagueId: resolvedA.leagueId,
      leagueName: 'Head-to-Head Comparison',
      country: resolvedA.country,
      countryCode: 'EU',
      kickoffIso: new Date().toISOString(),
      dateKey: new Date().toISOString().slice(0, 10),
      status: 'upcoming',
      venue: resolvedA.name,
      homeTeam: resolvedA,
      awayTeam: resolvedB,
      leagueAvgHomeGoals: 1.5,
      leagueAvgAwayGoals: 1.18,
      leagueHomeAdvantage: 1.12,
      h2h: h2hList,
      hasXG: resolvedA.xGFor !== undefined && resolvedB.xGFor !== undefined,
    };
    return predictMatch(synthetic);
  }, [resolvedA, resolvedB, h2hList]);

  if (!resolvedA || !resolvedB || !statsA || !statsB) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        {t.common.noResults}
      </div>
    );
  }

  const sameTeam = resolvedA.id === resolvedB.id;

  const chartData = [
    { metric: pt.goalsPerGame, [resolvedA.shortName]: statsA.gfPg, [resolvedB.shortName]: statsB.gfPg },
    { metric: pt.concededPerGame, [resolvedA.shortName]: statsA.gaPg, [resolvedB.shortName]: statsB.gaPg },
    { metric: pt.xgPerGame, [resolvedA.shortName]: statsA.xgfPg, [resolvedB.shortName]: statsB.xgfPg },
    { metric: pt.xgaPerGame, [resolvedA.shortName]: statsA.xgaPg, [resolvedB.shortName]: statsB.xgaPg },
    { metric: pt.pointsPerGame, [resolvedA.shortName]: statsA.ppg, [resolvedB.shortName]: statsB.ppg },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
          {pt.title}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{pt.subtitle}</p>
      </div>

      {/* Team Selectors */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-11">
          <div className="md:col-span-5 space-y-1.5">
            <label
              htmlFor="compare-team-a"
              className="block text-xs font-medium text-emerald-700 dark:text-emerald-400"
            >
              {pt.teamA}
            </label>
            <select
              id="compare-team-a"
              value={resolvedA.id}
              onChange={(e) => setTeamAId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {teams.map((tm) => (
                <option key={tm.id} value={tm.id}>
                  {tm.name} (Elo {tm.elo})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setTeamAId(resolvedB.id);
                setTeamBId(resolvedA.id);
              }}
              aria-label={pt.swapTeams}
              className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </button>
          </div>

          <div className="md:col-span-5 space-y-1.5">
            <label
              htmlFor="compare-team-b"
              className="block text-xs font-medium text-sky-700 dark:text-sky-400"
            >
              {pt.teamB}
            </label>
            <select
              id="compare-team-b"
              value={resolvedB.id}
              onChange={(e) => setTeamBId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {teams.map((tm) => (
                <option key={tm.id} value={tm.id}>
                  {tm.name} (Elo {tm.elo})
                </option>
              ))}
            </select>
          </div>
        </div>
        {sameTeam && (
          <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">{pt.sameTeamWarning}</p>
        )}
      </section>

      {/* Side-by-Side Profile Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[
          { team: resolvedA, stats: statsA, accent: 'emerald' as const },
          { team: resolvedB, stats: statsB, accent: 'sky' as const },
        ].map(({ team, stats, accent }) => (
          <section
            key={`${accent}-${team.id}`}
            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <TeamCrest code={team.code} size="lg" />
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-slate-900 dark:text-slate-50">
                    {team.name}
                  </h2>
                  <p className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                    #{team.standingsPosition} · Elo {team.elo} · {team.wins}W-{team.draws}D-{team.losses}L
                  </p>
                </div>
              </div>
              <div className="text-right font-mono tabular-nums">
                <p className="text-xs text-slate-500 dark:text-slate-400">{pt.winRate}</p>
                <p
                  className={`text-lg font-bold ${
                    accent === 'emerald'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-sky-700 dark:text-sky-400'
                  }`}
                >
                  {stats.winRate}%
                </p>
              </div>
            </div>

            {/* Attack / Defense Rating Bars */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">{pt.attackRating}</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {stats.attackRating}/100
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-sm bg-slate-100 dark:bg-slate-800">
                  <div
                    className={accent === 'emerald' ? 'h-full bg-emerald-500' : 'h-full bg-sky-500'}
                    style={{ width: `${stats.attackRating}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">{pt.defenseRating}</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {stats.defenseRating}/100
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-sm bg-slate-100 dark:bg-slate-800">
                  <div
                    className={accent === 'emerald' ? 'h-full bg-emerald-500/80' : 'h-full bg-sky-500/80'}
                    style={{ width: `${stats.defenseRating}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Form Strip */}
            <div className="space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{pt.formTitle}</p>
              <FormBadgeStrip form={team.last10Form.slice(0, 10).map((f) => f.result)} />
            </div>
          </section>
        ))}
      </div>

      {/* Metrics Comparison Bar Chart + H2H & Simulation */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-7">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {pt.ratingsTitle}
          </h2>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey={resolvedA.shortName} fill="#10b981" radius={[3, 3, 0, 0]} />
                {!sameTeam && (
                  <Bar dataKey={resolvedB.shortName} fill="#0ea5e9" radius={[3, 3, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Simulated Head-to-Head + H2H List */}
        <div className="space-y-6 lg:col-span-5">
          {simulatedPrediction && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  {pt.simulationTitle}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {pt.neutralVenueNote} · {pt.estimateNote}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/70">
                  <p className="truncate text-[11px] text-slate-500">{resolvedA.shortName}</p>
                  <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {formatPercent(simulatedPrediction.homeWinProb, 1)}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/70">
                  <p className="text-[11px] text-slate-500">{t.common.draw}</p>
                  <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-slate-700 dark:text-slate-200">
                    {formatPercent(simulatedPrediction.drawProb, 1)}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/70">
                  <p className="truncate text-[11px] text-slate-500">{resolvedB.shortName}</p>
                  <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-sky-700 dark:text-sky-400">
                    {formatPercent(simulatedPrediction.awayWinProb, 1)}
                  </p>
                </div>
              </div>
              <ProbabilityBar
                homeProb={simulatedPrediction.homeWinProb}
                drawProb={simulatedPrediction.drawProb}
                awayProb={simulatedPrediction.awayWinProb}
                showLabels={false}
                compact
              />
              <div className="flex items-center justify-between text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
                <span>
                  xG: {simulatedPrediction.expectedGoals.home.toFixed(2)} –{' '}
                  {simulatedPrediction.expectedGoals.away.toFixed(2)}
                </span>
                <span>O2.5: {formatPercent(simulatedPrediction.over25Prob, 0)}</span>
                <span>BTTS: {formatPercent(simulatedPrediction.bttsYesProb, 0)}</span>
              </div>
            </section>
          )}

          <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              {pt.h2hTitle}
            </h2>
            {h2hList.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{pt.noH2H}</p>
            ) : (
              <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/80">
                {h2hList.map((h, i) => (
                  <div
                    key={`${h.date}-${i}`}
                    className="flex items-center justify-between py-2 text-xs"
                  >
                    <span className="font-mono text-slate-500">{formatShortDate(h.date, lang)}</span>
                    <span className="truncate px-2 text-slate-800 dark:text-slate-200">
                      {h.homeTeamName} vs {h.awayTeamName}
                    </span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-50">
                      {h.homeGoals} – {h.awayGoals}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <DisclaimerBanner text={t.common.disclaimer} />
    </div>
  );
};
