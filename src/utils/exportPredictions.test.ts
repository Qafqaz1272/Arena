import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPredictionsCsv, escapeCsvCell, toPdfSafeText } from './exportPredictions';
import { predictMatch } from '../engine/predictionEngine';
import type { MatchRecord, MatchWithPrediction } from '../types/football';

test('escapeCsvCell escapes commas, quotes, and formula prefixes', () => {
  assert.equal(escapeCsvCell('A, B'), '"A, B"');
  assert.equal(escapeCsvCell('He said "hi"'), '"He said ""hi"""');
  assert.equal(escapeCsvCell('=CMD()'), "'=CMD()");
});

test('toPdfSafeText transliterates Azerbaijani characters cleanly for Helvetica PDF', () => {
  assert.equal(toPdfSafeText('Qarabağ — Azərbaycan Şəhəri'), 'Qarabag — Azerbaycan Seheri');
});

test('buildPredictionsCsv produces UTF-8 BOM CSV with header and match row', () => {
  const base: MatchRecord = {
    id: 'csv-1',
    leagueId: 'az-pl',
    leagueName: 'Azərbaycan Premyer Liqası',
    country: 'Azerbaijan',
    countryCode: 'AZ',
    kickoffIso: '2026-11-19T18:00:00Z',
    dateKey: '2026-11-19',
    status: 'upcoming',
    venue: 'Baku',
    leagueAvgHomeGoals: 1.5,
    leagueAvgAwayGoals: 1.1,
    leagueHomeAdvantage: 1.15,
    hasXG: false,
    h2h: [],
    homeTeam: {
      id: 'h',
      name: 'Qarabağ FK',
      shortName: 'Qarabağ',
      code: 'QAR',
      country: 'Azerbaijan',
      leagueId: 'az-pl',
      elo: 1750,
      standingsPosition: 1,
      points: 30,
      played: 12,
      wins: 10,
      draws: 0,
      losses: 2,
      goalsFor: 28,
      goalsAgainst: 8,
      homeSplit: { played: 6, wins: 5, draws: 0, losses: 1, goalsFor: 16, goalsAgainst: 4 },
      awaySplit: { played: 6, wins: 5, draws: 0, losses: 1, goalsFor: 12, goalsAgainst: 4 },
      last10Form: [],
      absences: [],
      formTrend: [2.5],
    },
    awayTeam: {
      id: 'a',
      name: 'Sabah FK',
      shortName: 'Sabah',
      code: 'SAB',
      country: 'Azerbaijan',
      leagueId: 'az-pl',
      elo: 1580,
      standingsPosition: 4,
      points: 20,
      played: 12,
      wins: 6,
      draws: 2,
      losses: 4,
      goalsFor: 18,
      goalsAgainst: 14,
      homeSplit: { played: 6, wins: 4, draws: 1, losses: 1, goalsFor: 11, goalsAgainst: 6 },
      awaySplit: { played: 6, wins: 2, draws: 1, losses: 3, goalsFor: 7, goalsAgainst: 8 },
      last10Form: [],
      absences: [],
      formTrend: [1.6],
    },
  };
  const m: MatchWithPrediction = { ...base, prediction: predictMatch(base) };
  const csv = buildPredictionsCsv([m]);
  assert.ok(csv.startsWith('\uFEFFDate,League,Match,'));
  assert.ok(csv.includes('Qarabağ vs Sabah'));
});
