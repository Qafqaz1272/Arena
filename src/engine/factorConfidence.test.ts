import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { predictMatch } from './predictionEngine';
import { computeFactorConfidenceBreakdown } from './factorConfidence';
import type { MatchRecord, MatchWithPrediction } from '../types/football';

function makeMatch(overrides: Partial<MatchRecord> = {}): MatchWithPrediction {
  const base: MatchRecord = {
    id: 'fc-test-1',
    leagueId: 'pl',
    leagueName: 'Premier League',
    country: 'England',
    countryCode: 'GB',
    dateKey: '2026-11-19',
    kickoffIso: '2026-11-19T19:45:00.000Z',
    status: 'upcoming',
    venue: 'Anfield',
    hasXG: true,
    leagueAvgHomeGoals: 1.56,
    leagueAvgAwayGoals: 1.24,
    leagueHomeAdvantage: 1.12,
    h2h: [
      {
        date: '2026-04-10',
        homeTeamId: 'liv',
        homeTeamName: 'Liverpool',
        awayTeamId: 'wol',
        awayTeamName: 'Wolves',
        homeGoals: 3,
        awayGoals: 0,
        competition: 'Premier League',
      },
      {
        date: '2025-11-02',
        homeTeamId: 'wol',
        homeTeamName: 'Wolves',
        awayTeamId: 'liv',
        awayTeamName: 'Liverpool',
        homeGoals: 1,
        awayGoals: 2,
        competition: 'Premier League',
      },
      {
        date: '2025-02-16',
        homeTeamId: 'liv',
        homeTeamName: 'Liverpool',
        awayTeamId: 'wol',
        awayTeamName: 'Wolves',
        homeGoals: 2,
        awayGoals: 1,
        competition: 'Premier League',
      },
    ],
    homeTeam: {
      id: 'liv',
      name: 'Liverpool',
      shortName: 'Liverpool',
      code: 'LIV',
      country: 'England',
      leagueId: 'pl',
      standingsPosition: 1,
      points: 68,
      played: 28,
      wins: 21,
      draws: 5,
      losses: 2,
      goalsFor: 66,
      goalsAgainst: 22,
      xGFor: 62.0,
      xGAgainst: 24.5,
      elo: 1990,
      formTrend: [2.4, 2.5, 2.5, 2.6, 2.7, 2.7],
      last10Form: Array.from({ length: 10 }, (_, i) => ({
        result: i % 4 === 0 ? ('D' as const) : ('W' as const),
        goalsFor: 2,
        goalsAgainst: 0,
        isHome: i % 2 === 0,
        opponent: 'OPP',
        date: `2026-10-${String(10 + i).padStart(2, '0')}`,
      })),
      homeSplit: { played: 14, wins: 12, draws: 2, losses: 0, goalsFor: 38, goalsAgainst: 9, xGFor: 35.2, xGAgainst: 10.4 },
      awaySplit: { played: 14, wins: 9, draws: 3, losses: 2, goalsFor: 28, goalsAgainst: 13, xGFor: 26.8, xGAgainst: 14.1 },
      absences: [],
    },
    awayTeam: {
      id: 'wol',
      name: 'Wolves',
      shortName: 'Wolves',
      code: 'WOL',
      country: 'England',
      leagueId: 'pl',
      standingsPosition: 16,
      points: 26,
      played: 28,
      wins: 7,
      draws: 5,
      losses: 16,
      goalsFor: 29,
      goalsAgainst: 51,
      xGFor: 28.4,
      xGAgainst: 49.0,
      elo: 1680,
      formTrend: [0.8, 0.9, 1.0, 0.7, 0.8, 0.9],
      last10Form: Array.from({ length: 10 }, (_, i) => ({
        result: i % 3 === 0 ? ('D' as const) : ('L' as const),
        goalsFor: 1,
        goalsAgainst: 2,
        isHome: i % 2 === 1,
        opponent: 'OPP',
        date: `2026-10-${String(10 + i).padStart(2, '0')}`,
      })),
      homeSplit: { played: 14, wins: 5, draws: 3, losses: 6, goalsFor: 18, goalsAgainst: 21, xGFor: 17.5, xGAgainst: 20.8 },
      awaySplit: { played: 14, wins: 2, draws: 2, losses: 10, goalsFor: 11, goalsAgainst: 30, xGFor: 10.9, xGAgainst: 28.2 },
      absences: [
        { playerName: 'Matheus Cunha', position: 'FW', reason: 'injury', impact: 'key' },
        { playerName: 'Mario Lemina', position: 'MF', reason: 'suspension', impact: 'key' },
      ],
    },
    ...overrides,
  };

  return {
    ...base,
    prediction: predictMatch(base),
  };
}

describe('computeFactorConfidenceBreakdown', () => {
  it('attributes positive signal and +5 xG bonus to Poisson factor for clear home favorite', () => {
    const match = makeMatch();
    const poisson = match.prediction.factors.find((f) => f.key === 'poisson_attack_defense')!;
    const result = computeFactorConfidenceBreakdown(poisson, match);

    assert.equal(result.alignment, 'reinforces');
    assert.equal(result.directModifierPts, 5);
    assert.equal(result.directModifierReason, 'xg_bonus');
    assert.ok(result.signalImpactPts > 0);
    assert.equal(
      result.netImpactPts,
      Number((result.signalImpactPts + result.directModifierPts).toFixed(1))
    );
    assert.equal(result.modelContext.finalConfidence, match.prediction.confidenceScore);
  });

  it('applies exact -3.5 pts per key absence penalty on squad_availability', () => {
    const match = makeMatch();
    const squad = match.prediction.factors.find((f) => f.key === 'squad_availability')!;
    const result = computeFactorConfidenceBreakdown(squad, match);

    // 2 key absences in awayTeam => -7.0 pts direct confidence uncertainty penalty
    assert.equal(result.directModifierPts, -7);
    assert.equal(result.directModifierReason, 'key_absences_penalty');
    assert.equal(result.modelContext.totalKeyAbsences, 2);
    assert.equal(result.modelContext.totalSquadPenaltyPts, 7);
  });

  it('awards +4 form depth bonus and +2 H2H sample bonus when sample thresholds are met', () => {
    const match = makeMatch();
    const form = match.prediction.factors.find((f) => f.key === 'recent_form')!;
    const h2h = match.prediction.factors.find((f) => f.key === 'head_to_head')!;

    assert.equal(computeFactorConfidenceBreakdown(form, match).directModifierPts, 4);
    assert.equal(computeFactorConfidenceBreakdown(h2h, match).directModifierPts, 2);
  });

  it('removes xG and H2H bonuses when xG is absent and H2H has fewer than 3 meetings', () => {
    const match = makeMatch({ hasXG: false, h2h: [] });
    const poisson = match.prediction.factors.find((f) => f.key === 'poisson_attack_defense')!;
    const h2h = match.prediction.factors.find((f) => f.key === 'head_to_head')!;

    const pRes = computeFactorConfidenceBreakdown(poisson, match);
    const hRes = computeFactorConfidenceBreakdown(h2h, match);

    assert.equal(pRes.directModifierPts, 0);
    assert.equal(pRes.directModifierReason, 'xg_estimated');
    assert.equal(hRes.directModifierPts, 0);
    assert.equal(hRes.directModifierReason, 'h2h_sample_limited');
  });

  it('applies -1.5 pts fatigue congestion modifier when a team played >= 2 matches in 7 days', () => {
    const base = makeMatch();
    const congested = makeMatch({
      homeTeam: {
        ...base.homeTeam,
        last10Form: [
          { result: 'W', goalsFor: 2, goalsAgainst: 0, isHome: true, opponent: 'A', date: '2026-11-17' },
          { result: 'W', goalsFor: 1, goalsAgainst: 0, isHome: false, opponent: 'B', date: '2026-11-14' },
          ...base.homeTeam.last10Form.slice(2),
        ],
      },
    });
    const fatigueFactor = congested.prediction.factors.find((f) => f.key === 'fatigue_congestion')!;
    const res = computeFactorConfidenceBreakdown(fatigueFactor, congested);
    assert.equal(res.directModifierPts, -1.5);
    assert.equal(res.directModifierReason, 'fatigue_congestion_penalty');
  });
});
