import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  Database,
  Loader2,
  Maximize2,
  MessageSquare,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import {
  MANDATORY_DISCLAIMER_AZ,
  type CouponLeg,
} from '../../utils/bettingInsightsEngine';

export interface PlatformChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  toolsUsed?: Array<{ name: string; summary: string }>;
}

interface PlatformAIChatProps {
  mode: 'floating' | 'fullpage';
  lang: 'az' | 'en' | 'ru';
  activeCouponLegs: CouponLeg[];
  topMatchLabel?: string;
  isOpen?: boolean;
  onToggleOpen?: (open: boolean) => void;
  onExpandFullPage?: () => void;
  queuedPrompt?: string | null;
  onConsumeQueuedPrompt?: () => void;
}

const CHAT_HISTORY_KEY = 'arena_az_ai_chat_history_v2';

function renderFormattedText(raw: string): React.ReactNode {
  const lines = raw.split('\n');
  return lines.map((line, lineIdx) => {
    const cleanLine = line.startsWith('> ') ? line.slice(2) : line;
    const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);
    const isQuote = line.startsWith('> ');
    return (
      <React.Fragment key={lineIdx}>
        {isQuote ? (
          <span className="mt-1.5 block border-l-2 border-[#2BD576] pl-2.5 text-[11px] opacity-85">
            {parts.map((part, i) =>
              part.startsWith('**') && part.endsWith('**') ? (
                <strong key={i}>{part.slice(2, -2)}</strong>
              ) : (
                <React.Fragment key={i}>{part}</React.Fragment>
              )
            )}
          </span>
        ) : (
          <span>
            {parts.map((part, i) =>
              part.startsWith('**') && part.endsWith('**') ? (
                <strong key={i}>{part.slice(2, -2)}</strong>
              ) : (
                <React.Fragment key={i}>{part}</React.Fragment>
              )
            )}
          </span>
        )}
        {lineIdx < lines.length - 1 && !isQuote && <br />}
      </React.Fragment>
    );
  });
}

export const PlatformAIChat: React.FC<PlatformAIChatProps> = ({
  mode,
  lang,
  activeCouponLegs,
  topMatchLabel,
  isOpen = false,
  onToggleOpen,
  onExpandFullPage,
  queuedPrompt,
  onConsumeQueuedPrompt,
}) => {
  const quickChips = useMemo(
    () => [
      'Bu gün ən təhlükəsiz 5 seçim hansılardır?',
      topMatchLabel ? `${topMatchLabel} analiz et` : 'Bu gün hansı oyunlarda dəyər var?',
      'Bu kuponu yoxla',
      'Modelin real tarixi dəqiqliyi necədir?',
    ],
    [topMatchLabel]
  );

  const [messages, setMessages] = useState<PlatformChatMessage[]>(() => {
    try {
      const saved = window.localStorage.getItem(CHAT_HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(-20);
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'welcome',
        role: 'model',
        text: `Salam! Mən **ARENA AZ AI Analitik** köməkçisiyəm. Canlı ESPN matç məlumatlarını, The Odds API real əmsallarını, Dixon-Coles ehtimallarını və kuponunuzun zəif bəndlərini birbaşa real bazadan yoxlayıram.\n> ${MANDATORY_DISCLAIMER_AZ}`,
      },
    ];
  });
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages.slice(-20)));
    } catch {
      // ignore
    }
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming, isOpen]);

  const sendMessage = async (rawPrompt: string) => {
    const prompt = rawPrompt.trim();
    if (!prompt || streaming) return;

    setErrorText(null);
    setInput('');
    const userMsg: PlatformChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: prompt,
    };
    const modelMsgId = `m-${Date.now() + 1}`;
    const placeholder: PlatformChatMessage = {
      id: modelMsgId,
      role: 'model',
      text: '',
      toolsUsed: [],
    };

    const historyPayload = messages
      .filter((m) => m.id !== 'welcome')
      .slice(-6)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, userMsg, placeholder]);
    setStreaming(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          history: historyPayload,
          lang,
          activeCouponLegs,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error('AI xidmətinə qoşulmaq mümkün olmadı.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const ev of events) {
          const line = ev.trim();
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.slice(5).trim();
          if (!jsonStr) continue;
          try {
            const payload = JSON.parse(jsonStr) as {
              text?: string;
              tool?: { name: string; summary: string };
              error?: string;
            };
            if (payload.tool) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === modelMsgId
                    ? { ...m, toolsUsed: [...(m.toolsUsed ?? []), payload.tool!] }
                    : m
                )
              );
            }
            if (payload.text) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === modelMsgId ? { ...m, text: m.text + payload.text } : m
                )
              );
            }
            if (payload.error) {
              setErrorText(payload.error);
            }
          } catch {
            // ignore malformed sse chunk
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setErrorText(err instanceof Error ? err.message : 'Xəta baş verdi.');
      }
    } finally {
      setStreaming(false);
    }
  };

  useEffect(() => {
    if (queuedPrompt && (mode === 'fullpage' || isOpen)) {
      const p = queuedPrompt;
      onConsumeQueuedPrompt?.();
      void sendMessage(p);
    }
  }, [queuedPrompt, isOpen, mode]);

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: `Söhbət tarixçəsi təmizləndi. İstədiyiniz real oyun, Value Bet və ya kupon haqqında sual verin.\n> ${MANDATORY_DISCLAIMER_AZ}`,
      },
    ]);
  };

  const renderPanelContent = (isCompact: boolean) => (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] shadow-xl ${
        isCompact ? 'h-[520px] w-[360px] max-w-[calc(100vw-24px)]' : 'min-h-[660px] w-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2BD576]/35 bg-[#2BD576]/10 text-[#168A4A] dark:text-[#2BD576]">
            <Bot className="h-4 w-4" strokeWidth={1.5} />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold uppercase leading-none text-[#111827] dark:text-[#F3F6FA]">
              AI Futbol Analitiki
            </h3>
            <p className="mt-0.5 text-[10px] text-[#64748B]">
              Canlı ESPN + Odds API alət çağırışları ilə
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleClearHistory}
            aria-label="Söhbəti təmizlə"
            title="Söhbəti təmizlə"
            className="rounded-lg p-1.5 text-[#64748B] hover:bg-[#EEF1F5] dark:hover:bg-[#171F2B] hover:text-[#111827] dark:hover:text-[#F3F6FA] cursor-pointer"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
          </button>
          {isCompact && onExpandFullPage && (
            <button
              type="button"
              onClick={onExpandFullPage}
              aria-label="Tam səhifədə aç"
              title="Tam səhifədə aç"
              className="rounded-lg p-1.5 text-[#64748B] hover:bg-[#EEF1F5] dark:hover:bg-[#171F2B] hover:text-[#111827] dark:hover:text-[#F3F6FA] cursor-pointer"
            >
              <Maximize2 className="h-4 w-4" strokeWidth={1.5} />
            </button>
          )}
          {isCompact && onToggleOpen && (
            <button
              type="button"
              onClick={() => onToggleOpen(false)}
              aria-label="AI söhbəti bağla"
              className="rounded-lg p-1.5 text-[#64748B] hover:bg-[#EEF1F5] dark:hover:bg-[#171F2B] hover:text-[#111827] dark:hover:text-[#F3F6FA] cursor-pointer"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* Messages Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            {msg.toolsUsed && msg.toolsUsed.length > 0 && (
              <div className="mb-1.5 flex flex-wrap gap-1">
                {msg.toolsUsed.map((tool, i) => (
                  <span
                    key={`${tool.name}-${i}`}
                    className="inline-flex items-center gap-1 rounded-[4px] border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] px-2 py-0.5 font-mono text-[10px] text-[#475569] dark:text-[#94A3B8]"
                  >
                    <Database className="h-2.5 w-2.5 text-[#2BD576]" strokeWidth={1.5} />
                    <span>{tool.summary}</span>
                  </span>
                ))}
              </div>
            )}
            <div
              className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#168A4A] dark:bg-[#2BD576] font-medium text-white dark:text-[#08140D]'
                  : 'border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] text-[#111827] dark:text-[#F3F6FA]'
              }`}
            >
              {msg.text ? renderFormattedText(msg.text) : streaming ? 'Canlı data yoxlanılır...' : ''}
            </div>
          </div>
        ))}
        {errorText && (
          <div className="rounded-lg border border-[#E5484D]/35 bg-[#E5484D]/10 px-3 py-2 text-xs text-[#DC3B40] dark:text-[#E5484D]">
            {errorText}
          </div>
        )}
      </div>

      {/* Dynamic Quick Reply Chips */}
      <div className="flex flex-wrap gap-1.5 border-t border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0E131B] px-3.5 py-2">
        {quickChips.map((chip) => (
          <button
            key={chip}
            type="button"
            disabled={streaming}
            onClick={() => void sendMessage(chip)}
            className="rounded-md border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] px-2.5 py-1 text-[11px] font-medium text-[#334155] dark:text-[#CBD5E1] hover:border-[#168A4A] dark:hover:border-[#2BD576] hover:text-[#147A42] dark:hover:text-[#2BD576] transition-colors cursor-pointer disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage(input);
        }}
        className="flex items-center gap-2 border-t border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Sualını yaz (məs. bu gün hansı oyunlarda dəyər var?)..."
          aria-label="AI analitikə sual yaz"
          className="flex-1 rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] px-3 py-2 text-xs sm:text-sm text-[#111827] dark:text-[#F3F6FA] placeholder:text-[#64748B] focus:border-[#2BD576] focus:outline-none"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          aria-label="Göndər"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#168A4A] dark:bg-[#2BD576] text-white dark:text-[#08140D] hover:opacity-90 disabled:opacity-50 cursor-pointer shrink-0"
        >
          {streaming ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
          ) : (
            <Send className="h-4 w-4" strokeWidth={1.5} />
          )}
        </button>
      </form>
    </div>
  );

  if (mode === 'fullpage') {
    return (
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-5">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#168A4A] dark:text-[#2BD576]">
            SERVER-TƏRƏFLİ AI ANALİTİK · CANLI ALƏT ÇAĞIRIŞI İLƏ
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-[#111827] dark:text-[#F3F6FA]">
            AI Matç Analiz Köməkçisi
          </h1>
          <p className="mt-1 text-sm text-[#475569] dark:text-[#94A3B8]">
            Rəqəmləri uydurmur — bütün ehtimal, xG, əmsal və kupon yoxlamalarını canlı ESPN və The
            Odds API alətlərindən oxuyaraq istinad edir.
          </p>
        </div>
        {renderPanelContent(false)}
      </section>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2.5">
      {isOpen && renderPanelContent(true)}
      <button
        type="button"
        onClick={() => onToggleOpen?.(!isOpen)}
        aria-label={isOpen ? 'AI köməkçini bağla' : 'AI Futbol Analitikini aç'}
        className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#168A4A] dark:border-[#2BD576] bg-[#168A4A] dark:bg-[#2BD576] px-3.5 text-xs font-semibold text-white dark:text-[#08140D] shadow-md hover:opacity-90 transition-opacity cursor-pointer"
      >
        {isOpen ? (
          <X className="h-4 w-4" strokeWidth={1.5} />
        ) : (
          <>
            <MessageSquare className="h-4 w-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">AI Analitik</span>
          </>
        )}
      </button>
    </div>
  );
};
