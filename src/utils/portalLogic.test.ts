import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCountdownParts,
  filterFixtures,
  getTableZone,
  formatGoalDifference,
  simulateGoalEvent,
  validateNewsletterEmail,
  type PortalFixture,
} from './portalLogic';

test('computeCountdownParts formats hours, minutes, seconds and clamps negatives', () => {
  assert.deepEqual(computeCountdownParts(3665), {
    hours: '01',
    minutes: '01',
    seconds: '05',
    totalSeconds: 3665,
  });
  assert.deepEqual(computeCountdownParts(-42), {
    hours: '00',
    minutes: '00',
    seconds: '00',
    totalSeconds: 0,
  });
});

test('filterFixtures filters accurately by league and date', () => {
  const sample: PortalFixture[] = [
    {
      id: '1',
      leagueId: 'azpl',
      dateId: 'today',
      time: '19:30',
      status: 'LIVE',
      minute: "70'",
      homeTeamId: 'qarabag',
      awayTeamId: 'neftci',
      homeScore: 2,
      awayScore: 1,
      stadium: 'Arena',
      round: 'Tur 29',
    },
    {
      id: '2',
      leagueId: 'ucl',
      dateId: 'tomorrow',
      time: '23:00',
      status: 'UPCOMING',
      minute: '23:00',
      homeTeamId: 'realmadrid',
      awayTeamId: 'bayern',
      homeScore: null,
      awayScore: null,
      stadium: 'Bernabeu',
      round: '1/4',
    },
  ];

  assert.equal(filterFixtures(sample, 'azpl', 'today').length, 1);
  assert.equal(filterFixtures(sample, 'azpl', 'tomorrow').length, 0);
  assert.equal(filterFixtures(sample, 'all', 'tomorrow').length, 1);
  assert.equal(filterFixtures(sample, 'all', 'all').length, 2);
});

test('getTableZone classifies UCL, Europa, relegation, and mid-table zones', () => {
  const azplConfig = { uclSpots: 1, europaSpots: 3, relegationStart: 9 };
  assert.equal(getTableZone(1, azplConfig), 'ucl');
  assert.equal(getTableZone(2, azplConfig), 'europa');
  assert.equal(getTableZone(3, azplConfig), 'europa');
  assert.equal(getTableZone(5, azplConfig), 'mid');
  assert.equal(getTableZone(9, azplConfig), 'relegation');
  assert.equal(getTableZone(10, azplConfig), 'relegation');
});

test('formatGoalDifference includes plus sign for positive values', () => {
  assert.equal(formatGoalDifference(74, 19), '+55');
  assert.equal(formatGoalDifference(20, 20), '0');
  assert.equal(formatGoalDifference(19, 56), '-37');
});

test('simulateGoalEvent increments correct team score and appends goal event', () => {
  const res = simulateGoalEvent({
    homeScore: 2,
    awayScore: 1,
    minute: 74,
    scoringSide: 'home',
    scorerName: 'Olavio Juninyo',
    assistName: 'Yassin Benzia',
    eventSeq: 1,
  });

  assert.equal(res.homeScore, 3);
  assert.equal(res.awayScore, 1);
  assert.equal(res.minute, 76);
  assert.equal(res.newEvent.type, 'goal');
  assert.equal(res.newEvent.player, 'Olavio Juninyo');
});

test('validateNewsletterEmail validates empty, malformed, and valid addresses', () => {
  assert.equal(validateNewsletterEmail('').valid, false);
  assert.equal(validateNewsletterEmail('not-an-email').valid, false);
  assert.equal(validateNewsletterEmail('azarkes@arena.az').valid, true);
});
