export type ValueSelectionKey = 'home' | 'draw' | 'away' | 'over25' | 'btts_yes';

export interface ValueBetCalculation {
  selection: ValueSelectionKey;
  modelProb: number; // 0..1
  bookmakerOdds: number; // decimal odds > 1
  impliedProb: number; // 1 / bookmakerOdds
  fairOdds: number; // 1 / modelProb
  edgeProb: number; // modelProb - impliedProb
  expectedValue: number; // modelProb * bookmakerOdds - 1
  evPercent: number; // expectedValue * 100
  isPositiveEv: boolean;
  /** Conservative quarter-Kelly fraction capped at 5% of bankroll */
  quarterKellyPct: number;
}

export interface BookmakerMarginSummary {
  overroundPct: number;
  impliedSum: number;
  fairHomeProb: number;
  fairDrawProb: number;
  fairAwayProb: number;
}

/**
 * Computes Implied Probability, Expected Value (EV), edge, and conservative
 * quarter-Kelly stake fraction for a single outcome against decimal bookmaker odds.
 */
export function evaluateValueBet(
  selection: ValueSelectionKey,
  modelProb: number,
  bookmakerOdds: number
): ValueBetCalculation | null {
  if (
    !Number.isFinite(modelProb) ||
    !Number.isFinite(bookmakerOdds) ||
    modelProb <= 0 ||
    modelProb >= 1 ||
    bookmakerOdds <= 1.01
  ) {
    return null;
  }

  const impliedProb = 1 / bookmakerOdds;
  const fairOdds = 1 / modelProb;
  const edgeProb = modelProb - impliedProb;
  const expectedValue = modelProb * bookmakerOdds - 1;
  const evPercent = expectedValue * 100;

  // Full Kelly: (b * p - q) / b where b = odds - 1, q = 1 - p
  const b = bookmakerOdds - 1;
  const fullKelly = b > 0 ? (b * modelProb - (1 - modelProb)) / b : 0;
  // Quarter-Kelly capped at 5% for responsible variance control
  const quarterKellyPct =
    fullKelly > 0 ? Math.min(5, Number((fullKelly * 0.25 * 100).toFixed(2))) : 0;

  return {
    selection,
    modelProb: Number(modelProb.toFixed(4)),
    bookmakerOdds: Number(bookmakerOdds.toFixed(2)),
    impliedProb: Number(impliedProb.toFixed(4)),
    fairOdds: Number(fairOdds.toFixed(2)),
    edgeProb: Number(edgeProb.toFixed(4)),
    expectedValue: Number(expectedValue.toFixed(4)),
    evPercent: Number(evPercent.toFixed(2)),
    // Require at least +1.0% EV buffer to classify as positive-EV estimate
    isPositiveEv: evPercent >= 1.0,
    quarterKellyPct,
  };
}

/**
 * Computes bookmaker overround (vig/margin) and de-vigged fair probabilities
 * when all three 1X2 odds are supplied.
 */
export function computeBookmakerMargin(
  homeOdds: number,
  drawOdds: number,
  awayOdds: number
): BookmakerMarginSummary | null {
  if (
    !Number.isFinite(homeOdds) ||
    !Number.isFinite(drawOdds) ||
    !Number.isFinite(awayOdds) ||
    homeOdds <= 1.01 ||
    drawOdds <= 1.01 ||
    awayOdds <= 1.01
  ) {
    return null;
  }

  const impH = 1 / homeOdds;
  const impD = 1 / drawOdds;
  const impA = 1 / awayOdds;
  const impliedSum = impH + impD + impA;

  return {
    overroundPct: Number(((impliedSum - 1) * 100).toFixed(2)),
    impliedSum: Number(impliedSum.toFixed(4)),
    fairHomeProb: Number((impH / impliedSum).toFixed(4)),
    fairDrawProb: Number((impD / impliedSum).toFixed(4)),
    fairAwayProb: Number((impA / impliedSum).toFixed(4)),
  };
}
