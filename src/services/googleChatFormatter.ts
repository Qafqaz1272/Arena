import type { Language, MatchWithPrediction } from '../types/football';
import { translations, formatConfidenceLabel, formatSelectionLabel } from '../i18n/translations';

export type GoogleChatErrorKind =
  | 'APP_NOT_CONFIGURED'
  | 'WORKSPACE_ACCOUNT_REQUIRED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'API_ERROR';

export interface ParsedGoogleChatError {
  kind: GoogleChatErrorKind;
  status: number;
  rawMessage: string;
}

/**
 * Pure parser that classifies Google Chat REST API errors so the UI can display
 * actionable guidance (especially HTTP 404 "Google Chat app not found" and Workspace prerequisites).
 */
export function parseGoogleChatError(
  status: number,
  payload: unknown
): ParsedGoogleChatError {
  let rawMessage = '';
  if (typeof payload === 'string') {
    rawMessage = payload;
  } else if (payload && typeof payload === 'object') {
    const errObj = (payload as { error?: { message?: string; status?: string } }).error;
    if (errObj && typeof errObj.message === 'string') {
      rawMessage = errObj.message;
    } else if ('message' in payload && typeof (payload as { message?: unknown }).message === 'string') {
      rawMessage = (payload as { message: string }).message;
    }
  }

  const lower = rawMessage.toLowerCase();

  if (status === 401) {
    return { kind: 'UNAUTHORIZED', status, rawMessage: rawMessage || 'Unauthorized' };
  }

  if (
    status === 404 &&
    (lower.includes('google chat app not found') ||
      lower.includes('configure the app in the google cloud console') ||
      lower.includes('chat app not found'))
  ) {
    return {
      kind: 'APP_NOT_CONFIGURED',
      status,
      rawMessage: rawMessage || 'Google Chat app not found.',
    };
  }

  if (
    status === 403 &&
    (lower.includes('workspace') ||
      lower.includes('consumer') ||
      lower.includes('gmail') ||
      lower.includes('not a google workspace') ||
      lower.includes('chat is not enabled'))
  ) {
    return {
      kind: 'WORKSPACE_ACCOUNT_REQUIRED',
      status,
      rawMessage: rawMessage || 'Google Workspace account required.',
    };
  }

  if (status === 403) {
    return { kind: 'FORBIDDEN', status, rawMessage: rawMessage || 'Permission denied' };
  }

  if (status === 429) {
    return { kind: 'RATE_LIMITED', status, rawMessage: rawMessage || 'Rate limit exceeded' };
  }

  if (status === 404) {
    return { kind: 'NOT_FOUND', status, rawMessage: rawMessage || 'Resource not found' };
  }

  return {
    kind: 'API_ERROR',
    status,
    rawMessage: rawMessage || `Google Chat API error (HTTP ${status})`,
  };
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Formats a clean, structured MatchEdge statistical summary ready to share in Google Chat.
 * Uses Google Chat markdown (*bold*, clean bullet lines) and always includes the compliance disclaimer.
 */
export function formatMatchForGoogleChat(
  match: MatchWithPrediction,
  lang: Language
): string {
  const t = translations[lang];
  const p = match.prediction;
  const home = match.homeTeam;
  const away = match.awayTeam;

  const statusLine =
    match.status === 'live' && match.score
      ? `${t.common.live} ${match.minute ?? 0}' (${match.score.home}–${match.score.away})`
      : match.status === 'finished' && match.score
        ? `${t.common.finished} (${match.score.home}–${match.score.away})`
        : `${t.common.upcoming} · ${match.dateKey}`;

  const topPickLabel = formatSelectionLabel(p.topOutcome.selection, t);
  const confidenceLabel = formatConfidenceLabel(p.confidenceBand, t);
  const topScores = p.topScorelines
    .slice(0, 3)
    .map((s) => `${s.score} (${pct(s.probability)})`)
    .join(', ');

  // Pick top 2 strongest directional factors by absolute impact
  const topFactors = [...p.factors]
    .sort((a, b) => Math.abs(b.homeEdge) * b.weight - Math.abs(a.homeEdge) * a.weight)
    .slice(0, 2)
    .map((f) => {
      const dir =
        f.homeEdge > 0.08
          ? home.shortName
          : f.homeEdge < -0.08
            ? away.shortName
            : t.matchDetail.balanced;
      return `  • ${t.matchDetail.factors[f.key]} (${f.weight}%): ${dir}`;
    });

  const lines = [
    `*MatchEdge · ${match.leagueName}*`,
    `*${home.name} vs ${away.name}* — ${statusLine}`,
    ``,
    `• *1X2*: ${home.shortName} ${pct(p.homeWinProb)} | ${t.common.draw} ${pct(p.drawProb)} | ${away.shortName} ${pct(p.awayWinProb)}`,
    `• *${t.common.over25} / ${t.common.under25}*: ${pct(p.over25Prob)} / ${pct(p.under25Prob)}`,
    `• *${t.common.marketBtts}*: ${t.common.bttsYes} ${pct(p.bttsYesProb)} | ${t.common.bttsNo} ${pct(p.bttsNoProb)}`,
    `• *${t.common.expectedGoals}*: ${home.shortName} ${p.expectedGoals.home.toFixed(2)} – ${p.expectedGoals.away.toFixed(2)} ${away.shortName}`,
    `• *${t.predictions.recommendedPick}*: ${topPickLabel} (${pct(p.topOutcome.probability)}, ±${pct(p.uncertaintyMargin)}) · ${t.common.confidence}: ${confidenceLabel}`,
    `• *${t.common.mostLikelyScore}*: ${topScores}`,
    ``,
    `*${t.matchDetail.whyTitle}*`,
    ...topFactors,
    ``,
    `_${t.common.disclaimer}_`,
  ];

  return lines.join('\n');
}
