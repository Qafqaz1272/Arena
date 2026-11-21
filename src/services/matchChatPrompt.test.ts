import test from 'node:test';
import assert from 'node:assert/strict';
import { predictMatch } from '../engine/predictionEngine.ts';
import type { MatchRecord, MatchWithPrediction } from '../types/football.ts';
import {
  buildMatchAnalystSystemInstruction,
  sanitizeChatHistory,
} from './matchChatPrompt.ts';

function buildSampleMatch(overrides?: Partial<MatchRecord>): MatchWithPrediction {
  const base: MatchRecord = {
    id: 'test-live-1',
    leagueId: 'ger.1',
    leagueName: 'Bundesliga',
    country: 'Germany',
    countryCode: 'DE',
    kickoffIso: '2026-11-19T19:30:00Z',
    dateKey: '2026-11-19',
    status: 'live',
    minute: 68,
    venue: 'Allianz Arena',
    score: { home: 2, away: 1 },
    liveStats: {
      possession: { home: 61, away: 39 },
      shots: { home: 14, away: 7 },
      shotsOnTarget: { home: 6, away: 3 },
      corners: { home: 7, away: 2 },
    },
    leagueAvgHomeGoals: 1.76,
    leagueAvgAwayGoals: 1.36,
    leagueHomeAdvantage: 1.15,
    hasXG: false,
    h2h: [
      {
        date: '2026-03-14',
        homeTeamId: 't-bay',
        homeTeamName: 'FC Bayern',
        awayTeamId: 't-kol',
        awayTeamName: 'FC Köln',
        homeGoals: 3,
        awayGoals: 0,
        competition: 'Bundesliga',
      },
    ],
    homeTeam: {
      id: 't-bay',
      name: 'FC Bayern München',
      shortName: 'Bayern',
      code: 'BAY',
      country: 'Germany',
      leagueId: 'ger.1',
      elo: 1960,
      standingsPosition: 1,
      points: 25,
      played: 10,
      wins: 8,
      draws: 1,
      losses: 1,
      goalsFor: 29,
      goalsAgainst: 8,
      homeSplit: { played: 5, wins: 4, draws: 1, losses: 0, goalsFor: 16, goalsAgainst: 3 },
      awaySplit: { played: 5, wins: 4, draws: 0, losses: 1, goalsFor: 13, goalsAgainst: 5 },
      last10Form: [
        { result: 'W', goalsFor: 3, goalsAgainst: 1, isHome: true, opponent: 'Leipzig', date: '2026-11-12' },
      ],
      absences: [{ playerName: 'J. Musiala', position: 'MF', reason: 'injury', impact: 'key' }],
      formTrend: [2.4, 2.5, 2.5],
    },
    awayTeam: {
      id: 't-kol',
      name: '1. FC Köln',
      shortName: 'Köln',
      code: 'KOL',
      country: 'Germany',
      leagueId: 'ger.1',
      elo: 1650,
      standingsPosition: 15,
      points: 9,
      played: 10,
      wins: 2,
      draws: 3,
      losses: 5,
      goalsFor: 10,
      goalsAgainst: 18,
      homeSplit: { played: 5, wins: 1, draws: 2, losses: 2, goalsFor: 6, goalsAgainst: 8 },
      awaySplit: { played: 5, wins: 1, draws: 1, losses: 3, goalsFor: 4, goalsAgainst: 10 },
      last10Form: [
        { result: 'L', goalsFor: 0, goalsAgainst: 2, isHome: false, opponent: 'Dortmund', date: '2026-11-11' },
      ],
      absences: [],
      formTrend: [0.9, 0.8, 0.9],
    },
    ...overrides,
  };
  return {
    ...base,
    prediction: predictMatch(base),
  };
}

test('buildMatchAnalystSystemInstruction includes live score, minute, remaining xG, live stats, absences, and AZ directive', () => {
  const match = buildSampleMatch();
  const prompt = buildMatchAnalystSystemInstruction(match, 'az');

  assert.match(prompt, /Azerbaijani/);
  assert.match(prompt, /LIVE IN-PLAY \(68'\)/);
  assert.match(prompt, /FC Bayern München 2 - 1 1\. FC Köln/);
  assert.match(prompt, /Remaining Expected Goals \(\+λ\)/);
  assert.match(prompt, /Possession: Bayern 61% vs Köln 39%/);
  assert.match(prompt, /J\. Musiala/);
  assert.match(prompt, /NEVER guarantee results/);
});

test('buildMatchAnalystSystemInstruction supports upcoming matches and RU/EN directives', () => {
  const match = buildSampleMatch({ status: 'upcoming', score: undefined, minute: undefined, liveStats: undefined });
  const ruPrompt = buildMatchAnalystSystemInstruction(match, 'ru');
  const enPrompt = buildMatchAnalystSystemInstruction(match, 'en');

  assert.match(ruPrompt, /Russian/);
  assert.match(enPrompt, /English/);
  assert.match(enPrompt, /UPCOMING/);
  assert.doesNotMatch(enPrompt, /Remaining Expected Goals/);
});

test('sanitizeChatHistory filters invalid entries, trims whitespace, and caps turn count', () => {
  const messy = [
    { role: 'system', text: 'ignore me' },
    { role: 'user', text: '   ' },
    ...Array.from({ length: 16 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'model',
      text: `  Turn ${i + 1}  `,
    })),
  ];

  const clean = sanitizeChatHistory(messy);
  assert.equal(clean.length, 12);
  assert.equal(clean[0].text, 'Turn 5');
  assert.equal(clean[11].text, 'Turn 16');
});

test('sanitizeChatHistory enforces alternating user/model turns ending with model', () => {
  const broken = [
    { role: 'model', text: 'leading model should be dropped' },
    { role: 'user', text: 'first question' },
    { role: 'user', text: 'retried question' },
    { role: 'model', text: 'analyst answer' },
    { role: 'user', text: 'orphan failed question at tail' },
  ];

  const clean = sanitizeChatHistory(broken);
  assert.deepEqual(clean, [
    { role: 'user', text: 'retried question' },
    { role: 'model', text: 'analyst answer' },
  ]);
});

test('buildMatchAnalystSystemInstruction embeds screenshot OCR and 10x coupon rules when active', () => {
  const match = buildSampleMatch();
  const prompt = buildMatchAnalystSystemInstruction(match, 'az', {
    hasImages: true,
    couponConcept: { preset: 'high_10x', targetOdds: 10, strategy: 'max_probability' },
  });

  assert.match(prompt, /SCREENSHOT & COUPON \/ TARGET-ODDS ANALYSIS MODE/);
  assert.match(prompt, /10x total odds/);
  assert.match(prompt, /Misli/);
});


