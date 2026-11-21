import type {
  CouponLeg,
  GeneratedCoupon,
  MatchPredictionOutput,
  ValueBetSignal,
} from '../utils/bettingInsightsEngine';

export interface PlatformBookmakerOdds {
  bookmaker: string;
  home: number;
  draw: number;
  away: number;
  over25?: number;
  bttsYes?: number;
}

export interface PlatformOddsMovement {
  market: string;
  selection: string;
  openingOdds: number;
  currentOdds: number;
  dropPct: number;
  isSharpDrop: boolean;
}

export interface PlatformH2HItem {
  date: string;
  homeTeam: string;
  awayTeam: string;
  score: string;
  competition: string;
}

export interface PlatformFormItem {
  date: string;
  opponent: string;
  result: 'W' | 'D' | 'L';
  goalsFor: number;
  goalsAgainst: number;
  isHome: boolean;
}

export interface PlatformLineupPlayer {
  number: string;
  name: string;
  position: string;
  starter: boolean;
  x: number;
  y: number;
  goals?: number;
  card?: 'yellow' | 'red';
}

export interface PlatformMatchEvent {
  id: string;
  minute: string;
  type: 'goal' | 'yellow' | 'red' | 'sub' | 'other';
  teamSide: 'home' | 'away' | 'neutral';
  teamName: string;
  text: string;
}

export interface PlatformMatchStatBar {
  label: string;
  home: number;
  away: number;
  unit: string;
}

export interface PlatformMatch {
  id: string;
  leagueId: string;
  leagueSlug: string;
  leagueName: string;
  leagueShort: string;
  country: string;
  countryCode: string;
  dateId: string;
  dateIso: string;
  kickoffIso: string;
  time: string;
  status: 'LIVE' | 'UPCOMING' | 'FINISHED';
  minute: string;
  round: string;
  stadium: string;
  homeTeamId: string;
  homeTeamName: string;
  homeShort: string;
  homeLogo?: string;
  awayTeamId: string;
  awayTeamName: string;
  awayShort: string;
  awayLogo?: string;
  homeScore: number | null;
  awayScore: number | null;
  homeYellowCards: number;
  awayYellowCards: number;
  homeRedCards: number;
  awayRedCards: number;
  homeRank: number;
  awayRank: number;
  homeForm: Array<'W' | 'D' | 'L'>;
  awayForm: Array<'W' | 'D' | 'L'>;
  prediction: MatchPredictionOutput;
  hasRealOdds: boolean;
  oddsProvider?: string;
  bookmakerOdds: PlatformBookmakerOdds[];
  bestOdds: {
    home: number;
    draw: number;
    away: number;
    over25?: number;
    bttsYes?: number;
  } | null;
  fairOdds: {
    home: number;
    draw: number;
    away: number;
    over25: number;
    bttsYes: number;
  };
  oddsMovements: PlatformOddsMovement[];
  valueBets: ValueBetSignal[];
  hasSharpDrop: boolean;
  topValueEdge: number;
}

export interface PlatformMatchDetailPayload {
  matchId: string;
  venue?: string;
  attendance?: number;
  referee?: string;
  homeFormation?: string;
  awayFormation?: string;
  homeLineup: PlatformLineupPlayer[];
  awayLineup: PlatformLineupPlayer[];
  events: PlatformMatchEvent[];
  stats: PlatformMatchStatBar[];
  homeLastForm: PlatformFormItem[];
  awayLastForm: PlatformFormItem[];
  h2h: PlatformH2HItem[];
  espnOdds?: PlatformBookmakerOdds[];
}

export interface PlatformNewsArticle {
  id: string;
  headline: string;
  description: string;
  league: string;
  publishedIso: string;
  imageUrl?: string;
  url: string;
}

export interface PlatformStandingsRow {
  position: number;
  teamId: string;
  teamName: string;
  code: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  elo: number;
  form: Array<'W' | 'D' | 'L'>;
}

export interface PlatformStandingsLeague {
  id: string;
  name: string;
  country: string;
  season: string;
  table: PlatformStandingsRow[];
}

export interface PlatformArchivePick {
  id: string;
  date: string;
  matchLabel: string;
  league: string;
  market: string;
  selection: string;
  odds: number;
  modelProb: number;
  actualOutcome: string;
  status: 'WON' | 'LOST';
}

export interface PlatformTransparencyMetrics {
  totalSettled: number;
  wonCount: number;
  lostCount: number;
  hitRatePct: number;
  highConfidenceHitRatePct: number;
  brierScore: number;
  roiPct: number;
  byLeague: Array<{
    league: string;
    total: number;
    won: number;
    hitRatePct: number;
    brierScore: number;
    roiPct: number;
  }>;
  byMarket: Array<{
    market: string;
    total: number;
    won: number;
    hitRatePct: number;
    roiPct: number;
  }>;
  calibrationBuckets: Array<{
    range: string;
    predictedAvg: number;
    actualRate: number;
    count: number;
  }>;
}

export interface PlatformTransparencyPayload {
  sourceLabel: string;
  updatedAt: string;
  metrics: PlatformTransparencyMetrics;
  archive: PlatformArchivePick[];
}

export interface PlatformFeatureFlag {
  key: string;
  labelAz: string;
  descriptionAz: string;
  enabled: boolean;
}

export const DEFAULT_PLATFORM_FEATURE_FLAGS: PlatformFeatureFlag[] = [
  {
    key: 'value_bet_scanner',
    labelAz: 'Real Value Bet (+5%) Skaneri',
    descriptionAz: 'Real bukmeker əmsalı ilə model fərqi +5% üstü olan oyunları işarələ',
    enabled: true,
  },
  {
    key: 'sharp_odds_alerts',
    labelAz: 'Canlı Əmsal Düşüşü Detektoru',
    descriptionAz: 'Real bazar əmsalında >= 8% eniş olduqda siqnal göstər',
    enabled: true,
  },
  {
    key: 'ai_chat_assistant',
    labelAz: 'AI Futbol Analitiki',
    descriptionAz: 'Canlı ESPN + Odds API alət çağırışlı AI köməkçi',
    enabled: true,
  },
  {
    key: 'prediction_contest',
    labelAz: 'Proqnoz Yarışı',
    descriptionAz: 'Real oyunlar üzrə pulsuz hesab təxmini yarışı',
    enabled: true,
  },
];

export interface PlatformSmartCouponResponse {
  coupons: GeneratedCoupon[];
  refreshedAt: string;
  realOddsMatchCount: number;
}
