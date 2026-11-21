import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  Hash,
  Info,
  Loader2,
  LogOut,
  MessageSquarePlus,
  Plus,
  RefreshCw,
  Search,
  Send,
  ThumbsUp,
  Trash2,
  Users,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type { Language, MatchWithPrediction } from '../types/football';
import type { TranslationDictionary } from '../i18n/translations';
import {
  clearGoogleAccessToken,
  GOOGLE_CHAT_CONSOLE_CONFIG_URL,
  GOOGLE_CHAT_PROJECT_ID,
  initGoogleAuth,
  signInWithGoogleChat,
  signOutGoogleChat,
} from '../services/googleAuth';
import {
  addGoogleChatReaction,
  createGoogleChatSpace,
  deleteGoogleChatMessage,
  GoogleChatApiError,
  listGoogleChatMembers,
  listGoogleChatMessages,
  listGoogleChatSpaces,
  sendGoogleChatMessage,
  type GoogleChatMember,
  type GoogleChatMessage,
  type GoogleChatSpace,
} from '../services/googleChatService';
import {
  formatMatchForGoogleChat,
  type GoogleChatErrorKind,
} from '../services/googleChatFormatter';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { ConfirmActionModal } from '../components/ConfirmActionModal';
import { DisclaimerBanner } from '../components/AnalyticsPrimitives';

interface GoogleChatPageProps {
  matches: MatchWithPrediction[];
  pendingShareMatch: MatchWithPrediction | null;
  onClearPendingShare: () => void;
  lang: Language;
  t: TranslationDictionary;
}

type PendingAction =
  | { type: 'send_message'; spaceName: string; spaceDisplayName: string; text: string }
  | { type: 'create_space'; displayName: string }
  | { type: 'delete_message'; messageName: string; preview: string }
  | { type: 'react_message'; messageName: string; emoji: string; preview: string };

function formatChatTime(iso: string | undefined, lang: Language): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const locale = lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-GB' : 'az-AZ';
    return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function getSpaceDisplayName(space: GoogleChatSpace, fallbackPrefix: string): string {
  if (space.displayName && space.displayName.trim()) return space.displayName;
  const shortId = space.name.split('/').pop() ?? space.name;
  if (space.spaceType === 'DIRECT_MESSAGE') return `DM · ${shortId}`;
  if (space.spaceType === 'GROUP_CHAT') return `Group · ${shortId}`;
  return `${fallbackPrefix} · ${shortId}`;
}

export const GoogleChatPage: React.FC<GoogleChatPageProps> = ({
  matches,
  pendingShareMatch,
  onClearPendingShare,
  lang,
  t,
}) => {
  const gc = t.googleChat;

  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [spaces, setSpaces] = useState<GoogleChatSpace[]>([]);
  const [spacesLoading, setSpacesLoading] = useState(false);
  const [spaceQuery, setSpaceQuery] = useState('');
  const [selectedSpaceName, setSelectedSpaceName] = useState<string | null>(null);

  const [messages, setMessages] = useState<GoogleChatMessage[]>([]);
  const [members, setMembers] = useState<GoogleChatMember[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [apiError, setApiError] = useState<{
    kind: GoogleChatErrorKind;
    message: string;
  } | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Composer state
  const [selectedMatchIdForReport, setSelectedMatchIdForReport] = useState<string>('');
  const [composerText, setComposerText] = useState<string>('');

  // Create Space inline form
  const [showCreateSpace, setShowCreateSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');

  // Mandatory confirmation modal state
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initGoogleAuth((session) => {
      setUser(session.user);
      setAccessToken(session.accessToken);
      if (!session.user) {
        setSpaces([]);
        setMessages([]);
        setMembers([]);
        setSelectedSpaceName(null);
      }
    });
    return unsubscribe;
  }, []);

  // Pre-fill composer if navigated from Match Detail "Share to Google Chat"
  useEffect(() => {
    if (pendingShareMatch) {
      setSelectedMatchIdForReport(pendingShareMatch.id);
      setComposerText(formatMatchForGoogleChat(pendingShareMatch, lang));
    }
  }, [pendingShareMatch, lang]);

  // Default match picker selection
  useEffect(() => {
    if (!selectedMatchIdForReport && matches.length > 0) {
      const liveFirst = matches.find((m) => m.status === 'live') ?? matches[0];
      setSelectedMatchIdForReport(liveFirst.id);
    }
  }, [matches, selectedMatchIdForReport]);

  const handleApiError = useCallback((err: unknown) => {
    if (err instanceof GoogleChatApiError) {
      if (err.kind === 'UNAUTHORIZED') {
        clearGoogleAccessToken();
        setAccessToken(null);
      }
      setApiError({ kind: err.kind, message: err.message });
    } else {
      setApiError({
        kind: 'API_ERROR',
        message: err instanceof Error ? err.message : 'Google Chat API request failed.',
      });
    }
  }, []);

  const loadSpaces = useCallback(
    async (token: string) => {
      setSpacesLoading(true);
      setApiError(null);
      try {
        const list = await listGoogleChatSpaces(token);
        setSpaces(list);
        setSelectedSpaceName((prev) => {
          if (prev && list.some((s) => s.name === prev)) return prev;
          return list[0]?.name ?? null;
        });
      } catch (err) {
        handleApiError(err);
      } finally {
        setSpacesLoading(false);
      }
    },
    [handleApiError]
  );

  const loadSpaceDetails = useCallback(
    async (token: string, spaceName: string) => {
      setMessagesLoading(true);
      setApiError(null);
      try {
        const [msgList, memberList] = await Promise.all([
          listGoogleChatMessages(token, spaceName, 30),
          listGoogleChatMembers(token, spaceName).catch(() => [] as GoogleChatMember[]),
        ]);
        setMessages(msgList);
        setMembers(memberList);
      } catch (err) {
        handleApiError(err);
      } finally {
        setMessagesLoading(false);
      }
    },
    [handleApiError]
  );

  // Load spaces whenever an active in-memory OAuth access token becomes available
  useEffect(() => {
    if (accessToken) {
      loadSpaces(accessToken);
    }
  }, [accessToken, loadSpaces]);

  // Load messages whenever selected space changes
  useEffect(() => {
    if (accessToken && selectedSpaceName) {
      loadSpaceDetails(accessToken, selectedSpaceName);
    } else {
      setMessages([]);
      setMembers([]);
    }
  }, [accessToken, selectedSpaceName, loadSpaceDetails]);

  const handleSignIn = async (forceConsent: boolean = false) => {
    setAuthLoading(true);
    setAuthError(null);
    setApiError(null);
    try {
      const session = await signInWithGoogleChat(forceConsent);
      setUser(session.user);
      setAccessToken(session.accessToken);
      if (!session.accessToken) {
        setAuthError(gc.missingTokenError);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : gc.authFailed;
      if (!msg.includes('popup-closed-by-user')) {
        setAuthError(msg);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    setApiError(null);
    setStatusNotice(null);
    await signOutGoogleChat();
    setUser(null);
    setAccessToken(null);
    setSpaces([]);
    setMessages([]);
    setMembers([]);
    setSelectedSpaceName(null);
  };

  const filteredSpaces = useMemo(() => {
    const q = spaceQuery.trim().toLowerCase();
    if (!q) return spaces;
    return spaces.filter((s) =>
      getSpaceDisplayName(s, gc.spaceFallback).toLowerCase().includes(q)
    );
  }, [spaces, spaceQuery, gc.spaceFallback]);

  const selectedSpace = useMemo(
    () => spaces.find((s) => s.name === selectedSpaceName) ?? null,
    [spaces, selectedSpaceName]
  );

  const handleInsertMatchReport = () => {
    const target = matches.find((m) => m.id === selectedMatchIdForReport);
    if (!target) return;
    setComposerText(formatMatchForGoogleChat(target, lang));
    setStatusNotice(null);
  };

  const requestSendMessage = () => {
    if (!selectedSpace || !composerText.trim()) return;
    setPendingAction({
      type: 'send_message',
      spaceName: selectedSpace.name,
      spaceDisplayName: getSpaceDisplayName(selectedSpace, gc.spaceFallback),
      text: composerText.trim(),
    });
  };

  const requestCreateSpace = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newSpaceName.trim();
    if (!cleaned) return;
    setPendingAction({
      type: 'create_space',
      displayName: cleaned,
    });
  };

  const executeConfirmedAction = async () => {
    if (!pendingAction || !accessToken) return;
    setConfirmSubmitting(true);
    setApiError(null);
    setStatusNotice(null);

    try {
      if (pendingAction.type === 'send_message') {
        await sendGoogleChatMessage(
          accessToken,
          pendingAction.spaceName,
          pendingAction.text
        );
        setComposerText('');
        if (pendingShareMatch) onClearPendingShare();
        setStatusNotice(gc.messageSentSuccess);
        await loadSpaceDetails(accessToken, pendingAction.spaceName);
      } else if (pendingAction.type === 'create_space') {
        const created = await createGoogleChatSpace(
          accessToken,
          pendingAction.displayName
        );
        setNewSpaceName('');
        setShowCreateSpace(false);
        setStatusNotice(gc.spaceCreatedSuccess);
        await loadSpaces(accessToken);
        if (created.name) {
          setSelectedSpaceName(created.name);
        }
      } else if (pendingAction.type === 'delete_message') {
        await deleteGoogleChatMessage(accessToken, pendingAction.messageName);
        setStatusNotice(gc.messageDeletedSuccess);
        if (selectedSpaceName) {
          await loadSpaceDetails(accessToken, selectedSpaceName);
        }
      } else if (pendingAction.type === 'react_message') {
        await addGoogleChatReaction(
          accessToken,
          pendingAction.messageName,
          pendingAction.emoji
        );
        setStatusNotice(gc.reactionAddedSuccess);
        if (selectedSpaceName) {
          await loadSpaceDetails(accessToken, selectedSpaceName);
        }
      }
      setPendingAction(null);
    } catch (err) {
      setPendingAction(null);
      handleApiError(err);
    } finally {
      setConfirmSubmitting(false);
    }
  };

  const modalConfig = useMemo(() => {
    if (!pendingAction) return null;
    switch (pendingAction.type) {
      case 'send_message':
        return {
          title: gc.confirmSendTitle,
          description: gc.confirmSendDesc,
          targetLabel: `${gc.targetSpaceLabel}: ${pendingAction.spaceDisplayName}`,
          previewText: pendingAction.text,
          confirmLabel: gc.confirmSendAction,
          destructive: false,
        };
      case 'create_space':
        return {
          title: gc.confirmCreateSpaceTitle,
          description: gc.confirmCreateSpaceDesc,
          targetLabel: `${gc.spaceNameLabel}: ${pendingAction.displayName}`,
          previewText: undefined,
          confirmLabel: gc.confirmCreateSpaceAction,
          destructive: false,
        };
      case 'delete_message':
        return {
          title: gc.confirmDeleteTitle,
          description: gc.confirmDeleteDesc,
          targetLabel: undefined,
          previewText: pendingAction.preview,
          confirmLabel: gc.confirmDeleteAction,
          destructive: true,
        };
      case 'react_message':
        return {
          title: gc.confirmReactTitle,
          description: gc.confirmReactDesc,
          targetLabel: `${gc.reactionLabel}: ${pendingAction.emoji}`,
          previewText: pendingAction.preview,
          confirmLabel: gc.confirmReactAction,
          destructive: false,
        };
    }
  }, [pendingAction, gc]);

  const isAuthenticated = Boolean(user && accessToken);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {gc.title}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {gc.subtitle}
          </p>
        </div>

        {isAuthenticated && user && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {user.displayName || user.email}
              </span>
              {user.displayName && user.email && (
                <span className="ml-2 text-slate-500 dark:text-slate-400">
                  {user.email}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => accessToken && loadSpaces(accessToken)}
              disabled={spacesLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${spacesLoading ? 'animate-spin' : ''}`} />
              <span>{t.common.refresh}</span>
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{gc.signOut}</span>
            </button>
          </div>
        )}
      </div>

      {/* Pending Match Share Banner (shown when arriving from Match Detail) */}
      {pendingShareMatch && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-50/70 px-4 py-3 text-xs dark:bg-emerald-950/25">
          <div>
            <p className="font-semibold text-emerald-900 dark:text-emerald-300">
              {gc.readyToShareMatch}: {pendingShareMatch.homeTeam.name} vs{' '}
              {pendingShareMatch.awayTeam.name}
            </p>
            <p className="mt-0.5 text-emerald-800/80 dark:text-emerald-400/80">
              {isAuthenticated ? gc.readyToShareHintSignedIn : gc.readyToShareHintSignedOut}
            </p>
          </div>
          <button
            type="button"
            onClick={onClearPendingShare}
            className="rounded-lg border border-emerald-600/30 px-2.5 py-1 font-medium text-emerald-800 hover:bg-emerald-600/10 dark:text-emerald-300"
          >
            {gc.dismissDraft}
          </button>
        </div>
      )}

      {/* Auth Error Alert */}
      {authError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-50 px-4 py-3 text-xs text-rose-900 dark:bg-rose-950/30 dark:text-rose-200"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <p>{authError}</p>
        </div>
      )}

      {/* API Error Alert with Dedicated Google Chat App Configuration Guidance */}
      {apiError && (
        <div
          role="alert"
          className="rounded-xl border border-amber-500/40 bg-amber-50/80 p-4 text-xs text-amber-950 dark:bg-amber-950/25 dark:text-amber-100"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex-1 space-y-2">
              <p className="font-semibold">
                {apiError.kind === 'APP_NOT_CONFIGURED'
                  ? gc.errorAppNotConfiguredTitle
                  : apiError.kind === 'WORKSPACE_ACCOUNT_REQUIRED'
                    ? gc.errorWorkspaceRequiredTitle
                    : apiError.kind === 'UNAUTHORIZED'
                      ? gc.errorUnauthorizedTitle
                      : gc.errorGenericTitle}
              </p>
              <p className="leading-relaxed opacity-90">
                {apiError.kind === 'APP_NOT_CONFIGURED'
                  ? gc.errorAppNotConfiguredDesc
                  : apiError.kind === 'WORKSPACE_ACCOUNT_REQUIRED'
                    ? gc.errorWorkspaceRequiredDesc
                    : apiError.message}
              </p>
              {apiError.kind === 'APP_NOT_CONFIGURED' && (
                <p className="font-mono text-[11px] opacity-80">{apiError.message}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {apiError.kind === 'APP_NOT_CONFIGURED' && (
                  <a
                    href={GOOGLE_CHAT_CONSOLE_CONFIG_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 font-semibold text-white hover:bg-amber-500"
                  >
                    <span>{gc.openChatConfigConsole}</span>
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                )}
                {apiError.kind === 'WORKSPACE_ACCOUNT_REQUIRED' && (
                  <button
                    type="button"
                    onClick={() => handleSignIn(true)}
                    className="rounded-lg bg-amber-600 px-3 py-1.5 font-semibold text-white hover:bg-amber-500"
                  >
                    {gc.switchAccount}
                  </button>
                )}
                {accessToken && (
                  <button
                    type="button"
                    onClick={() => loadSpaces(accessToken)}
                    className="rounded-lg border border-amber-700/30 px-3 py-1.5 font-medium hover:bg-amber-600/10"
                  >
                    {t.common.retry}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Status Banner */}
      {statusNotice && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/30 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"
        >
          {statusNotice}
        </div>
      )}

      {/* Unauthenticated Connect View */}
      {!isAuthenticated ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-7 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {gc.connectTitle}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {user ? gc.sessionRefreshDesc : gc.connectDesc}
              </p>
            </div>

            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span>{gc.featureBrowseSpaces}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span>{gc.featureShareReports}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span>{gc.featureConfirmAlways}</span>
              </li>
            </ul>

            <div className="pt-1">
              <GoogleSignInButton
                label={user ? gc.reconnectWithGoogle : gc.signInWithGoogle}
                loading={authLoading}
                onClick={() => handleSignIn(false)}
              />
            </div>

            {pendingShareMatch && composerText && (
              <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {gc.draftPreviewTitle}
                </p>
                <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  {composerText}
                </pre>
              </div>
            )}
          </section>

          {/* Prerequisites Callout per Google Chat API specification */}
          <aside className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Info className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" aria-hidden="true" />
              <h2 className="text-sm font-semibold">{gc.prerequisitesTitle}</h2>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              <div className="rounded-lg border border-slate-200/80 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  1. {gc.prereqWorkspaceTitle}
                </p>
                <p className="mt-1">{gc.prereqWorkspaceDesc}</p>
              </div>

              <div className="rounded-lg border border-slate-200/80 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  2. {gc.prereqChatAppTitle}
                </p>
                <p className="mt-1">{gc.prereqChatAppDesc}</p>
                <p className="mt-1.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  Project: {GOOGLE_CHAT_PROJECT_ID}
                </p>
                <a
                  href={GOOGLE_CHAT_CONSOLE_CONFIG_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  <span>{gc.openChatConfigConsole}</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        /* Authenticated Split-Pane Google Chat Workspace */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Spaces List */}
          <section className="flex flex-col rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:col-span-4">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {gc.spacesTitle}{' '}
                <span className="font-mono text-xs font-normal tabular-nums text-slate-500 dark:text-slate-400">
                  ({spaces.length})
                </span>
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateSpace((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{gc.newSpace}</span>
              </button>
            </div>

            {/* Inline Create Space Form (Confirmed via Modal) */}
            {showCreateSpace && (
              <form
                onSubmit={requestCreateSpace}
                className="border-b border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/60 space-y-2"
              >
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  {gc.spaceNameLabel}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSpaceName}
                    onChange={(e) => setNewSpaceName(e.target.value)}
                    placeholder={gc.spaceNamePlaceholder}
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="submit"
                    disabled={!newSpaceName.trim()}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {gc.createButton}
                  </button>
                </div>
              </form>
            )}

            {/* Search Spaces */}
            <div className="border-b border-slate-100 p-3 dark:border-slate-800/80">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={spaceQuery}
                  onChange={(e) => setSpaceQuery(e.target.value)}
                  placeholder={gc.searchSpacesPlaceholder}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pr-3 pl-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Spaces List Body */}
            <div className="max-h-[460px] flex-1 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800/70">
              {spacesLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-xs text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{gc.loadingSpaces}</span>
                </div>
              ) : filteredSpaces.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  {gc.noSpacesFound}
                </div>
              ) : (
                filteredSpaces.map((space) => {
                  const active = space.name === selectedSpaceName;
                  const title = getSpaceDisplayName(space, gc.spaceFallback);
                  return (
                    <button
                      key={space.name}
                      type="button"
                      onClick={() => setSelectedSpaceName(space.name)}
                      className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors ${
                        active
                          ? 'bg-emerald-600/10 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
                          : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Hash className="h-4 w-4 shrink-0 opacity-60" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold">{title}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                            {space.spaceType || 'SPACE'}
                          </p>
                        </div>
                      </div>
                      {space.membershipCount?.joinedDirectHumanUserCount !== undefined && (
                        <span className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                          {space.membershipCount.joinedDirectHumanUserCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Right Column: Messages Feed & Match Report Composer */}
          <section className="flex flex-col rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:col-span-8">
            {/* Active Space Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-3 dark:border-slate-800">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {selectedSpace
                    ? getSpaceDisplayName(selectedSpace, gc.spaceFallback)
                    : gc.selectSpacePrompt}
                </h2>
                {selectedSpace && (
                  <p className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" aria-hidden="true" />
                      <span className="font-mono tabular-nums">
                        {members.length > 0
                          ? members.length
                          : selectedSpace.membershipCount?.joinedDirectHumanUserCount ?? '—'}
                      </span>
                    </span>
                    <span>·</span>
                    <span className="font-mono">{selectedSpace.name}</span>
                  </p>
                )}
              </div>

              {selectedSpace && (
                <button
                  type="button"
                  onClick={() =>
                    accessToken && loadSpaceDetails(accessToken, selectedSpace.name)
                  }
                  disabled={messagesLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${messagesLoading ? 'animate-spin' : ''}`} />
                  <span>{t.common.refresh}</span>
                </button>
              )}
            </div>

            {/* Messages Timeline */}
            <div className="min-h-[260px] max-h-[380px] flex-1 space-y-3 overflow-y-auto p-5">
              {!selectedSpace ? (
                <div className="flex h-52 items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                  {gc.selectSpacePrompt}
                </div>
              ) : messagesLoading ? (
                <div className="flex h-52 items-center justify-center gap-2 text-xs text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{gc.loadingMessages}</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-52 items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                  {gc.noMessagesYet}
                </div>
              ) : (
                messages.map((msg) => {
                  const body = msg.text || msg.formattedText || '';
                  const senderName =
                    msg.sender?.displayName || msg.sender?.name || gc.unknownSender;
                  return (
                    <article
                      key={msg.name}
                      className="rounded-lg border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/60"
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {senderName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                            {formatChatTime(msg.createTime, lang)}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setPendingAction({
                                type: 'react_message',
                                messageName: msg.name,
                                emoji: '👍',
                                preview: body.slice(0, 140),
                              })
                            }
                            aria-label={gc.reactButton}
                            className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setPendingAction({
                                type: 'delete_message',
                                messageName: msg.name,
                                preview: body.slice(0, 200),
                              })
                            }
                            aria-label={gc.deleteMessageButton}
                            className="rounded p-1 text-slate-500 transition-colors hover:bg-rose-100 hover:text-rose-700 dark:text-slate-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-300"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                        {body}
                      </p>

                      {msg.emojiReactionSummaries &&
                        msg.emojiReactionSummaries.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {msg.emojiReactionSummaries.map((r, idx) => (
                              <span
                                key={`${msg.name}-rx-${idx}`}
                                className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                              >
                                <span>{r.emoji?.unicode ?? '👍'}</span>
                                <span>{r.reactionCount ?? 1}</span>
                              </span>
                            ))}
                          </div>
                        )}
                    </article>
                  );
                })
              )}
            </div>

            {/* Match Report Picker + Message Composer */}
            <div className="border-t border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40 space-y-3">
              {/* Quick Match Analysis Inserter */}
              {matches.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label={gc.selectMatchToShare}
                    value={selectedMatchIdForReport}
                    onChange={(e) => setSelectedMatchIdForReport(e.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {matches.slice(0, 60).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.status === 'live' ? `[LIVE ${m.minute ?? 0}'] ` : ''}
                        {m.homeTeam.shortName} vs {m.awayTeam.shortName} — {m.leagueName}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleInsertMatchReport}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/40 bg-emerald-600/10 px-3 py-1.5 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-600/20 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300 whitespace-nowrap"
                  >
                    <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{gc.insertMatchReport}</span>
                  </button>
                </div>
              )}

              <textarea
                rows={4}
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                placeholder={gc.composerPlaceholder}
                disabled={!selectedSpace}
                className="w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {gc.confirmationGuaranteeNote}
                </p>
                <button
                  type="button"
                  onClick={requestSendMessage}
                  disabled={!selectedSpace || !composerText.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
                >
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{gc.sendMessageButton}</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Mandatory Custom Confirmation Modal */}
      {modalConfig && (
        <ConfirmActionModal
          isOpen={Boolean(pendingAction)}
          title={modalConfig.title}
          description={modalConfig.description}
          targetLabel={modalConfig.targetLabel}
          previewText={modalConfig.previewText}
          confirmLabel={modalConfig.confirmLabel}
          cancelLabel={gc.cancelAction}
          destructive={modalConfig.destructive}
          submitting={confirmSubmitting}
          onConfirm={executeConfirmedAction}
          onCancel={() => {
            if (!confirmSubmitting) setPendingAction(null);
          }}
        />
      )}

      <DisclaimerBanner text={t.common.disclaimer} />
    </div>
  );
};
