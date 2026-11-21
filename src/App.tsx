import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  Bookmark,
  CalendarDays,
  FlaskConical,
  LayoutDashboard,
  Menu,
  MessageSquare,
  MessagesSquare,
  Moon,
  Percent,
  Radio,
  RefreshCw,
  ShieldCheck,
  Sun,
  TrendingUp,
  Trophy,
  Wallet,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type {
  ApiStatusInfo,
  Language,
  LeagueStandings,
  LiveProbSnapshot,
  MatchWithPrediction,
  PerformanceSummary,
  ThemeMode,
} from './types/football';
import { translations } from './i18n/translations';
import { proTranslations } from './i18n/proTranslations';
import { footballService, FootballServiceError } from './services/footballService';
import { useWatchlist } from './hooks/useWatchlist';
import { useWatchlistNotifications } from './hooks/useWatchlistNotifications';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DashboardSkeleton, DemoModeNotice } from './components/AnalyticsPrimitives';
import { MatchChatSidebar, type MatchChatErrorEvent } from './components/MatchChatSidebar';
import { ToastContainer } from './components/ToastContainer';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  dismissToast,
  enqueueToast,
  type ToastInput,
  type ToastItem,
} from './utils/toastQueue';
import { resolveStickySelectedMatch } from './utils/selectedMatchResolver';
import { DashboardPage } from './pages/DashboardPage';
import { MatchesPage } from './pages/MatchesPage';
import { MatchDetailPage } from './pages/MatchDetailPage';
import { PredictionsPage } from './pages/PredictionsPage';
import { TeamsLeaguesPage } from './pages/TeamsLeaguesPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { PerformancePage } from './pages/PerformancePage';
import { GoogleChatPage } from './pages/GoogleChatPage';
import { LivePanelPage } from './pages/LivePanelPage';
import { ValueBetsPage } from './pages/ValueBetsPage';
import { BacktestingPage } from './pages/BacktestingPage';
import { TeamComparisonPage } from './pages/TeamComparisonPage';
import { BankrollPage } from './pages/BankrollPage';
import { ModelTransparencyPage } from './pages/ModelTransparencyPage';
import { ResponsibleGamblingPage } from './pages/ResponsibleGamblingPage';
import { FootballPortalApp } from './pages/FootballPortalApp';

type NavTab =
  | 'dashboard'
  | 'live-panel'
  | 'matches'
  | 'predictions'
  | 'value-bets'
  | 'backtesting'
  | 'team-compare'
  | 'teams'
  | 'watchlist'
  | 'bankroll'
  | 'performance'
  | 'google-chat'
  | 'how-it-works'
  | 'responsible-gambling';

const LANG_STORAGE_KEY = 'matchedge_lang_v1';
const THEME_STORAGE_KEY = 'matchedge_theme_v1';

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
      if (saved === 'az' || saved === 'en' || saved === 'ru') return saved;
    } catch {
      // ignore
    }
    return 'az';
  });

  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // ignore
    }
    return 'dark';
  });

  const [appMode, setAppMode] = useState<'portal' | 'analytics'>('portal');
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedMatchSnapshot, setSelectedMatchSnapshot] = useState<MatchWithPrediction | null>(
    null
  );
  const [pendingShareMatchId, setPendingShareMatchId] = useState<string | null>(null);
  const [chatSidebarOpen, setChatSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [matches, setMatches] = useState<MatchWithPrediction[]>([]);
  const [standings, setStandings] = useState<LeagueStandings[]>([]);
  const [performance, setPerformance] = useState<PerformanceSummary | null>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatusInfo | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorState, setErrorState] = useState<{
    type: 'rate_limit' | 'error';
    message: string;
  } | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [previousSnapshots, setPreviousSnapshots] = useState<Record<string, LiveProbSnapshot>>({});
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const currentSnapshotsRef = useRef<Record<string, LiveProbSnapshot>>({});

  const watchlist = useWatchlist();
  const t = translations[lang];
  const pt = proTranslations[lang];

  const pushToast = useCallback((input: ToastInput) => {
    setToasts((prev) => enqueueToast(prev, input));
  }, []);

  const handleDismissToast = useCallback((id: string) => {
    setToasts((prev) => dismissToast(prev, id));
  }, []);

  const notifLabels = useMemo(
    () => ({
      matchLiveTitle: pt.watchlistAlerts.matchLiveTitle,
      goalTitle: pt.watchlistAlerts.goalTitle,
      probShiftTitle: pt.watchlistAlerts.probShiftTitle,
      nowLiveSuffix: pt.watchlistAlerts.nowLiveSuffix,
      probMovedPrefix: pt.watchlistAlerts.probMovedPrefix,
    }),
    [pt.watchlistAlerts]
  );

  const watchlistNotifications = useWatchlistNotifications({
    entries: watchlist.entries,
    matches,
    labels: notifLabels,
    onInAppAlert: useCallback(
      (alert) => {
        pushToast({
          variant: 'info',
          title: alert.title,
          message: alert.body,
          durationMs: 6500,
        });
      },
      [pushToast]
    ),
  });

  const handleChatError = useCallback(
    (event: MatchChatErrorEvent) => {
      pushToast({
        variant: event.isRateLimit ? 'warning' : 'error',
        title: event.isRateLimit ? t.toast.chatRateLimitTitle : t.toast.chatErrorTitle,
        message: event.message,
        durationMs: 7000,
        actionLabel: t.common.retry,
        onAction: event.onRetry,
      });
    },
    [pushToast, t.toast.chatRateLimitTitle, t.toast.chatErrorTitle, t.common.retry]
  );

  const recordSnapshots = useCallback((nextMatches: MatchWithPrediction[]) => {
    const prev = currentSnapshotsRef.current;
    if (Object.keys(prev).length > 0) {
      setPreviousSnapshots(prev);
    }
    const nowIso = new Date().toISOString();
    const fresh: Record<string, LiveProbSnapshot> = {};
    for (const m of nextMatches) {
      fresh[m.id] = {
        homeWinProb: m.prediction.homeWinProb,
        drawProb: m.prediction.drawProb,
        awayWinProb: m.prediction.awayWinProb,
        over25Prob: m.prediction.over25Prob,
        bttsYesProb: m.prediction.bttsYesProb,
        scoreHome: m.score?.home ?? 0,
        scoreAway: m.score?.away ?? 0,
        minute: m.minute,
        capturedAt: nowIso,
      };
    }
    currentSnapshotsRef.current = fresh;
    setLastUpdatedAt(nowIso);
  }, []);

  // Sync theme with <html class="dark">
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.lang = lang;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme, lang]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }, [lang]);

  // Close mobile menu or chat sidebar on Escape key (never interrupt typing inside inputs)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const activeEl = document.activeElement as HTMLElement | null;
      const tag = activeEl?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || activeEl?.isContentEditable) {
        return;
      }
      if (mobileMenuOpen) setMobileMenuOpen(false);
      else if (chatSidebarOpen) setChatSidebarOpen(false);
      else if (selectedMatchId) {
        setSelectedMatchId(null);
        setSelectedMatchSnapshot(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen, chatSidebarOpen, selectedMatchId]);

  const loadAllData = useCallback(
    async (forceRefresh: boolean = false) => {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);
      setErrorState(null);

      try {
        const [matchesRes, standingsRes, perfRes] = await Promise.all([
          footballService.fetchMatches({ forceRefresh }),
          footballService.fetchStandings({ forceRefresh }),
          footballService.fetchPerformance({ forceRefresh }),
        ]);
        recordSnapshots(matchesRes.matches);
        setMatches(matchesRes.matches);
        setStandings(standingsRes.standings);
        setPerformance(perfRes.performance);
        setApiStatus(matchesRes.status);
      } catch (err) {
        if (err instanceof FootballServiceError && err.code === 'RATE_LIMITED') {
          setErrorState({ type: 'rate_limit', message: err.message });
        } else {
          setErrorState({
            type: 'error',
            message: err instanceof Error ? err.message : 'Unable to fetch data',
          });
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [recordSnapshots]
  );

  const refreshLiveMatchesOnly = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await footballService.fetchMatches({ forceRefresh: true });
      recordSnapshots(res.matches);
      setMatches(res.matches);
      setApiStatus(res.status);
    } catch {
      // Keep current state silently on transient background poll failure
    } finally {
      setRefreshing(false);
    }
  }, [recordSnapshots]);

  useEffect(() => {
    if (appMode === 'analytics') {
      loadAllData(false);
    }
  }, [appMode, loadAllData]);

  const handleToggleWatchlist = useCallback(
    (match: MatchWithPrediction) => {
      watchlist.toggleWatchlist(match.id, {
        market: '1x2',
        selection: match.prediction.topOutcome.selection,
        probability: match.prediction.topOutcome.probability,
      });
    },
    [watchlist]
  );

  const handleSelectNav = (tab: NavTab) => {
    setActiveTab(tab);
    setSelectedMatchId(null);
    setSelectedMatchSnapshot(null);
    setChatSidebarOpen(false);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenMatch = (matchId: string) => {
    const found = matches.find((m) => m.id === matchId) ?? null;
    setSelectedMatchId(matchId);
    if (found) {
      setSelectedMatchSnapshot(found);
    }
    // Automatically dock the AI Chat Sidebar on wide desktop screens
    if (typeof window !== 'undefined' && window.innerWidth >= 1280) {
      setChatSidebarOpen(true);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShareToGoogleChat = (matchId: string) => {
    setPendingShareMatchId(matchId);
    setSelectedMatchId(null);
    setSelectedMatchSnapshot(null);
    setChatSidebarOpen(false);
    setActiveTab('google-chat');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Quietly refresh live matches every 60s when live games are currently being played
  useEffect(() => {
    const hasLive = matches.some((m) => m.status === 'live');
    if (!hasLive) return;
    const timer = window.setInterval(() => {
      footballService
        .fetchMatches({ forceRefresh: true })
        .then((res) => {
          recordSnapshots(res.matches);
          setMatches(res.matches);
          setApiStatus(res.status);
        })
        .catch(() => {
          // Keep current state silently on transient background poll failure
        });
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [matches.some((m) => m.status === 'live'), recordSnapshots]);

  // Enrich selected match on-demand with real recent matches, H2H, injuries, and live match stats
  useEffect(() => {
    if (!selectedMatchId) return;
    const target =
      matches.find((m) => m.id === selectedMatchId) ?? selectedMatchSnapshot;
    if (!target) return;

    const controller = new AbortController();
    footballService
      .fetchMatchDetail(target, controller.signal)
      .then((enriched) => {
        const stableEnriched = { ...enriched, id: selectedMatchId };
        setSelectedMatchSnapshot(stableEnriched);
        setMatches((prev) =>
          prev.map((m) => (m.id === selectedMatchId ? stableEnriched : m))
        );
      })
      .catch(() => {
        // Keep base match metrics seamlessly if summary enrichment is unavailable
      });

    return () => controller.abort();
  }, [selectedMatchId]);

  // Keep sticky selectedMatchSnapshot updated whenever matches refresh, without ever dropping it to null
  useEffect(() => {
    if (!selectedMatchId) return;
    setSelectedMatchSnapshot((prev) => resolveStickySelectedMatch(selectedMatchId, prev, matches));
  }, [matches, selectedMatchId]);

  const selectedMatch = selectedMatchId
    ? selectedMatchSnapshot ?? matches.find((m) => m.id === selectedMatchId) ?? null
    : null;

  const pendingShareMatch = pendingShareMatchId
    ? matches.find((m) => m.id === pendingShareMatchId) ?? null
    : null;

  const liveCount = matches.filter((m) => m.status === 'live').length;

  type NavItemDef = {
    id: NavTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    count?: number;
    liveDot?: boolean;
  };

  const navSections: Array<{ title: string; items: NavItemDef[] }> = [
    {
      title: pt.navSections.analytics,
      items: [
        { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
        { id: 'live-panel', label: pt.nav.livePanel, icon: Radio, count: liveCount, liveDot: liveCount > 0 },
        { id: 'matches', label: t.nav.matches, icon: CalendarDays },
        { id: 'predictions', label: t.nav.predictions, icon: TrendingUp },
        { id: 'teams', label: t.nav.teamsLeagues, icon: Trophy },
        { id: 'team-compare', label: pt.nav.teamCompare, icon: ArrowLeftRight },
      ],
    },
    {
      title: pt.navSections.tools,
      items: [
        { id: 'value-bets', label: pt.nav.valueBets, icon: Percent },
        { id: 'backtesting', label: pt.nav.backtesting, icon: FlaskConical },
        { id: 'bankroll', label: pt.nav.bankroll, icon: Wallet },
        { id: 'watchlist', label: t.nav.watchlist, icon: Bookmark, count: watchlist.entries.length },
        { id: 'performance', label: t.nav.performance, icon: BarChart3 },
        { id: 'google-chat', label: t.nav.googleChat, icon: MessagesSquare },
      ],
    },
    {
      title: pt.navSections.transparency,
      items: [
        { id: 'how-it-works', label: pt.nav.howItWorks, icon: BookOpen },
        { id: 'responsible-gambling', label: pt.nav.responsibleGambling, icon: ShieldCheck },
      ],
    },
  ];

  const allNavItems = navSections.flatMap((s) => s.items);

  const activeNavLabel = selectedMatch
    ? `${selectedMatch.homeTeam.shortName} vs ${selectedMatch.awayTeam.shortName}`
    : allNavItems.find((n) => n.id === activeTab)?.label ?? t.nav.dashboard;

  const renderNavSections = (isMobile: boolean) =>
    navSections.map((section) => (
      <div key={section.title} className="space-y-0.5">
        <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {section.title}
        </p>
        {section.items.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id && !selectedMatch;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectNav(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex w-full items-center justify-between rounded-lg px-3 ${
                isMobile ? 'py-2.5' : 'py-2'
              } text-sm font-medium transition-colors whitespace-nowrap ${
                active
                  ? 'bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </span>
              {item.count !== undefined && item.count > 0 && (
                <span
                  className={`inline-flex items-center gap-1 font-mono text-xs tabular-nums ${
                    item.liveDot
                      ? 'text-rose-600 dark:text-rose-400 font-semibold'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {item.liveDot && <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />}
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    ));

  if (appMode === 'portal') {
    return (
      <ErrorBoundary>
        <FootballPortalApp
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          lang={lang}
          onChangeLang={setLang}
          onOpenProAnalytics={() => {
            setAppMode('analytics');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </ErrorBoundary>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0B0F17] dark:text-slate-100">
      {/* Desktop Left Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200 bg-white dark:border-slate-800/90 dark:bg-[#0E1420] lg:flex">
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-slate-200 px-5 dark:border-slate-800/90">
          <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap">
            MatchEdge
          </span>
        </div>

        <nav aria-label="Primary navigation" className="flex-1 overflow-y-auto space-y-2 px-3 py-2">
          {renderNavSections(false)}
        </nav>

        <div className="shrink-0 space-y-2.5 border-t border-slate-200 p-3.5 text-xs text-slate-500 dark:border-slate-800/90 dark:text-slate-400">
          <PWAInstallButton
            installLabel={pt.pwa.installApp}
            iosTitle={pt.pwa.iosTitle}
            iosStep1={pt.pwa.iosStep1}
            iosStep2={pt.pwa.iosStep2}
            closeLabel={pt.pwa.close}
          />
          <div>
            <p className="font-medium text-slate-700 dark:text-slate-300">
              {apiStatus?.sourceLabel || t.common.liveApiMode}
            </p>
            <p className="mt-0.5 text-[11px]">{t.brandTagline}</p>
          </div>
        </div>
      </aside>

      {/* Mobile Slide-Over Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-[1px]"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 flex w-72 max-w-[82vw] flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0E1420]"
            >
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-50">
                    MatchEdge
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label={t.common.closeMenu}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav aria-label="Mobile navigation" className="flex-1 overflow-y-auto space-y-2 p-3">
                {renderNavSections(true)}
              </nav>
              <div className="shrink-0 border-t border-slate-200 p-3 dark:border-slate-800">
                <PWAInstallButton
                  installLabel={pt.pwa.installApp}
                  iosTitle={pt.pwa.iosTitle}
                  iosStep1={pt.pwa.iosStep1}
                  iosStep2={pt.pwa.iosStep2}
                  closeLabel={pt.pwa.close}
                />
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Column */}
      <div
        className={`flex min-h-screen flex-col transition-[padding] duration-200 lg:pl-60 ${
          selectedMatch && chatSidebarOpen ? 'xl:pr-[380px]' : ''
        }`}
      >
        {/* Slim Sticky Top Bar (56px — stays well under 15% mobile sticky cap) */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs dark:border-slate-800/90 dark:bg-[#0B0F17]/95 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label={t.common.openMenu}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {activeNavLabel}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setAppMode('portal');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-[#00F58C] hover:bg-emerald-500/20 transition-colors whitespace-nowrap"
            >
              <span>← ARENA AZ</span>
            </button>
            {/* Compact PWA Install prompt in header when installable */}
            <div className="hidden sm:block">
              <PWAInstallButton
                installLabel={pt.pwa.installApp}
                iosTitle={pt.pwa.iosTitle}
                iosStep1={pt.pwa.iosStep1}
                iosStep2={pt.pwa.iosStep2}
                closeLabel={pt.pwa.close}
                compact
              />
            </div>

            {/* Match AI Chat Sidebar Toggle (shown when viewing a match) */}
            {selectedMatch && (
              <button
                type="button"
                onClick={() => setChatSidebarOpen((prev) => !prev)}
                aria-expanded={chatSidebarOpen}
                aria-controls="match-chat-sidebar"
                aria-label={t.matchChat.askButton}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  chatSidebarOpen
                    ? 'border-emerald-600/40 bg-emerald-600/10 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">{t.matchChat.title}</span>
              </button>
            )}

            {/* Refresh Data Button */}
            <button
              type="button"
              onClick={() => loadAllData(true)}
              disabled={refreshing}
              aria-label={t.common.refresh}
              className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Language Switcher AZ / EN / RU */}
            <div
              role="group"
              aria-label="Language"
              className="inline-flex items-center rounded-lg bg-slate-100 p-0.5 dark:bg-slate-900"
            >
              {(['az', 'en', 'ru'] as const).map((code) => {
                const active = lang === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLang(code)}
                    aria-pressed={active}
                    className={`rounded-md px-2 py-1 text-xs font-semibold uppercase transition-colors ${
                      active
                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-emerald-400'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                    }`}
                  >
                    {code}
                  </button>
                );
              })}
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              aria-label={theme === 'dark' ? t.common.lightTheme : t.common.darkTheme}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6">
          {/* Explicit DEMO MODE Banner */}
          {apiStatus?.mode === 'demo' && (
            <DemoModeNotice
              title={t.common.demoBannerTitle}
              description={
                apiStatus.fallbackReason
                  ? `${t.common.demoBannerDesc} (${apiStatus.fallbackReason})`
                  : t.common.demoBannerDesc
              }
            />
          )}

          {/* Error / Rate Limit Banner */}
          {errorState && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:bg-rose-950/30 dark:text-rose-200"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <div>
                  <p className="font-semibold">
                    {errorState.type === 'rate_limit'
                      ? t.common.rateLimitTitle
                      : t.common.errorTitle}
                  </p>
                  <p className="text-xs opacity-90">
                    {errorState.type === 'rate_limit'
                      ? t.common.rateLimitDesc
                      : errorState.message}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => loadAllData(true)}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-500 whitespace-nowrap"
              >
                {t.common.retry}
              </button>
            </div>
          )}

          <ErrorBoundary fallbackTitle={t.common.errorTitle} retryLabel={t.common.retry}>
            {loading ? (
              <DashboardSkeleton />
            ) : (
              <motion.div
                key={selectedMatch ? `match-${selectedMatch.id}` : activeTab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              >
                {selectedMatch ? (
                  <MatchDetailPage
                    match={selectedMatch}
                    lang={lang}
                    t={t}
                    onBack={() => {
                      setSelectedMatchId(null);
                      setSelectedMatchSnapshot(null);
                      setChatSidebarOpen(false);
                    }}
                    isSaved={watchlist.isSaved(selectedMatch.id)}
                    onToggleWatchlist={() => handleToggleWatchlist(selectedMatch)}
                    isChatOpen={chatSidebarOpen}
                    onToggleChatSidebar={() => setChatSidebarOpen((prev) => !prev)}
                    onShareToGoogleChat={() => handleShareToGoogleChat(selectedMatch.id)}
                  />
                ) : activeTab === 'dashboard' ? (
                  <DashboardPage
                    matches={matches}
                    lang={lang}
                    t={t}
                    onSelectMatch={handleOpenMatch}
                    onNavigatePredictions={() => handleSelectNav('predictions')}
                    isSaved={watchlist.isSaved}
                    onToggleWatchlist={handleToggleWatchlist}
                  />
                ) : activeTab === 'live-panel' ? (
                  <LivePanelPage
                    matches={matches}
                    previousSnapshots={previousSnapshots}
                    lastUpdatedAt={lastUpdatedAt}
                    refreshing={refreshing}
                    onRefreshLive={refreshLiveMatchesOnly}
                    onSelectMatch={handleOpenMatch}
                    lang={lang}
                    t={t}
                  />
                ) : activeTab === 'matches' ? (
                  <MatchesPage
                    matches={matches}
                    lang={lang}
                    t={t}
                    onSelectMatch={handleOpenMatch}
                    isSaved={watchlist.isSaved}
                    onToggleWatchlist={handleToggleWatchlist}
                  />
                ) : activeTab === 'predictions' ? (
                  <PredictionsPage
                    matches={matches}
                    lang={lang}
                    t={t}
                    onSelectMatch={handleOpenMatch}
                    isSaved={watchlist.isSaved}
                    onToggleWatchlist={handleToggleWatchlist}
                    onNotify={(message) =>
                      pushToast({
                        variant: 'info',
                        title: t.predictions.title,
                        message,
                        durationMs: 4000,
                      })
                    }
                  />
                ) : activeTab === 'value-bets' ? (
                  <ValueBetsPage
                    matches={matches}
                    lang={lang}
                    t={t}
                    onSelectMatch={handleOpenMatch}
                  />
                ) : activeTab === 'backtesting' ? (
                  <BacktestingPage
                    performance={performance}
                    matches={matches}
                    lang={lang}
                    t={t}
                  />
                ) : activeTab === 'team-compare' ? (
                  <TeamComparisonPage
                    matches={matches}
                    standings={standings}
                    lang={lang}
                    t={t}
                  />
                ) : activeTab === 'teams' ? (
                  <TeamsLeaguesPage standings={standings} lang={lang} t={t} />
                ) : activeTab === 'bankroll' ? (
                  <BankrollPage
                    lang={lang}
                    t={t}
                    onDailyLimitTriggered={(title, body) =>
                      pushToast({
                        variant: 'warning',
                        title,
                        message: body,
                        durationMs: 8000,
                      })
                    }
                  />
                ) : activeTab === 'watchlist' ? (
                  <WatchlistPage
                    entries={watchlist.entries}
                    matches={matches}
                    lang={lang}
                    t={t}
                    onSelectMatch={handleOpenMatch}
                    onRemove={watchlist.removeEntry}
                    onClearAll={watchlist.clearWatchlist}
                    onBrowseMatches={() => handleSelectNav('matches')}
                    notifEnabled={watchlistNotifications.enabled}
                    onToggleNotifEnabled={watchlistNotifications.setEnabled}
                    browserPermission={watchlistNotifications.browserPermission}
                    browserSupported={watchlistNotifications.browserSupported}
                    onRequestBrowserPermission={watchlistNotifications.requestBrowserPermission}
                    alerts={watchlistNotifications.alerts}
                    onClearAlerts={watchlistNotifications.clearAlerts}
                    onSendTestAlert={() =>
                      watchlistNotifications.sendTestAlert(
                        pt.watchlistAlerts.testTitle,
                        pt.watchlistAlerts.testBody
                      )
                    }
                  />
                ) : activeTab === 'google-chat' ? (
                  <GoogleChatPage
                    matches={matches}
                    pendingShareMatch={pendingShareMatch}
                    onClearPendingShare={() => setPendingShareMatchId(null)}
                    lang={lang}
                    t={t}
                  />
                ) : activeTab === 'how-it-works' ? (
                  <ModelTransparencyPage lang={lang} t={t} />
                ) : activeTab === 'responsible-gambling' ? (
                  <ResponsibleGamblingPage lang={lang} />
                ) : performance ? (
                  <PerformancePage performance={performance} lang={lang} t={t} />
                ) : null}
              </motion.div>
            )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Right-Docked AI Match Analyst Chat Sidebar */}
      <ErrorBoundary fallbackTitle={t.common.errorTitle} retryLabel={t.common.retry}>
        <MatchChatSidebar
          selectedMatch={selectedMatch}
          isOpen={chatSidebarOpen}
          onClose={() => setChatSidebarOpen(false)}
          lang={lang}
          t={t}
          onChatError={handleChatError}
        />
      </ErrorBoundary>

      {/* Non-Intrusive Toast Notification Stack */}
      <ToastContainer
        toasts={toasts}
        onDismiss={handleDismissToast}
        regionLabel={t.toast.regionLabel}
        dismissLabel={t.toast.dismiss}
        offsetForRightSidebar={Boolean(selectedMatch && chatSidebarOpen)}
      />

      {/* Offline Connectivity Indicator */}
      <OfflineIndicator label={pt.pwa.offlineBanner} />
    </div>
  );
}
