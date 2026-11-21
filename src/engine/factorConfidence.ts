import type { MatchWithPrediction, PredictionFactor } from '../types/football';

export type FactorAlignment = 'reinforces' | 'opposes' | 'neutral';

export interface FactorConfidenceBreakdown {
  factorKey: PredictionFactor['key'];
  weight: number;
  alignment: FactorAlignment;
  /** Directional alignment score in [-1, 1] relative to the model's top 1X2 pick */
  alignmentScore: number;
  /** Attributed percentage-point impact via 1X2 probability separation */
  signalImpactPts: number;
  /** Direct confidence bonus/penalty in percentage points (xG, form depth, H2H sample, key absences) */
  directModifierPts: number;
  /** Combined net influence of this factor on final confidenceScore */
  netImpactPts: number;
  /** Key identifying which direct modifier rule applied */
  directModifierReason:
    | 'xg_bonus'
    | 'xg_estimated'
    | 'form_depth_bonus'
    | 'form_depth_limited'
    | 'h2h_sample_bonus'
    | 'h2h_sample_limited'
    | 'key_absences_penalty'
    | 'no_key_absences'
    | 'fatigue_congestion_penalty'
    | 'fatigue_rested'
    | 'signal_only';
  /** Match-level confidence formula summary for transparent reference */
  modelContext: {
    baseConfidence: number;
    finalConfidence: number;
    topSelection: 'home' | 'draw' | 'away';
    topProbabilityPct: number;
    separationPct: number;
    totalSignalPoolPts: number;
    totalDataBonusPts: number;
    totalSquadPenaltyPts: number;
    totalKeyAbsences: number;
    isClamped: boolean;
    capPct: number;
  };
}

function getDirectionalAlignment(
  factor: PredictionFactor,
  topSelection: 'home' | 'draw' | 'away'
): number {
  if (topSelection === 'home') {
    return factor.homeEdge;
  }
  if (topSelection === 'away') {
    return -factor.homeEdge;
  }
  // When Draw is the top outcome, balanced factors (near 0 edge) reinforce the draw,
  // while strongly skewed factors oppose it.
  return Number((0.45 - Math.abs(factor.homeEdge)).toFixed(3));
}

function getDirectModifier(
  factor: PredictionFactor,
  match: MatchWithPrediction
): {
  pts: number;
  reason: FactorConfidenceBreakdown['directModifierReason'];
} {
  switch (factor.key) {
    case 'poisson_attack_defense':
      return match.hasXG
        ? { pts: 5, reason: 'xg_bonus' }
        : { pts: 0, reason: 'xg_estimated' };
    case 'recent_form': {
      const deepSample =
        match.homeTeam.last10Form.length >= 8 && match.awayTeam.last10Form.length >= 8;
      return deepSample
        ? { pts: 4, reason: 'form_depth_bonus' }
        : { pts: 0, reason: 'form_depth_limited' };
    }
    case 'head_to_head': {
      const sampleSize = Number(factor.metrics.sampleSize ?? match.h2h.length);
      return sampleSize >= 3
        ? { pts: 2, reason: 'h2h_sample_bonus' }
        : { pts: 0, reason: 'h2h_sample_limited' };
    }
    case 'squad_availability': {
      const keyAbsences =
        Number(factor.metrics.homeKeyAbsences ?? 0) +
        Number(factor.metrics.awayKeyAbsences ?? 0);
      return keyAbsences > 0
        ? { pts: Number((-keyAbsences * 3.5).toFixed(1)), reason: 'key_absences_penalty' }
        : { pts: 0, reason: 'no_key_absences' };
    }
    case 'fatigue_congestion': {
      const congestedTeams =
        (Number(factor.metrics.homeMatches7d ?? 0) >= 2 ? 1 : 0) +
        (Number(factor.metrics.awayMatches7d ?? 0) >= 2 ? 1 : 0);
      return congestedTeams > 0
        ? { pts: Number((-congestedTeams * 1.5).toFixed(1)), reason: 'fatigue_congestion_penalty' }
        : { pts: 0, reason: 'fatigue_rested' };
    }
    default:
      return { pts: 0, reason: 'signal_only' };
  }
}

/**
 * Pure decomposition of how a specific prediction factor influences the final
 * MatchEdge confidence score percentage. Mirrors the exact equations in
 * predictionEngine.ts (base 30% + separation/peak signal + data bonuses - squad uncertainty).
 */
export function computeFactorConfidenceBreakdown(
  factor: PredictionFactor,
  match: MatchWithPrediction
): FactorConfidenceBreakdown {
  const pred = match.prediction;
  const probs = [pred.homeWinProb, pred.drawProb, pred.awayWinProb].sort((a, b) => b - a);
  const separation = probs[0] - probs[1];
  const topSelection = pred.topOutcome.selection;

  const totalSignalPoolPts = Math.max(
    0,
    separation * 78 + (pred.topOutcome.probability - 0.34) * 34
  );

  const squadFactor = pred.factors.find((f) => f.key === 'squad_availability');
  const totalKeyAbsences =
    Number(squadFactor?.metrics.homeKeyAbsences ?? 0) +
    Number(squadFactor?.metrics.awayKeyAbsences ?? 0);
  const totalSquadPenaltyPts = Number((totalKeyAbsences * 3.5).toFixed(1));

  const h2hFactor = pred.factors.find((f) => f.key === 'head_to_head');
  const h2hSample = Number(h2hFactor?.metrics.sampleSize ?? match.h2h.length);
  const totalDataBonusPts =
    (match.hasXG ? 5 : 0) +
    (match.homeTeam.last10Form.length >= 8 && match.awayTeam.last10Form.length >= 8 ? 4 : 0) +
    (h2hSample >= 3 ? 2 : 0);

  const fatigueFactor = pred.factors.find((f) => f.key === 'fatigue_congestion');
  const congestedCount =
    (Number(fatigueFactor?.metrics.homeMatches7d ?? 0) >= 2 ? 1 : 0) +
    (Number(fatigueFactor?.metrics.awayMatches7d ?? 0) >= 2 ? 1 : 0);
  const totalFatiguePenaltyPts = Number((congestedCount * 1.5).toFixed(1));
  const totalUncertaintyPenaltyPts = Number((totalSquadPenaltyPts + totalFatiguePenaltyPts).toFixed(1));

  // Attribute the probability-separation confidence pool across the 7 weighted factors
  const weightedAlignments = pred.factors.map(
    (f) => (f.weight / 100) * getDirectionalAlignment(f, topSelection)
  );
  const sumWeightedAlignment = weightedAlignments.reduce((acc, v) => acc + v, 0);
  const effectiveDenominator = Math.max(0.28, Math.abs(sumWeightedAlignment));

  const alignmentScore = getDirectionalAlignment(factor, topSelection);
  const rawSignalShare =
    ((factor.weight / 100) * alignmentScore / effectiveDenominator) * totalSignalPoolPts;
  // Clamp single-factor attribution to keep extreme cancellations interpretable
  const signalImpactPts = Number(
    Math.max(-18, Math.min(totalSignalPoolPts, rawSignalShare)).toFixed(1)
  );

  const direct = getDirectModifier(factor, match);
  const netImpactPts = Number((signalImpactPts + direct.pts).toFixed(1));

  const alignment: FactorAlignment =
    alignmentScore > 0.08
      ? 'reinforces'
      : alignmentScore < -0.08
        ? 'opposes'
        : 'neutral';

  return {
    factorKey: factor.key,
    weight: factor.weight,
    alignment,
    alignmentScore: Number(alignmentScore.toFixed(2)),
    signalImpactPts,
    directModifierPts: direct.pts,
    netImpactPts,
    directModifierReason: direct.reason,
    modelContext: {
      baseConfidence: 30,
      finalConfidence: pred.confidenceScore,
      topSelection,
      topProbabilityPct: Number((pred.topOutcome.probability * 100).toFixed(1)),
      separationPct: Number((separation * 100).toFixed(1)),
      totalSignalPoolPts: Number(totalSignalPoolPts.toFixed(1)),
      totalDataBonusPts,
      totalSquadPenaltyPts: totalUncertaintyPenaltyPts,
      totalKeyAbsences,
      isClamped:
        Math.round(30 + totalSignalPoolPts + totalDataBonusPts - totalUncertaintyPenaltyPts) !==
        pred.confidenceScore,
      capPct: pred.isLiveAdjusted ? 92 : 86,
    },
  };
}
