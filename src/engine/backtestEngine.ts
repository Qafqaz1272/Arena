import type {
  ConfidenceBand,
  HistoricalPredictionRecord,
  MatchWithPrediction,
  PerformanceSummary,
} from '../types/football';

export interface BacktestSample {
  id: string;
  date: string;
  leagueId: string;
  leagueName: string;
  homeTeam: string;
  awayTeam: string;
  predictedSelection: 'home' | 'draw' | 'away';
  predictedProb: number;
  /** Full 3-way probabilities when available (from finished live matches) or reconstructed */
  probs: { home: number; draw: number; away: number };
  actualResult: 'home' | 'draw' | 'away';
  actualScore: string;
  confidenceBand: ConfidenceBand;
  hit: boolean;
  brierScore: number;
  logLoss: number;
}

export interface CalibrationBin {
  binLabel: string;
  binCenterPct: number;
  predictedPct: number;
  actualPct: number;
  perfectPct: number;
  count: number;
}

export interface BacktestReport {
  totalMatches: number;
  hitRate: number;
  avgBrierScore: number;
  avgLogLoss: number;
  calibrationErrorEce: number;
  calibrationBins: CalibrationBin[];
  byLeague: Array<{
    leagueId: string;
    leagueName: string;
    total: number;
    hitRate: number;
    avgBrier: number;
    avgLogLoss: number;
  }>;
  samples: BacktestSample[];
}

const EPS = 1e-6;

/**
 * Multi-class 1X2 Brier score in [0, 2] (lower is better; uniform 1/3 gives ~0.667).
 * Note: single-event squared error is also computed when only top-outcome probability is present.
 */
export function computeMultiClassBrier(
  probs: { home: number; draw: number; away: number },
  actual: 'home' | 'draw' | 'away'
): number {
  const yH = actual === 'home' ? 1 : 0;
  const yD = actual === 'draw' ? 1 : 0;
  const yA = actual === 'away' ? 1 : 0;
  const score =
    Math.pow(probs.home - yH, 2) +
    Math.pow(probs.draw - yD, 2) +
    Math.pow(probs.away - yA, 2);
  return Number(score.toFixed(4));
}

/**
 * Multi-class categorical cross-entropy (Log Loss) in [0, +inf) (lower is better; uniform 1/3 gives ~1.099).
 */
export function computeMultiClassLogLoss(
  probs: { home: number; draw: number; away: number },
  actual: 'home' | 'draw' | 'away'
): number {
  const pActual = Math.max(EPS, Math.min(1 - EPS, probs[actual]));
  return Number((-Math.log(pActual)).toFixed(4));
}

function reconstructThreeWayProbs(
  record: HistoricalPredictionRecord
): { home: number; draw: number; away: number } {
  const p = Math.max(0.15, Math.min(0.88, record.predictedProb));
  const rem = 1 - p;
  if (record.predictedSelection === 'home') {
    return { home: p, draw: rem * 0.48, away: rem * 0.52 };
  }
  if (record.predictedSelection === 'away') {
    return { home: rem * 0.52, draw: rem * 0.48, away: p };
  }
  return { home: rem * 0.55, draw: p, away: rem * 0.45 };
}

/**
 * Evaluates the prediction model across settled historical records and any finished
 * matches from the current dataset, computing Brier score, Log Loss, Expected Calibration Error,
 * and binned reliability curves for Recharts visualization.
 */
export function runBacktestEvaluation(
  performance: PerformanceSummary | null,
  matches: MatchWithPrediction[],
  leagueFilter: string = 'all'
): BacktestReport {
  const sampleMap = new Map<string, BacktestSample>();

  // 1. Add finished matches from live/current dataset using exact full 3-way predictions
  for (const m of matches) {
    if (m.status !== 'finished' || !m.score) continue;
    const actualResult: 'home' | 'draw' | 'away' =
      m.score.home > m.score.away ? 'home' : m.score.home < m.score.away ? 'away' : 'draw';
    const probs = {
      home: m.prediction.homeWinProb,
      draw: m.prediction.drawProb,
      away: m.prediction.awayWinProb,
    };
    const brier = computeMultiClassBrier(probs, actualResult);
    const logLoss = computeMultiClassLogLoss(probs, actualResult);

    sampleMap.set(m.id, {
      id: m.id,
      date: m.dateKey,
      leagueId: m.leagueId,
      leagueName: m.leagueName,
      homeTeam: m.homeTeam.shortName,
      awayTeam: m.awayTeam.shortName,
      predictedSelection: m.prediction.topOutcome.selection,
      predictedProb: m.prediction.topOutcome.probability,
      probs,
      actualResult,
      actualScore: `${m.score.home}-${m.score.away}`,
      confidenceBand: m.prediction.confidenceBand,
      hit: m.prediction.topOutcome.selection === actualResult,
      brierScore: brier,
      logLoss,
    });
  }

  // 2. Merge historical settled records from performance summary
  if (performance?.recentResults) {
    for (const r of performance.recentResults) {
      if (sampleMap.has(r.id)) continue;
      const probs = reconstructThreeWayProbs(r);
      const brier = computeMultiClassBrier(probs, r.actualResult);
      const logLoss = computeMultiClassLogLoss(probs, r.actualResult);
      sampleMap.set(r.id, {
        id: r.id,
        date: r.date,
        leagueId: r.leagueId,
        leagueName: r.leagueName,
        homeTeam: r.homeTeam,
        awayTeam: r.awayTeam,
        predictedSelection: r.predictedSelection,
        predictedProb: r.predictedProb,
        probs,
        actualResult: r.actualResult,
        actualScore: r.actualScore,
        confidenceBand: r.confidenceBand,
        hit: r.hit,
        brierScore: brier,
        logLoss,
      });
    }
  }

  const allSamples = Array.from(sampleMap.values())
    .filter((s) => (leagueFilter === 'all' ? true : s.leagueId === leagueFilter))
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalMatches = allSamples.length;
  if (totalMatches === 0) {
    return {
      totalMatches: 0,
      hitRate: 0,
      avgBrierScore: 0,
      avgLogLoss: 0,
      calibrationErrorEce: 0,
      calibrationBins: [],
      byLeague: [],
      samples: [],
    };
  }

  const hits = allSamples.filter((s) => s.hit).length;
  const hitRate = Number((hits / totalMatches).toFixed(4));
  const avgBrierScore = Number(
    (allSamples.reduce((acc, s) => acc + s.brierScore, 0) / totalMatches).toFixed(4)
  );
  const avgLogLoss = Number(
    (allSamples.reduce((acc, s) => acc + s.logLoss, 0) / totalMatches).toFixed(4)
  );

  // Build reliability / calibration bins across all 3 outcome probabilities per match (3 * N events)
  const binEdges = [
    { min: 0.0, max: 0.2, label: '0–20%', center: 10 },
    { min: 0.2, max: 0.35, label: '20–35%', center: 27.5 },
    { min: 0.35, max: 0.5, label: '35–50%', center: 42.5 },
    { min: 0.5, max: 0.65, label: '50–65%', center: 57.5 },
    { min: 0.65, max: 1.01, label: '65%+', center: 75 },
  ];

  const binAcc = binEdges.map((edge) => ({
    ...edge,
    predSum: 0,
    actualSum: 0,
    count: 0,
  }));

  for (const s of allSamples) {
    const outcomes: Array<['home' | 'draw' | 'away', number]> = [
      ['home', s.probs.home],
      ['draw', s.probs.draw],
      ['away', s.probs.away],
    ];
    for (const [key, prob] of outcomes) {
      const occurred = s.actualResult === key ? 1 : 0;
      const bin = binAcc.find((b) => prob >= b.min && prob < b.max) ?? binAcc[binAcc.length - 1];
      bin.predSum += prob;
      bin.actualSum += occurred;
      bin.count += 1;
    }
  }

  const totalEvents = totalMatches * 3;
  let ece = 0;
  const calibrationBins: CalibrationBin[] = binAcc
    .filter((b) => b.count > 0)
    .map((b) => {
      const avgPred = b.predSum / b.count;
      const avgAct = b.actualSum / b.count;
      ece += (b.count / totalEvents) * Math.abs(avgPred - avgAct);
      return {
        binLabel: b.label,
        binCenterPct: b.center,
        predictedPct: Number((avgPred * 100).toFixed(1)),
        actualPct: Number((avgAct * 100).toFixed(1)),
        perfectPct: Number((avgPred * 100).toFixed(1)),
        count: b.count,
      };
    });

  // League breakdown
  const leagueMap = new Map<
    string,
    { leagueId: string; leagueName: string; total: number; hits: number; brier: number; logLoss: number }
  >();
  for (const s of allSamples) {
    const entry = leagueMap.get(s.leagueId) ?? {
      leagueId: s.leagueId,
      leagueName: s.leagueName,
      total: 0,
      hits: 0,
      brier: 0,
      logLoss: 0,
    };
    entry.total += 1;
    if (s.hit) entry.hits += 1;
    entry.brier += s.brierScore;
    entry.logLoss += s.logLoss;
    leagueMap.set(s.leagueId, entry);
  }

  const byLeague = Array.from(leagueMap.values())
    .map((l) => ({
      leagueId: l.leagueId,
      leagueName: l.leagueName,
      total: l.total,
      hitRate: Number((l.hits / l.total).toFixed(4)),
      avgBrier: Number((l.brier / l.total).toFixed(4)),
      avgLogLoss: Number((l.logLoss / l.total).toFixed(4)),
    }))
    .sort((a, b) => b.total - a.total);

  return {
    totalMatches,
    hitRate,
    avgBrierScore,
    avgLogLoss,
    calibrationErrorEce: Number((ece * 100).toFixed(2)),
    calibrationBins,
    byLeague,
    samples: allSamples,
  };
}
