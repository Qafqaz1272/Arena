import type {
  ConfidenceBand,
  FormEntry,
  HeadToHeadEntry,
  MatchPrediction,
  MatchRecord,
  PlayerAbsence,
  PredictionFactor,
  ScorelineProbability,
} from '../types/football';

const MAX_GOALS = 8;
const DIXON_COLES_RHO = -0.085;
const CALIBRATION_SHRINKAGE = 0.08;

/**
 * Computes exact Poisson probability mass P(X = k; lambda).
 */
export function poissonPmf(lambda: number, k: number): number {
  if (lambda <= 0) {
    return k === 0 ? 1 : 0;
  }
  if (k < 0 || !Number.isInteger(k)) {
    return 0;
  }
  let logFact = 0;
  for (let i = 2; i <= k; i += 1) {
    logFact += Math.log(i);
  }
  return Math.exp(k * Math.log(lambda) - lambda - logFact);
}

/**
 * Dixon-Coles low-score correlation adjustment factor tau(x, y).
 * Corrects standard independent Poisson's underestimation of 0-0 and 1-1 draws.
 */
export function dixonColesTau(
  homeGoals: number,
  awayGoals: number,
  lambdaHome: number,
  lambdaAway: number,
  rho: number = DIXON_COLES_RHO
): number {
  if (homeGoals === 0 && awayGoals === 0) {
    return Math.max(0.05, 1 - lambdaHome * lambdaAway * rho);
  }
  if (homeGoals === 0 && awayGoals === 1) {
    return Math.max(0.05, 1 + lambdaHome * rho);
  }
  if (homeGoals === 1 && awayGoals === 0) {
    return Math.max(0.05, 1 + lambdaAway * rho);
  }
  if (homeGoals === 1 && awayGoals === 1) {
    return Math.max(0.05, 1 - rho);
  }
  return 1;
}

/**
 * Standard Elo expected score for home side including calibrated home-field Elo boost.
 */
export function computeEloExpected(
  homeElo: number,
  awayElo: number,
  homeEloBonus: number = 55
): number {
  const diff = homeElo + homeEloBonus - awayElo;
  return 1 / (1 + Math.pow(10, -diff / 400));
}

/**
 * Exponentially decayed recent form score in [0, 1].
 * Assumes form[0] is the most recent match and form[n-1] is the oldest.
 */
export function computeWeightedFormScore(form: FormEntry[]): number {
  if (!form || form.length === 0) {
    return 0.5;
  }
  const decay = 0.84;
  let weightedSum = 0;
  let weightTotal = 0;

  form.slice(0, 10).forEach((entry, idx) => {
    const w = Math.pow(decay, idx);
    const resultPoints = entry.result === 'W' ? 1 : entry.result === 'D' ? 0.45 : 0;
    const goalDiff = Math.max(-3, Math.min(3, entry.goalsFor - entry.goalsAgainst));
    const gdModifier = (goalDiff / 3) * 0.14;
    const matchScore = clamp(resultPoints + gdModifier, 0, 1);
    weightedSum += matchScore * w;
    weightTotal += w;
  });

  return weightTotal > 0 ? weightedSum / weightTotal : 0.5;
}

/**
 * Empirical-Bayes shrunk Head-to-Head edge in [-1, 1] (>0 favors homeTeamId).
 */
export function computeH2HEdge(
  h2h: HeadToHeadEntry[],
  homeTeamId: string
): { edge: number; homeWins: number; draws: number; awayWins: number; sampleSize: number } {
  if (!h2h || h2h.length === 0) {
    return { edge: 0, homeWins: 0, draws: 0, awayWins: 0, sampleSize: 0 };
  }

  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  let scoreSum = 0;

  for (const item of h2h) {
    const isHomeListedFirst = item.homeTeamId === homeTeamId;
    const gf = isHomeListedFirst ? item.homeGoals : item.awayGoals;
    const ga = isHomeListedFirst ? item.awayGoals : item.homeGoals;

    if (gf > ga) {
      homeWins += 1;
      scoreSum += 1;
    } else if (gf < ga) {
      awayWins += 1;
      scoreSum -= 1;
    } else {
      draws += 1;
    }
  }

  const n = h2h.length;
  // Shrink toward 0 when sample size is small (prior pseudo-count = 5)
  const shrinkage = n / (n + 5);
  const rawAvg = scoreSum / n;
  return {
    edge: clamp(rawAvg * shrinkage, -0.75, 0.75),
    homeWins,
    draws,
    awayWins,
    sampleSize: n,
  };
}

/**
 * Computes offensive & defensive availability penalties from injured/suspended players.
 */
export function computeAvailabilityImpact(absences: PlayerAbsence[]): {
  attackPenalty: number;
  defensePenalty: number;
  totalSeverity: number;
  keyCount: number;
} {
  if (!absences || absences.length === 0) {
    return { attackPenalty: 0, defensePenalty: 0, totalSeverity: 0, keyCount: 0 };
  }

  let attackPenalty = 0;
  let defensePenalty = 0;
  let keyCount = 0;

  for (const a of absences) {
    const base = a.impact === 'key' ? 0.075 : a.impact === 'rotation' ? 0.032 : 0.012;
    if (a.impact === 'key') keyCount += 1;

    if (a.position === 'FW') {
      attackPenalty += base * 1.15;
    } else if (a.position === 'MF') {
      attackPenalty += base * 0.65;
      defensePenalty += base * 0.5;
    } else if (a.position === 'DF') {
      defensePenalty += base * 1.05;
      attackPenalty += base * 0.15;
    } else {
      // GK
      defensePenalty += base * 1.25;
    }
  }

  // Cap penalties so extreme injury lists stay physically realistic
  const cappedAttack = Math.min(0.24, attackPenalty);
  const cappedDefense = Math.min(0.26, defensePenalty);
  return {
    attackPenalty: cappedAttack,
    defensePenalty: cappedDefense,
    totalSeverity: Number((cappedAttack + cappedDefense).toFixed(3)),
    keyCount,
  };
}

/**
 * Evaluates schedule congestion and physical fatigue based on matches played
 * in the 7 days immediately preceding the target match date.
 */
export function computeFatigueImpact(
  form: FormEntry[],
  referenceDateIso: string
): {
  matchesLast7Days: number;
  restDays: number | null;
  attackPenalty: number;
  defensePenalty: number;
  totalPenalty: number;
  isCongested: boolean;
} {
  if (!form || form.length === 0) {
    return {
      matchesLast7Days: 0,
      restDays: null,
      attackPenalty: 0,
      defensePenalty: 0,
      totalPenalty: 0,
      isCongested: false,
    };
  }

  const toUtcDayMs = (raw: string): number => {
    const matchDay = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw.trim());
    if (matchDay) {
      return Date.UTC(Number(matchDay[1]), Number(matchDay[2]) - 1, Number(matchDay[3]));
    }
    const parsed = Date.parse(raw);
    if (!Number.isFinite(parsed)) return Number.NaN;
    const d = new Date(parsed);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  };

  const refDayMs = toUtcDayMs(referenceDateIso);
  if (!Number.isFinite(refDayMs)) {
    return {
      matchesLast7Days: 0,
      restDays: null,
      attackPenalty: 0,
      defensePenalty: 0,
      totalPenalty: 0,
      isCongested: false,
    };
  }

  const DAY_MS = 24 * 60 * 60 * 1000;
  let matchesLast7Days = 0;
  let minRestDays: number | null = null;

  for (const entry of form) {
    const entryDayMs = toUtcDayMs(entry.date);
    if (!Number.isFinite(entryDayMs)) continue;
    const diffDays = Math.round((refDayMs - entryDayMs) / DAY_MS);
    if (diffDays <= 0) continue; // Ignore same-day or future entries
    if (diffDays <= 7) {
      matchesLast7Days += 1;
    }
    if (minRestDays === null || diffDays < minRestDays) {
      minRestDays = diffDays;
    }
  }

  let basePenalty = 0;
  if (matchesLast7Days === 1) basePenalty = 0.01;
  else if (matchesLast7Days === 2) basePenalty = 0.05;
  else if (matchesLast7Days >= 3) basePenalty = 0.095;

  // Short turnaround penalty when last match was <= 3 days ago
  if (minRestDays !== null && minRestDays <= 3) {
    basePenalty += 0.025;
  }

  const totalPenalty = Number(clamp(basePenalty, 0, 0.135).toFixed(3));
  return {
    matchesLast7Days,
    restDays: minRestDays,
    attackPenalty: Number((totalPenalty * 0.85).toFixed(3)),
    defensePenalty: Number((totalPenalty * 0.75).toFixed(3)),
    totalPenalty,
    isCongested: matchesLast7Days >= 2 || (minRestDays !== null && minRestDays <= 3),
  };
}

/**
 * Calibrates raw 1X2 probabilities via gentle shrinkage toward uniform prior
 * to avoid overconfident tails and reflect real-world football variance.
 */
export function calibrateThreeWayProbabilities(
  rawHome: number,
  rawDraw: number,
  rawAway: number,
  shrinkage: number = CALIBRATION_SHRINKAGE
): { home: number; draw: number; away: number } {
  const total = rawHome + rawDraw + rawAway;
  const normH = total > 0 ? rawHome / total : 1 / 3;
  const normD = total > 0 ? rawDraw / total : 1 / 3;
  const normA = total > 0 ? rawAway / total : 1 / 3;

  // Football empirical prior slightly favors home & draw less than uniform 1/3
  const priorH = 0.42;
  const priorD = 0.27;
  const priorA = 0.31;

  let h = (1 - shrinkage) * normH + shrinkage * priorH;
  let d = (1 - shrinkage) * normD + shrinkage * priorD;
  let a = (1 - shrinkage) * normA + shrinkage * priorA;

  // Enforce honest lower bounds first, then normalize
  h = Math.max(h, 0.04);
  d = Math.max(d, 0.08);
  a = Math.max(a, 0.04);

  const sum1 = h + d + a;
  h /= sum1;
  d /= sum1;
  a /= sum1;

  // Enforce honest upper bound (never claim near-100% certainty)
  const MAX_PROB = 0.85;
  if (h > MAX_PROB) {
    const excess = h - MAX_PROB;
    h = MAX_PROB;
    const otherSum = d + a;
    d += excess * (d / otherSum);
    a += excess * (a / otherSum);
  } else if (a > MAX_PROB) {
    const excess = a - MAX_PROB;
    a = MAX_PROB;
    const otherSum = h + d;
    h += excess * (h / otherSum);
    d += excess * (d / otherSum);
  }

  return { home: h, draw: d, away: a };
}

/**
 * Generates normalized bivariate Poisson + Dixon-Coles scoreline matrix.
 */
export function buildScorelineMatrix(
  lambdaHome: number,
  lambdaAway: number
): ScorelineProbability[] {
  const entries: ScorelineProbability[] = [];
  let sum = 0;

  for (let hg = 0; hg <= MAX_GOALS; hg += 1) {
    const pH = poissonPmf(lambdaHome, hg);
    for (let ag = 0; ag <= MAX_GOALS; ag += 1) {
      const pA = poissonPmf(lambdaAway, ag);
      const tau = dixonColesTau(hg, ag, lambdaHome, lambdaAway);
      const prob = pH * pA * tau;
      sum += prob;
      entries.push({
        score: `${hg}-${ag}`,
        homeGoals: hg,
        awayGoals: ag,
        probability: prob,
      });
    }
  }

  return entries.map((e) => ({
    ...e,
    probability: sum > 0 ? e.probability / sum : 0,
  }));
}

/**
 * Full transparent statistical match prediction combining:
 * 1. Poisson attack/defense goal model (blending goals & xG)
 * 2. Elo rating differential
 * 3. Exponentially decayed recent form (last 10)
 * 4. League & team home-advantage splits
 * 5. Empirical-Bayes shrunk H2H history
 * 6. Squad availability (injuries & suspensions)
 */
export function predictMatch(match: MatchRecord): MatchPrediction {
  const { homeTeam, awayTeam, leagueAvgHomeGoals, leagueAvgAwayGoals, leagueHomeAdvantage, h2h } =
    match;

  // 1. Attack & Defense ratings (blend actual goals and xG when available)
  const homePlayed = Math.max(1, homeTeam.homeSplit.played);
  const awayPlayed = Math.max(1, awayTeam.awaySplit.played);

  const homeGFPerGame = homeTeam.homeSplit.goalsFor / homePlayed;
  const homeGAPerGame = homeTeam.homeSplit.goalsAgainst / homePlayed;
  const awayGFPerGame = awayTeam.awaySplit.goalsFor / awayPlayed;
  const awayGAPerGame = awayTeam.awaySplit.goalsAgainst / awayPlayed;

  const homeAttackRate =
    match.hasXG && homeTeam.homeSplit.xGFor !== undefined
      ? 0.45 * homeGFPerGame + 0.55 * (homeTeam.homeSplit.xGFor / homePlayed)
      : homeGFPerGame;
  const homeDefenseRate =
    match.hasXG && homeTeam.homeSplit.xGAgainst !== undefined
      ? 0.45 * homeGAPerGame + 0.55 * (homeTeam.homeSplit.xGAgainst / homePlayed)
      : homeGAPerGame;
  const awayAttackRate =
    match.hasXG && awayTeam.awaySplit.xGFor !== undefined
      ? 0.45 * awayGFPerGame + 0.55 * (awayTeam.awaySplit.xGFor / awayPlayed)
      : awayGFPerGame;
  const awayDefenseRate =
    match.hasXG && awayTeam.awaySplit.xGAgainst !== undefined
      ? 0.45 * awayGAPerGame + 0.55 * (awayTeam.awaySplit.xGAgainst / awayPlayed)
      : awayGAPerGame;

  // Regress raw home/away attack & defense strengths toward league average (1.0)
  // to avoid overfitting small home/away split samples and double-counting with Elo/form.
  const rawHomeAttack = clamp(homeAttackRate / Math.max(0.6, leagueAvgHomeGoals), 0.55, 1.85);
  const rawHomeDefense = clamp(homeDefenseRate / Math.max(0.5, leagueAvgAwayGoals), 0.55, 1.85);
  const rawAwayAttack = clamp(awayAttackRate / Math.max(0.5, leagueAvgAwayGoals), 0.55, 1.85);
  const rawAwayDefense = clamp(awayDefenseRate / Math.max(0.6, leagueAvgHomeGoals), 0.55, 1.85);

  const homeAttackStrength = 0.6 * rawHomeAttack + 0.4;
  const homeDefenseWeakness = 0.6 * rawHomeDefense + 0.4;
  const awayAttackStrength = 0.6 * rawAwayAttack + 0.4;
  const awayDefenseWeakness = 0.6 * rawAwayDefense + 0.4;

  let lambdaHome = leagueAvgHomeGoals * homeAttackStrength * awayDefenseWeakness;
  let lambdaAway = leagueAvgAwayGoals * awayAttackStrength * homeDefenseWeakness;

  // 2. Elo adjustment (gentle calibrated shift on top of Poisson baseline)
  const eloDiff = homeTeam.elo - awayTeam.elo;
  const eloExpectedHome = computeEloExpected(homeTeam.elo, awayTeam.elo, 45);
  const eloShift = clamp((eloExpectedHome - 0.5) * 0.42, -0.22, 0.22);
  lambdaHome *= 1 + eloShift * 0.65;
  lambdaAway *= 1 - eloShift * 0.55;

  // 3. Recent form weighting (last 10 matches)
  const homeForm = computeWeightedFormScore(homeTeam.last10Form);
  const awayForm = computeWeightedFormScore(awayTeam.last10Form);
  const formDelta = homeForm - awayForm; // in [-1, 1]
  lambdaHome *= 1 + formDelta * 0.11;
  lambdaAway *= 1 - formDelta * 0.1;

  // 4. Home advantage (league baseline + team home/away PPG split, moderated to avoid double-counting)
  const homeSplitPpg = (homeTeam.homeSplit.wins * 3 + homeTeam.homeSplit.draws) / homePlayed;
  const awaySplitPpg = (awayTeam.awaySplit.wins * 3 + awayTeam.awaySplit.draws) / awayPlayed;
  const venueBoost = clamp(
    (leagueHomeAdvantage - 1) * 0.22 + (homeSplitPpg - awaySplitPpg) * 0.014,
    -0.04,
    0.09
  );
  lambdaHome *= 1 + venueBoost;
  lambdaAway *= 1 - venueBoost * 0.3;

  // 5. Head-to-head empirical-Bayes edge
  const h2hStats = computeH2HEdge(h2h, homeTeam.id);
  lambdaHome *= 1 + h2hStats.edge * 0.06;
  lambdaAway *= 1 - h2hStats.edge * 0.05;

  // 6. Squad availability (injuries & suspensions)
  const homeAvail = computeAvailabilityImpact(homeTeam.absences);
  const awayAvail = computeAvailabilityImpact(awayTeam.absences);
  lambdaHome *= (1 - homeAvail.attackPenalty) * (1 + awayAvail.defensePenalty * 0.65);
  lambdaAway *= (1 - awayAvail.attackPenalty) * (1 + homeAvail.defensePenalty * 0.65);

  // 7. Fatigue & schedule congestion (matches played in last 7 days)
  const refDate = match.kickoffIso || match.dateKey;
  const homeFatigue = computeFatigueImpact(homeTeam.last10Form, refDate);
  const awayFatigue = computeFatigueImpact(awayTeam.last10Form, refDate);
  lambdaHome *= (1 - homeFatigue.attackPenalty) * (1 + awayFatigue.defensePenalty * 0.6);
  lambdaAway *= (1 - awayFatigue.attackPenalty) * (1 + homeFatigue.defensePenalty * 0.6);

  // Clamp full-90 pre-match lambdas to realistic football scoring range
  lambdaHome = clamp(lambdaHome, 0.4, 3.15);
  lambdaAway = clamp(lambdaAway, 0.35, 2.95);

  const isLive = match.status === 'live' && match.score !== undefined;
  let matrix: ScorelineProbability[];
  let calibrated: { home: number; draw: number; away: number };
  let over25Prob: number;
  let under25Prob: number;
  let bttsYesProb: number;
  let bttsNoProb: number;
  let liveMinute: number | undefined;
  let remainingExpectedGoals: { home: number; away: number } | undefined;
  let remainingFraction = 1;

  if (isLive && match.score) {
    const curHome = Math.max(0, match.score.home);
    const curAway = Math.max(0, match.score.away);
    liveMinute = clamp(match.minute ?? 45, 1, 90);
    // 92-minute effective horizon accounts for typical stoppage time
    remainingFraction = clamp((92 - liveMinute) / 92, 0.035, 0.99);

    const scoreDiff = curHome - curAway;
    let homeStateMult = 1;
    let awayStateMult = 1;
    if (scoreDiff === 1) {
      homeStateMult = 0.94;
      awayStateMult = 1.08;
    } else if (scoreDiff >= 2) {
      homeStateMult = 0.9;
      awayStateMult = 1.05;
    } else if (scoreDiff === -1) {
      homeStateMult = 1.08;
      awayStateMult = 0.94;
    } else if (scoreDiff <= -2) {
      homeStateMult = 1.05;
      awayStateMult = 0.9;
    }

    // Subtle live match-tempo adjustment when in-play shots on target are available
    if (match.liveStats?.shotsOnTarget) {
      const sotDiff = clamp(
        (match.liveStats.shotsOnTarget.home - match.liveStats.shotsOnTarget.away) / 8,
        -0.12,
        0.12
      );
      homeStateMult *= 1 + sotDiff;
      awayStateMult *= 1 - sotDiff;
    }

    const remLambdaHome = clamp(lambdaHome * remainingFraction * homeStateMult, 0.03, 3.0);
    const remLambdaAway = clamp(lambdaAway * remainingFraction * awayStateMult, 0.03, 3.0);
    remainingExpectedGoals = {
      home: Number(remLambdaHome.toFixed(2)),
      away: Number(remLambdaAway.toFixed(2)),
    };

    // Build remaining-goals matrix and shift by current live score
    const remMatrix = buildScorelineMatrix(remLambdaHome, remLambdaAway);
    matrix = remMatrix.map((cell) => {
      const finalH = curHome + cell.homeGoals;
      const finalA = curAway + cell.awayGoals;
      return {
        score: `${finalH}-${finalA}`,
        homeGoals: finalH,
        awayGoals: finalA,
        probability: cell.probability,
      };
    });

    let rawHome = 0;
    let rawDraw = 0;
    let rawAway = 0;
    let over25Raw = 0;
    let bttsYesRaw = 0;

    for (const cell of matrix) {
      if (cell.homeGoals > cell.awayGoals) rawHome += cell.probability;
      else if (cell.homeGoals === cell.awayGoals) rawDraw += cell.probability;
      else rawAway += cell.probability;

      if (cell.homeGoals + cell.awayGoals >= 3) over25Raw += cell.probability;
      if (cell.homeGoals >= 1 && cell.awayGoals >= 1) bttsYesRaw += cell.probability;
    }

    // Time-decayed shrinkage: avoids artificially suppressing strong late-game leads
    const liveShrinkage = CALIBRATION_SHRINKAGE * remainingFraction;
    const prePrior = calibrateThreeWayProbabilities(rawHome, rawDraw, rawAway, 0);
    let h = clamp((1 - liveShrinkage) * rawHome + liveShrinkage * prePrior.home, 0.01, 0.97);
    let d = clamp((1 - liveShrinkage) * rawDraw + liveShrinkage * prePrior.draw, 0.01, 0.97);
    let a = clamp((1 - liveShrinkage) * rawAway + liveShrinkage * prePrior.away, 0.01, 0.97);
    const liveSum = h + d + a;
    calibrated = { home: h / liveSum, draw: d / liveSum, away: a / liveSum };

    if (curHome + curAway >= 3) {
      over25Prob = 0.99;
      under25Prob = 0.01;
    } else {
      over25Prob = clamp(
        over25Raw * (1 - 0.04 * remainingFraction) + 0.02 * remainingFraction,
        0.02,
        0.98
      );
      under25Prob = 1 - over25Prob;
    }

    if (curHome >= 1 && curAway >= 1) {
      bttsYesProb = 0.99;
      bttsNoProb = 0.01;
    } else {
      bttsYesProb = clamp(
        bttsYesRaw * (1 - 0.04 * remainingFraction) + 0.02 * remainingFraction,
        0.02,
        0.98
      );
      bttsNoProb = 1 - bttsYesProb;
    }
  } else {
    // Pre-match (upcoming or finished historical backtest) normalized scoreline distribution
    matrix = buildScorelineMatrix(lambdaHome, lambdaAway);

    let rawHome = 0;
    let rawDraw = 0;
    let rawAway = 0;
    let over25Raw = 0;
    let bttsYesRaw = 0;

    for (const cell of matrix) {
      if (cell.homeGoals > cell.awayGoals) rawHome += cell.probability;
      else if (cell.homeGoals === cell.awayGoals) rawDraw += cell.probability;
      else rawAway += cell.probability;

      if (cell.homeGoals + cell.awayGoals >= 3) over25Raw += cell.probability;
      if (cell.homeGoals >= 1 && cell.awayGoals >= 1) bttsYesRaw += cell.probability;
    }

    // Calibrate 1X2 and binary markets honestly
    calibrated = calibrateThreeWayProbabilities(rawHome, rawDraw, rawAway);
    over25Prob = clamp(over25Raw * 0.94 + 0.03, 0.14, 0.84);
    under25Prob = 1 - over25Prob;
    bttsYesProb = clamp(bttsYesRaw * 0.94 + 0.03, 0.14, 0.83);
    bttsNoProb = 1 - bttsYesProb;
  }

  const topScorelines = [...matrix]
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 5)
    .map((s) => ({
      ...s,
      probability: Number(s.probability.toFixed(4)),
    }));

  // Determine highest-probability 1X2 outcome
  const outcomes: Array<{ selection: 'home' | 'draw' | 'away'; probability: number }> = [
    { selection: 'home', probability: calibrated.home },
    { selection: 'draw', probability: calibrated.draw },
    { selection: 'away', probability: calibrated.away },
  ];
  outcomes.sort((a, b) => b.probability - a.probability);
  const topOutcome = outcomes[0];

  // Determine strongest market pick across 1X2, O/U 2.5, BTTS
  const candidatePicks: Array<MatchPrediction['bestMarketPick']> = [
    { market: '1x2', selection: topOutcome.selection, probability: topOutcome.probability },
    {
      market: 'over25',
      selection: over25Prob >= under25Prob ? 'over25' : 'under25',
      probability: Math.max(over25Prob, under25Prob),
    },
    {
      market: 'btts',
      selection: bttsYesProb >= bttsNoProb ? 'btts_yes' : 'btts_no',
      probability: Math.max(bttsYesProb, bttsNoProb),
    },
  ];
  candidatePicks.sort((a, b) => b.probability - a.probability);
  const bestMarketPick = candidatePicks[0];

  // Transparent confidence score (0-100) & uncertainty margin
  const separation = outcomes[0].probability - outcomes[1].probability;
  const dataQualityBonus =
    (match.hasXG ? 5 : 0) +
    (homeTeam.last10Form.length >= 8 && awayTeam.last10Form.length >= 8 ? 4 : 0) +
    (h2hStats.sampleSize >= 3 ? 2 : 0) +
    (isLive ? Math.round((1 - remainingFraction) * 8) : 0);
  const squadUncertaintyPenalty = (homeAvail.keyCount + awayAvail.keyCount) * 3.5;
  const fatigueUncertaintyPenalty =
    (homeFatigue.matchesLast7Days >= 2 ? 1.5 : 0) + (awayFatigue.matchesLast7Days >= 2 ? 1.5 : 0);

  const rawConfidence =
    30 +
    separation * 78 +
    (topOutcome.probability - 0.34) * 34 +
    dataQualityBonus -
    squadUncertaintyPenalty -
    fatigueUncertaintyPenalty;
  const confidenceScore = Math.round(clamp(rawConfidence, 28, isLive ? 92 : 86));

  const confidenceBand: ConfidenceBand =
    confidenceScore >= 70 ? 'high' : confidenceScore >= 54 ? 'medium' : 'low';

  // Uncertainty margin (± percentage points) shrinks modestly as live match approaches full time
  const baseUncertainty = clamp(0.115 - confidenceScore * 0.0008, 0.038, 0.095);
  const uncertaintyMargin = Number(
    (isLive ? clamp(baseUncertainty * Math.sqrt(Math.max(0.15, remainingFraction)), 0.018, 0.09) : baseUncertainty).toFixed(3)
  );

  // Transparent 7-factor breakdown (weights sum to 100)
  const poissonEdge = clamp((lambdaHome - lambdaAway) / 2.2, -1, 1);
  const eloEdge = clamp(eloDiff / 280, -1, 1);
  const formEdge = clamp(formDelta * 1.4, -1, 1);
  const homeAdvEdge = clamp(venueBoost * 5.2, -1, 1);
  const availEdge = clamp((awayAvail.totalSeverity - homeAvail.totalSeverity) * 3.2, -1, 1);
  const fatigueEdge = clamp((awayFatigue.totalPenalty - homeFatigue.totalPenalty) * 7.5, -1, 1);

  const factors: PredictionFactor[] = [
    {
      key: 'poisson_attack_defense',
      weight: 30,
      homeEdge: Number(poissonEdge.toFixed(2)),
      metrics: {
        homeXG: Number(lambdaHome.toFixed(2)),
        awayXG: Number(lambdaAway.toFixed(2)),
        homeAttack: Number(homeAttackStrength.toFixed(2)),
        awayAttack: Number(awayAttackStrength.toFixed(2)),
      },
    },
    {
      key: 'elo_rating',
      weight: 22,
      homeEdge: Number(eloEdge.toFixed(2)),
      metrics: {
        homeElo: homeTeam.elo,
        awayElo: awayTeam.elo,
        diff: eloDiff,
      },
    },
    {
      key: 'recent_form',
      weight: 16,
      homeEdge: Number(formEdge.toFixed(2)),
      metrics: {
        homeFormPct: Math.round(homeForm * 100),
        awayFormPct: Math.round(awayForm * 100),
      },
    },
    {
      key: 'home_advantage',
      weight: 11,
      homeEdge: Number(homeAdvEdge.toFixed(2)),
      metrics: {
        homePpg: Number(homeSplitPpg.toFixed(2)),
        awayPpg: Number(awaySplitPpg.toFixed(2)),
        leagueFactor: Number(leagueHomeAdvantage.toFixed(2)),
      },
    },
    {
      key: 'head_to_head',
      weight: 7,
      homeEdge: Number(h2hStats.edge.toFixed(2)),
      metrics: {
        homeWins: h2hStats.homeWins,
        draws: h2hStats.draws,
        awayWins: h2hStats.awayWins,
        sampleSize: h2hStats.sampleSize,
      },
    },
    {
      key: 'squad_availability',
      weight: 7,
      homeEdge: Number(availEdge.toFixed(2)),
      metrics: {
        homeAbsences: homeTeam.absences.length,
        awayAbsences: awayTeam.absences.length,
        homeKeyAbsences: homeAvail.keyCount,
        awayKeyAbsences: awayAvail.keyCount,
      },
    },
    {
      key: 'fatigue_congestion',
      weight: 7,
      homeEdge: Number(fatigueEdge.toFixed(2)),
      metrics: {
        homeMatches7d: homeFatigue.matchesLast7Days,
        awayMatches7d: awayFatigue.matchesLast7Days,
        homeRestDays: homeFatigue.restDays ?? '—',
        awayRestDays: awayFatigue.restDays ?? '—',
      },
    },
  ];

  return {
    matchId: match.id,
    homeWinProb: Number(calibrated.home.toFixed(4)),
    drawProb: Number(calibrated.draw.toFixed(4)),
    awayWinProb: Number(calibrated.away.toFixed(4)),
    over25Prob: Number(over25Prob.toFixed(4)),
    under25Prob: Number(under25Prob.toFixed(4)),
    bttsYesProb: Number(bttsYesProb.toFixed(4)),
    bttsNoProb: Number(bttsNoProb.toFixed(4)),
    expectedGoals: {
      home: Number(lambdaHome.toFixed(2)),
      away: Number(lambdaAway.toFixed(2)),
    },
    topScorelines,
    topOutcome: {
      selection: topOutcome.selection,
      probability: Number(topOutcome.probability.toFixed(4)),
    },
    bestMarketPick: {
      ...bestMarketPick,
      probability: Number(bestMarketPick.probability.toFixed(4)),
    },
    confidenceScore,
    confidenceBand,
    uncertaintyMargin,
    isLiveAdjusted: isLive || undefined,
    liveMinute,
    remainingExpectedGoals,
    factors,
  };
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
