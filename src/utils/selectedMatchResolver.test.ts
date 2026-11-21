import test from 'node:test';
import assert from 'node:assert/strict';
import { predictMatch } from '../engine/predictionEngine.ts';
import type { MatchRecord, MatchWithPrediction } from '../types/football.ts';
import { resolveStickySelectedMatch } from './selectedMatchResolver.ts';

function makeMatch(overrides: Partial<MatchRecord>): MatchWithPrediction {
  const base: MatchRecord = {
    id: 'fd-100',
    leagueId: 'pl',
    leagueName: 'Premier League',
    country: 'England',
    countryCode: 'GB-ENG',
    dateKey: '2026-11-21',
    hasXG: false,
    kickoffIso: '2026-11-21T15:00:00Z',
    venue: 'Etihad Stadium',
    status: 'live',
    minute: 35,
    score: { home: 1, away: 0 },
    leagueAvgHomeGoals: 1.55,
    leagueAvgAwayGoals: 1.25,
    leagueHomeAdvantage: 1.12,
    homeTeam: {
      id: 'h1',
      name: 'Manchester City FC',
      shortName: 'Man City',
      code: 'MCI',
      country: 'England',
      leagueId: 'pl',
      elo: 1960,
      standingsPosition: 2,
      played: 12,
      wins: 9,
      draws: 2,
      losses: 1,
      goalsFor: 28,
      goalsAgainst: 10,
      points: 29,
      formTrend: [3, 3, 1, 3, 3],
      homeSplit: { played: 6, wins: 5, draws: 1, losses: 0, goalsFor: 16, goalsAgainst: 4 },
      awaySplit: { played: 6, wins: 4, draws: 1, losses: 1, goalsFor: 12, goalsAgainst: 6 },
      last10Form: [],
      absences: [],
    },
    awayTeam: {
      id: 'a1',
      name: 'Fulham FC',
      shortName: 'Fulham',
      code: 'FUL',
      country: 'England',
      leagueId: 'pl',
      elo: 1740,
      standingsPosition: 12,
      played: 12,
      wins: 4,
      draws: 4,
      losses: 4,
      goalsFor: 15,
      goalsAgainst: 16,
      points: 16,
      formTrend: [1, 3, 0, 1, 3],
      homeSplit: { played: 6, wins: 3, draws: 2, losses: 1, goalsFor: 9, goalsAgainst: 6 },
      awaySplit: { played: 6, wins: 1, draws: 2, losses: 3, goalsFor: 6, goalsAgainst: 10 },
      last10Form: [],
      absences: [],
    },
    h2h: [],
    ...overrides,
  };
  return { ...base, prediction: predictMatch(base) };
}

test('resolveStickySelectedMatch keeps snapshot when match disappears after provider switch', () => {
  const snapshot = makeMatch({ id: 'fd-100' });
  const unrelatedMatches = [
    makeMatch({
      id: 'espn-999',
      homeTeam: { ...snapshot.homeTeam, name: 'Arsenal FC', shortName: 'Arsenal' },
      awayTeam: { ...snapshot.awayTeam, name: 'Chelsea FC', shortName: 'Chelsea' },
    }),
  ];

  const resolved = resolveStickySelectedMatch('fd-100', snapshot, unrelatedMatches);
  assert.ok(resolved);
  assert.equal(resolved.id, 'fd-100');
  assert.equal(resolved.homeTeam.shortName, 'Man City');
});

test('resolveStickySelectedMatch matches by team names across provider switches while keeping stable id', () => {
  const snapshot = makeMatch({
    id: 'fd-100',
    minute: 35,
    score: { home: 1, away: 0 },
    h2h: [
      {
        date: '2026-04-01',
        homeTeamId: 'h1',
        awayTeamId: 'a1',
        homeTeamName: 'Manchester City',
        awayTeamName: 'Fulham',
        homeGoals: 3,
        awayGoals: 1,
        competition: 'Premier League',
      },
    ],
  });
  const espnMatch = makeMatch({
    id: 'espn-777',
    minute: 52,
    score: { home: 2, away: 0 },
    h2h: [],
  });

  const resolved = resolveStickySelectedMatch('fd-100', snapshot, [espnMatch]);
  assert.ok(resolved);
  assert.equal(resolved.id, 'fd-100');
  assert.equal(resolved.minute, 52);
  assert.equal(resolved.score?.home, 2);
  assert.equal(resolved.h2h.length, 1);
});

test('resolveStickySelectedMatch returns null when selectedMatchId is null', () => {
  const snapshot = makeMatch({ id: 'fd-100' });
  assert.equal(resolveStickySelectedMatch(null, snapshot, [snapshot]), null);
});
