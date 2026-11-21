import type { Language } from '../types/football.ts';

export type CouponConceptPreset =
  | 'auto'
  | 'safe_2x'
  | 'balanced_3x'
  | 'medium_5x'
  | 'high_10x'
  | 'custom';

export type CouponStrategyMode = 'max_probability' | 'balanced_value' | 'conservative';

export interface CouponConceptConfig {
  preset: CouponConceptPreset;
  /** Target total multiplier, e.g. 2, 3, 5, 10, or custom (null when preset === 'auto') */
  targetOdds: number | null;
  strategy?: CouponStrategyMode;
}

export interface ChatImageAttachment {
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  /** Raw base64 payload (without data:...;base64, prefix) */
  data: string;
  fileName?: string;
}

export interface CouponLegInput {
  label: string;
  odds: number;
  estimatedProb: number;
}

export interface AccumulatorMetrics {
  legCount: number;
  combinedOdds: number;
  combinedProbability: number;
  fairCombinedOdds: number;
  expectedValueEdge: number;
  averageLegOdds: number;
  weakestLeg: CouponLegInput | null;
}

export interface TargetOddsProfile {
  targetOdds: number;
  fairNoMarginProbability: number;
  realisticProbabilityRange: { low: number; high: number };
  recommendedLegCount: { min: number; max: number };
  idealAvgLegOdds: { min: number; max: number };
  riskTier: 'low' | 'moderate' | 'elevated' | 'high';
}

export const ALLOWED_IMAGE_MIME_TYPES = new Set<ChatImageAttachment['mimeType']>([
  'image/png',
  'image/jpeg',
  'image/webp',
]);

export const MAX_CHAT_IMAGES = 2;
export const MAX_BASE64_CHARS_PER_IMAGE = 6_000_000; // ~4.5 MB raw binary

export const PRESET_TARGET_ODDS: Record<Exclude<CouponConceptPreset, 'auto' | 'custom'>, number> = {
  safe_2x: 2,
  balanced_3x: 3,
  medium_5x: 5,
  high_10x: 10,
};

export function computeImpliedProbability(decimalOdds: number): number {
  if (!Number.isFinite(decimalOdds) || decimalOdds <= 1) {
    return 0;
  }
  return Math.min(0.99, Math.max(0.01, 1 / decimalOdds));
}

export function computeOverround(decimalOddsList: number[]): number {
  const valid = decimalOddsList.filter((o) => Number.isFinite(o) && o > 1);
  if (valid.length === 0) return 0;
  const impliedSum = valid.reduce((sum, o) => sum + 1 / o, 0);
  return Math.max(0, impliedSum - 1);
}

export function computeAccumulatorMetrics(legs: CouponLegInput[]): AccumulatorMetrics {
  const validLegs = legs.filter(
    (l) =>
      Number.isFinite(l.odds) &&
      l.odds > 1 &&
      Number.isFinite(l.estimatedProb) &&
      l.estimatedProb > 0 &&
      l.estimatedProb < 1
  );

  if (validLegs.length === 0) {
    return {
      legCount: 0,
      combinedOdds: 1,
      combinedProbability: 0,
      fairCombinedOdds: 0,
      expectedValueEdge: 0,
      averageLegOdds: 0,
      weakestLeg: null,
    };
  }

  let combinedOdds = 1;
  let combinedProbability = 1;
  let weakestLeg = validLegs[0];

  for (const leg of validLegs) {
    combinedOdds *= leg.odds;
    combinedProbability *= leg.estimatedProb;
    if (leg.estimatedProb < weakestLeg.estimatedProb) {
      weakestLeg = leg;
    }
  }

  const averageLegOdds = Math.pow(combinedOdds, 1 / validLegs.length);
  const fairCombinedOdds = combinedProbability > 0 ? 1 / combinedProbability : 0;
  const expectedValueEdge = combinedProbability * combinedOdds - 1;

  return {
    legCount: validLegs.length,
    combinedOdds: Number(combinedOdds.toFixed(2)),
    combinedProbability: Number(combinedProbability.toFixed(4)),
    fairCombinedOdds: Number(fairCombinedOdds.toFixed(2)),
    expectedValueEdge: Number(expectedValueEdge.toFixed(4)),
    averageLegOdds: Number(averageLegOdds.toFixed(2)),
    weakestLeg,
  };
}

/**
 * Computes transparent statistical benchmarks for any target accumulator multiplier
 * (e.g., 2x, 3x, 5x, 10x, 20x) accounting for typical bookmaker overround (~5-7% per leg).
 */
export function estimateTargetOddsProfile(targetOdds: number): TargetOddsProfile {
  const clampedOdds = Math.min(100, Math.max(1.2, Number.isFinite(targetOdds) ? targetOdds : 2));
  const fairNoMarginProbability = Number((1 / clampedOdds).toFixed(4));

  let recommendedLegCount: { min: number; max: number };
  let riskTier: TargetOddsProfile['riskTier'];

  if (clampedOdds <= 2.4) {
    recommendedLegCount = { min: 1, max: 2 };
    riskTier = 'low';
  } else if (clampedOdds <= 4.2) {
    recommendedLegCount = { min: 2, max: 3 };
    riskTier = 'moderate';
  } else if (clampedOdds <= 7.5) {
    recommendedLegCount = { min: 3, max: 5 };
    riskTier = 'elevated';
  } else if (clampedOdds <= 15) {
    recommendedLegCount = { min: 4, max: 6 };
    riskTier = 'high';
  } else {
    recommendedLegCount = { min: 5, max: 8 };
    riskTier = 'high';
  }

  // Geometric mean per leg for min/max leg counts
  const idealMinOdds = Number(Math.pow(clampedOdds, 1 / recommendedLegCount.max).toFixed(2));
  const idealMaxOdds = Number(Math.pow(clampedOdds, 1 / recommendedLegCount.min).toFixed(2));

  // Compound bookmaker overround penalty (~5.5% per leg) reduces raw implied probability
  const avgLegs = (recommendedLegCount.min + recommendedLegCount.max) / 2;
  const marginDragLow = Math.pow(0.92, avgLegs);
  const marginDragHigh = Math.pow(0.97, avgLegs);

  return {
    targetOdds: Number(clampedOdds.toFixed(2)),
    fairNoMarginProbability,
    realisticProbabilityRange: {
      low: Number(Math.max(0.005, fairNoMarginProbability * marginDragLow).toFixed(4)),
      high: Number(Math.min(0.85, fairNoMarginProbability * marginDragHigh).toFixed(4)),
    },
    recommendedLegCount,
    idealAvgLegOdds: {
      min: Math.max(1.15, idealMinOdds),
      max: Math.max(1.25, idealMaxOdds),
    },
    riskTier,
  };
}

export function sanitizeCouponConcept(raw: unknown): CouponConceptConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const presetRaw = obj.preset;
  const validPresets: CouponConceptPreset[] = [
    'auto',
    'safe_2x',
    'balanced_3x',
    'medium_5x',
    'high_10x',
    'custom',
  ];
  if (typeof presetRaw !== 'string' || !validPresets.includes(presetRaw as CouponConceptPreset)) {
    return null;
  }
  const preset = presetRaw as CouponConceptPreset;

  let targetOdds: number | null = null;
  if (preset === 'auto') {
    targetOdds = null;
  } else if (preset === 'custom') {
    const num = typeof obj.targetOdds === 'number' ? obj.targetOdds : Number(obj.targetOdds);
    if (Number.isFinite(num) && num >= 1.2 && num <= 100) {
      targetOdds = Number(num.toFixed(2));
    } else {
      targetOdds = 5;
    }
  } else {
    targetOdds = PRESET_TARGET_ODDS[preset];
  }

  const strategyRaw = obj.strategy;
  const strategy: CouponStrategyMode =
    strategyRaw === 'balanced_value' || strategyRaw === 'conservative'
      ? strategyRaw
      : 'max_probability';

  return {
    preset,
    targetOdds,
    strategy,
  };
}

export function sanitizeImageAttachments(raw: unknown): ChatImageAttachment[] {
  if (!Array.isArray(raw)) return [];
  const valid: ChatImageAttachment[] = [];

  for (const item of raw) {
    if (valid.length >= MAX_CHAT_IMAGES) break;
    if (!item || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;
    const mimeType = obj.mimeType;
    const rawData = obj.data;

    if (
      typeof mimeType !== 'string' ||
      !ALLOWED_IMAGE_MIME_TYPES.has(mimeType as ChatImageAttachment['mimeType'])
    ) {
      continue;
    }
    if (typeof rawData !== 'string') continue;

    // Strip optional data URL prefix cleanly
    const stripped = rawData.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '').trim();
    if (stripped.length < 32 || stripped.length > MAX_BASE64_CHARS_PER_IMAGE) continue;
    // Basic base64 alphabet verification
    if (!/^[A-Za-z0-9+/=\s]+$/.test(stripped)) continue;

    valid.push({
      mimeType: mimeType as ChatImageAttachment['mimeType'],
      data: stripped.replace(/\s+/g, ''),
      fileName: typeof obj.fileName === 'string' ? obj.fileName.slice(0, 120) : undefined,
    });
  }

  return valid;
}

export function buildDefaultScreenshotPrompt(
  concept: CouponConceptConfig | null,
  lang: Language
): string {
  const targetText = concept?.targetOdds ? `${concept.targetOdds}x` : null;

  if (lang === 'az') {
    return targetText
      ? `Yüklənmiş ekran görüntüsündəki oyunları və əmsalları oxu, ${targetText} hədəf əmsal konsepti üzrə statistik olaraq ən yüksək udma ehtimalı olan kupon kombinasiyasını, hər oyun üzrə ehtimalı və riskləri ətraflı analiz et.`
      : 'Yüklənmiş ekran görüntüsündəki oyunları, bazarları və əmsalları oxu; statistik olaraq ən yüksək udma ehtimalı olan seçimləri, ümumi əmsalı, udma ehtimalını və riskli bəndləri analiz et.';
  }
  if (lang === 'ru') {
    return targetText
      ? `Проанализируй матчи и коэффициенты на загруженном скриншоте и собери статистически наиболее вероятную комбинацию под целевой коэффициент ${targetText} с вероятностью каждого исхода и оценкой рисков.`
      : 'Проанализируй матчи, рынки и коэффициенты на загруженном скриншоте: выдели наиболее вероятные статистические исходы, общий коэффициент, вероятность прохода и главные риски.';
  }
  return targetText
    ? `Analyze the matches and odds shown in the uploaded screenshot and build the statistically highest-probability combination targeting ${targetText} total odds, including per-leg probabilities, combined probability, and risk notes.`
    : 'Analyze the matches, markets, and odds in the uploaded screenshot, identifying the statistically highest-probability selections, combined odds, estimated hit probability, and weakest links.';
}

export function buildCouponSystemDirective(
  concept: CouponConceptConfig | null,
  hasImages: boolean,
  lang: Language
): string | null {
  if (!hasImages && (!concept || concept.preset === 'auto')) {
    return null;
  }

  const lines: string[] = [
    '',
    '=== SCREENSHOT & COUPON / TARGET-ODDS ANALYSIS MODE ===',
  ];

  if (hasImages) {
    lines.push(
      'The user attached screenshot(s) from a betting or sports platform (such as Misli, Topaz, Flashscore, SofaScore, or a bookmaker slip/odds board).'
    );
    lines.push('SCREENSHOT EXTRACTION & ANALYSIS PROTOCOL:');
    lines.push(
      '1. Carefully read EVERY visible match, team name, market type (1/X/2, 1X/X2/12, Over/Under 1.5/2.5/3.5, BTTS/QQ, Double Chance, Handicap, Half-Time, etc.), and decimal odds from the screenshot.'
    );
    lines.push(
      '2. If any text or odds in the screenshot are blurry, cropped, or unreadable, state clearly what is unreadable instead of guessing or fabricating numbers.'
    );
    lines.push(
      '3. For each extracted option, compute implied probability (1 / decimal_odds), account for bookmaker margin (typically 5–8% overround), and cross-check with MatchEdge’s statistical context whenever a match overlaps with the active match.'
    );
    lines.push(
      '4. Rank candidates strictly by calibrated statistical hit probability and variance stability (favoring higher-probability, lower-variance legs such as 1X/X2, Over 1.5, strong favorite win, or clear xG/form edges rather than volatile long-shots).'
    );
  }

  if (concept?.targetOdds) {
    const profile = estimateTargetOddsProfile(concept.targetOdds);
    lines.push('');
    lines.push(`USER TARGET COUPON CONCEPT: ${profile.targetOdds}x total odds (Strategy: ${concept.strategy ?? 'max_probability'})`);
    lines.push(
      `- Mathematical Benchmark for ${profile.targetOdds}x: Fair no-margin baseline = ${(profile.fairNoMarginProbability * 100).toFixed(1)}%; Realistic bookmaker-adjusted combined hit probability ≈ ${(profile.realisticProbabilityRange.low * 100).toFixed(1)}%–${(profile.realisticProbabilityRange.high * 100).toFixed(1)}%.`
    );
    lines.push(
      `- Optimal Variance Structure: Prefer ${profile.recommendedLegCount.min}–${profile.recommendedLegCount.max} disciplined legs averaging ~${profile.idealAvgLegOdds.min}–${profile.idealAvgLegOdds.max} odds each (instead of 1–2 extreme longshots or 10+ fragile legs) to maximize statistical probability while reaching ~${profile.targetOdds}x.`
    );
    lines.push(
      `- Build the exact recommended combination from the screenshot's matches (or explain clearly if the screenshot does not contain enough matches/markets to reach ${profile.targetOdds}x cleanly, showing the highest reachable multiplier from the screenshot).`
    );
  }

  lines.push('');
  lines.push('REQUIRED OUTPUT STRUCTURE FOR COUPON / SCREENSHOT ANALYSIS:');
  if (lang === 'az') {
    lines.push(
      'Format response cleanly in Azerbaijani with these exact sections: (1) **Görüntüdən oxunan matçlar və əmsallar**, (2) **Statistik olaraq ən yüksək ehtimallı kupon seçimi** (hər oyun: Matç — Seçim — Əmsal — Təxmini ehtimal % + qısa əsaslandırma), (3) **Ümumi kupon göstəriciləri** (Ümumi əmsal `∏ əmsal`, Ümumi statistik udma ehtimalı `∏ ehtimal %`, Zəif bənd / Ən riskli oyun), (4) **Daha təhlükəsiz alternativ** (istəyə görə daha aşağı əmsallı, lakin daha yüksək ehtimallı variant), and end with the honest compliance note: "Qeyd: Bütün hesablamalar statistik ehtimal qiymətləndirməsidir, zəmanət deyil. 18+. Məsuliyyətli davranın."'
    );
  } else if (lang === 'ru') {
    lines.push(
      'Format response cleanly in Russian with: (1) Extracted matches & odds, (2) Statistically highest-probability coupon picks (Match — Pick — Odds — Estimated Probability %), (3) Combined odds (`∏ odds`), combined statistical hit probability (`∏ prob %`), and weakest link risk warning, (4) Safer lower-variance alternative, ending with an honest statistical disclaimer (no guarantees, 18+).'
    );
  } else {
    lines.push(
      'Format response cleanly in English with: (1) Extracted matches & odds, (2) Statistically highest-probability coupon combination (Match — Pick — Odds — Estimated Probability %), (3) Combined odds (`∏ odds`), combined statistical hit probability (`∏ prob %`), and weakest-link risk warning, (4) Safer lower-variance alternative, ending with an honest statistical disclaimer (no guarantees, 18+).'
    );
  }
  lines.push(
    'CRITICAL INTEGRITY RULE: Never claim a coupon or pick is guaranteed, "banko", or 100% sure. Clearly highlight that higher target multipliers (like 10x) mathematically carry lower combined hit probability even with optimal statistical selections.'
  );

  return lines.join('\n');
}
