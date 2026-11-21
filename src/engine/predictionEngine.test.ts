import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildScorelineMatrix,
  calibrateThreeWayProbabilities,
  computeAvailabilityImpact,
  computeEloExpected,
  computeFatigueImpact,
  computeH2HEdge,
  computeWeightedFormScore,
  dixonColesTau,
  poissonPmf,
  predictMatch,
} from './predictionEngine';
import type { MatchRecord } from '../types/football';

function createFixtureMatch(overrides?: Partial<MatchRecord>): MatchRecord {
  const base: MatchRecord = {
    id: 'test-match-1',
    leagueId: 'az-pl',
    leagueName: 'Azərbaycan Premyer Liqası',
    country: 'Azerbaijan',
    countryCode: 'AZ',
    kickoffIso: '2026-11-19T18:00:00Z',
    dateKey: '2026-11-19',
    status: 'upcoming',
    venue: 'Tofiq Bəhramov Stadionu',
    leagueAvgHomeGoals: 1.52,
    leagueAvgAwayGoals: 1.15,
    leagueHomeAdvantage: 1.15,
    hasXG: true,
    h2h: [
      {
        date: '2026-04-12',
        homeTeamId: 't-home',
        homeTeamName: 'Qarabağ FK',
        awayTeamId: 't-away',
        awayTeamName: 'Neftçi PFK',
        homeGoals: 2,
        awayGoals: 0,
        competition: 'Azərbaycan Premyer Liqası',
      },
      {
        date: '2025-11-02',
        homeTeamId: 't-away',
        homeTeamName: 'Neftçi PFK',
        awayTeamId: 't-home',
        awayTeamName: 'Qarabağ FK',
        homeGoals: 1,
        awayGoals: 2,
        competition: 'Azərbaycan Premyer Liqası',
      },
    ],
    homeTeam: {
      id: 't-home',
      name: 'Qarabağ FK',
      shortName: 'Qarabağ',
      code: 'QAR',
      country: 'Azerbaijan',
      leagueId: 'az-pl',
      elo: 1740,
      standingsPosition: 1,
      points: 34,
      played: 14,
      wins: 11,
      draws: 1,
      losses: 2,
      goalsFor: 32,
      goalsAgainst: 11,
      xGFor: 29.8,
      xGAgainst: 12.1,
      homeSplit: { played: 7, wins: 6, draws: 1, losses: 0, goalsFor: 18, goalsAgainst: 4, xGFor: 16.9, xGAgainst: 5.1 },
      awaySplit: { played: 7, wins: 5, draws: 0, losses: 2, goalsFor: 14, goalsAgainst: 7, xGFor: 12.9, xGAgainst: 7.0 },
      last10Form: [
        { result: 'W', goalsFor: 3, goalsAgainst: 1, isHome: true, opponent: 'Sabah', date: '2026-11-12' },
        { result: 'W', goalsFor: 2, goalsAgainst: 0, isHome: false, opponent: 'Zirə', date: '2026-11-05' },
        { result: 'W', goalsFor: 2, goalsAgainst: 1, isHome: true, opponent: 'Turan', date: '2026-10-29' },
        { result: 'D', goalsFor: 1, goalsAgainst: 1, isHome: false, opponent: 'Sumqayıt', date: '2026-10-22' },
        { result: 'W', goalsFor: 4, goalsAgainst: 0, isHome: true, opponent: 'Kəpəz', date: '2026-10-15' },
      ],
      absences: [],
      formTrend: [2.2, 2.4, 2.5, 2.4, 2.6, 2.8],
    },
    awayTeam: {
      id: 't-away',
      name: 'Neftçi PFK',
      shortName: 'Neftçi',
      code: 'NEF',
      country: 'Azerbaijan',
      leagueId: 'az-pl',
      elo: 1560,
      standingsPosition: 5,
      points: 20,
      played: 14,
      wins: 5,
      draws: 5,
      losses: 4,
      goalsFor: 17,
      goalsAgainst: 16,
      xGFor: 16.2,
      xGAgainst: 17.4,
      homeSplit: { played: 7, wins: 3, draws: 3, losses: 1, goalsFor: 10, goalsAgainst: 6, xGFor: 9.8, xGAgainst: 7.1 },
      awaySplit: { played: 7, wins: 2, draws: 2, losses: 3, goalsFor: 7, goalsAgainst: 10, xGFor: 6.4, xGAgainst: 10.3 },
      last10Form: [
        { result: 'L', goalsFor: 0, goalsAgainst: 2, isHome: false, opponent: 'Sabah', date: '2026-11-11' },
        { result: 'D', goalsFor: 1, goalsAgainst: 1, isHome: true, opponent: 'Zirə', date: '2026-11-04' },
        { result: 'W', goalsFor: 2, goalsAgainst: 1, isHome: true, opponent: 'Araz', date: '2026-10-28' },
        { result: 'L', goalsFor: 1, goalsAgainst: 2, isHome: false, opponent: 'Turan', date: '2026-10-21' },
        { result: 'D', goalsFor: 0, goalsAgainst: 0, isHome: true, opponent: 'Səbail', date: '2026-10-14' },
      ],
      absences: [
        { playerName: 'E. Mahmudov', position: 'MF', reason: 'injury', impact: 'key' },
      ],
      formTrend: [1.4, 1.5, 1.3, 1.4, 1.2, 1.1],
    },
  };
  return { ...base, ...overrides };
}

test('poissonPmf sums to ~1 across k=0..15 and handles edge cases', () => {
  let total = 0;
  for (let k = 0; k <= 15; k += 1) {
    total += poissonPmf(1.65, k);
  }
  assert.ok(Math.abs(total - 1) < 1e-6);
  assert.equal(poissonPmf(0, 0), 1);
  assert.equal(poissonPmf(0, 2), 0);
  assert.equal(poissonPmf(1.5, -1), 0);
});

test('dixonColesTau adjusts 0-0 and 1-1 upwards when rho < 0', () => {
  assert.ok(dixonColesTau(0, 0, 1.3, 1.1, -0.085) > 1);
  assert.ok(dixonColesTau(1, 1, 1.3, 1.1, -0.085) > 1);
  assert.equal(dixonColesTau(3, 1, 1.3, 1.1, -0.085), 1);
});

test('computeEloExpected returns >0.5 for higher Elo and symmetric baseline', () => {
  assert.equal(Number(computeEloExpected(1600, 1600, 0).toFixed(4)), 0.5);
  assert.ok(computeEloExpected(1750, 1550, 55) > 0.75);
  assert.ok(computeEloExpected(1450, 1750, 55) < 0.25);
});

test('computeWeightedFormScore prioritizes recent wins over older wins', () => {
  const recentWins = computeWeightedFormScore([
    { result: 'W', goalsFor: 2, goalsAgainst: 0, isHome: true, opponent: 'A', date: '2026-11-10' },
    { result: 'W', goalsFor: 2, goalsAgainst: 0, isHome: true, opponent: 'B', date: '2026-11-03' },
    { result: 'L', goalsFor: 0, goalsAgainst: 2, isHome: false, opponent: 'C', date: '2026-10-27' },
    { result: 'L', goalsFor: 0, goalsAgainst: 2, isHome: false, opponent: 'D', date: '2026-10-20' },
  ]);
  const olderWins = computeWeightedFormScore([
    { result: 'L', goalsFor: 0, goalsAgainst: 2, isHome: false, opponent: 'A', date: '2026-11-10' },
    { result: 'L', goalsFor: 0, goalsAgainst: 2, isHome: false, opponent: 'B', date: '2026-11-03' },
    { result: 'W', goalsFor: 2, goalsAgainst: 0, isHome: true, opponent: 'C', date: '2026-10-27' },
    { result: 'W', goalsFor: 2, goalsAgainst: 0, isHome: true, opponent: 'D', date: '2026-10-20' },
  ]);
  assert.ok(recentWins > olderWins);
});

test('computeH2HEdge applies Bayesian shrinkage for small sample sizes', () => {
  const oneWin = computeH2HEdge(
    [
      {
        date: '2026-01-01',
        homeTeamId: 'h',
        homeTeamName: 'H',
        awayTeamId: 'a',
        awayTeamName: 'A',
        homeGoals: 2,
        awayGoals: 0,
        competition: 'Cup',
      },
    ],
    'h'
  );
  assert.ok(oneWin.edge > 0 && oneWin.edge < 0.25);
});

test('calibrateThreeWayProbabilities sums to 1 and prevents 100% certainty claims', () => {
  const extreme = calibrateThreeWayProbabilities(0.99, 0.005, 0.005);
  assert.ok(Math.abs(extreme.home + extreme.draw + extreme.away - 1) < 1e-6);
  assert.ok(extreme.home <= 0.86);
  assert.ok(extreme.away >= 0.03);
});

test('buildScorelineMatrix normalizes to 1.0', () => {
  const matrix = buildScorelineMatrix(1.8, 1.1);
  const sum = matrix.reduce((acc, s) => acc + s.probability, 0);
  assert.ok(Math.abs(sum - 1) < 1e-6);
});

test('predictMatch produces coherent, calibrated output and transparent factor weights', () => {
  const match = createFixtureMatch();
  const pred = predictMatch(match);

  const sum1x2 = pred.homeWinProb + pred.drawProb + pred.awayWinProb;
  assert.ok(Math.abs(sum1x2 - 1) < 0.002);
  assert.ok(Math.abs(pred.over25Prob + pred.under25Prob - 1) < 0.002);
  assert.ok(Math.abs(pred.bttsYesProb + pred.bttsNoProb - 1) < 0.002);

  // Stronger home favorite (Qarabağ) should have clearly higher home win probability
  assert.ok(pred.homeWinProb > pred.awayWinProb);
  assert.equal(pred.topOutcome.selection, 'home');

  // Factor weights must sum to exactly 100%
  const weightSum = pred.factors.reduce((acc, f) => acc + f.weight, 0);
  assert.equal(weightSum, 100);
  assert.equal(pred.topScorelines.length, 5);
  assert.ok(pred.uncertaintyMargin > 0.03 && pred.uncertaintyMargin < 0.12);
});

test('key player absences lower team expected goals and win probability', () => {
  const healthy = createFixtureMatch();
  const injured = createFixtureMatch({
    homeTeam: {
      ...healthy.homeTeam,
      absences: [
        { playerName: 'Striker 1', position: 'FW', reason: 'injury', impact: 'key' },
        { playerName: 'Defender 1', position: 'DF', reason: 'suspension', impact: 'key' },
        { playerName: 'Keeper 1', position: 'GK', reason: 'injury', impact: 'key' },
      ],
    },
  });

  const healthyPred = predictMatch(healthy);
  const injuredPred = predictMatch(injured);

  assert.ok(injuredPred.expectedGoals.home < healthyPred.expectedGoals.home);
  assert.ok(injuredPred.homeWinProb < healthyPred.homeWinProb);
  assert.ok(computeAvailabilityImpact(injured.homeTeam.absences).keyCount === 3);
});

test('predictMatch adjusts probabilities and scoreline floors dynamically for live matches', () => {
  const preMatch = createFixtureMatch({ status: 'upcoming' });
  const prePred = predictMatch(preMatch);

  // Away team unexpectedly leads 0-2 at minute 75
  const liveAwayLeading = createFixtureMatch({
    status: 'live',
    minute: 75,
    score: { home: 0, away: 2 },
  });
  const livePred = predictMatch(liveAwayLeading);

  assert.equal(livePred.isLiveAdjusted, true);
  assert.equal(livePred.liveMinute, 75);
  assert.ok(livePred.remainingExpectedGoals !== undefined);
  assert.ok(livePred.awayWinProb > 0.85, `Expected strong away win prob at 0-2 (75'), got ${livePred.awayWinProb}`);
  assert.ok(livePred.awayWinProb > prePred.awayWinProb);
  assert.ok(Math.abs(livePred.homeWinProb + livePred.drawProb + livePred.awayWinProb - 1) < 0.002);

  // Every predicted final scoreline must be >= current live score (0-2)
  for (const s of livePred.topScorelines) {
    assert.ok(s.homeGoals >= 0 && s.awayGoals >= 2, `Impossible live scoreline ${s.score} for 0-2 game`);
  }
});

test('predictMatch marks Over 2.5 and BTTS as settled when live score already satisfies them', () => {
  const liveHighScoring = createFixtureMatch({
    status: 'live',
    minute: 62,
    score: { home: 2, away: 1 },
  });
  const pred = predictMatch(liveHighScoring);

  assert.equal(pred.over25Prob, 0.99);
  assert.equal(pred.under25Prob, 0.01);
  assert.equal(pred.bttsYesProb, 0.99);
  assert.equal(pred.bttsNoProb, 0.01);
  for (const s of pred.topScorelines) {
    assert.ok(s.homeGoals >= 2 && s.awayGoals >= 1);
  }
});

test('computeFatigueImpact penalizes teams with congested schedule (2-3+ matches in last 7 days)', () => {
  const rested = computeFatigueImpact(
    [
      { result: 'W', goalsFor: 2, goalsAgainst: 0, isHome: true, opponent: 'A', date: '2026-11-10' },
      { result: 'W', goalsFor: 1, goalsAgainst: 0, isHome: false, opponent: 'B', date: '2026-11-01' },
    ],
    '2026-11-19T18:00:00Z'
  );
  const congested = computeFatigueImpact(
    [
      { result: 'W', goalsFor: 2, goalsAgainst: 1, isHome: true, opponent: 'A', date: '2026-11-17' },
      { result: 'D', goalsFor: 1, goalsAgainst: 1, isHome: false, opponent: 'B', date: '2026-11-14' },
      { result: 'W', goalsFor: 3, goalsAgainst: 0, isHome: true, opponent: 'C', date: '2026-11-12' },
    ],
    '2026-11-19T18:00:00Z'
  );

  assert.equal(rested.matchesLast7Days, 0);
  assert.equal(rested.isCongested, false);
  assert.equal(congested.matchesLast7Days, 3);
  assert.equal(congested.isCongested, true);
  assert.ok(congested.totalPenalty > rested.totalPenalty);
});

test('predictMatch includes 7th fatigue_congestion factor and adjusts xG when home team is congested', () => {
  const freshMatch = createFixtureMatch();
  const tiredHomeMatch = createFixtureMatch({
    homeTeam: {
      ...freshMatch.homeTeam,
      last10Form: [
        { result: 'W', goalsFor: 2, goalsAgainst: 1, isHome: true, opponent: 'A', date: '2026-11-17' },
        { result: 'W', goalsFor: 2, goalsAgainst: 0, isHome: false, opponent: 'B', date: '2026-11-15' },
        { result: 'W', goalsFor: 2, goalsAgainst: 1, isHome: true, opponent: 'C', date: '2026-11-13' },
        ...freshMatch.homeTeam.last10Form.slice(3),
      ],
    },
  });

  const freshPred = predictMatch(freshMatch);
  const tiredPred = predictMatch(tiredHomeMatch);

  assert.equal(tiredPred.factors.length, 7);
  const fatigueFactor = tiredPred.factors.find((f) => f.key === 'fatigue_congestion');
  assert.ok(fatigueFactor);
  assert.equal(fatigueFactor.metrics.homeMatches7d, 3);
  assert.ok(fatigueFactor.homeEdge < 0, 'Congested home team should produce negative homeEdge');
  assert.ok(tiredPred.expectedGoals.home < freshPred.expectedGoals.home);
});

