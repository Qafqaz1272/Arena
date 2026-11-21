import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFractionalKelly,
  computeArchiveMetrics,
  detectOddsDrop,
  evaluateCustomCoupon,
  evaluateValueBet,
  generateSmartCoupons,
  MANDATORY_DISCLAIMER_AZ,
  predictMatchDixonColes,
  scoreContestPrediction,
  type ArchivePickItem,
  type CouponLeg,
} from './bettingInsightsEngine';

test('predictMatchDixonColes produces normalized 1X2 probabilities, top scorelines, and 3 Azerbaijani factors', () => {
  const res = predictMatchDixonColes({
    matchId: 'm-qarabag-araz',
    homeName: 'Qarabağ FK',
    awayName: 'Araz-Naxçıvan',
    homeElo: 1790,
    awayElo: 1580,
    homeFormPts: 13,
    awayFormPts: 8,
    homeHomeStrength: 1.15,
    awayAwayStrength: 0.94,
    h2hHomeBias: 0.08,
    homeInjuries: 0,
    awayInjuries: 2,
    homeRestDays: 5,
    awayRestDays: 3,
    homeMotivation: 0.9,
    awayMotivation: 0.7,
  });

  const sum = res.homeWinProb + res.drawProb + res.awayWinProb;
  assert.ok(Math.abs(sum - 100) <= 0.2, `Expected 1X2 sum ~100, got ${sum}`);
  assert.ok(res.homeWinProb > res.awayWinProb, 'Stronger home favorite should have higher win probability');
  assert.equal(res.topScorelines.length, 4);
  assert.equal(res.top3FactorsAz.length, 3);
  assert.equal(res.disclaimerAz, MANDATORY_DISCLAIMER_AZ);
  assert.ok(res.markets.length >= 20, `Expected full multi-market table, got ${res.markets.length}`);
  assert.equal(res.topSafePicks.length, 3);
  assert.ok(res.topPick && res.topPick.prob <= 95);
  assert.ok(res.riskWarningsAz.length >= 1);
  for (const m of res.markets) {
    assert.ok(m.prob <= 95 && m.prob >= 3, `Market ${m.id} prob out of bounds: ${m.prob}`);
    assert.ok(!/zəmanətli|100%/i.test(m.reasonAz), `Forbidden certainty text in ${m.id}`);
  }
});

test('evaluateValueBet flags edge > 5% and rejects non-value picks', () => {
  const value = evaluateValueBet({
    matchId: 'm1',
    matchLabel: 'Qarabağ - Leverkuzen',
    league: 'UEFA Çempionlar Liqası',
    market: '1X2',
    selection: '1 (Qarabağ)',
    modelProb: 52,
    bookmakerOdds: 2.35, // implied 42.6%, edge +9.4%
    confidence: 'Orta',
  });
  assert.equal(value.isValueBet, true);
  assert.ok(value.edgePct > 5);
  assert.ok(value.evPct > 0);

  const nonValue = evaluateValueBet({
    matchId: 'm2',
    matchLabel: 'Arsenal - Liverpul',
    league: 'İngiltərə Premyer Liqası',
    market: '1X2',
    selection: '1 (Arsenal)',
    modelProb: 45,
    bookmakerOdds: 2.1, // implied 47.6%, edge -2.6%
    confidence: 'Orta',
  });
  assert.equal(nonValue.isValueBet, false);
});

test('detectOddsDrop flags sharp-money movement at >= 8% drop', () => {
  const sharp = detectOddsDrop('1', 2.4, 2.15);
  assert.equal(sharp.isSharpDrop, true);
  assert.ok(sharp.dropPct >= 8);

  const normal = detectOddsDrop('1', 2.0, 1.94);
  assert.equal(normal.isSharpDrop, false);
});

test('generateSmartCoupons enforces non-correlated legs across all 4 coupon types', () => {
  const legs: CouponLeg[] = [
    { id: 'l1', matchId: 'm1', matchLabel: 'A - B', league: 'AZPL', market: '1X2', selection: '1', odds: 1.55, modelProb: 71, impliedProb: 64.5, edgePct: 6.5, confidence: 'Yüksək' },
    { id: 'l1b', matchId: 'm1', matchLabel: 'A - B', league: 'AZPL', market: 'Üst/Alt 2.5', selection: 'Üst 2.5', odds: 1.72, modelProb: 66, impliedProb: 58.1, edgePct: 7.9, confidence: 'Yüksək' },
    { id: 'l2', matchId: 'm2', matchLabel: 'C - D', league: 'EPL', market: '1X2', selection: '1', odds: 1.75, modelProb: 64, impliedProb: 57.1, edgePct: 6.9, confidence: 'Yüksək' },
    { id: 'l3', matchId: 'm3', matchLabel: 'E - F', league: 'UCL', market: 'QQ (BTTS)', selection: 'QQ Var', odds: 2.05, modelProb: 56, impliedProb: 48.8, edgePct: 7.2, confidence: 'Orta' },
    { id: 'l4', matchId: 'm4', matchLabel: 'G - H', league: 'La Liqa', market: '1X2', selection: '2', odds: 2.3, modelProb: 49, impliedProb: 43.5, edgePct: 5.5, confidence: 'Orta' },
    { id: 'l5', matchId: 'm5', matchLabel: 'I - J', league: 'AZPL', market: 'Üst/Alt 2.5', selection: 'Üst 2.5', odds: 2.15, modelProb: 53, impliedProb: 46.5, edgePct: 6.5, confidence: 'Orta' },
  ];

  const coupons = generateSmartCoupons(legs);
  assert.equal(coupons.length, 4);
  for (const coupon of coupons) {
    const matchIds = coupon.legs.map((l) => l.matchId);
    assert.equal(new Set(matchIds).size, matchIds.length, `Correlated match detected in ${coupon.id}`);
    assert.equal(coupon.disclaimerAz, MANDATORY_DISCLAIMER_AZ);
  }
});

test('evaluateCustomCoupon detects correlation, identifies weakest leg, and recommends safer alternative', () => {
  const pool: CouponLeg[] = [
    { id: 'l1', matchId: 'm1', matchLabel: 'Qarabağ - Araz', league: 'AZPL', market: '1X2', selection: '1 (Qarabağ)', odds: 1.45, modelProb: 74, impliedProb: 69, edgePct: 5, confidence: 'Yüksək' },
    { id: 'l1-alt', matchId: 'm1', matchLabel: 'Qarabağ - Araz', league: 'AZPL', market: 'Üst/Alt 2.5', selection: 'Üst 2.5', odds: 1.78, modelProb: 60, impliedProb: 56.2, edgePct: 3.8, confidence: 'Orta' },
    { id: 'l2-risky', matchId: 'm2', matchLabel: 'Real - Atletik', league: 'La Liqa', market: '1X2', selection: 'X (Heç-heçə)', odds: 3.8, modelProb: 24, impliedProb: 26.3, edgePct: -2.3, confidence: 'Aşağı' },
    { id: 'l2-safe', matchId: 'm2', matchLabel: 'Real - Atletik', league: 'La Liqa', market: '1X2', selection: '1 (Real)', odds: 1.55, modelProb: 67, impliedProb: 64.5, edgePct: 2.5, confidence: 'Yüksək' },
  ];

  const evalCorr = evaluateCustomCoupon([pool[0], pool[1]], pool);
  assert.equal(evalCorr.hasCorrelationWarning, true);
  assert.deepEqual(evalCorr.correlatedMatchIds, ['m1']);

  const evalWeak = evaluateCustomCoupon([pool[0], pool[2]], pool);
  assert.equal(evalWeak.hasCorrelationWarning, false);
  assert.equal(evalWeak.weakestLeg?.id, 'l2-risky');
  assert.equal(evalWeak.saferAlternative?.id, 'l2-safe');
});

test('calculateFractionalKelly caps stake at 5% and returns 0 for negative EV', () => {
  const pos = calculateFractionalKelly({
    bankroll: 1000,
    modelProbPct: 65,
    decimalOdds: 2.2,
    fraction: 0.25,
    maxCapPct: 5,
  });
  assert.equal(pos.isPositiveEv, true);
  assert.equal(pos.recommendedPct, 5);
  assert.equal(pos.recommendedStake, 50);

  const neg = calculateFractionalKelly({
    bankroll: 1000,
    modelProbPct: 40,
    decimalOdds: 2.0,
  });
  assert.equal(neg.isPositiveEv, false);
  assert.equal(neg.recommendedStake, 0);
});

test('scoreContestPrediction awards 5 for exact, 3 for goal diff, 1 for 1X2, 0 for wrong', () => {
  assert.equal(scoreContestPrediction(2, 1, 2, 1), 5);
  assert.equal(scoreContestPrediction(3, 2, 2, 1), 3);
  assert.equal(scoreContestPrediction(1, 1, 0, 0), 3);
  assert.equal(scoreContestPrediction(3, 0, 2, 1), 1);
  assert.equal(scoreContestPrediction(0, 1, 2, 1), 0);
});

test('computeArchiveMetrics accurately computes Brier score, hit rate, ROI, and includes losses', () => {
  const archive: ArchivePickItem[] = [
    { id: '1', date: '2025-04-15', league: 'AZPL', matchLabel: 'A - B', market: '1X2', selection: '1', odds: 2.0, modelProb: 60, impliedProb: 50, edgePct: 10, resultScore: '2-0', status: 'won' },
    { id: '2', date: '2025-04-16', league: 'AZPL', matchLabel: 'C - D', market: 'Üst/Alt 2.5', selection: 'Üst 2.5', odds: 1.9, modelProb: 55, impliedProb: 52.6, edgePct: 2.4, resultScore: '1-0', status: 'lost' },
    { id: '3', date: '2025-04-17', league: 'UCL', matchLabel: 'E - F', market: '1X2', selection: '1', odds: 2.4, modelProb: 52, impliedProb: 41.7, edgePct: 10.3, resultScore: '3-1', status: 'won' },
  ];

  const metrics = computeArchiveMetrics(archive);
  assert.equal(metrics.totalSettled, 3);
  assert.equal(metrics.wonCount, 2);
  assert.equal(metrics.lostCount, 1);
  assert.equal(metrics.hitRatePct, 66.7);
  assert.ok(metrics.brierScore > 0 && metrics.brierScore < 0.35);
  assert.ok(metrics.roiPct > 0);
});
