import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeMultiClassBrier,
  computeMultiClassLogLoss,
  runBacktestEvaluation,
} from './backtestEngine';
import type { PerformanceSummary } from '../types/football';

test('computeMultiClassBrier gives 0 for perfect prediction and ~0.6667 for uniform 1/3', () => {
  assert.equal(computeMultiClassBrier({ home: 1, draw: 0, away: 0 }, 'home'), 0);
  const uniform = computeMultiClassBrier({ home: 1 / 3, draw: 1 / 3, away: 1 / 3 }, 'draw');
  assert.ok(Math.abs(uniform - 0.6667) < 0.001);
});

test('computeMultiClassLogLoss penalizes confident wrong predictions strongly', () => {
  const good = computeMultiClassLogLoss({ home: 0.75, draw: 0.15, away: 0.1 }, 'home');
  const bad = computeMultiClassLogLoss({ home: 0.75, draw: 0.15, away: 0.1 }, 'away');
  assert.ok(good < 0.35);
  assert.ok(bad > 2.2);
});

test('runBacktestEvaluation computes Brier, Log Loss, and calibration bins cleanly', () => {
  const perf: PerformanceSummary = {
    totalEvaluated: 3,
    overallHitRate: 0.67,
    avgBrierScore: 0.21,
    highConfidenceHitRate: 0.75,
    byLeague: [],
    byConfidence: [],
    monthlyTrend: [],
    recentResults: [
      {
        id: 'h1',
        date: '2026-11-10',
        leagueId: 'pl',
        leagueName: 'Premier League',
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        predictedSelection: 'home',
        predictedProb: 0.62,
        confidenceBand: 'high',
        actualResult: 'home',
        actualScore: '2-1',
        hit: true,
        brierScore: 0.144,
      },
      {
        id: 'h2',
        date: '2026-11-11',
        leagueId: 'pl',
        leagueName: 'Premier League',
        homeTeam: 'Liverpool',
        awayTeam: 'Everton',
        predictedSelection: 'home',
        predictedProb: 0.68,
        confidenceBand: 'high',
        actualResult: 'draw',
        actualScore: '1-1',
        hit: false,
        brierScore: 0.46,
      },
      {
        id: 'h3',
        date: '2026-11-12',
        leagueId: 'll',
        leagueName: 'La Liga',
        homeTeam: 'Real Madrid',
        awayTeam: 'Sevilla',
        predictedSelection: 'home',
        predictedProb: 0.71,
        confidenceBand: 'high',
        actualResult: 'home',
        actualScore: '3-0',
        hit: true,
        brierScore: 0.084,
      },
    ],
  };

  const report = runBacktestEvaluation(perf, []);
  assert.equal(report.totalMatches, 3);
  assert.ok(Math.abs(report.hitRate - 2 / 3) < 0.001);
  assert.ok(report.avgBrierScore > 0 && report.avgBrierScore < 1);
  assert.ok(report.avgLogLoss > 0 && report.avgLogLoss < 2);
  assert.ok(report.calibrationBins.length >= 2);
  assert.equal(report.byLeague.length, 2);

  const plOnly = runBacktestEvaluation(perf, [], 'pl');
  assert.equal(plOnly.totalMatches, 2);
});
