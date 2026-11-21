import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  formatMatchForGoogleChat,
  parseGoogleChatError,
} from './googleChatFormatter';
import { predictMatch } from '../engine/predictionEngine';
import type { MatchRecord, MatchWithPrediction } from '../types/football';

function buildFixture(overrides: Partial<MatchRecord> = {}): MatchWithPrediction {
  const base: MatchRecord = {
    id: 'test-fixture-1',
    leagueId: 'pl',
    leagueName: 'Premier League',
    country: 'England',
    countryCode: 'GB',
    dateKey: '2026-11-19',
    kickoffIso: '2026-11-19T19:45:00.000Z',
    status: 'upcoming',
    venue: 'Emirates Stadium',
    hasXG: true,
    leagueAvgHomeGoals: 1.56,
    leagueAvgAwayGoals: 1.24,
    leagueHomeAdvantage: 1.12,
    h2h: [
      {
        date: '2026-04-12',
        homeTeamId: 'ars',
        homeTeamName: 'Arsenal',
        awayTeamId: 'che',
        awayTeamName: 'Chelsea',
        homeGoals: 2,
        awayGoals: 1,
        competition: 'Premier League',
      },
    ],
    homeTeam: {
      id: 'ars',
      name: 'Arsenal',
      shortName: 'Arsenal',
      code: 'ARS',
      country: 'England',
      leagueId: 'pl',
      standingsPosition: 1,
      points: 62,
      played: 26,
      wins: 19,
      draws: 5,
      losses: 2,
      goalsFor: 58,
      goalsAgainst: 21,
      xGFor: 54.2,
      xGAgainst: 22.8,
      elo: 1965,
      formTrend: [2.2, 2.3, 2.4, 2.5, 2.5, 2.6],
      last10Form: [
        { result: 'W', goalsFor: 2, goalsAgainst: 0, isHome: true, opponent: 'BHA', date: '2026-11-12' },
        { result: 'W', goalsFor: 3, goalsAgainst: 1, isHome: false, opponent: 'WHU', date: '2026-11-08' },
        { result: 'D', goalsFor: 1, goalsAgainst: 1, isHome: true, opponent: 'LIV', date: '2026-11-02' },
        { result: 'W', goalsFor: 2, goalsAgainst: 1, isHome: false, opponent: 'NEW', date: '2026-10-27' },
        { result: 'W', goalsFor: 4, goalsAgainst: 0, isHome: true, opponent: 'EVE', date: '2026-10-20' },
      ],
      homeSplit: { played: 13, wins: 11, draws: 2, losses: 0, goalsFor: 34, goalsAgainst: 9, xGFor: 31.1, xGAgainst: 10.2 },
      awaySplit: { played: 13, wins: 8, draws: 3, losses: 2, goalsFor: 24, goalsAgainst: 12, xGFor: 23.1, xGAgainst: 12.6 },
      absences: [],
    },
    awayTeam: {
      id: 'che',
      name: 'Chelsea',
      shortName: 'Chelsea',
      code: 'CHE',
      country: 'England',
      leagueId: 'pl',
      standingsPosition: 5,
      points: 46,
      played: 26,
      wins: 13,
      draws: 7,
      losses: 6,
      goalsFor: 44,
      goalsAgainst: 31,
      xGFor: 42.5,
      xGAgainst: 33.4,
      elo: 1840,
      formTrend: [1.6, 1.7, 1.5, 1.8, 1.8, 1.7],
      last10Form: [
        { result: 'W', goalsFor: 2, goalsAgainst: 1, isHome: true, opponent: 'AVL', date: '2026-11-12' },
        { result: 'L', goalsFor: 0, goalsAgainst: 2, isHome: false, opponent: 'MCI', date: '2026-11-08' },
        { result: 'D', goalsFor: 1, goalsAgainst: 1, isHome: true, opponent: 'TOT', date: '2026-11-02' },
        { result: 'W', goalsFor: 3, goalsAgainst: 2, isHome: true, opponent: 'FUL', date: '2026-10-27' },
        { result: 'D', goalsFor: 2, goalsAgainst: 2, isHome: false, opponent: 'BRE', date: '2026-10-20' },
      ],
      homeSplit: { played: 13, wins: 8, draws: 3, losses: 2, goalsFor: 25, goalsAgainst: 13, xGFor: 24.0, xGAgainst: 14.5 },
      awaySplit: { played: 13, wins: 5, draws: 4, losses: 4, goalsFor: 19, goalsAgainst: 18, xGFor: 18.5, xGAgainst: 18.9 },
      absences: [],
    },
    ...overrides,
  };

  return {
    ...base,
    prediction: predictMatch(base),
  };
}

describe('formatMatchForGoogleChat', () => {
  it('formats complete Azerbaijani match analysis report including disclaimer', () => {
    const fixture = buildFixture();
    const text = formatMatchForGoogleChat(fixture, 'az');

    assert.ok(text.includes('*MatchEdge · Premier League*'));
    assert.ok(text.includes('*Arsenal vs Chelsea*'));
    assert.ok(text.includes('*1X2*:'));
    assert.ok(text.includes('Üst 2.5'));
    assert.ok(text.includes('18+'));
    assert.ok(text.includes('Niyə bu proqnoz?'));
  });

  it('includes live score and minute when match is in-play', () => {
    const fixture = buildFixture({
      status: 'live',
      minute: 68,
      score: { home: 1, away: 1 },
    });
    const text = formatMatchForGoogleChat(fixture, 'en');

    assert.ok(text.includes("Live 68' (1–1)"));
    assert.ok(text.includes('Predictions are statistical estimates'));
  });
});

describe('parseGoogleChatError', () => {
  it('detects Google Chat app not configured 404 error', () => {
    const parsed = parseGoogleChatError(404, {
      error: {
        code: 404,
        message:
          'Google Chat app not found. To create a Chat app, you must turn on the Chat API and configure the app in the Google Cloud console.',
      },
    });
    assert.equal(parsed.kind, 'APP_NOT_CONFIGURED');
    assert.equal(parsed.status, 404);
  });

  it('detects Workspace account requirement on 403', () => {
    const parsed = parseGoogleChatError(403, {
      error: {
        message: 'Google Chat is not enabled for consumer Gmail accounts.',
      },
    });
    assert.equal(parsed.kind, 'WORKSPACE_ACCOUNT_REQUIRED');
  });

  it('detects 401 unauthorized and 429 rate limits', () => {
    assert.equal(parseGoogleChatError(401, {}).kind, 'UNAUTHORIZED');
    assert.equal(parseGoogleChatError(429, {}).kind, 'RATE_LIMITED');
  });
});
