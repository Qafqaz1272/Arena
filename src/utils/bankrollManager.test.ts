import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRoiCurve,
  computeBankrollMetrics,
  computeBetProfit,
  type BankrollSettings,
} from './bankrollManager';
import type { BankrollBet } from '../types/football';

const settings: BankrollSettings = {
  startingBankroll: 500,
  dailyLossLimit: 50,
  currency: 'AZN',
};

test('computeBetProfit handles win, loss, void, and pending accurately', () => {
  assert.equal(computeBetProfit({ stake: 20, odds: 2.5, result: 'win' }), 30);
  assert.equal(computeBetProfit({ stake: 20, odds: 2.5, result: 'loss' }), -20);
  assert.equal(computeBetProfit({ stake: 20, odds: 2.5, result: 'void' }), 0);
  assert.equal(computeBetProfit({ stake: 20, odds: 2.5, result: 'pending' }), 0);
});

test('computeBankrollMetrics calculates ROI and triggers daily loss limit warning', () => {
  const bets: BankrollBet[] = [
    {
      id: 'b1',
      date: '2026-11-19',
      createdAt: '2026-11-19T10:00:00Z',
      matchLabel: 'Qarabağ vs Neftçi',
      selection: '1',
      stake: 40,
      odds: 2.0,
      result: 'loss',
    },
    {
      id: 'b2',
      date: '2026-11-19',
      createdAt: '2026-11-19T12:00:00Z',
      matchLabel: 'Arsenal vs Chelsea',
      selection: 'Over 2.5',
      stake: 20,
      odds: 1.9,
      result: 'loss',
    },
    {
      id: 'b3',
      date: '2026-11-18',
      createdAt: '2026-11-18T14:00:00Z',
      matchLabel: 'Milan vs Inter',
      selection: 'BTTS',
      stake: 30,
      odds: 2.0,
      result: 'win',
    },
  ];

  const m = computeBankrollMetrics(bets, settings, '2026-11-19');
  assert.equal(m.netProfit, -30);
  assert.equal(m.currentBankroll, 470);
  assert.equal(m.todayLossAmount, 60);
  assert.equal(m.isDailyLossLimitReached, true);
  assert.equal(m.wins, 1);
  assert.equal(m.losses, 2);

  const curve = buildRoiCurve(bets, settings.startingBankroll);
  assert.equal(curve.length, 3);
  assert.equal(curve[0].cumulativeProfit, 30);
  assert.equal(curve[2].cumulativeProfit, -30);
});
