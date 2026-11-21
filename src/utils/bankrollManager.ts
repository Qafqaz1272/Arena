import type { BankrollBet } from '../types/football';

export interface BankrollSettings {
  startingBankroll: number;
  dailyLossLimit: number;
  currency: string;
}

export interface BankrollMetrics {
  startingBankroll: number;
  currentBankroll: number;
  totalStaked: number;
  settledStaked: number;
  netProfit: number;
  roiPct: number;
  winRatePct: number;
  totalBets: number;
  settledBets: number;
  wins: number;
  losses: number;
  pending: number;
  todayNetProfit: number;
  todayLossAmount: number;
  dailyLossLimit: number;
  isDailyLossLimitReached: boolean;
  dailyLossUsagePct: number;
}

export interface RoiChartPoint {
  index: number;
  label: string;
  date: string;
  cumulativeProfit: number;
  cumulativeRoiPct: number;
  bankroll: number;
}

export const BANKROLL_BETS_KEY = 'matchedge_bankroll_bets_v1';
export const BANKROLL_SETTINGS_KEY = 'matchedge_bankroll_settings_v1';

export const DEFAULT_BANKROLL_SETTINGS: BankrollSettings = {
  startingBankroll: 500,
  dailyLossLimit: 50,
  currency: 'AZN',
};

export function computeBetProfit(bet: Pick<BankrollBet, 'stake' | 'odds' | 'result'>): number {
  if (!Number.isFinite(bet.stake) || bet.stake <= 0) return 0;
  if (bet.result === 'win') {
    return Number((bet.stake * (bet.odds - 1)).toFixed(2));
  }
  if (bet.result === 'loss') {
    return Number((-bet.stake).toFixed(2));
  }
  return 0;
}

export function getTodayDateKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function computeBankrollMetrics(
  bets: BankrollBet[],
  settings: BankrollSettings,
  todayKey: string = getTodayDateKey()
): BankrollMetrics {
  let totalStaked = 0;
  let settledStaked = 0;
  let netProfit = 0;
  let wins = 0;
  let losses = 0;
  let pending = 0;
  let todayNetProfit = 0;

  for (const bet of bets) {
    totalStaked += bet.stake;
    if (bet.result === 'pending') {
      pending += 1;
      continue;
    }
    const profit = computeBetProfit(bet);
    if (bet.result === 'win') {
      wins += 1;
      settledStaked += bet.stake;
      netProfit += profit;
    } else if (bet.result === 'loss') {
      losses += 1;
      settledStaked += bet.stake;
      netProfit += profit;
    }

    if (bet.date === todayKey && (bet.result === 'win' || bet.result === 'loss')) {
      todayNetProfit += profit;
    }
  }

  const settledBets = wins + losses;
  const roiPct = settledStaked > 0 ? Number(((netProfit / settledStaked) * 100).toFixed(2)) : 0;
  const winRatePct = settledBets > 0 ? Number(((wins / settledBets) * 100).toFixed(1)) : 0;
  const todayLossAmount = todayNetProfit < 0 ? Number(Math.abs(todayNetProfit).toFixed(2)) : 0;
  const dailyLossLimit = Math.max(0, settings.dailyLossLimit);
  const isDailyLossLimitReached = dailyLossLimit > 0 && todayLossAmount >= dailyLossLimit;
  const dailyLossUsagePct =
    dailyLossLimit > 0 ? Math.min(100, Number(((todayLossAmount / dailyLossLimit) * 100).toFixed(1))) : 0;

  return {
    startingBankroll: settings.startingBankroll,
    currentBankroll: Number((settings.startingBankroll + netProfit).toFixed(2)),
    totalStaked: Number(totalStaked.toFixed(2)),
    settledStaked: Number(settledStaked.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    roiPct,
    winRatePct,
    totalBets: bets.length,
    settledBets,
    wins,
    losses,
    pending,
    todayNetProfit: Number(todayNetProfit.toFixed(2)),
    todayLossAmount,
    dailyLossLimit,
    isDailyLossLimitReached,
    dailyLossUsagePct,
  };
}

export function buildRoiCurve(
  bets: BankrollBet[],
  startingBankroll: number
): RoiChartPoint[] {
  const settled = bets
    .filter((b) => b.result === 'win' || b.result === 'loss')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  let cumProfit = 0;
  let cumStaked = 0;

  return settled.map((bet, idx) => {
    cumProfit += computeBetProfit(bet);
    cumStaked += bet.stake;
    const roiPct = cumStaked > 0 ? (cumProfit / cumStaked) * 100 : 0;
    return {
      index: idx + 1,
      label: `#${idx + 1}`,
      date: bet.date,
      cumulativeProfit: Number(cumProfit.toFixed(2)),
      cumulativeRoiPct: Number(roiPct.toFixed(2)),
      bankroll: Number((startingBankroll + cumProfit).toFixed(2)),
    };
  });
}

export function loadBankrollBets(): BankrollBet[] {
  try {
    const raw = window.localStorage.getItem(BANKROLL_BETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (b): b is BankrollBet =>
        typeof b === 'object' &&
        b !== null &&
        typeof b.id === 'string' &&
        typeof b.stake === 'number' &&
        typeof b.odds === 'number'
    );
  } catch {
    return [];
  }
}

export function saveBankrollBets(bets: BankrollBet[]): void {
  try {
    window.localStorage.setItem(BANKROLL_BETS_KEY, JSON.stringify(bets));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadBankrollSettings(): BankrollSettings {
  try {
    const raw = window.localStorage.getItem(BANKROLL_SETTINGS_KEY);
    if (!raw) return DEFAULT_BANKROLL_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<BankrollSettings>;
    return {
      startingBankroll:
        typeof parsed.startingBankroll === 'number' && parsed.startingBankroll >= 0
          ? parsed.startingBankroll
          : DEFAULT_BANKROLL_SETTINGS.startingBankroll,
      dailyLossLimit:
        typeof parsed.dailyLossLimit === 'number' && parsed.dailyLossLimit >= 0
          ? parsed.dailyLossLimit
          : DEFAULT_BANKROLL_SETTINGS.dailyLossLimit,
      currency:
        typeof parsed.currency === 'string' && parsed.currency.trim().length > 0
          ? parsed.currency.trim().slice(0, 6)
          : DEFAULT_BANKROLL_SETTINGS.currency,
    };
  } catch {
    return DEFAULT_BANKROLL_SETTINGS;
  }
}

export function saveBankrollSettings(settings: BankrollSettings): void {
  try {
    window.localStorage.setItem(BANKROLL_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors
  }
}
