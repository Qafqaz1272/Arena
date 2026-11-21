import test from 'node:test';
import assert from 'node:assert/strict';
import { computeTeamThreatSummary, generateMatchShotMap } from './xgShotMap';

test('generateMatchShotMap is deterministic for identical inputs', () => {
  const params = {
    matchId: 'match-ars-mci-2026',
    homeXg: 1.85,
    awayXg: 1.12,
    homeScore: 2,
    awayScore: 1,
    homeShotsCount: 14,
    awayShotsCount: 9,
  };

  const first = generateMatchShotMap(params);
  const second = generateMatchShotMap(params);

  assert.deepEqual(first, second);
  assert.equal(first.length, 23);
});

test('all generated shots stay within FIFA pitch boundaries and valid xG range', () => {
  const shots = generateMatchShotMap({
    matchId: 'match-qar-nef',
    homeXg: 2.3,
    awayXg: 0.75,
    homeScore: 3,
    awayScore: 0,
  });

  assert.ok(shots.length > 0);
  for (const shot of shots) {
    assert.ok(shot.x >= 0 && shot.x <= 105, `x out of bounds: ${shot.x}`);
    assert.ok(shot.y >= 0 && shot.y <= 68, `y out of bounds: ${shot.y}`);
    assert.ok(shot.xg >= 0.02 && shot.xg <= 0.78, `xg out of bounds: ${shot.xg}`);
    assert.ok(shot.minute >= 1 && shot.minute <= 90, `minute out of bounds: ${shot.minute}`);

    // Home attacks toward x=105 (right half), Away attacks toward x=0 (left half)
    if (shot.team === 'home') {
      assert.ok(shot.x > 52.5, `home shot should be in attacking half, got ${shot.x}`);
    } else {
      assert.ok(shot.x < 52.5, `away shot should be in attacking half, got ${shot.x}`);
    }
  }
});

test('generated goal counts match the actual scoreboard for both teams', () => {
  const shots = generateMatchShotMap({
    matchId: 'match-rma-fcb',
    homeXg: 2.1,
    awayXg: 1.6,
    homeScore: 3,
    awayScore: 2,
    homeShotsCount: 15,
    awayShotsCount: 11,
  });

  const homeSummary = computeTeamThreatSummary(shots, 'home');
  const awaySummary = computeTeamThreatSummary(shots, 'away');

  assert.equal(homeSummary.goals, 3);
  assert.equal(awaySummary.goals, 2);
  assert.equal(homeSummary.shots, 15);
  assert.equal(awaySummary.shots, 11);
  assert.ok(Math.abs(homeSummary.totalXg - 2.1) < 0.35);
  assert.ok(Math.abs(awaySummary.totalXg - 1.6) < 0.35);
  assert.ok(homeSummary.boxSharePct >= 0 && homeSummary.boxSharePct <= 100);
  assert.ok(
    Math.abs(
      homeSummary.sixYardXg +
        homeSummary.penaltyBoxXg +
        homeSummary.outsideBoxXg -
        homeSummary.totalXg
    ) < 0.05
  );
});

test('handles upcoming matches with null scores cleanly', () => {
  const shots = generateMatchShotMap({
    matchId: 'upcoming-liv-che',
    homeXg: 1.55,
    awayXg: 1.25,
    homeScore: null,
    awayScore: null,
  });

  const homeSummary = computeTeamThreatSummary(shots, 'home');
  const awaySummary = computeTeamThreatSummary(shots, 'away');

  assert.equal(homeSummary.goals, 0);
  assert.equal(awaySummary.goals, 0);
  assert.ok(homeSummary.shots >= 5);
  assert.ok(awaySummary.shots >= 5);
});
