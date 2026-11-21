import type { Language, MatchWithPrediction } from '../types/football.ts';
import {
  buildCouponSystemDirective,
  type CouponConceptConfig,
} from '../engine/couponAnalyzer.ts';

export interface ChatMessageInput {
  role: 'user' | 'model';
  text: string;
}

const MAX_HISTORY_TURNS = 12;
const MAX_MESSAGE_CHARS = 1200;

export function sanitizeChatHistory(raw: unknown): ChatMessageInput[] {
  if (!Array.isArray(raw)) return [];
  const cleaned: ChatMessageInput[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const role = (item as { role?: unknown }).role;
    const text = (item as { text?: unknown }).text;
    if ((role === 'user' || role === 'model') && typeof text === 'string') {
      const trimmed = text.trim();
      if (trimmed.length === 0) continue;
      // History must begin with a user turn
      if (cleaned.length === 0 && role !== 'user') continue;
      const prev = cleaned[cleaned.length - 1];
      if (prev && prev.role === role) {
        // Keep the latest message if two consecutive turns share the same role
        cleaned[cleaned.length - 1] = {
          role,
          text: trimmed.slice(0, MAX_MESSAGE_CHARS),
        };
      } else {
        cleaned.push({
          role,
          text: trimmed.slice(0, MAX_MESSAGE_CHARS),
        });
      }
    }
  }
  const sliced = cleaned.slice(-MAX_HISTORY_TURNS);
  // Ensure the slice starts with 'user' and ends with 'model' before appending the new user message
  while (sliced.length > 0 && sliced[0].role !== 'user') {
    sliced.shift();
  }
  while (sliced.length > 0 && sliced[sliced.length - 1].role !== 'model') {
    sliced.pop();
  }
  return sliced;
}

export function buildMatchAnalystSystemInstruction(
  match: MatchWithPrediction,
  lang: Language,
  options?: {
    couponConcept?: CouponConceptConfig | null;
    hasImages?: boolean;
  }
): string {
  const { homeTeam, awayTeam, prediction: pred } = match;
  const languageDirective =
    lang === 'az'
      ? 'Respond in natural, clear Azerbaijani by default (unless the user explicitly writes in English or Russian, in which case reply in the language of their question).'
      : lang === 'ru'
        ? 'Respond in natural, clear Russian by default (unless the user explicitly writes in Azerbaijani or English, in which case reply in the language of their question).'
        : 'Respond in natural, clear English by default (unless the user explicitly writes in Azerbaijani or Russian, in which case reply in the language of their question).';

  const statusLine =
    match.status === 'live'
      ? `LIVE IN-PLAY (${match.minute ?? 0}') — Current Score: ${homeTeam.name} ${match.score?.home ?? 0} - ${match.score?.away ?? 0} ${awayTeam.name}`
      : match.status === 'finished'
        ? `FINISHED — Final Score: ${homeTeam.name} ${match.score?.home ?? 0} - ${match.score?.away ?? 0} ${awayTeam.name}`
        : `UPCOMING — Kickoff: ${match.kickoffIso}`;

  const formatForm = (team: MatchWithPrediction['homeTeam']) => {
    if (!team.last10Form || team.last10Form.length === 0) return 'No recent match log available';
    return team.last10Form
      .slice(0, 6)
      .map(
        (f) =>
          `${f.result} (${f.goalsFor}-${f.goalsAgainst} ${f.isHome ? 'H' : 'A'} vs ${f.opponent}, ${f.date})`
      )
      .join('; ');
  };

  const formatAbsences = (team: MatchWithPrediction['homeTeam']) => {
    if (!team.absences || team.absences.length === 0) return 'None reported';
    return team.absences
      .map((a) => `${a.playerName} (${a.position}, ${a.reason}, ${a.impact})`)
      .join('; ');
  };

  const formatH2H = () => {
    if (!match.h2h || match.h2h.length === 0) return 'No recent H2H records loaded';
    return match.h2h
      .slice(0, 6)
      .map(
        (h) =>
          `${h.date}: ${h.homeTeamName} ${h.homeGoals}-${h.awayGoals} ${h.awayTeamName} (${h.competition})`
      )
      .join('; ');
  };

  const liveStatsSection = match.liveStats
    ? [
        'In-Play / Match Statistics:',
        match.liveStats.possession
          ? `- Possession: ${homeTeam.shortName} ${match.liveStats.possession.home}% vs ${awayTeam.shortName} ${match.liveStats.possession.away}%`
          : null,
        match.liveStats.shots
          ? `- Total Shots: ${homeTeam.shortName} ${match.liveStats.shots.home} vs ${awayTeam.shortName} ${match.liveStats.shots.away}`
          : null,
        match.liveStats.shotsOnTarget
          ? `- Shots on Target: ${homeTeam.shortName} ${match.liveStats.shotsOnTarget.home} vs ${awayTeam.shortName} ${match.liveStats.shotsOnTarget.away}`
          : null,
        match.liveStats.corners
          ? `- Corners: ${homeTeam.shortName} ${match.liveStats.corners.home} vs ${awayTeam.shortName} ${match.liveStats.corners.away}`
          : null,
      ]
        .filter(Boolean)
        .join('\n')
    : 'In-Play / Match Statistics: Not available yet';

  const factorsSummary = pred.factors
    .map(
      (f) =>
        `- ${f.key} (weight ${f.weight}%, homeEdge ${f.homeEdge >= 0 ? '+' : ''}${f.homeEdge}): ${JSON.stringify(f.metrics)}`
    )
    .join('\n');

  const topScorelines = pred.topScorelines
    .map((s) => `${s.score} (${(s.probability * 100).toFixed(1)}%)`)
    .join(', ');

  return [
    'You are MatchEdge Analyst, a sharp, objective football (soccer) analytics assistant embedded inside the match analysis page.',
    languageDirective,
    '',
    'STRICT ANALYTICAL RULES:',
    '1. Ground every claim strictly in the real match metrics, team standings, Elo, form, H2H, live stats, and Poisson/Dixon-Coles model outputs provided below.',
    '2. Never invent player names, injuries, odds, or statistics that are not present in the context below. If a metric (like lineups or xG) is unavailable, say so transparently.',
    '3. Keep responses concise, structured, and easy to scan (short paragraphs or 3-6 crisp bullet points with exact numbers).',
    '4. Always express outcomes probabilistically with honest uncertainty. NEVER guarantee results or tell the user a bet is "sure" or "guaranteed".',
    '5. If the match is LIVE, always anchor your reasoning in the current score, elapsed minute, remaining expected goals (+λ), and remaining time left.',
    '',
    '=== MATCH CONTEXT ===',
    `Competition: ${match.leagueName} (${match.country})`,
    `Venue: ${match.venue}`,
    `Status: ${statusLine}`,
    `League Averages: Home ${match.leagueAvgHomeGoals} goals/game, Away ${match.leagueAvgAwayGoals} goals/game, Home Advantage x${match.leagueHomeAdvantage}`,
    '',
    `HOME TEAM: ${homeTeam.name} (#${homeTeam.standingsPosition}, Elo ${homeTeam.elo})`,
    `- Record: ${homeTeam.played}P ${homeTeam.wins}W-${homeTeam.draws}D-${homeTeam.losses}L, ${homeTeam.points} pts, GF:GA ${homeTeam.goalsFor}:${homeTeam.goalsAgainst}`,
    `- Home Split: ${homeTeam.homeSplit.played}P ${homeTeam.homeSplit.wins}W-${homeTeam.homeSplit.draws}D-${homeTeam.homeSplit.losses}L, GF:GA ${homeTeam.homeSplit.goalsFor}:${homeTeam.homeSplit.goalsAgainst}`,
    `- Recent Form: ${formatForm(homeTeam)}`,
    `- Absences: ${formatAbsences(homeTeam)}`,
    '',
    `AWAY TEAM: ${awayTeam.name} (#${awayTeam.standingsPosition}, Elo ${awayTeam.elo})`,
    `- Record: ${awayTeam.played}P ${awayTeam.wins}W-${awayTeam.draws}D-${awayTeam.losses}L, ${awayTeam.points} pts, GF:GA ${awayTeam.goalsFor}:${awayTeam.goalsAgainst}`,
    `- Away Split: ${awayTeam.awaySplit.played}P ${awayTeam.awaySplit.wins}W-${awayTeam.awaySplit.draws}D-${awayTeam.awaySplit.losses}L, GF:GA ${awayTeam.awaySplit.goalsFor}:${awayTeam.awaySplit.goalsAgainst}`,
    `- Recent Form: ${formatForm(awayTeam)}`,
    `- Absences: ${formatAbsences(awayTeam)}`,
    '',
    `Head-to-Head (H2H): ${formatH2H()}`,
    liveStatsSection,
    '',
    '=== MATCHEDGE STATISTICAL MODEL OUTPUT ===',
    `Mode: ${pred.isLiveAdjusted ? `Live In-Play Adjusted (${pred.liveMinute ?? match.minute ?? 0}')` : 'Pre-Match Poisson + Dixon-Coles + Elo'}`,
    `1X2 Probabilities: Home ${(pred.homeWinProb * 100).toFixed(1)}% | Draw ${(pred.drawProb * 100).toFixed(1)}% | Away ${(pred.awayWinProb * 100).toFixed(1)}%`,
    `Over/Under 2.5: Over ${(pred.over25Prob * 100).toFixed(1)}% | Under ${(pred.under25Prob * 100).toFixed(1)}%`,
    `BTTS: Yes ${(pred.bttsYesProb * 100).toFixed(1)}% | No ${(pred.bttsNoProb * 100).toFixed(1)}%`,
    `Full-90 Expected Goals (λ): ${homeTeam.shortName} ${pred.expectedGoals.home.toFixed(2)} vs ${awayTeam.shortName} ${pred.expectedGoals.away.toFixed(2)}`,
    pred.isLiveAdjusted && pred.remainingExpectedGoals
      ? `Remaining Expected Goals (+λ): ${homeTeam.shortName} +${pred.remainingExpectedGoals.home.toFixed(2)} vs ${awayTeam.shortName} +${pred.remainingExpectedGoals.away.toFixed(2)}`
      : null,
    `Top 5 Likely Scorelines: ${topScorelines}`,
    `Confidence: ${pred.confidenceBand.toUpperCase()} (${pred.confidenceScore}/100), Uncertainty: ±${(pred.uncertaintyMargin * 100).toFixed(1)}%`,
    'Factor Breakdown:',
    factorsSummary,
    buildCouponSystemDirective(
      options?.couponConcept ?? null,
      Boolean(options?.hasImages),
      lang
    ),
  ]
    .filter((line): line is string => line !== null)
    .join('\n');
}
