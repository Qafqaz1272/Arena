import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectLiveMatchChanges,
  formatGoalAlertText,
  mergeLiveScorePatches,
  type LiveScoreSnapshot,
} from './liveGoalDetector.ts';
import type { PlatformMatch } from '../types/platform.ts';

function makeSnap(overrides: Partial<LiveScoreSnapshot> = {}): LiveScoreSnapshot {
  return {
    id: 'espn-401874967',
    leagueShort: 'Seriya A',
    homeTeamId: '115',
    homeTeamName: 'Parma',
    homeShort: 'PAR',
    awayTeamId: '104',
    awayTeamName: 'AS Roma',
    awayShort: 'ROM',
    status: 'LIVE',
    minute: "65'",
    homeScore: 1,
    awayScore: 2,
    homeYellowCards: 1,
    awayYellowCards: 0,
    homeRedCards: 0,
    awayRedCards: 0,
    ...overrides,
  };
}

test('detectLiveMatchChanges skips cold-start matches without firing false goals', () => {
  const prev = new Map<string, LiveScoreSnapshot>();
  const diff = detectLiveMatchChanges(prev, [makeSnap()], '2026-11-21T18:00:00.000Z');
  assert.equal(diff.goals.length, 0);
  assert.equal(diff.patches.length, 0);
  assert.equal(diff.redCards.length, 0);
});

test('detectLiveMatchChanges detects away goal with scorer name and idempotent eventId', () => {
  const prev = new Map<string, LiveScoreSnapshot>([['espn-401874967', makeSnap()]]);
  const next = makeSnap({
    minute: "72'",
    awayScore: 3,
    lastGoalSide: 'away',
    lastGoalScorer: 'Donyell Malen',
    lastGoalMinute: "72'",
  });

  const diff = detectLiveMatchChanges(prev, [next], '2026-11-21T18:07:00.000Z');
  assert.equal(diff.goals.length, 1);
  assert.equal(diff.goals[0].eventId, 'goal:espn-401874967:A:1-3');
  assert.equal(diff.goals[0].scoringSide, 'away');
  assert.equal(diff.goals[0].scoringTeamName, 'AS Roma');
  assert.equal(diff.goals[0].scorerName, 'Donyell Malen');
  assert.equal(diff.patches.length, 1);
  assert.equal(diff.patches[0].awayScore, 3);
  assert.match(formatGoalAlertText(diff.goals[0]), /QOL! 72' · AS Roma — Donyell Malen/);
});

test('detectLiveMatchChanges does not emit duplicate goals when identical state arrives twice', () => {
  const snap = makeSnap({ awayScore: 3, minute: "72'" });
  const prev = new Map<string, LiveScoreSnapshot>([[snap.id, snap]]);
  const diff = detectLiveMatchChanges(prev, [snap], '2026-11-21T18:08:00.000Z');
  assert.equal(diff.goals.length, 0);
  assert.equal(diff.patches.length, 0);
});

test('detectLiveMatchChanges detects red cards and status transitions', () => {
  const prev = new Map<string, LiveScoreSnapshot>([
    ['m1', makeSnap({ id: 'm1', status: 'UPCOMING', homeScore: null, awayScore: null, minute: '19:00' })],
    ['m2', makeSnap({ id: 'm2', status: 'LIVE', homeRedCards: 0, minute: "80'" })],
  ]);
  const next = [
    makeSnap({ id: 'm1', status: 'LIVE', homeScore: 0, awayScore: 0, minute: "1'" }),
    makeSnap({ id: 'm2', status: 'LIVE', homeRedCards: 1, minute: "82'" }),
  ];

  const diff = detectLiveMatchChanges(prev, next, '2026-11-21T18:10:00.000Z');
  assert.equal(diff.statusChanges.length, 1);
  assert.equal(diff.statusChanges[0].nextStatus, 'LIVE');
  assert.equal(diff.redCards.length, 1);
  assert.equal(diff.redCards[0].side, 'home');
  assert.equal(diff.goals.length, 0);
});

test('mergeLiveScorePatches updates only changed matches and preserves untouched references', () => {
  const m1 = {
    id: 'espn-1',
    status: 'LIVE',
    minute: "50'",
    homeScore: 0,
    awayScore: 0,
    homeYellowCards: 0,
    awayYellowCards: 0,
    homeRedCards: 0,
    awayRedCards: 0,
  } as PlatformMatch;
  const m2 = {
    id: 'espn-2',
    status: 'UPCOMING',
    minute: '20:00',
    homeScore: null,
    awayScore: null,
    homeYellowCards: 0,
    awayYellowCards: 0,
    homeRedCards: 0,
    awayRedCards: 0,
  } as PlatformMatch;

  const updated = mergeLiveScorePatches([m1, m2], [
    {
      id: 'espn-1',
      status: 'LIVE',
      minute: "52'",
      homeScore: 1,
      awayScore: 0,
      homeYellowCards: 1,
      awayYellowCards: 0,
      homeRedCards: 0,
      awayRedCards: 0,
    },
  ]);

  assert.equal(updated[0].homeScore, 1);
  assert.equal(updated[0].minute, "52'");
  assert.equal(updated[0].homeYellowCards, 1);
  assert.equal(updated[1], m2);
});
