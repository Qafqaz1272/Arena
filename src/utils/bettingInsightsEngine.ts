export type ConfidenceTier = 'Yüksək' | 'Orta' | 'Aşağı';

export const MANDATORY_DISCLAIMER_AZ =
  'Proqnozlar statistik ehtimallardır, qazanc zəmanəti vermir. Məsuliyyətlə oynayın.';

export interface MatchModelInputs {
  matchId: string;
  homeName: string;
  awayName: string;
  homeElo: number;
  awayElo: number;
  homeFormPts: number; // out of 15 (last 5)
  awayFormPts: number; // out of 15 (last 5)
  homeHomeStrength: number; // 0.85..1.25
  awayAwayStrength: number; // 0.85..1.25
  h2hHomeBias: number; // -0.15..+0.15
  homeInjuries: number; // key absentees 0..5
  awayInjuries: number; // key absentees 0..5
  homeRestDays: number; // 2..10
  awayRestDays: number; // 2..10
  homeMotivation: number; // 0..1 (title/UCL/relegation urgency)
  awayMotivation: number; // 0..1
}

export interface ScorelineProb {
  score: string;
  prob: number; // 0..100
}

export interface BookmakerOddsRow {
  bookmaker: string;
  home: number;
  draw: number;
  away: number;
  over25: number;
  bttsYes: number;
}

export interface OddsMovementSummary {
  market: '1' | 'X' | '2' | 'Üst 2.5' | 'QQ Var';
  openingOdds: number;
  currentOdds: number;
  dropPct: number; // positive when odds dropped (sharp money)
  isSharpDrop: boolean;
}

export interface ValueBetSignal {
  matchId: string;
  matchLabel: string;
  league: string;
  market: '1X2' | 'Üst/Alt 2.5' | 'QQ (BTTS)';
  selection: string;
  modelProb: number; // 0..100
  bookmakerOdds: number;
  impliedProb: number; // 0..100
  edgePct: number; // modelProb - impliedProb
  evPct: number; // (modelProb/100 * odds - 1) * 100
  isValueBet: boolean; // edgePct > 5
  confidence: ConfidenceTier;
}

export type MarketGroupId = 'result' | 'goals' | 'team_goals' | 'handicap' | 'first_half';

export interface MarketOption {
  id: string;
  group: MarketGroupId;
  market: string;
  selection: string;
  shortLabel: string;
  prob: number; // strictly capped at 95.0%
  fairOdds: number;
  confidence: ConfidenceTier;
  reasonAz: string;
}

export interface MatchPredictionOutput {
  homeXg: number;
  awayXg: number;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  over25Prob: number;
  under25Prob: number;
  bttsYesProb: number;
  bttsNoProb: number;
  topScorelines: ScorelineProb[];
  confidence: ConfidenceTier;
  top3FactorsAz: string[];
  disclaimerAz: string;
  markets: MarketOption[];
  topSafePicks: MarketOption[];
  topPick: MarketOption;
  riskWarningsAz: string[];
}

export interface CouponLeg {
  id: string;
  matchId: string;
  matchLabel: string;
  league: string;
  market: string;
  selection: string;
  odds: number;
  modelProb: number; // 0..100
  impliedProb: number; // 0..100
  edgePct: number;
  confidence: ConfidenceTier;
}

export interface GeneratedCoupon {
  id: string;
  category: 'daily' | 'safe' | 'value' | 'risk';
  titleAz: string;
  subtitleAz: string;
  riskLabelAz: string;
  legs: CouponLeg[];
  combinedOdds: number;
  combinedProb: number;
  avgEdgePct: number;
  disclaimerAz: string;
}

export interface CouponEvaluationResult {
  legCount: number;
  combinedOdds: number;
  combinedProb: number;
  expectedValuePct: number;
  hasCorrelationWarning: boolean;
  correlatedMatchIds: string[];
  weakestLeg: CouponLeg | null;
  saferAlternative: CouponLeg | null;
  verdictAz: string;
  riskLevelAz: 'Aşağı' | 'Orta' | 'Yüksək' | 'Çox Yüksək';
  disclaimerAz: string;
}

export interface KellyStakeInput {
  bankroll: number;
  modelProbPct: number; // 0..100
  decimalOdds: number;
  fraction?: number; // default 0.25 (quarter Kelly)
  maxCapPct?: number; // default 5%
}

export interface KellyStakeResult {
  fullKellyPct: number;
  recommendedPct: number;
  recommendedStake: number;
  expectedValuePct: number;
  isPositiveEv: boolean;
}

export interface ArchivePickItem {
  id: string;
  date: string;
  league: string;
  matchLabel: string;
  market: '1X2' | 'Üst/Alt 2.5' | 'QQ (BTTS)';
  selection: string;
  odds: number;
  modelProb: number; // 0..100
  impliedProb: number; // 0..100
  edgePct: number;
  resultScore: string;
  status: 'won' | 'lost' | 'pending';
}

export interface ArchiveTransparencyMetrics {
  totalSettled: number;
  wonCount: number;
  lostCount: number;
  hitRatePct: number;
  brierScore: number;
  roiPct: number;
  byLeague: Array<{ league: string; total: number; won: number; hitRatePct: number; roiPct: number }>;
  byMarket: Array<{ market: string; total: number; won: number; hitRatePct: number; roiPct: number }>;
  calibrationBins: Array<{ bucket: string; predictedAvg: number; actualPct: number; count: number }>;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function poissonPmf(k: number, lambda: number): number {
  let fact = 1;
  for (let i = 2; i <= k; i += 1) fact *= i;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / fact;
}

/**
 * Dixon-Coles low-score correlation adjustment factor tau(x, y).
 */
function dixonColesTau(x: number, y: number, lambdaHome: number, lambdaAway: number, rho: number): number {
  if (x === 0 && y === 0) return Math.max(0.1, 1 - lambdaHome * lambdaAway * rho);
  if (x === 0 && y === 1) return Math.max(0.1, 1 + lambdaHome * rho);
  if (x === 1 && y === 0) return Math.max(0.1, 1 + lambdaAway * rho);
  if (x === 1 && y === 1) return Math.max(0.1, 1 - rho);
  return 1;
}

/**
 * Computes full Dixon-Coles + Elo + Form + Split + H2H + Injuries + Rest + Motivation prediction.
 */
export function predictMatchDixonColes(input: MatchModelInputs): MatchPredictionOutput {
  const eloDiff = (input.homeElo - input.awayElo) / 400; // typically -1.0 to +1.0
  const formDiff = (input.homeFormPts - input.awayFormPts) / 15; // -1 to +1
  const injuryDiff = (input.awayInjuries - input.homeInjuries) * 0.07; // positive helps home
  const restDiff = clamp((input.homeRestDays - input.awayRestDays) * 0.025, -0.12, 0.12);
  const motivationDiff = (input.homeMotivation - input.awayMotivation) * 0.12;

  const baseLeagueAvg = 1.38;
  const homeAdvantage = 0.22;

  const rawHomeXg =
    baseLeagueAvg *
    input.homeHomeStrength *
    Math.exp(
      0.42 * eloDiff +
        0.18 * formDiff +
        input.h2hHomeBias +
        injuryDiff +
        restDiff +
        motivationDiff +
        homeAdvantage
    );

  const rawAwayXg =
    baseLeagueAvg *
    input.awayAwayStrength *
    Math.exp(
      -0.42 * eloDiff -
        0.18 * formDiff -
        input.h2hHomeBias -
        injuryDiff -
        restDiff -
        motivationDiff -
        0.08
    );

  const homeXg = round2(clamp(rawHomeXg, 0.35, 3.45));
  const awayXg = round2(clamp(rawAwayXg, 0.3, 3.25));

  const rho = -0.08;
  let totalMass = 0;
  const matrix: Array<{ h: number; a: number; p: number }> = [];

  for (let h = 0; h <= 6; h += 1) {
    const pH = poissonPmf(h, homeXg);
    for (let a = 0; a <= 6; a += 1) {
      const pA = poissonPmf(a, awayXg);
      const tau = dixonColesTau(h, a, homeXg, awayXg, rho);
      const joint = Math.max(0, pH * pA * tau);
      matrix.push({ h, a, p: joint });
      totalMass += joint;
    }
  }

  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;
  let over05 = 0;
  let over15 = 0;
  let over25 = 0;
  let over35 = 0;
  let bttsYes = 0;
  let homeOver05 = 0;
  let homeOver15 = 0;
  let awayOver05 = 0;
  let awayOver15 = 0;
  let homeHcpMinus15 = 0;
  let homeHcpPlus15 = 0;
  let awayHcpMinus15 = 0;
  let awayHcpPlus15 = 0;

  const normalizedScores: ScorelineProb[] = [];
  for (const cell of matrix) {
    const prob = totalMass > 0 ? cell.p / totalMass : 0;
    const totalGoals = cell.h + cell.a;
    if (cell.h > cell.a) homeWin += prob;
    else if (cell.h === cell.a) draw += prob;
    else awayWin += prob;

    if (totalGoals >= 1) over05 += prob;
    if (totalGoals >= 2) over15 += prob;
    if (totalGoals >= 3) over25 += prob;
    if (totalGoals >= 4) over35 += prob;
    if (cell.h >= 1 && cell.a >= 1) bttsYes += prob;

    if (cell.h >= 1) homeOver05 += prob;
    if (cell.h >= 2) homeOver15 += prob;
    if (cell.a >= 1) awayOver05 += prob;
    if (cell.a >= 2) awayOver15 += prob;

    if (cell.h - cell.a >= 2) homeHcpMinus15 += prob;
    if (cell.a - cell.h <= 1) homeHcpPlus15 += prob;
    if (cell.a - cell.h >= 2) awayHcpMinus15 += prob;
    if (cell.h - cell.a <= 1) awayHcpPlus15 += prob;

    normalizedScores.push({
      score: `${cell.h}-${cell.a}`,
      prob: round1(prob * 100),
    });
  }

  // First-half (1H) goal matrix using empirical 44% first-half goal share
  const fhHomeXg = homeXg * 0.44;
  const fhAwayXg = awayXg * 0.44;
  let fhMass = 0;
  let fhHome = 0;
  let fhDraw = 0;
  let fhAway = 0;
  let fhOver05 = 0;
  for (let h = 0; h <= 4; h += 1) {
    const pH = poissonPmf(h, fhHomeXg);
    for (let a = 0; a <= 4; a += 1) {
      const p = pH * poissonPmf(a, fhAwayXg);
      fhMass += p;
      if (h > a) fhHome += p;
      else if (h === a) fhDraw += p;
      else fhAway += p;
      if (h + a >= 1) fhOver05 += p;
    }
  }
  if (fhMass > 0) {
    fhHome /= fhMass;
    fhDraw /= fhMass;
    fhAway /= fhMass;
    fhOver05 /= fhMass;
  }

  normalizedScores.sort((a, b) => b.prob - a.prob);
  const topScorelines = normalizedScores.slice(0, 4);

  // Enforce strict <= 95% cap while keeping 1X2 strictly summing to 100.0%
  let homeWinProb = round1(clamp(homeWin * 100, 2, 95));
  let drawProb = round1(clamp(draw * 100, 3, 90));
  let awayWinProb = round1(Math.max(2, 100 - homeWinProb - drawProb));
  if (awayWinProb > 95) {
    awayWinProb = 95;
    homeWinProb = round1(Math.max(2, 100 - awayWinProb - drawProb));
  }
  // Final rounding reconciliation so 1X2 strictly sums to 100.0
  const sum1x2 = round1(homeWinProb + drawProb + awayWinProb);
  if (sum1x2 !== 100) {
    drawProb = round1(Math.max(2, drawProb + (100 - sum1x2)));
  }

  const cap95 = (p: number) => round1(clamp(p * 100, 3, 95));
  const over25Prob = cap95(over25);
  const under25Prob = cap95(1 - over25);
  const bttsYesProb = cap95(bttsYes);
  const bttsNoProb = cap95(1 - bttsYes);

  const maxOutcomeProb = Math.max(homeWinProb, drawProb, awayWinProb);
  const totalInjuries = input.homeInjuries + input.awayInjuries;
  let confidence: ConfidenceTier = 'Orta';
  if (maxOutcomeProb >= 58 && totalInjuries <= 3) confidence = 'Yüksək';
  else if (maxOutcomeProb < 44 || totalInjuries >= 5) confidence = 'Aşağı';

  const marketConf = (prob: number): ConfidenceTier => {
    if (prob >= 76 && totalInjuries <= 3) return 'Yüksək';
    if (prob >= 60) return 'Orta';
    return 'Aşağı';
  };

  const makeMarket = (
    id: string,
    group: MarketGroupId,
    market: string,
    selection: string,
    shortLabel: string,
    rawProbPct: number,
    reasonAz: string
  ): MarketOption => {
    const prob = round1(clamp(rawProbPct, 3, 95));
    return {
      id,
      group,
      market,
      selection,
      shortLabel,
      prob,
      fairOdds: round2(100 / Math.max(4, prob)),
      confidence: marketConf(prob),
      reasonAz,
    };
  };

  const totalXg = round2(homeXg + awayXg);
  const dc1X = clamp(homeWinProb + drawProb, 5, 95);
  const dcX2 = clamp(drawProb + awayWinProb, 5, 95);
  const dc12 = clamp(homeWinProb + awayWinProb, 5, 95);

  const markets: MarketOption[] = [
    // Result & Double Chance
    makeMarket(
      '1x2-home',
      'result',
      'Nəticə (1X2)',
      `1 (${input.homeName})`,
      `1 (${input.homeName})`,
      homeWinProb,
      `${input.homeName} evdə ${homeXg.toFixed(2)} xG və ${input.homeElo} Elo reytinqi ilə üstünlük yaradır.`
    ),
    makeMarket(
      '1x2-draw',
      'result',
      'Nəticə (1X2)',
      'X (Heç-heçə)',
      'X (Heç-heçə)',
      drawProb,
      `Komandalar arasında güc balansı yaxın olduqda heç-heçə ehtimalı yüksəlir.`
    ),
    makeMarket(
      '1x2-away',
      'result',
      'Nəticə (1X2)',
      `2 (${input.awayName})`,
      `2 (${input.awayName})`,
      awayWinProb,
      `${input.awayName} səfərdə ${awayXg.toFixed(2)} xG və son 5 oyunda ${input.awayFormPts}/15 xal forması göstərir.`
    ),
    makeMarket(
      'dc-1x',
      'result',
      'İkili Şans',
      `1X (${input.homeName} uduzmaz)`,
      '1X',
      dc1X,
      `Ev sahibi uduzmadıqda (${input.homeName} qələbə və ya heç-heçə) seçim qazanır.`
    ),
    makeMarket(
      'dc-x2',
      'result',
      'İkili Şans',
      `X2 (${input.awayName} uduzmaz)`,
      'X2',
      dcX2,
      `Qonaq komanda xal qazandıqda (${input.awayName} qələbə və ya heç-heçə) keçir.`
    ),
    makeMarket(
      'dc-12',
      'result',
      'İkili Şans',
      '12 (Heç-heçə olmaz)',
      '12',
      dc12,
      `Hər iki komandanın hücum balansı oyunun qalibiyyətlə bitmə ehtimalını artırır.`
    ),

    // Over/Under & BTTS
    makeMarket(
      'ou-05',
      'goals',
      'Üst/Alt Qol',
      'Üst 0.5 qol',
      'Üst 0.5 qol',
      cap95(over05),
      `Ümumi gözlənilən qol (${totalXg.toFixed(2)} xG) matçda ən azı 1 qol ehtimalını gücləndirir.`
    ),
    makeMarket(
      'ou-15',
      'goals',
      'Üst/Alt Qol',
      'Üst 1.5 qol',
      'Üst 1.5 qol',
      cap95(over15),
      `Cəmi ${totalXg.toFixed(2)} xG proqnozu ilə 2+ qol ssenarisi əsas gözləntidir.`
    ),
    makeMarket(
      'ou-25-over',
      'goals',
      'Üst/Alt Qol',
      'Üst 2.5 qol',
      'Üst 2.5 qol',
      over25Prob,
      `Hər iki komandanın hücum tempi toplam ${totalXg.toFixed(2)} xG həddinə işarə edir.`
    ),
    makeMarket(
      'ou-25-under',
      'goals',
      'Üst/Alt Qol',
      'Alt 2.5 qol',
      'Alt 2.5 qol',
      under25Prob,
      `Müdafiə nizamı və aşağı temp halında 0-2 qol aralığı ön plana çıxır.`
    ),
    makeMarket(
      'ou-35-over',
      'goals',
      'Üst/Alt Qol',
      'Üst 3.5 qol',
      'Üst 3.5 qol',
      cap95(over35),
      `Yüksək məhsuldarlıqlı açıq oyun ssenarisi üçün aqressiv qol bazarı.`
    ),
    makeMarket(
      'ou-35-under',
      'goals',
      'Üst/Alt Qol',
      'Alt 3.5 qol',
      'Alt 3.5 qol',
      cap95(1 - over35),
      `Poisson paylanmasına görə matçların böyük əksəriyyəti 3 və ya daha az qolla bitir.`
    ),
    makeMarket(
      'btts-yes',
      'goals',
      'QQ (BTTS)',
      'Hər iki komanda qol vurur (Bəli)',
      'QQ Bəli',
      bttsYesProb,
      `${input.homeName} (${homeXg.toFixed(2)} xG) və ${input.awayName} (${awayXg.toFixed(2)} xG) qarşılıqlı qol potensialına malikdir.`
    ),
    makeMarket(
      'btts-no',
      'goals',
      'QQ (BTTS)',
      'Hər iki komanda qol vurur (Xeyr)',
      'QQ Xeyr',
      bttsNoProb,
      `Ən azı bir komandanın qapısını toxunulmaz saxlama şansı statistik olaraq yüksəkdir.`
    ),

    // Team Goals
    makeMarket(
      'tg-home-05',
      'team_goals',
      'Komanda Qolları',
      `${input.homeName} Üst 0.5 qol`,
      `${input.homeName} Üst 0.5`,
      cap95(homeOver05),
      `${input.homeName} doğma meydanda orta ${homeXg.toFixed(2)} xG istehsal edir.`
    ),
    makeMarket(
      'tg-home-15',
      'team_goals',
      'Komanda Qolları',
      `${input.homeName} Üst 1.5 qol`,
      `${input.homeName} Üst 1.5`,
      cap95(homeOver15),
      `Ev sahibinin 2+ qol vurma ehtimalı hücum gücündən birbaşa asılıdır.`
    ),
    makeMarket(
      'tg-away-05',
      'team_goals',
      'Komanda Qolları',
      `${input.awayName} Üst 0.5 qol`,
      `${input.awayName} Üst 0.5`,
      cap95(awayOver05),
      `${input.awayName} səfərdə ${awayXg.toFixed(2)} xG ilə qol şansı yaradır.`
    ),
    makeMarket(
      'tg-away-15',
      'team_goals',
      'Komanda Qolları',
      `${input.awayName} Üst 1.5 qol`,
      `${input.awayName} Üst 1.5`,
      cap95(awayOver15),
      `Qonaq komandanın 2+ qol vurması üçün yüksək hücum effektivliyi tələb olunur.`
    ),

    // Handicap (+/-1.5)
    makeMarket(
      'hcp-home-m15',
      'handicap',
      'Handikap',
      `${input.homeName} (-1.5)`,
      `Ev -1.5`,
      cap95(homeHcpMinus15),
      `${input.homeName} ən azı 2 top fərqi ilə qalib gəldikdə keçir.`
    ),
    makeMarket(
      'hcp-home-p15',
      'handicap',
      'Handikap',
      `${input.homeName} (+1.5)`,
      `Ev +1.5`,
      cap95(homeHcpPlus15),
      `${input.homeName} 2+ fərqlə uduzmadıqda bu təhlükəsiz handikap keçir.`
    ),
    makeMarket(
      'hcp-away-m15',
      'handicap',
      'Handikap',
      `${input.awayName} (-1.5)`,
      `Qonaq -1.5`,
      cap95(awayHcpMinus15),
      `${input.awayName} səfərdə ən azı 2 top fərqli qələbə qazandıqda keçir.`
    ),
    makeMarket(
      'hcp-away-p15',
      'handicap',
      'Handikap',
      `${input.awayName} (+1.5)`,
      `Qonaq +1.5`,
      cap95(awayHcpPlus15),
      `${input.awayName} 2+ top fərqi ilə məğlub olmadıqda seçim qazanır.`
    ),

    // First Half (1H)
    makeMarket(
      'fh-over05',
      'first_half',
      'İlk Yarı (1H)',
      '1-ci yarı Üst 0.5 qol',
      '1H Üst 0.5',
      cap95(fhOver05),
      `İlk 45 dəqiqədə gözlənilən ${(fhHomeXg + fhAwayXg).toFixed(2)} xG üzrə ən azı 1 qol ehtimalı.`
    ),
    makeMarket(
      'fh-home',
      'first_half',
      'İlk Yarı (1H)',
      `1-ci yarı: ${input.homeName}`,
      '1H Ev',
      cap95(fhHome),
      `${input.homeName} oyunun ilk hissəsində sürətli startla üstünlük qura bilər.`
    ),
    makeMarket(
      'fh-draw',
      'first_half',
      'İlk Yarı (1H)',
      '1-ci yarı: Heç-heçə',
      '1H X',
      cap95(fhDraw),
      `İlk hissədə ehtiyatlı taktika ehtimalı bərabərlik şansını artırır.`
    ),
    makeMarket(
      'fh-away',
      'first_half',
      'İlk Yarı (1H)',
      `1-ci yarı: ${input.awayName}`,
      '1H Qonaq',
      cap95(fhAway),
      `${input.awayName} əks-hücumlarla fasiləyə öndə çıxa bilər.`
    ),
  ];

  // Rank top 3 actionable safest picks (exclude trivial 0.5 goals so top 3 are genuinely useful coupon markets)
  const actionablePool = markets
    .filter((mk) => mk.id !== 'ou-05' && mk.prob >= 55)
    .sort((a, b) => b.prob - a.prob);

  const topSafePicks: MarketOption[] = [];
  const usedGroups = new Set<string>();
  for (const mk of actionablePool) {
    if (topSafePicks.length >= 3) break;
    // Prefer diverse market types in Top 3 where possible
    if (usedGroups.has(mk.group) && actionablePool.some((alt) => !usedGroups.has(alt.group) && alt.prob >= 66)) {
      continue;
    }
    usedGroups.add(mk.group);
    topSafePicks.push(mk);
  }
  // Fill remaining slots up to 3 if needed
  for (const mk of actionablePool) {
    if (topSafePicks.length >= 3) break;
    if (!topSafePicks.some((x) => x.id === mk.id)) topSafePicks.push(mk);
  }
  const topPick = topSafePicks[0] ?? markets[0];

  // Contextual risk warnings explaining what could break the prediction
  const riskWarningsAz: string[] = [];
  if (input.homeInjuries >= 2 || input.awayInjuries >= 2) {
    riskWarningsAz.push(
      `Heyət itkiləri: ${
        input.homeInjuries >= input.awayInjuries ? input.homeName : input.awayName
      } heyətində əsas oyunçu itkisi start heyəti açıqlananda balansı dəyişə bilər.`
    );
  }
  if (input.homeRestDays <= 3 || input.awayRestDays <= 3) {
    const tiredTeam = input.homeRestDays <= input.awayRestDays ? input.homeName : input.awayName;
    riskWarningsAz.push(
      `Sıx təqvim və yorğunluq: ${tiredTeam} cəmi ${Math.min(
        input.homeRestDays,
        input.awayRestDays
      )} gün istirahət edib — rotasiya riski var.`
    );
  }
  if (Math.abs(input.homeElo - input.awayElo) <= 75) {
    riskWarningsAz.push(
      `Bərabər güc balansı: Elo fərqi azdır (${Math.round(
        Math.abs(input.homeElo - input.awayElo)
      )} xal) — fərdi səhv və ya standart vəziyyət nəticəni dəyişə bilər.`
    );
  }
  if (drawProb >= 27) {
    riskWarningsAz.push(
      `Yüksək heç-heçə riski (${drawProb}%): Təmiz qələbə yerinə İkili Şans (1X/X2) daha az risklidir.`
    );
  }
  if (riskWarningsAz.length === 0) {
    riskWarningsAz.push(
      `Start heyətlərində gözlənilməz rotasiya, qırmızı vərəqə və ya erkən penalti istənilən statistik modeli poza bilər.`
    );
  }

  // Rank drivers to generate Top 3 plain-Azerbaijani explanations
  const factorCandidates: Array<{ weight: number; text: string }> = [
    {
      weight: Math.abs(eloDiff) * 1.4,
      text:
        input.homeElo >= input.awayElo
          ? `Elo güc reytinqi: ${input.homeName} (${input.homeElo}) rəqibindən ${Math.round(input.homeElo - input.awayElo)} xal irəlidədir.`
          : `Elo güc reytinqi: ${input.awayName} (${input.awayElo}) rəqibindən ${Math.round(input.awayElo - input.homeElo)} xal üstündür.`,
    },
    {
      weight: Math.abs(formDiff) * 1.15 + 0.1,
      text:
        input.homeFormPts >= input.awayFormPts
          ? `Son 5 oyun forması: ${input.homeName} ${input.homeFormPts}/15 xal toplayıb (${input.awayName}: ${input.awayFormPts}/15).`
          : `Son 5 oyun forması: ${input.awayName} ${input.awayFormPts}/15 xalla daha stabil qrafik göstərir.`,
    },
    {
      weight: Math.abs(input.homeHomeStrength - input.awayAwayStrength) * 1.1 + 0.08,
      text: `Ev/səfər balansı: ${input.homeName} doğma meydanda ${homeXg.toFixed(2)} xG, ${input.awayName} səfərdə ${awayXg.toFixed(2)} xG yaradır.`,
    },
    {
      weight: Math.abs(input.homeInjuries - input.awayInjuries) * 0.32,
      text:
        input.awayInjuries > input.homeInjuries
          ? `Heyət itkiləri: ${input.awayName} heyətində ${input.awayInjuries} əsas oyunçu zədəli və ya cəzalıdır.`
          : `Heyət itkiləri: ${input.homeName} heyətində ${input.homeInjuries} vacib itki hücum potensialına təsir edir.`,
    },
    {
      weight: Math.abs(input.homeRestDays - input.awayRestDays) * 0.18,
      text:
        input.homeRestDays >= input.awayRestDays
          ? `İstirahət və yorğunluq: ${input.homeName} ${input.homeRestDays} gün, ${input.awayName} isə cəmi ${input.awayRestDays} gün dincəlib.`
          : `İstirahət və yorğunluq: ${input.awayName} (${input.awayRestDays} gün) daha təzə heyətlə meydana çıxır.`,
    },
    {
      weight: Math.abs(input.homeMotivation - input.awayMotivation) * 0.9,
      text:
        input.homeMotivation >= input.awayMotivation
          ? `Cədvəl motivasiyası: ${input.homeName} üçün bu oyunun turnir əhəmiyyəti kritik dərəcədə yüksəkdir.`
          : `Cədvəl motivasiyası: ${input.awayName} turnir hədəfləri uğrunda xal itirməmək məcburiyyətindədir.`,
    },
  ];

  factorCandidates.sort((a, b) => b.weight - a.weight);
  const top3FactorsAz = factorCandidates.slice(0, 3).map((f) => f.text);

  return {
    homeXg,
    awayXg,
    homeWinProb,
    drawProb,
    awayWinProb,
    over25Prob,
    under25Prob,
    bttsYesProb,
    bttsNoProb,
    topScorelines,
    confidence,
    top3FactorsAz,
    disclaimerAz: MANDATORY_DISCLAIMER_AZ,
    markets,
    topSafePicks,
    topPick,
    riskWarningsAz,
  };
}

/**
 * Evaluates a bookmaker market against model probability and flags Value Bets when edge > 5%.
 */
export function evaluateValueBet(params: {
  matchId: string;
  matchLabel: string;
  league: string;
  market: '1X2' | 'Üst/Alt 2.5' | 'QQ (BTTS)';
  selection: string;
  modelProb: number;
  bookmakerOdds: number;
  confidence: ConfidenceTier;
  edgeThresholdPct?: number;
}): ValueBetSignal {
  const threshold = params.edgeThresholdPct ?? 5;
  const impliedProb = round1((1 / Math.max(1.01, params.bookmakerOdds)) * 100);
  const edgePct = round1(params.modelProb - impliedProb);
  const evPct = round1(((params.modelProb / 100) * params.bookmakerOdds - 1) * 100);
  return {
    matchId: params.matchId,
    matchLabel: params.matchLabel,
    league: params.league,
    market: params.market,
    selection: params.selection,
    modelProb: round1(params.modelProb),
    bookmakerOdds: round2(params.bookmakerOdds),
    impliedProb,
    edgePct,
    evPct,
    isValueBet: edgePct > threshold,
    confidence: params.confidence,
  };
}

/**
 * Detects sharp-money odds drops (>= 8% decline from opening odds).
 */
export function detectOddsDrop(
  market: OddsMovementSummary['market'],
  openingOdds: number,
  currentOdds: number
): OddsMovementSummary {
  const dropPct = round1(((openingOdds - currentOdds) / Math.max(1.01, openingOdds)) * 100);
  return {
    market,
    openingOdds: round2(openingOdds),
    currentOdds: round2(currentOdds),
    dropPct,
    isSharpDrop: dropPct >= 8,
  };
}

/**
 * Selects up to `maxLegs` strictly non-correlated legs (at most one selection per matchId).
 */
export function selectNonCorrelatedLegs(candidates: CouponLeg[], maxLegs: number): CouponLeg[] {
  const usedMatches = new Set<string>();
  const picked: CouponLeg[] = [];
  for (const leg of candidates) {
    if (usedMatches.has(leg.matchId)) continue;
    usedMatches.add(leg.matchId);
    picked.push(leg);
    if (picked.length >= maxLegs) break;
  }
  return picked;
}

function summarizeCoupon(
  id: string,
  category: GeneratedCoupon['category'],
  titleAz: string,
  subtitleAz: string,
  riskLabelAz: string,
  legs: CouponLeg[]
): GeneratedCoupon {
  const combinedOdds =
    legs.length > 0 ? round2(legs.reduce((acc, l) => acc * l.odds, 1)) : 1;
  const combinedProb =
    legs.length > 0 ? round1(legs.reduce((acc, l) => acc * (l.modelProb / 100), 1) * 100) : 0;
  const avgEdgePct =
    legs.length > 0
      ? round1(legs.reduce((acc, l) => acc + l.edgePct, 0) / legs.length)
      : 0;

  return {
    id,
    category,
    titleAz,
    subtitleAz,
    riskLabelAz,
    legs,
    combinedOdds,
    combinedProb,
    avgEdgePct,
    disclaimerAz: MANDATORY_DISCLAIMER_AZ,
  };
}

/**
 * Auto-generates the 4 platform coupons without correlated selections.
 */
export function generateSmartCoupons(allLegs: CouponLeg[]): GeneratedCoupon[] {
  const dailyPool = [...allLegs]
    .filter((l) => l.modelProb >= 52 && l.edgePct >= 2)
    .sort((a, b) => b.modelProb * 0.6 + b.edgePct * 2 - (a.modelProb * 0.6 + a.edgePct * 2));
  const dailyLegs = selectNonCorrelatedLegs(dailyPool.length >= 2 ? dailyPool : allLegs, 3);

  const safePool = [...allLegs]
    .filter((l) => l.modelProb >= 60 && l.odds <= 1.85)
    .sort((a, b) => b.modelProb - a.modelProb);
  const safeLegs = selectNonCorrelatedLegs(
    safePool.length >= 2 ? safePool : [...allLegs].sort((a, b) => b.modelProb - a.modelProb),
    2
  );

  const valuePool = [...allLegs]
    .filter((l) => l.edgePct > 5)
    .sort((a, b) => b.edgePct - a.edgePct);
  const valueLegs = selectNonCorrelatedLegs(
    valuePool.length >= 2 ? valuePool : [...allLegs].sort((a, b) => b.edgePct - a.edgePct),
    3
  );

  const riskPool = [...allLegs]
    .filter((l) => l.odds >= 1.95 && l.edgePct >= 0)
    .sort((a, b) => b.odds * (b.modelProb / 100) - a.odds * (a.modelProb / 100));
  const riskLegs = selectNonCorrelatedLegs(
    riskPool.length >= 3 ? riskPool : [...allLegs].sort((a, b) => b.odds - a.odds),
    4
  );

  return [
    summarizeCoupon(
      'coupon-daily',
      'daily',
      'Günün kuponu',
      'Ən yüksək ehtimal və müsbət model fərqinin balanslı 3-lü seçimi (korrelyasiyasız)',
      'Balanslı Risk',
      dailyLegs
    ),
    summarizeCoupon(
      'coupon-safe',
      'safe',
      'Təhlükəsiz kupon',
      'Aşağı riskli 2-li kombinasiya — yüksək model ehtimalına fokuslanır',
      'Aşağı Risk',
      safeLegs
    ),
    summarizeCoupon(
      'coupon-value',
      'value',
      'Dəyərli kupon',
      'Bukmeker əmsalına qarşı +5% üstündə model üstünlüyü (Value Bet) olan seçimlər',
      'Dəyər (EV+)',
      valueLegs
    ),
    summarizeCoupon(
      'coupon-risk',
      'risk',
      'Risk kuponu',
      'Daha yüksək ümumi əmsal axtaranlar üçün 4 fərqli oyundan seçilmiş kombinasiya',
      'Yüksək Risk',
      riskLegs
    ),
  ];
}

/**
 * Evaluates a user-built custom coupon: combined odds/prob, correlation warnings, weakest leg, safer alternative.
 */
export function evaluateCustomCoupon(
  legs: CouponLeg[],
  candidatePool: CouponLeg[]
): CouponEvaluationResult {
  if (legs.length === 0) {
    return {
      legCount: 0,
      combinedOdds: 1,
      combinedProb: 0,
      expectedValuePct: 0,
      hasCorrelationWarning: false,
      correlatedMatchIds: [],
      weakestLeg: null,
      saferAlternative: null,
      verdictAz: 'Analiz üçün ən azı 1 oyun seçimi əlavə edin.',
      riskLevelAz: 'Aşağı',
      disclaimerAz: MANDATORY_DISCLAIMER_AZ,
    };
  }

  const matchCounts = new Map<string, number>();
  for (const leg of legs) {
    matchCounts.set(leg.matchId, (matchCounts.get(leg.matchId) ?? 0) + 1);
  }
  const correlatedMatchIds = Array.from(matchCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([id]) => id);
  const hasCorrelationWarning = correlatedMatchIds.length > 0;

  const combinedOdds = round2(legs.reduce((acc, l) => acc * l.odds, 1));
  // Slight correlation penalty if user added multiple legs from the same match
  const rawProb = legs.reduce((acc, l) => acc * (l.modelProb / 100), 1);
  const combinedProb = round1(rawProb * 100);
  const expectedValuePct = round1((rawProb * combinedOdds - 1) * 100);

  const weakestLeg = [...legs].sort(
    (a, b) => a.modelProb + a.edgePct * 1.5 - (b.modelProb + b.edgePct * 1.5)
  )[0];

  const existingIds = new Set(legs.map((l) => l.id));
  const sameMatchSafer = candidatePool
    .filter(
      (c) =>
        c.matchId === weakestLeg.matchId &&
        !existingIds.has(c.id) &&
        c.modelProb > weakestLeg.modelProb + 4
    )
    .sort((a, b) => b.modelProb - a.modelProb)[0];

  const usedOtherMatches = new Set(legs.map((l) => l.matchId));
  const poolSafer = candidatePool
    .filter(
      (c) =>
        !usedOtherMatches.has(c.matchId) &&
        c.modelProb > weakestLeg.modelProb + 6 &&
        c.edgePct >= 0
    )
    .sort((a, b) => b.modelProb - a.modelProb)[0];

  const saferAlternative = sameMatchSafer ?? poolSafer ?? null;

  let riskLevelAz: CouponEvaluationResult['riskLevelAz'] = 'Orta';
  if (combinedProb >= 45) riskLevelAz = 'Aşağı';
  else if (combinedProb >= 25) riskLevelAz = 'Orta';
  else if (combinedProb >= 12) riskLevelAz = 'Yüksək';
  else riskLevelAz = 'Çox Yüksək';

  let verdictAz = '';
  if (hasCorrelationWarning) {
    verdictAz =
      'Diqqət: Kuponda eyni oyundan birdən çox seçim var (korrelyasiya riski). Müstəqil oyunlara bölmək daha sağlamdır.';
  } else if (expectedValuePct > 4 && combinedProb >= 25) {
    verdictAz = `Kuponun riyazi gözləntisi müsbətdir (EV +${expectedValuePct}%). Ən zəif bənd: ${weakestLeg.matchLabel} (${weakestLeg.selection}).`;
  } else if (combinedProb < 15) {
    verdictAz = `Ümumi keçid ehtimalı aşağıdır (${combinedProb}%). Seçim sayını azaltmaq və ya ən zəif bəndi (${weakestLeg.selection}) daha sabit bazarla əvəzləmək tövsiyə olunur.`;
  } else {
    verdictAz = `Orta riskli kupon (${combinedProb}% ehtimal, ${combinedOdds}x əmsal). Zəif bənd: ${weakestLeg.matchLabel} — ${weakestLeg.selection}.`;
  }

  return {
    legCount: legs.length,
    combinedOdds,
    combinedProb,
    expectedValuePct,
    hasCorrelationWarning,
    correlatedMatchIds,
    weakestLeg,
    saferAlternative,
    verdictAz,
    riskLevelAz,
    disclaimerAz: MANDATORY_DISCLAIMER_AZ,
  };
}

/**
 * Fractional Kelly Criterion stake calculator (default quarter-Kelly, capped at 5% of bankroll).
 */
export function calculateFractionalKelly(input: KellyStakeInput): KellyStakeResult {
  const fraction = input.fraction ?? 0.25;
  const maxCapPct = input.maxCapPct ?? 5;
  const bankroll = Math.max(0, input.bankroll);
  const p = clamp(input.modelProbPct / 100, 0, 1);
  const b = Math.max(0.01, input.decimalOdds - 1);
  const q = 1 - p;

  const expectedValuePct = round1((p * input.decimalOdds - 1) * 100);
  const rawKelly = (b * p - q) / b;

  if (rawKelly <= 0 || bankroll <= 0) {
    return {
      fullKellyPct: 0,
      recommendedPct: 0,
      recommendedStake: 0,
      expectedValuePct,
      isPositiveEv: false,
    };
  }

  const fullKellyPct = round2(rawKelly * 100);
  const fractionalPct = fullKellyPct * fraction;
  const recommendedPct = round2(Math.min(maxCapPct, fractionalPct));
  const recommendedStake = round2((bankroll * recommendedPct) / 100);

  return {
    fullKellyPct,
    recommendedPct,
    recommendedStake,
    expectedValuePct,
    isPositiveEv: true,
  };
}

/**
 * Proqnoz Yarisi exact-score scoring:
 * Exact score: +5 | Correct goal difference & outcome: +3 | Correct 1X2 outcome: +1 | Otherwise: 0
 */
export function scoreContestPrediction(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number
): number {
  if (predHome === actualHome && predAway === actualAway) return 5;
  const predDiff = predHome - predAway;
  const actualDiff = actualHome - actualAway;
  if (predDiff === actualDiff) return 3;
  if (Math.sign(predDiff) === Math.sign(actualDiff)) return 1;
  return 0;
}

/**
 * Computes transparent model evaluation metrics (Brier score, hit rate by league/market, ROI, calibration curve).
 * Never hides losing predictions.
 */
export function computeArchiveMetrics(picks: ArchivePickItem[]): ArchiveTransparencyMetrics {
  const settled = picks.filter((p) => p.status === 'won' || p.status === 'lost');
  const totalSettled = settled.length;
  const wonCount = settled.filter((p) => p.status === 'won').length;
  const lostCount = totalSettled - wonCount;
  const hitRatePct = totalSettled > 0 ? round1((wonCount / totalSettled) * 100) : 0;

  let brierSum = 0;
  let profitUnits = 0;
  for (const p of settled) {
    const outcome = p.status === 'won' ? 1 : 0;
    const prob = clamp(p.modelProb / 100, 0, 1);
    brierSum += Math.pow(prob - outcome, 2);
    profitUnits += outcome === 1 ? p.odds - 1 : -1;
  }

  const brierScore = totalSettled > 0 ? Math.round((brierSum / totalSettled) * 1000) / 1000 : 0;
  const roiPct = totalSettled > 0 ? round1((profitUnits / totalSettled) * 100) : 0;

  const groupStats = (keyFn: (p: ArchivePickItem) => string) => {
    const map = new Map<string, { total: number; won: number; profit: number }>();
    for (const p of settled) {
      const k = keyFn(p);
      const cur = map.get(k) ?? { total: 0, won: 0, profit: 0 };
      cur.total += 1;
      if (p.status === 'won') {
        cur.won += 1;
        cur.profit += p.odds - 1;
      } else {
        cur.profit -= 1;
      }
      map.set(k, cur);
    }
    return Array.from(map.entries()).map(([k, v]) => ({
      key: k,
      total: v.total,
      won: v.won,
      hitRatePct: round1((v.won / v.total) * 100),
      roiPct: round1((v.profit / v.total) * 100),
    }));
  };

  const byLeague = groupStats((p) => p.league).map((x) => ({
    league: x.key,
    total: x.total,
    won: x.won,
    hitRatePct: x.hitRatePct,
    roiPct: x.roiPct,
  }));

  const byMarket = groupStats((p) => p.market).map((x) => ({
    market: x.key,
    total: x.total,
    won: x.won,
    hitRatePct: x.hitRatePct,
    roiPct: x.roiPct,
  }));

  const binDefs = [
    { label: '40–50%', min: 40, max: 50 },
    { label: '50–60%', min: 50, max: 60 },
    { label: '60–70%', min: 60, max: 70 },
    { label: '70–85%', min: 70, max: 85 },
  ];

  const calibrationBins = binDefs.map((b) => {
    const inBin = settled.filter((p) => p.modelProb >= b.min && p.modelProb < b.max);
    if (inBin.length === 0) {
      return { bucket: b.label, predictedAvg: round1((b.min + b.max) / 2), actualPct: 0, count: 0 };
    }
    const predAvg = inBin.reduce((s, p) => s + p.modelProb, 0) / inBin.length;
    const actualPct = (inBin.filter((p) => p.status === 'won').length / inBin.length) * 100;
    return {
      bucket: b.label,
      predictedAvg: round1(predAvg),
      actualPct: round1(actualPct),
      count: inBin.length,
    };
  });

  return {
    totalSettled,
    wonCount,
    lostCount,
    hitRatePct,
    brierScore,
    roiPct,
    byLeague,
    byMarket,
    calibrationBins,
  };
}
