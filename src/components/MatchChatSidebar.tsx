import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ImagePlus,
  MessageSquare,
  RotateCcw,
  Send,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { Language, MatchWithPrediction } from '../types/football';
import type { TranslationDictionary } from '../i18n/translations';
import { footballService, FootballServiceError } from '../services/footballService';
import {
  buildDefaultScreenshotPrompt,
  MAX_CHAT_IMAGES,
  PRESET_TARGET_ODDS,
  type CouponConceptConfig,
  type CouponConceptPreset,
} from '../engine/couponAnalyzer';
import {
  prepareScreenshotAttachment,
  type PreparedChatImage,
} from '../utils/imageAttachment';
import { formatPercent } from '../utils/formatters';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  imagePreviews?: string[];
  conceptTag?: string;
}

export interface MatchChatErrorEvent {
  message: string;
  isRateLimit: boolean;
  onRetry: () => void;
}

export interface MatchChatSidebarProps {
  selectedMatch: MatchWithPrediction | null;
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  t: TranslationDictionary;
  onChatError?: (error: MatchChatErrorEvent) => void;
}

/**
 * Lightweight inline formatter supporting **bold** and bullet lines cleanly
 * without pulling in a heavy markdown runtime.
 */
function renderFormattedText(text: string): React.ReactNode {
  const renderInline = (line: string, keyPrefix: string) => {
    const segments = line.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*)/g);
    return segments.map((seg, idx) => {
      if (seg.startsWith('**') && seg.endsWith('**') && seg.length > 4) {
        return (
          <strong
            key={`${keyPrefix}-${idx}`}
            className="font-semibold text-slate-900 dark:text-slate-50"
          >
            {seg.slice(2, -2)}
          </strong>
        );
      }
      if (seg.startsWith('*') && seg.endsWith('*') && seg.length > 2) {
        return (
          <em key={`${keyPrefix}-${idx}`} className="italic text-slate-800 dark:text-slate-100">
            {seg.slice(1, -1)}
          </em>
        );
      }
      return <React.Fragment key={`${keyPrefix}-${idx}`}>{seg}</React.Fragment>;
    });
  };

  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];
  let tableBuffer: string[] = [];

  const flushBullets = (idxKey: number) => {
    if (bulletBuffer.length === 0) return;
    blocks.push(
      <ul key={`ul-${idxKey}`} className="my-1.5 list-disc space-y-1 pl-4">
        {bulletBuffer.map((item, bIdx) => (
          <li key={`li-${idxKey}-${bIdx}`}>{renderInline(item, `b-${idxKey}-${bIdx}`)}</li>
        ))}
      </ul>
    );
    bulletBuffer = [];
  };

  const flushTable = (idxKey: number) => {
    if (tableBuffer.length === 0) return;
    const rows = tableBuffer
      .map((line) =>
        line
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((cell) => cell.trim())
      )
      .filter((cells) => !cells.every((c) => /^:?-{2,}:?$/.test(c)));

    if (rows.length > 0) {
      const [header, ...bodyRows] = rows;
      blocks.push(
        <div
          key={`tbl-${idxKey}`}
          className="my-2 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800"
        >
          <table className="w-full border-collapse text-left text-[11px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/70">
                {header.map((cell, cIdx) => (
                  <th
                    key={`th-${idxKey}-${cIdx}`}
                    className="px-2 py-1.5 font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap"
                  >
                    {renderInline(cell, `th-${idxKey}-${cIdx}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, rIdx) => (
                <tr
                  key={`tr-${idxKey}-${rIdx}`}
                  className="border-b border-slate-200/70 last:border-b-0 dark:border-slate-800/70"
                >
                  {row.map((cell, cIdx) => (
                    <td
                      key={`td-${idxKey}-${rIdx}-${cIdx}`}
                      className="px-2 py-1.5 align-top text-slate-700 dark:text-slate-200"
                    >
                      {renderInline(cell, `td-${idxKey}-${rIdx}-${cIdx}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    tableBuffer = [];
  };

  lines.forEach((rawLine, i) => {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      flushBullets(i);
      flushTable(i);
      return;
    }
    if (/^[-*_]{3,}$/.test(trimmed)) {
      flushBullets(i);
      flushTable(i);
      blocks.push(
        <hr key={`hr-${i}`} className="my-2 border-slate-200 dark:border-slate-800" />
      );
      return;
    }
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushBullets(i);
      tableBuffer.push(trimmed);
      return;
    }
    flushTable(i);
    const headingMatch = trimmed.match(/^#{1,4}\s+(.*)$/);
    if (headingMatch) {
      flushBullets(i);
      blocks.push(
        <p
          key={`h-${i}`}
          className="mt-2.5 mb-1 text-xs font-semibold text-slate-900 dark:text-slate-50"
        >
          {renderInline(headingMatch[1], `h-${i}`)}
        </p>
      );
      return;
    }
    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    if (bulletMatch) {
      bulletBuffer.push(bulletMatch[1]);
      return;
    }
    flushBullets(i);
    blocks.push(
      <p key={`p-${i}`} className="my-1 leading-relaxed">
        {renderInline(trimmed, `p-${i}`)}
      </p>
    );
  });
  flushBullets(lines.length);
  flushTable(lines.length);

  return blocks;
}

export const MatchChatSidebar: React.FC<MatchChatSidebarProps> = ({
  selectedMatch,
  isOpen,
  onClose,
  lang,
  t,
  onChatError,
}) => {
  // Persist conversation history per match ID within the session
  const [threadsByMatch, setThreadsByMatch] = useState<Record<string, ChatMessage[]>>({});
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastFailedQuestion, setLastFailedQuestion] = useState<string | null>(null);

  // Screenshot & Coupon Concept state
  const [attachedImages, setAttachedImages] = useState<PreparedChatImage[]>([]);
  const [conceptPreset, setConceptPreset] = useState<CouponConceptPreset>('auto');
  const [customOddsInput, setCustomOddsInput] = useState('15');
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const matchId = selectedMatch?.id ?? null;
  const messages = matchId ? threadsByMatch[matchId] ?? [] : [];

  const prevMatchIdRef = useRef<string | null>(matchId);

  // Abort any in-flight stream ONLY when user actually switches to a different match
  useEffect(() => {
    const prevId = prevMatchIdRef.current;
    prevMatchIdRef.current = matchId;
    if (prevId && matchId && prevId !== matchId) {
      abortRef.current?.abort();
      setSending(false);
      setErrorMsg(null);
      setLastFailedQuestion(null);
      setInput('');
      setAttachedImages([]);
    } else if (!matchId && prevId) {
      abortRef.current?.abort();
      setSending(false);
      setErrorMsg(null);
      setLastFailedQuestion(null);
    }
  }, [matchId]);

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, sending, isOpen]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const quickPrompts = selectedMatch
    ? selectedMatch.status === 'live'
      ? t.matchChat.livePrompts
      : selectedMatch.status === 'finished'
        ? t.matchChat.finishedPrompts
        : t.matchChat.upcomingPrompts
    : [];

  const resolveActiveCouponConcept = (): CouponConceptConfig => {
    if (conceptPreset === 'auto') {
      return { preset: 'auto', targetOdds: null, strategy: 'max_probability' };
    }
    if (conceptPreset === 'custom') {
      const parsed = Number(customOddsInput.replace(',', '.'));
      const clamped = Number.isFinite(parsed)
        ? Math.min(100, Math.max(1.2, Number(parsed.toFixed(1))))
        : 10;
      return { preset: 'custom', targetOdds: clamped, strategy: 'max_probability' };
    }
    return {
      preset: conceptPreset,
      targetOdds: PRESET_TARGET_ODDS[conceptPreset],
      strategy: 'max_probability',
    };
  };

  const handleAddFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    if (fileArr.length === 0) return;

    const remainingSlots = MAX_CHAT_IMAGES - attachedImages.length;
    if (remainingSlots <= 0) {
      onChatError?.({
        message: t.matchChat.maxImagesNote,
        isRateLimit: false,
        onRetry: () => fileInputRef.current?.click(),
      });
      return;
    }

    const toProcess = fileArr.slice(0, remainingSlots);
    const prepared: PreparedChatImage[] = [];

    for (const file of toProcess) {
      try {
        const item = await prepareScreenshotAttachment(file);
        prepared.push(item);
      } catch (err) {
        const code = err instanceof Error ? err.message : '';
        const friendly =
          code === 'UNSUPPORTED_IMAGE_TYPE'
            ? t.matchChat.unsupportedImageError
            : code === 'IMAGE_TOO_LARGE'
              ? t.matchChat.imageTooLargeError
              : t.matchChat.unsupportedImageError;
        setErrorMsg(friendly);
        onChatError?.({
          message: friendly,
          isRateLimit: false,
          onRetry: () => fileInputRef.current?.click(),
        });
      }
    }

    if (prepared.length > 0) {
      setAttachedImages((prev) => [...prev, ...prepared].slice(0, MAX_CHAT_IMAGES));
      setErrorMsg(null);
      inputRef.current?.focus();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void handleAddFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const f = item.getAsFile();
        if (f) imageFiles.push(f);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      void handleAddFiles(imageFiles);
    }
  };

  const handleRemoveImage = (id: string) => {
    setAttachedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const updateMatchThread = (
    targetMatchId: string,
    updater: (prev: ChatMessage[]) => ChatMessage[]
  ) => {
    setThreadsByMatch((prev) => ({
      ...prev,
      [targetMatchId]: updater(prev[targetMatchId] ?? []),
    }));
  };

  const sendQuestion = async (
    rawQuestion: string,
    overrideImages?: PreparedChatImage[],
    overrideConcept?: CouponConceptConfig
  ) => {
    if (!selectedMatch) return;
    const imagesToSend = overrideImages ?? attachedImages;
    const conceptToSend = overrideConcept ?? resolveActiveCouponConcept();
    const trimmed = rawQuestion.trim();
    const hasImages = imagesToSend.length > 0;

    if ((!trimmed && !hasImages) || sending) return;

    const displayQuestion =
      trimmed || buildDefaultScreenshotPrompt(conceptToSend, lang);

    const targetId = selectedMatch.id;
    setErrorMsg(null);
    setLastFailedQuestion(null);
    setInput('');
    if (!overrideImages) {
      setAttachedImages([]);
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: displayQuestion,
      imagePreviews: hasImages ? imagesToSend.map((img) => img.previewUrl) : undefined,
      conceptTag: conceptToSend.targetOdds ? `${conceptToSend.targetOdds}x` : undefined,
    };
    const modelMsgId = `m-${Date.now() + 1}`;
    const priorHistory = (threadsByMatch[targetId] ?? []).map((m) => ({
      role: m.role,
      text: m.text,
    }));

    updateMatchThread(targetId, (prev) => [
      ...prev,
      userMsg,
      { id: modelMsgId, role: 'model', text: '' },
    ]);
    setSending(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await footballService.streamMatchChat({
        match: selectedMatch,
        message: trimmed,
        history: priorHistory,
        lang,
        images: hasImages
          ? imagesToSend.map((img) => ({
              mimeType: img.mimeType,
              data: img.data,
              fileName: img.fileName,
            }))
          : undefined,
        couponConcept: conceptToSend.preset !== 'auto' ? conceptToSend : null,
        signal: controller.signal,
        onChunk: (chunk) => {
          updateMatchThread(targetId, (prev) =>
            prev.map((m) => (m.id === modelMsgId ? { ...m, text: m.text + chunk } : m))
          );
        },
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      const message = err instanceof Error ? err.message : t.common.errorTitle;
      const isRateLimit = err instanceof FootballServiceError && err.code === 'RATE_LIMITED';
      setErrorMsg(message);
      setLastFailedQuestion(trimmed || displayQuestion);
      if (trimmed) {
        setInput((curr) => (curr ? curr : trimmed));
      }
      if (hasImages && !overrideImages) {
        setAttachedImages((curr) => (curr.length > 0 ? curr : imagesToSend));
      }
      onChatError?.({
        message,
        isRateLimit,
        onRetry: () => {
          void sendQuestion(trimmed, imagesToSend, conceptToSend);
        },
      });
      // Remove empty model placeholder and orphan user turn so retrying never duplicates history
      updateMatchThread(targetId, (prev) => {
        const hasModelText = prev.some((m) => m.id === modelMsgId && m.text.trim() !== '');
        if (hasModelText) return prev;
        return prev.filter((m) => m.id !== modelMsgId && m.id !== userMsg.id);
      });
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendQuestion(input);
  };

  const handleClear = () => {
    if (!matchId) return;
    abortRef.current?.abort();
    updateMatchThread(matchId, () => []);
    setErrorMsg(null);
    setSending(false);
    inputRef.current?.focus();
  };

  const visible = Boolean(isOpen && selectedMatch);
  const pred = selectedMatch?.prediction;

  return (
    <AnimatePresence>
      {visible && selectedMatch && pred && (
        <>
          {/* Mobile / Tablet backdrop (docked without backdrop on xl+) */}
          <motion.div
            key="chat-sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => {
              if (!sending) onClose();
            }}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[1px] xl:hidden"
          />

          {/* Right-Docked AI Match Analyst Sidebar */}
          <motion.aside
            key="chat-sidebar-drawer"
            id="match-chat-sidebar"
            role="complementary"
            aria-label={t.matchChat.title}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onDragOver={(e) => {
              e.preventDefault();
              if (!isDraggingFile) setIsDraggingFile(true);
            }}
            onDragLeave={(e) => {
              if (e.currentTarget === e.target) setIsDraggingFile(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingFile(false);
              if (e.dataTransfer?.files?.length) {
                void handleAddFiles(e.dataTransfer.files);
              }
            }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[380px] flex-col border-l border-slate-200 bg-white dark:border-slate-800/90 dark:bg-[#0E1420] xl:z-30"
          >
            {isDraggingFile && (
              <div className="pointer-events-none absolute inset-3 z-20 flex items-center justify-center rounded-xl border-2 border-dashed border-emerald-500 bg-emerald-50/90 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-200">
                {t.matchChat.dropScreenshotHere}
              </div>
            )}
            {/* Top Header */}
            <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-4 dark:border-slate-800/90">
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare
                  className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
                <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {t.matchChat.title}
                </h2>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClear}
                    aria-label={t.matchChat.clearChat}
                    title={t.matchChat.clearChat}
                    className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t.matchChat.closeSidebar}
                  className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Active Match Knowledge-Base Summary Strip */}
            <div className="shrink-0 border-b border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800/90 dark:bg-slate-900/70">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {selectedMatch.homeTeam.shortName} vs {selectedMatch.awayTeam.shortName}
                </p>
                {selectedMatch.score ? (
                  <span className="font-mono text-xs font-bold tabular-nums text-slate-900 dark:text-slate-50 shrink-0">
                    {selectedMatch.score.home}–{selectedMatch.score.away}
                    {selectedMatch.status === 'live' ? ` (${selectedMatch.minute ?? 0}')` : ' FT'}
                  </span>
                ) : (
                  <span className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                    {t.common.upcoming}
                  </span>
                )}
              </div>
              <p className="mt-1 truncate font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                1X2 {formatPercent(pred.homeWinProb, 0)}/{formatPercent(pred.drawProb, 0)}/
                {formatPercent(pred.awayWinProb, 0)} · λ {pred.expectedGoals.home.toFixed(1)}–
                {pred.expectedGoals.away.toFixed(1)} · Elo {selectedMatch.homeTeam.elo}/
                {selectedMatch.awayTeam.elo}
              </p>
              <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                {t.matchChat.contextActive}
              </p>
            </div>

            {/* Scrollable Messages & Prompt Area */}
            <div
              aria-live="polite"
              className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
            >
              {messages.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {t.matchChat.welcomePrefix}
                  </p>
                  <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {t.matchChat.screenshotHint}
                  </p>
                  <div className="space-y-2">
                    {quickPrompts.map((promptText) => (
                      <button
                        key={promptText}
                        type="button"
                        disabled={sending}
                        onClick={() => void sendQuestion(promptText)}
                        className="block w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-left text-xs font-medium leading-snug text-slate-700 transition-colors hover:border-emerald-500/50 hover:bg-emerald-50/50 hover:text-slate-900 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-emerald-500/40 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                      >
                        {promptText}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                      >
                        <span className="mb-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {isUser ? t.matchChat.youLabel : t.matchChat.analystLabel}
                          {isUser && msg.conceptTag ? ` · ${msg.conceptTag}` : ''}
                        </span>
                        <div
                          className={`max-w-[92%] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm ${
                            isUser
                              ? 'bg-emerald-600 text-white'
                              : 'border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
                          }`}
                        >
                          {isUser ? (
                            <div className="space-y-2">
                              {msg.imagePreviews && msg.imagePreviews.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {msg.imagePreviews.map((src, idx) => (
                                    <img
                                      key={`${msg.id}-img-${idx}`}
                                      src={src}
                                      alt="Screenshot attachment"
                                      className="h-24 w-auto max-w-full rounded-lg border border-white/25 object-cover"
                                    />
                                  ))}
                                </div>
                              )}
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            </div>
                          ) : msg.text ? (
                            <div>{renderFormattedText(msg.text)}</div>
                          ) : (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {t.matchChat.thinking}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Compact follow-up quick prompts after conversation starts */}
                  {!sending && (
                    <div className="pt-2">
                      <p className="mb-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {t.matchChat.suggestedFollowups}
                      </p>
                      <div className="space-y-1.5">
                        {quickPrompts.slice(0, 2).map((promptText) => (
                          <button
                            key={promptText}
                            type="button"
                            onClick={() => void sendQuestion(promptText)}
                            className="block w-full rounded-lg border border-slate-200/80 px-2.5 py-1.5 text-left text-[11px] text-slate-600 transition-colors hover:border-emerald-500/40 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:border-emerald-500/40 dark:hover:text-slate-100"
                          >
                            {promptText}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {errorMsg && (
                <div
                  role="alert"
                  className="space-y-2 rounded-lg border border-rose-500/30 bg-rose-50 px-3 py-2.5 text-xs text-rose-800 dark:bg-rose-950/30 dark:text-rose-200"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle
                      className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400"
                      aria-hidden="true"
                    />
                    <span className="leading-relaxed">{errorMsg}</span>
                  </div>
                  {lastFailedQuestion && !sending && (
                    <button
                      type="button"
                      onClick={() => void sendQuestion(lastFailedQuestion)}
                      className="rounded-md bg-rose-600 px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-rose-500"
                    >
                      {t.common.retry}
                    </button>
                  )}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Pinned Bottom Coupon Concept + Screenshot Preview + Input Form */}
            <div className="shrink-0 border-t border-slate-200 bg-white p-3.5 dark:border-slate-800/90 dark:bg-[#0E1420]">
              {/* Coupon Target Odds Concept Selector */}
              <div className="mb-2.5 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {t.matchChat.couponConceptLabel}
                  </span>
                  {conceptPreset === 'custom' && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1.2}
                        max={100}
                        step="any"
                        value={customOddsInput}
                        onChange={(e) => setCustomOddsInput(e.target.value)}
                        aria-label={t.matchChat.conceptCustom}
                        placeholder={t.matchChat.customOddsPlaceholder}
                        className="w-16 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] tabular-nums text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        x
                      </span>
                    </div>
                  )}
                </div>

                <div
                  role="group"
                  aria-label={t.matchChat.couponConceptLabel}
                  className="grid grid-cols-6 gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-900"
                >
                  {(
                    [
                      { id: 'auto', label: t.matchChat.conceptAuto },
                      { id: 'safe_2x', label: '2x' },
                      { id: 'balanced_3x', label: '3x' },
                      { id: 'medium_5x', label: '5x' },
                      { id: 'high_10x', label: '10x' },
                      { id: 'custom', label: t.matchChat.conceptCustom },
                    ] as Array<{ id: CouponConceptPreset; label: string }>
                  ).map((item) => {
                    const active = conceptPreset === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={sending}
                        aria-pressed={active}
                        onClick={() => setConceptPreset(item.id)}
                        className={`rounded-md px-1.5 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap ${
                          active
                            ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-800 dark:text-emerald-400'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Attached Screenshot Preview Strip */}
              {attachedImages.length > 0 && (
                <div
                  data-testid="chat-screenshot-preview"
                  className="mb-2.5 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-2 dark:border-slate-800 dark:bg-slate-900/70"
                >
                  {attachedImages.map((img) => (
                    <div key={img.id} className="relative flex items-center gap-2">
                      <img
                        src={img.previewUrl}
                        alt={img.fileName || 'Screenshot preview'}
                        className="h-12 w-16 rounded-md border border-slate-200 object-cover dark:border-slate-700"
                      />
                      <div className="min-w-0 max-w-[140px]">
                        <p className="truncate text-[11px] font-medium text-slate-800 dark:text-slate-200">
                          {img.fileName}
                        </p>
                        <p className="font-mono text-[10px] tabular-nums text-slate-500 dark:text-slate-400">
                          {img.sizeKb} KB · {t.matchChat.screenshotAttachedNote}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        aria-label={t.matchChat.removeScreenshot}
                        className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-200/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={handleFileInputChange}
                className="sr-only"
                data-testid="chat-screenshot-input"
              />

              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={sending || attachedImages.length >= MAX_CHAT_IMAGES}
                  onClick={() => fileInputRef.current?.click()}
                  aria-label={t.matchChat.attachScreenshot}
                  title={t.matchChat.attachScreenshot}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:border-emerald-500/50 hover:bg-emerald-50/50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-emerald-500/50 dark:hover:text-emerald-400"
                >
                  <ImagePlus className="h-4 w-4" aria-hidden="true" />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onPaste={handlePaste}
                  disabled={sending}
                  placeholder={t.matchChat.placeholder}
                  aria-label={t.matchChat.title}
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={sending || (!input.trim() && attachedImages.length === 0)}
                  aria-label={t.matchChat.send}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
              <p className="mt-2 text-[10px] leading-snug text-slate-500 dark:text-slate-400">
                {t.matchChat.footerNote}
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
