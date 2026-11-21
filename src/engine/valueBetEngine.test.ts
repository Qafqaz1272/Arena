import test from 'node:test';
import assert from 'node:assert/strict';
import { computeBookmakerMargin, evaluateValueBet } from './valueBetEngine';

test('evaluateValueBet detects positive EV when model probability exceeds implied probability', () => {
  // Model 52% vs bookmaker odds 2.30 (implied 43.48%) -> EV = 0.52 * 2.30 - 1 = +19.6%
  const res = evaluateValueBet('home', 0.52, 2.3);
  assert.ok(res);
  assert.equal(res.isPositiveEv, true);
  assert.ok(Math.abs(res.evPercent - 19.6) < 0.05);
  assert.ok(Math.abs(res.impliedProb - 1 / 2.3) < 0.001);
  assert.ok(res.quarterKellyPct > 0 && res.quarterKellyPct <= 5);
});

test('evaluateValueBet flags negative EV when bookmaker odds are too short', () => {
  // Model 40% vs odds 2.10 -> EV = 0.40 * 2.10 - 1 = -16%
  const res = evaluateValueBet('away', 0.4, 2.1);
  assert.ok(res);
  assert.equal(res.isPositiveEv, false);
  assert.ok(res.evPercent < 0);
  assert.equal(res.quarterKellyPct, 0);
});

test('evaluateValueBet rejects invalid odds or probabilities', () => {
  assert.equal(evaluateValueBet('home', 0.5, 1.0), null);
  assert.equal(evaluateValueBet('home', 0.5, Number.NaN), null);
  assert.equal(evaluateValueBet('home', 0, 2.2), null);
});

test('computeBookmakerMargin computes vig and de-vigged fair probabilities summing to 1', () => {
  const margin = computeBookmakerMargin(2.1, 3.4, 3.6);
  assert.ok(margin);
  assert.ok(margin.overroundPct > 4 && margin.overroundPct < 6);
  const sum = margin.fairHomeProb + margin.fairDrawProb + margin.fairAwayProb;
  assert.ok(Math.abs(sum - 1) < 0.002);
});
