import {
  GoogleGenAI,
  ThinkingLevel,
  type GenerateContentResponse,
  type Part,
} from '@google/genai';
import type { Language, MatchWithPrediction } from '../types/football.ts';
import {
  buildDefaultScreenshotPrompt,
  sanitizeCouponConcept,
  sanitizeImageAttachments,
} from '../engine/couponAnalyzer.ts';
import {
  buildMatchAnalystSystemInstruction,
  sanitizeChatHistory,
  type ChatMessageInput,
} from './matchChatPrompt.ts';

const PRIMARY_ANALYST_MODEL = 'gemini-4-hydrogen';
const FALLBACK_ANALYST_MODEL = 'gemini-3.1-flash-lite';

export class MatchChatConfigError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'MatchChatConfigError';
    this.statusCode = statusCode;
  }
}

function resolveGeminiApiKey(): string | null {
  const raw = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!raw) return null;
  const cleaned = raw.trim().replace(/^['"]+|['"]+$/g, '').trim();
  if (!cleaned || cleaned === 'MY_GEMINI_API_KEY') return null;
  return cleaned;
}

function localizedError(
  kind: 'missing_key' | 'invalid_key' | 'rate_limit' | 'high_demand' | 'generic',
  lang: Language,
  fallbackDetail?: string
): string {
  if (kind === 'missing_key') {
    if (lang === 'az') {
      return 'GEMINI_API_KEY serverdə təyin edilməyib. Zəhmət olmasa Settings > Secrets bölməsində Gemini API açarını yoxlayın.';
    }
    if (lang === 'ru') {
      return 'GEMINI_API_KEY не задан на сервере. Пожалуйста, проверьте ключ в разделе Settings > Secrets.';
    }
    return 'GEMINI_API_KEY is not configured on the server. Please check your API key in Settings > Secrets.';
  }
  if (kind === 'invalid_key') {
    if (lang === 'az') {
      return 'Gemini API açarı qəbul edilmədi. Zəhmət olmasa Settings > Secrets bölməsində açarı yoxlayın.';
    }
    if (lang === 'ru') {
      return 'Ключ Gemini API отклонён. Пожалуйста, проверьте ключ в Settings > Secrets.';
    }
    return 'Gemini API key was rejected. Please verify GEMINI_API_KEY in Settings > Secrets.';
  }
  if (kind === 'rate_limit') {
    if (lang === 'az') {
      return 'AI analitik sorğu limiti dolub. Bir qədər sonra yenidən cəhd edin.';
    }
    if (lang === 'ru') {
      return 'Превышен лимит запросов к AI-аналитику. Пожалуйста, повторите попытку чуть позже.';
    }
    return 'AI assistant rate limit reached. Please wait a moment and try again.';
  }
  if (kind === 'high_demand') {
    if (lang === 'az') {
      return 'AI modelində müvəqqəti yüksək yüklənmə var. Zəhmət olmasa bir neçə saniyə sonra yenidən cəhd edin.';
    }
    if (lang === 'ru') {
      return 'На стороне AI-модели временная высокая нагрузка. Повторите попытку через несколько секунд.';
    }
    return 'The AI model is experiencing temporary high demand. Please retry in a few seconds.';
  }
  return fallbackDetail || 'Unable to generate match analysis response.';
}

/**
 * Unwraps nested JSON error strings returned by @google/genai into a clean human-readable message.
 */
function extractReadableErrorMessage(raw: string): string {
  let current = raw.trim();
  for (let depth = 0; depth < 3; depth += 1) {
    if (!current.startsWith('{')) break;
    try {
      const parsed = JSON.parse(current) as {
        error?: { message?: string } | string;
        message?: string;
      };
      if (parsed.error && typeof parsed.error === 'object' && typeof parsed.error.message === 'string') {
        current = parsed.error.message.trim();
      } else if (typeof parsed.message === 'string') {
        current = parsed.message.trim();
      } else {
        break;
      }
    } catch {
      break;
    }
  }
  return current;
}

function getGeminiClient(lang: Language): GoogleGenAI {
  const apiKey = resolveGeminiApiKey();
  if (!apiKey) {
    // Use HTTP 500 (not 503) so reverse proxies with error_page 503 interception preserve the JSON body
    throw new MatchChatConfigError(localizedError('missing_key', lang), 500);
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const PRIMARY_TEXT_TIMEOUT_MS = 14_000;
const PRIMARY_IMAGE_TIMEOUT_MS = 22_000;
const FALLBACK_TIMEOUT_MS = 25_000;

export function resolveAttemptTimeoutMs(params: {
  model: string;
  hasImages: boolean;
  attemptIndex: number;
}): number {
  if (params.model === PRIMARY_ANALYST_MODEL) {
    return params.hasImages ? PRIMARY_IMAGE_TIMEOUT_MS : PRIMARY_TEXT_TIMEOUT_MS;
  }
  return params.hasImages ? FALLBACK_TIMEOUT_MS + 10_000 : FALLBACK_TIMEOUT_MS;
}

export function isTransientOverload(err: unknown): boolean {
  const raw = err instanceof Error ? err.message : String(err);
  const upper = raw.toUpperCase();
  return (
    upper.includes('UNAVAILABLE') ||
    upper.includes('HIGH DEMAND') ||
    upper.includes('OVERLOADED') ||
    upper.includes('503') ||
    upper.includes('500') ||
    upper.includes('INTERNAL') ||
    upper.includes('DEADLINE_EXCEEDED') ||
    upper.includes('TIMED OUT') ||
    upper.includes('TIMEOUT')
  );
}

export function canTryAlternateModel(err: unknown): boolean {
  if (isTransientOverload(err)) return true;
  const raw = err instanceof Error ? err.message : String(err);
  const upper = raw.toUpperCase();
  return (
    upper.includes('RESOURCE_EXHAUSTED') ||
    upper.includes('429') ||
    upper.includes('NOT_FOUND') ||
    upper.includes('404') ||
    upper.includes('EMPTY RESPONSE')
  );
}

/**
 * Maps upstream Gemini errors to safe HTTP status codes (never 403/502/503/504,
 * which Nginx error_page intercepts and rewrites to HTML warmup/forbidden pages).
 */
export function mapGeminiError(err: unknown, lang: Language): { status: number; message: string } {
  if (err instanceof MatchChatConfigError) {
    const safeStatus = [403, 502, 503, 504].includes(err.statusCode) ? 500 : err.statusCode;
    return { status: safeStatus, message: err.message };
  }
  const raw = err instanceof Error ? err.message : String(err);
  const readable = extractReadableErrorMessage(raw);
  const upper = `${raw} ${readable}`.toUpperCase();

  if (upper.includes('API_KEY_INVALID') || upper.includes('PERMISSION_DENIED') || upper.includes('403')) {
    return { status: 401, message: localizedError('invalid_key', lang) };
  }
  if (upper.includes('RESOURCE_EXHAUSTED') || upper.includes('429')) {
    return { status: 429, message: localizedError('rate_limit', lang) };
  }
  if (isTransientOverload(err)) {
    return { status: 429, message: localizedError('high_demand', lang) };
  }
  return {
    status: 500,
    message: localizedError('generic', lang, readable),
  };
}

export async function streamMatchAnalystReply(params: {
  match: MatchWithPrediction;
  message: string;
  history: unknown;
  lang: Language;
  images?: unknown;
  couponConcept?: unknown;
  signal?: AbortSignal;
  onChunk: (text: string) => void;
}): Promise<string> {
  const sanitizedImages = sanitizeImageAttachments(params.images);
  const hasImages = sanitizedImages.length > 0;
  const couponConcept = sanitizeCouponConcept(params.couponConcept);
  const rawMessage = typeof params.message === 'string' ? params.message.trim() : '';

  const effectiveMessage =
    rawMessage ||
    (hasImages ? buildDefaultScreenshotPrompt(couponConcept, params.lang) : '');

  if (!effectiveMessage) {
    throw new MatchChatConfigError('Message cannot be empty.', 400);
  }

  const ai = getGeminiClient(params.lang);
  const systemInstruction = buildMatchAnalystSystemInstruction(params.match, params.lang, {
    couponConcept,
    hasImages,
  });
  const sanitizedHistory: ChatMessageInput[] = sanitizeChatHistory(params.history);

  const geminiHistory = sanitizedHistory.map((turn) => ({
    role: turn.role,
    parts: [{ text: turn.text }],
  }));

  const userParts: Part[] = [
    ...sanitizedImages.map((img) => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.data,
      },
    })),
    { text: effectiveMessage.slice(0, 1400) },
  ];

  // Attempt chain: primary model -> fast flash-lite fallback -> final retry on fast fallback
  const attempts: Array<{ model: string; delayMs: number }> = [
    { model: PRIMARY_ANALYST_MODEL, delayMs: 0 },
    { model: FALLBACK_ANALYST_MODEL, delayMs: 250 },
    { model: FALLBACK_ANALYST_MODEL, delayMs: 750 },
  ];

  let lastError: unknown = null;
  let emittedAnyChunk = false;

  const trackedOnChunk = (text: string) => {
    emittedAnyChunk = true;
    params.onChunk(text);
  };

  for (let i = 0; i < attempts.length; i += 1) {
    if (params.signal?.aborted) {
      throw new MatchChatConfigError('Request cancelled by client.', 499);
    }

    const step = attempts[i];
    if (step.delayMs > 0) {
      await new Promise((r) => setTimeout(r, step.delayMs));
    }

    const timeoutMs = resolveAttemptTimeoutMs({
      model: step.model,
      hasImages,
      attemptIndex: i,
    });
    const attemptController = new AbortController();
    let timedOut = false;

    const onCallerAbort = () => {
      attemptController.abort();
    };
    params.signal?.addEventListener('abort', onCallerAbort, { once: true });

    let firstChunkTimer: ReturnType<typeof setTimeout> | undefined;
    const armFirstChunkTimeout = () => {
      firstChunkTimer = setTimeout(() => {
        timedOut = true;
        attemptController.abort();
      }, timeoutMs);
    };
    const clearFirstChunkTimeout = () => {
      if (firstChunkTimer) {
        clearTimeout(firstChunkTimer);
        firstChunkTimer = undefined;
      }
    };

    try {
      armFirstChunkTimeout();

      const chat = ai.chats.create({
        model: step.model,
        history: geminiHistory,
        config: {
          systemInstruction,
          abortSignal: attemptController.signal,
          ...(step.model === PRIMARY_ANALYST_MODEL
            ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
            : {}),
        },
      });

      const stream = await chat.sendMessageStream({
        message: hasImages ? userParts : effectiveMessage.slice(0, 1400),
      });

      let fullText = '';
      for await (const chunk of stream) {
        const c = chunk as GenerateContentResponse;
        const piece = c.text;
        if (piece) {
          clearFirstChunkTimeout();
          fullText += piece;
          trackedOnChunk(piece);
        }
      }
      clearFirstChunkTimeout();

      if (fullText.trim().length > 0) {
        return fullText;
      }
      lastError = new Error('Empty response from model');
    } catch (err) {
      clearFirstChunkTimeout();
      if (params.signal?.aborted) {
        throw new MatchChatConfigError('Request cancelled by client.', 499);
      }
      const normalizedErr = timedOut
        ? new Error(`DEADLINE_EXCEEDED: model timed out after ${Math.round(timeoutMs / 1000)}s`)
        : err;
      lastError = normalizedErr;

      // Do not retry if partial text was already streamed to the user or error is non-retryable (e.g. invalid API key)
      if (emittedAnyChunk || !canTryAlternateModel(normalizedErr)) {
        break;
      }
    } finally {
      clearFirstChunkTimeout();
      params.signal?.removeEventListener('abort', onCallerAbort);
    }
  }

  const mapped = mapGeminiError(lastError, params.lang);
  throw new MatchChatConfigError(mapped.message, mapped.status);
}
