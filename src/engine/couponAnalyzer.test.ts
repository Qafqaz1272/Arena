import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCouponSystemDirective,
  buildDefaultScreenshotPrompt,
  computeAccumulatorMetrics,
  computeImpliedProbability,
  computeOverround,
  estimateTargetOddsProfile,
  sanitizeCouponConcept,
  sanitizeImageAttachments,
} from './couponAnalyzer';

test('computeImpliedProbability and computeOverround calculate exact bookmaker margins', () => {
  assert.equal(computeImpliedProbability(2.0), 0.5);
  assert.equal(computeImpliedProbability(0.8), 0);
  const overround = computeOverround([1.9, 3.4, 4.2]);
  // 1/1.9 + 1/3.4 + 1/4.2 = 0.5263 + 0.2941 + 0.2381 = 1.0585 -> margin ~5.85%
  assert.ok(overround > 0.055 && overround < 0.062);
});

test('computeAccumulatorMetrics multiplies leg odds and probabilities and identifies weakest leg', () => {
  const result = computeAccumulatorMetrics([
    { label: 'Match A - 1X', odds: 1.45, estimatedProb: 0.72 },
    { label: 'Match B - Over 1.5', odds: 1.55, estimatedProb: 0.68 },
    { label: 'Match C - Home Win', odds: 2.1, estimatedProb: 0.51 },
    { label: 'Match D - BTTS Yes', odds: 2.15, estimatedProb: 0.54 },
  ]);

  assert.equal(result.legCount, 4);
  // 1.45 * 1.55 * 2.1 * 2.15 = 10.147 -> 10.15
  assert.equal(result.combinedOdds, 10.15);
  // 0.72 * 0.68 * 0.51 * 0.54 = 0.1348...
  assert.ok(result.combinedProbability > 0.13 && result.combinedProbability < 0.14);
  assert.equal(result.weakestLeg?.label, 'Match C - Home Win');
});

test('estimateTargetOddsProfile provides calibrated 10x coupon benchmark and leg range', () => {
  const profile10x = estimateTargetOddsProfile(10);
  assert.equal(profile10x.targetOdds, 10);
  assert.equal(profile10x.fairNoMarginProbability, 0.1);
  assert.equal(profile10x.riskTier, 'high');
  assert.deepEqual(profile10x.recommendedLegCount, { min: 4, max: 6 });
  assert.ok(profile10x.realisticProbabilityRange.low > 0.04);
  assert.ok(profile10x.realisticProbabilityRange.high < 0.1);

  const profile2x = estimateTargetOddsProfile(2);
  assert.equal(profile2x.riskTier, 'low');
  assert.deepEqual(profile2x.recommendedLegCount, { min: 1, max: 2 });
});

test('sanitizeCouponConcept validates presets and clamps custom odds', () => {
  assert.deepEqual(sanitizeCouponConcept({ preset: 'high_10x' }), {
    preset: 'high_10x',
    targetOdds: 10,
    strategy: 'max_probability',
  });
  assert.deepEqual(sanitizeCouponConcept({ preset: 'custom', targetOdds: 15.5, strategy: 'conservative' }), {
    preset: 'custom',
    targetOdds: 15.5,
    strategy: 'conservative',
  });
  assert.equal(sanitizeCouponConcept({ preset: 'invalid_preset' }), null);
});

test('sanitizeImageAttachments strips data-url prefix, filters invalid mime types, and caps count to 2', () => {
  const validPayload = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const cleaned = sanitizeImageAttachments([
    { mimeType: 'image/png', data: `data:image/png;base64,${validPayload}`, fileName: 'misli-1.png' },
    { mimeType: 'image/gif', data: validPayload, fileName: 'bad.gif' },
    { mimeType: 'image/jpeg', data: validPayload, fileName: 'misli-2.jpg' },
    { mimeType: 'image/webp', data: validPayload, fileName: 'misli-3.webp' },
  ]);

  assert.equal(cleaned.length, 2);
  assert.equal(cleaned[0].mimeType, 'image/png');
  assert.equal(cleaned[0].data, validPayload);
  assert.equal(cleaned[1].mimeType, 'image/jpeg');
});

test('buildCouponSystemDirective includes screenshot OCR rules, 10x target benchmark, and AZ compliance rule', () => {
  const directive = buildCouponSystemDirective(
    { preset: 'high_10x', targetOdds: 10, strategy: 'max_probability' },
    true,
    'az'
  );
  assert.ok(directive);
  assert.match(directive, /Misli/);
  assert.match(directive, /10x total odds/);
  assert.match(directive, /18\+/);
  assert.match(directive, /Never claim a coupon or pick is guaranteed/);

  assert.equal(buildCouponSystemDirective({ preset: 'auto', targetOdds: null }, false, 'az'), null);
  assert.match(buildDefaultScreenshotPrompt({ preset: 'high_10x', targetOdds: 10 }, 'az'), /10x/);
});
