export type Language = 'az' | 'en' | 'ru';
export type ThemeMode = 'dark' | 'light';

export type MatchStatus = 'live' | 'upcoming' | 'finished';
export type FormResult = 'W' | 'D' | 'L';
export type ConfidenceBand = 'low' | 'medium' | 'high';
export type MarketFilter = 'all' | '1x2' | 'over25' | 'btts';
export type DataMode = 'live-api' | 'demo';

export interface FormEntry {
  result: FormResult;
  goalsFor: number;
  goalsAgainst: number;
  isHome: boolean;
  opponent: string;
  date: string;
}

export interface PlayerAbsence {
  playerName: string;
  position: 'FW' | 'MF' | 'DF' | 'GK';
  reason: 'injury' | 'suspension';
  impact: 'key' | 'rotation' | 'minor';
  expectedReturn?: string;
}

export interface TeamSplitStats {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  xGFor?: number;
  xGAgainst?: number;
}

export interface TeamProfile {
  id: string;
  name: string;
  shortName: string;
  code: string;
  country: string;
  leagueId: string;
  elo: number;
  standingsPosition: number;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  xGFor?: number;
  xGAgainst?: number;
  homeSplit: TeamSplitStats;
  awaySplit: TeamSplitStats;
  last10Form: FormEntry[];
  absences: PlayerAbsence[];
  /** Rolling points-per-game trend over last 6 matchweeks for sparklines */
  formTrend: number[];
}

export interface HeadToHeadEntry {
  date: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  homeGoals: number;
  awayGoals: number;
  competition: string;
}

export interface LeagueInfo {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  region: string;
  season: string;
  avgHomeGoals: number;
  avgAwayGoals: number;
  homeAdvantageFactor: number;
}

export interface MatchLiveStats {
  possession?: { home: number; away: number };
  shots?: { home: number; away: number };
  shotsOnTarget?: { home: number; away: number };
  corners?: { home: number; away: number };
}

export interface MatchRecord {
  id: string;
  leagueId: string;
  leagueSlug?: string;
  leagueName: string;
  country: string;
  countryCode: string;
  kickoffIso: string; // ISO string
  dateKey: string; // YYYY-MM-DD
  status: MatchStatus;
  minute?: number;
  venue: string;
  score?: {
    home: number;
    away: number;
  };
  liveStats?: MatchLiveStats;
  homeTeam: TeamProfile;
  awayTeam: TeamProfile;
  leagueAvgHomeGoals: number;
  leagueAvgAwayGoals: number;
  leagueHomeAdvantage: number;
  h2h: HeadToHeadEntry[];
  hasXG: boolean;
}

export interface ScorelineProbability {
  score: string;
  homeGoals: number;
  awayGoals: number;
  probability: number;
}

export type PredictionFactorKey =
  | 'poisson_attack_defense'
  | 'elo_rating'
  | 'recent_form'
  | 'home_advantage'
  | 'head_to_head'
  | 'squad_availability'
  | 'fatigue_congestion';

export interface PredictionFactor {
  key: PredictionFactorKey;
  /** Percentage weight in the model (all 7 sum to 100) */
  weight: number;
  /** Normalized directional edge in [-1, 1] where > 0 favors Home, < 0 favors Away */
  homeEdge: number;
  /** Structured metrics for localized UI rendering */
  metrics: Record<string, number | string>;
}

export interface MatchPrediction {
  matchId: string;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  over25Prob: number;
  under25Prob: number;
  bttsYesProb: number;
  bttsNoProb: number;
  expectedGoals: {
    home: number;
    away: number;
  };
  topScorelines: ScorelineProbability[];
  topOutcome: {
    selection: 'home' | 'draw' | 'away';
    probability: number;
  };
  bestMarketPick: {
    market: '1x2' | 'over25' | 'btts';
    selection: 'home' | 'draw' | 'away' | 'over25' | 'under25' | 'btts_yes' | 'btts_no';
    probability: number;
  };
  confidenceScore: number; // 0-100
  confidenceBand: ConfidenceBand;
  /** Calibrated uncertainty interval (+/- probability points, e.g. 0.055 = ±5.5%) */
  uncertaintyMargin: number;
  /** True when probabilities and scorelines are dynamically adjusted for live score & elapsed minute */
  isLiveAdjusted?: boolean;
  liveMinute?: number;
  remainingExpectedGoals?: {
    home: number;
    away: number;
  };
  factors: PredictionFactor[];
}

export interface MatchWithPrediction extends MatchRecord {
  prediction: MatchPrediction;
}

export interface StandingsRow {
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
  xGFor?: number;
  xGAgainst?: number;
  elo: number;
  form: FormResult[];
  formTrend: number[];
}

export interface LeagueStandings {
  league: LeagueInfo;
  table: StandingsRow[];
}

export interface HistoricalPredictionRecord {
  id: string;
  date: string;
  leagueId: string;
  leagueName: string;
  homeTeam: string;
  awayTeam: string;
  predictedSelection: 'home' | 'draw' | 'away';
  predictedProb: number;
  confidenceBand: ConfidenceBand;
  actualResult: 'home' | 'draw' | 'away';
  actualScore: string;
  hit: boolean;
  brierScore: number;
}

export interface PerformanceSummary {
  totalEvaluated: number;
  overallHitRate: number;
  avgBrierScore: number;
  highConfidenceHitRate: number;
  byLeague: Array<{
    leagueId: string;
    leagueName: string;
    total: number;
    hits: number;
    hitRate: number;
    avgBrier: number;
  }>;
  byConfidence: Array<{
    band: ConfidenceBand;
    total: number;
    hits: number;
    hitRate: number;
    expectedAvgProb: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    hitRate: number;
    volume: number;
    brier: number;
  }>;
  recentResults: HistoricalPredictionRecord[];
}

export interface ApiStatusInfo {
  mode: DataMode;
  provider: 'espn-live' | 'api-football' | 'football-data' | 'demo';
  cachedAt: string;
  cacheTtlSeconds: number;
  hasConfiguredKey?: boolean;
  sourceLabel?: string;
  rateLimitRemaining?: number;
  rateLimitResetSeconds?: number;
  fallbackReason?: string;
}

export interface WatchlistEntry {
  matchId: string;
  addedAt: string;
  savedPick?: {
    market: '1x2' | 'over25' | 'btts';
    selection: string;
    probability: number;
  };
  note?: string;
}

export interface BookmakerOddsQuote {
  matchKey: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime?: string;
  bookmaker: string;
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
}

export interface LiveProbSnapshot {
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  over25Prob: number;
  bttsYesProb: number;
  scoreHome: number;
  scoreAway: number;
  minute?: number;
  capturedAt: string;
}

export type BetResultStatus = 'pending' | 'win' | 'loss' | 'void';

export interface BankrollBet {
  id: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
  matchLabel: string;
  selection: string;
  stake: number;
  odds: number;
  result: BetResultStatus;
  note?: string;
}

export interface WatchlistAlertItem {
  id: string;
  matchId: string;
  title: string;
  body: string;
  timestamp: string;
  kind: 'live_start' | 'goal' | 'prob_shift';
}
