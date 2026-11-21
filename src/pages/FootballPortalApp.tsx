import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Radio, X } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { Language, ThemeMode } from '../types/football';
import {
  DEFAULT_PLATFORM_FEATURE_FLAGS,
  type PlatformFeatureFlag,
  type PlatformMatch,
  type PlatformNewsArticle,
  type PlatformStandingsLeague,
  type PlatformTransparencyPayload,
} from '../types/platform';
import {
  generateSmartCoupons,
  MANDATORY_DISCLAIMER_AZ,
  type CouponLeg,
  type GeneratedCoupon,
} from '../utils/bettingInsightsEngine';
import { mergeLiveScorePatches } from '../utils/liveGoalDetector';
import { useLiveScoreStream } from '../hooks/useLiveScoreStream';
import { ClubLogo } from '../components/platform/ClubLogo';
import {
  checkIsAdminUser,
  DEFAULT_ALERT_PREFS,
  loadOrCreateUserProfile,
  loadUserBankrollBets,
  loadUserContestPredictions,
  saveBankrollBetToFirestore,
  saveContestPredictionToFirestore,
  saveUserCouponToFirestore,
  signInWithGoogle,
  signOutUser,
  subscribeAuth,
  updateUserPreferences,
  type AlertPreferences,
  type PersistedBankrollBet,
  type PersistedContestEntry,
} from '../services/firestorePlatform';
import { PortalNavbar, type PlatformTab } from '../components/portal/PortalNavbar';
import { LiveScoresTicker } from '../components/portal/LiveScoresTicker';
import { HeroSection } from '../components/portal/HeroSection';
import { LeagueTableSection } from '../components/portal/LeagueTableSection';
import { NewsGridSection } from '../components/portal/NewsGridSection';
import { NewsletterFooter } from '../components/portal/NewsletterFooter';
import { PitchDivider } from '../components/portal/PitchDivider';
import { AgeGateModal, ResponsibleGamblingModal } from '../components/platform/AgeGateModal';
import { ArenaMatchCenter } from '../components/platform/ArenaMatchCenter';
import { DeepMatchDetailView } from '../components/platform/DeepMatchDetailView';
import { ValueBetsHubView } from '../components/platform/ValueBetsHubView';
import { CouponBankrollView } from '../components/platform/CouponBankrollView';
import { PlatformAIChat } from '../components/platform/PlatformAIChat';
import { TransparencyArchiveView } from '../components/platform/TransparencyArchiveView';
import {
  PredictionContestView,
  TipstersView,
} from '../components/platform/ContestAndTipstersView';
import {
  AdminPanelView,
  AlertsDrawer,
  PremiumPlansView,
} from '../components/platform/PremiumAlertsAdminView';
import {
  MatchAnalysisDrawer,
  marketOptionToCouponLeg,
} from '../components/platform/MatchAnalysisDrawer';
import { CouponDrawer } from '../components/platform/CouponDrawer';
import { HowItWorksModal } from '../components/platform/HowItWorksModal';
import { OfflineIndicator } from '../components/OfflineIndicator';

interface FootballPortalAppProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  lang: Language;
  onChangeLang: (lang: Language) => void;
  onOpenProAnalytics: () => void;
}

const STORAGE_FAV_TEAMS = 'arena_az_fav_teams_v2';
const STORAGE_FAV_LEAGUES = 'arena_az_fav_leagues_v2';
const STORAGE_CUSTOM_COUPON = 'arena_az_custom_coupon_v2';
const STORAGE_BANKROLL_BETS = 'arena_az_bankroll_bets_v2';
const STORAGE_CONTEST = 'arena_az_contest_v2';
const STORAGE_ALERTS = 'arena_az_alerts_v2';
const STORAGE_GOAL_SOUND = 'arena_az_goal_sound_v1';

function readLocalJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const FootballPortalApp: React.FC<FootballPortalAppProps> = ({
  theme,
  onToggleTheme,
  lang,
  onChangeLang,
  onOpenProAnalytics,
}) => {
  const [activeTab, setActiveTab] = useState<PlatformTab>('home');
  const [activeMatchId, setActiveMatchId] = useState<string>('');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>('');

  // Firebase Auth + User State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free');

  // 100% REAL Live Backend Data State (Zero Demo Fallbacks)
  const [platformMatches, setPlatformMatches] = useState<PlatformMatch[]>([]);
  const [matchesLoading, setMatchesLoading] = useState<boolean>(true);
  const [sourceLabel, setSourceLabel] = useState<string>('ESPN Live + The Odds API');
  const [standings, setStandings] = useState<PlatformStandingsLeague[]>([]);
  const [standingsLoading, setStandingsLoading] = useState<boolean>(true);
  const [newsArticles, setNewsArticles] = useState<PlatformNewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState<boolean>(true);
  const [transparency, setTransparency] = useState<PlatformTransparencyPayload | null>(null);
  const [transparencyLoading, setTransparencyLoading] = useState<boolean>(true);

  const [featureFlags, setFeatureFlags] = useState<PlatformFeatureFlag[]>(
    DEFAULT_PLATFORM_FEATURE_FLAGS
  );
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // User Personalization & Persisted Collections (Starts Empty — Zero Seeded Fake Bets/Data)
  const [favoriteTeams, setFavoriteTeams] = useState<string[]>(() =>
    readLocalJson<string[]>(STORAGE_FAV_TEAMS, [])
  );
  const [favoriteLeagues, setFavoriteLeagues] = useState<string[]>(() =>
    readLocalJson<string[]>(STORAGE_FAV_LEAGUES, [])
  );
  const [customLegs, setCustomLegs] = useState<CouponLeg[]>(() =>
    readLocalJson<CouponLeg[]>(STORAGE_CUSTOM_COUPON, [])
  );
  const [bankrollBets, setBankrollBets] = useState<PersistedBankrollBet[]>(() =>
    readLocalJson<PersistedBankrollBet[]>(STORAGE_BANKROLL_BETS, [])
  );
  const [contestEntries, setContestEntries] = useState<Record<string, PersistedContestEntry>>(() =>
    readLocalJson<Record<string, PersistedContestEntry>>(STORAGE_CONTEST, {})
  );
  const [alertPrefs, setAlertPrefs] = useState<AlertPreferences>(() =>
    readLocalJson<AlertPreferences>(STORAGE_ALERTS, DEFAULT_ALERT_PREFS)
  );

  // Drawers, Modals, AI Floating Chat, Toast
  const [responsibleOpen, setResponsibleOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [drawerMatchId, setDrawerMatchId] = useState<string | null>(null);
  const [couponDrawerOpen, setCouponDrawerOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [floatingChatOpen, setFloatingChatOpen] = useState(false);
  const [queuedAiPrompt, setQueuedAiPrompt] = useState<string | null>(null);
  const [bannerToast, setBannerToast] = useState<string | null>(null);
  const [customCursorEnabled, setCustomCursorEnabled] = useState<boolean>(false);
  const [goalSoundEnabled, setGoalSoundEnabled] = useState<boolean>(() =>
    readLocalJson<boolean>(STORAGE_GOAL_SOUND, true)
  );

  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setBannerToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setBannerToast(null), 3800);
  }, []);

  // Subscribe to Firebase Auth & sync Firestore user records when signed in
  useEffect(() => {
    const unsub = subscribeAuth(async (u) => {
      setFirebaseUser(u);
      if (!u) {
        setIsAdminUser(false);
        return;
      }
      try {
        const [profile, adminFlag, remoteBets, remoteContest] = await Promise.all([
          loadOrCreateUserProfile(u, {
            language: lang,
            theme,
            favoriteTeams,
            favoriteLeagues,
            alertPrefs,
          }),
          checkIsAdminUser(u.uid),
          loadUserBankrollBets(u.uid).catch(() => []),
          loadUserContestPredictions(u.uid).catch(() => ({})),
        ]);
        setIsAdminUser(adminFlag);
        setUserPlan(profile.plan);
        if (profile.favoriteTeams.length > 0) setFavoriteTeams(profile.favoriteTeams);
        if (profile.favoriteLeagues.length > 0) setFavoriteLeagues(profile.favoriteLeagues);
        setAlertPrefs(profile.alertPrefs);
        if (remoteBets.length > 0) setBankrollBets(remoteBets);
        if (Object.keys(remoteContest).length > 0) {
          setContestEntries((prev) => ({ ...prev, ...remoteContest }));
        }
      } catch {
        // Keep local persistence smooth if offline
      }
    });
    return unsub;
  }, []);

  // Persist user preferences locally
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_FAV_TEAMS, JSON.stringify(favoriteTeams));
      window.localStorage.setItem(STORAGE_FAV_LEAGUES, JSON.stringify(favoriteLeagues));
      window.localStorage.setItem(STORAGE_CUSTOM_COUPON, JSON.stringify(customLegs));
      window.localStorage.setItem(STORAGE_BANKROLL_BETS, JSON.stringify(bankrollBets));
      window.localStorage.setItem(STORAGE_CONTEST, JSON.stringify(contestEntries));
      window.localStorage.setItem(STORAGE_ALERTS, JSON.stringify(alertPrefs));
      window.localStorage.setItem(STORAGE_GOAL_SOUND, JSON.stringify(goalSoundEnabled));
    } catch {
      // ignore storage quota errors
    }
  }, [
    favoriteTeams,
    favoriteLeagues,
    customLegs,
    bankrollBets,
    contestEntries,
    alertPrefs,
    goalSoundEnabled,
  ]);

  // Fetch REAL live matches from /api/platform/matches
  const refreshPlatformMatches = useCallback(
    async (force = false, explicitDate = selectedCalendarDate) => {
      setRefreshing(true);
      try {
        const params = new URLSearchParams();
        if (force) params.set('refresh', '1');
        if (explicitDate) params.set('date', explicitDate);
        const qs = params.toString();
        const res = await fetch(`/api/platform/matches${qs ? `?${qs}` : ''}`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Canlı matç bazası cavab vermədi.');
        const json = (await res.json()) as {
          matches?: PlatformMatch[];
          sourceLabel?: string;
        };
        if (Array.isArray(json.matches)) {
          setPlatformMatches(json.matches);
          if (json.sourceLabel) setSourceLabel(json.sourceLabel);
        }
      } catch {
        showToast('Canlı matç məlumatı yenilənərkən şəbəkə xətası baş verdi.');
      } finally {
        setMatchesLoading(false);
        setRefreshing(false);
      }
    },
    [selectedCalendarDate, showToast]
  );

  // Fetch REAL standings, news, and transparency backtest on mount
  const fetchSecondaryLiveFeeds = useCallback(async (force = false) => {
    const q = force ? '?refresh=1' : '';
    setStandingsLoading(true);
    setNewsLoading(true);
    setTransparencyLoading(true);

    const [stRes, nwRes, trRes] = await Promise.allSettled([
      fetch(`/api/platform/standings${q}`).then((r) => (r.ok ? r.json() : null)),
      fetch('/api/platform/news').then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/platform/transparency${q}`).then((r) => (r.ok ? r.json() : null)),
    ]);

    if (stRes.status === 'fulfilled' && stRes.value?.standings) {
      setStandings(stRes.value.standings as PlatformStandingsLeague[]);
    }
    setStandingsLoading(false);

    if (nwRes.status === 'fulfilled' && Array.isArray(nwRes.value?.articles)) {
      setNewsArticles(nwRes.value.articles as PlatformNewsArticle[]);
    }
    setNewsLoading(false);

    if (trRes.status === 'fulfilled' && trRes.value?.metrics) {
      setTransparency(trRes.value as PlatformTransparencyPayload);
    }
    setTransparencyLoading(false);
  }, []);

  useEffect(() => {
    void refreshPlatformMatches(false, selectedCalendarDate);
  }, [selectedCalendarDate, refreshPlatformMatches]);

  useEffect(() => {
    void fetchSecondaryLiveFeeds(false);
  }, [fetchSecondaryLiveFeeds]);

  // Real-time SSE live stream (8-second server-authoritative ESPN live diff & instant goal push)
  const { activeGoalAlerts, recentGoalFlashes, dismissGoalAlert } = useLiveScoreStream({
    enabled: autoRefreshEnabled,
    soundEnabled: goalSoundEnabled,
    browserNotifyEnabled: alertPrefs.followedGoal,
    favoriteTeams,
    onPatches: useCallback((patches) => {
      setPlatformMatches((prev) => mergeLiveScorePatches(prev, patches));
    }, []),
    onStatusChange: useCallback(
      (ev) => {
        if (ev.nextStatus === 'LIVE') {
          showToast(`BAŞLADI: ${ev.homeTeamName} – ${ev.awayTeamName} (${ev.leagueShort})`);
        } else if (ev.nextStatus === 'FINISHED') {
          showToast(
            `BİTDİ: ${ev.homeTeamName} ${ev.homeScore ?? 0}-${ev.awayScore ?? 0} ${ev.awayTeamName}`
          );
        }
      },
      [showToast]
    ),
    onRedCard: useCallback(
      (ev) => {
        showToast(
          `QIRMIZI VƏRƏQƏ (${ev.minute}): ${ev.teamName} · ${ev.homeTeamName} – ${ev.awayTeamName}`
        );
      },
      [showToast]
    ),
  });

  // Secondary full-slate reconciliation every 60 seconds (adds newly started games / odds updates)
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    const id = window.setInterval(() => {
      void refreshPlatformMatches(false, selectedCalendarDate);
    }, 60_000);
    return () => window.clearInterval(id);
  }, [autoRefreshEnabled, refreshPlatformMatches, selectedCalendarDate]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Derived real candidate legs (strictly upcoming matches with real pre-match bookmaker odds for smart coupons)
  const candidateLegs = useMemo<CouponLeg[]>(() => {
    return platformMatches
      .filter((m) => m.status === 'UPCOMING' && m.hasRealOdds && m.valueBets.length > 0)
      .flatMap((m) =>
        m.valueBets
          .filter((vb) => vb.bookmakerOdds >= 1.12 && vb.bookmakerOdds <= 6.5 && vb.modelProb >= 25)
          .map((vb) => ({
            id: `${m.id}__${vb.market}__${vb.selection}`,
            matchId: m.id,
            matchLabel: vb.matchLabel,
            league: vb.league,
            market: vb.market,
            selection: vb.selection,
            odds: vb.bookmakerOdds,
            modelProb: vb.modelProb,
            impliedProb: vb.impliedProb,
            edgePct: vb.edgePct,
            confidence: vb.confidence,
          }))
      );
  }, [platformMatches]);

  // Full multi-market pool across all matches so AI Coupon Audit can always suggest safer alternatives (e.g. 1 -> 1X)
  const allMarketCandidateLegs = useMemo<CouponLeg[]>(() => {
    const marketLegs = platformMatches
      .filter((m) => m.status !== 'FINISHED')
      .flatMap((m) => (m.prediction.markets ?? []).map((opt) => marketOptionToCouponLeg(m, opt)));
    return [...marketLegs, ...candidateLegs];
  }, [platformMatches, candidateLegs]);

  const smartCoupons = useMemo<GeneratedCoupon[]>(
    () => generateSmartCoupons(candidateLegs),
    [candidateLegs]
  );

  const customCouponLegIds = useMemo(() => new Set(customLegs.map((l) => l.id)), [customLegs]);

  const flagEnabled = useCallback(
    (key: string) => featureFlags.find((f) => f.key === key)?.enabled ?? true,
    [featureFlags]
  );

  const featuredMatch = useMemo<PlatformMatch | null>(() => {
    if (platformMatches.length === 0) return null;
    const liveWithOdds = platformMatches.find((m) => m.status === 'LIVE' && m.hasRealOdds);
    if (liveWithOdds) return liveWithOdds;
    const anyLive = platformMatches.find((m) => m.status === 'LIVE');
    if (anyLive) return anyLive;
    const upcomingWithOdds = platformMatches.find((m) => m.status === 'UPCOMING' && m.hasRealOdds);
    return upcomingWithOdds ?? platformMatches[0];
  }, [platformMatches]);

  const liveCount = useMemo(
    () => platformMatches.filter((m) => m.status === 'LIVE').length,
    [platformMatches]
  );

  const valueBetCount = useMemo(
    () =>
      platformMatches.reduce(
        (sum, m) =>
          sum +
          (m.status !== 'FINISHED' && m.hasRealOdds
            ? m.valueBets.filter((v) => v.isValueBet).length
            : 0),
        0
      ),
    [platformMatches]
  );

  const realOddsMatchCount = useMemo(
    () => platformMatches.filter((m) => m.status !== 'FINISHED' && m.hasRealOdds).length,
    [platformMatches]
  );

  const activePlatformMatch =
    platformMatches.find((m) => m.id === activeMatchId) ?? featuredMatch;

  const drawerMatch = useMemo(
    () => (drawerMatchId ? platformMatches.find((m) => m.id === drawerMatchId) ?? null : null),
    [drawerMatchId, platformMatches]
  );

  const handleOpenMatchDrawer = useCallback(
    (matchId?: string) => {
      const targetId = matchId || featuredMatch?.id;
      if (!targetId) return;
      setDrawerMatchId(targetId);
    },
    [featuredMatch]
  );

  const handleOpenMatchCenter = useCallback(
    (matchId?: string) => {
      const targetId = matchId || featuredMatch?.id;
      if (!targetId) return;
      setDrawerMatchId(null);
      setActiveMatchId(targetId);
      setActiveTab('match-detail');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [featuredMatch]
  );

  const handleToggleFavoriteTeam = useCallback(
    (teamId: string) => {
      setFavoriteTeams((prev) => {
        const next = prev.includes(teamId)
          ? prev.filter((id) => id !== teamId)
          : [...prev, teamId].slice(0, 20);
        if (firebaseUser) {
          void updateUserPreferences(firebaseUser.uid, { favoriteTeams: next }).catch(() => {});
        }
        return next;
      });
    },
    [firebaseUser]
  );

  const handleToggleFavoriteLeague = useCallback(
    (leagueId: string) => {
      setFavoriteLeagues((prev) => {
        const next = prev.includes(leagueId)
          ? prev.filter((id) => id !== leagueId)
          : [...prev, leagueId].slice(0, 10);
        if (firebaseUser) {
          void updateUserPreferences(firebaseUser.uid, { favoriteLeagues: next }).catch(() => {});
        }
        return next;
      });
    },
    [firebaseUser]
  );

  const handleAddCouponLeg = useCallback(
    (leg: CouponLeg) => {
      setCustomLegs((prev) => {
        if (prev.some((x) => x.id === leg.id)) {
          showToast(`"${leg.selection}" kupondan çıxarıldı.`);
          return prev.filter((x) => x.id !== leg.id);
        }
        showToast(`"${leg.matchLabel} — ${leg.selection}" kupona əlavə edildi!`);
        return [...prev, leg].slice(0, 12);
      });
    },
    [showToast]
  );

  const handleAskAiPrompt = useCallback((prompt: string) => {
    setQueuedAiPrompt(prompt);
    setFloatingChatOpen(true);
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      showToast('Google hesabı ilə uğurla daxil oldunuz.');
    } catch {
      showToast('Google girişi ləğv edildi və ya tamamlanmadı.');
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    showToast('Hesabdan çıxış edildi.');
  };

  const topMatchLabel = featuredMatch
    ? `${featuredMatch.homeTeamName} - ${featuredMatch.awayTeamName}`
    : undefined;

  return (
    <div className="relative min-h-screen bg-[#F6F7F9] text-[#111827] dark:bg-[#0B0F14] dark:text-[#F3F6FA] transition-colors duration-200 overflow-x-clip">
      <AgeGateModal onOpenResponsibleModal={() => setResponsibleOpen(true)} />
      <ResponsibleGamblingModal
        open={responsibleOpen}
        onClose={() => setResponsibleOpen(false)}
      />
      <HowItWorksModal open={howItWorksOpen} onClose={() => setHowItWorksOpen(false)} />
      <MatchAnalysisDrawer
        match={drawerMatch}
        standings={standings}
        customCouponLegIds={customCouponLegIds}
        onClose={() => setDrawerMatchId(null)}
        onAddCouponLeg={handleAddCouponLeg}
        onOpenFullMatchCenter={handleOpenMatchCenter}
        onOpenHowItWorks={() => setHowItWorksOpen(true)}
        onAskAiAboutMatch={handleAskAiPrompt}
      />
      <CouponDrawer
        open={couponDrawerOpen}
        onOpenChange={setCouponDrawerOpen}
        legs={customLegs}
        candidatePool={allMarketCandidateLegs}
        onRemoveLeg={(id) => setCustomLegs((prev) => prev.filter((x) => x.id !== id))}
        onReplaceLeg={(oldId, nextLeg) => {
          setCustomLegs((prev) => prev.map((x) => (x.id === oldId ? nextLeg : x)));
          showToast(`Daha təhlükəsiz seçimlə əvəz edildi: ${nextLeg.selection}`);
        }}
        onClear={() => {
          setCustomLegs([]);
          showToast('Kupon təmizləndi.');
        }}
        onSaveCoupon={(title, combinedOdds, combinedProb) => {
          if (firebaseUser) {
            void saveUserCouponToFirestore({
              uid: firebaseUser.uid,
              couponId: `cp-${Date.now()}`,
              title,
              legs: customLegs,
              combinedOdds,
              combinedProb,
            }).catch(() => {});
          }
          showToast(`"${title}" yadda saxlandı!`);
        }}
        onAskAiToAudit={() => handleAskAiPrompt('Bu kuponu yoxla')}
      />
      <AlertsDrawer
        open={alertsOpen}
        onClose={() => setAlertsOpen(false)}
        prefs={alertPrefs}
        onChangePrefs={(next) => {
          setAlertPrefs(next);
          if (firebaseUser) {
            void updateUserPreferences(firebaseUser.uid, { alertPrefs: next }).catch(() => {});
          }
        }}
        onSendTestAlert={() => {
          const bestVb = platformMatches
            .filter((m) => m.status !== 'FINISHED' && m.hasRealOdds)
            .flatMap((m) => m.valueBets.filter((v) => v.isValueBet))
            .sort((a, b) => b.edgePct - a.edgePct)[0];
          if (bestVb) {
            showToast(
              `Real Siqnal: ${bestVb.matchLabel} (${bestVb.selection} @ ${bestVb.bookmakerOdds.toFixed(
                2
              )}) +${bestVb.edgePct}% Value Bet!`
            );
          } else {
            showToast(`Canlı skaner aktivdir: hazırda ${liveCount} canlı oyun izlənilir.`);
          }
          setAlertsOpen(false);
        }}
      />

      {/* Real-Time Goal Alert Banner Stack (instant SSE push) */}
      {activeGoalAlerts.length > 0 && (
        <div
          aria-live="assertive"
          className="fixed top-16 right-4 z-[85] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 pointer-events-none"
        >
          <AnimatePresence>
            {activeGoalAlerts.map((goal) => (
              <motion.div
                key={goal.eventId}
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 32 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="pointer-events-auto rounded-xl border border-[#F5A524]/60 bg-[#121821] p-3.5 text-[#F3F6FA] shadow-lg"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#F5A524] px-2 py-0.5 font-mono text-[10px] font-bold tracking-wide text-[#0B0F14] tabular-nums">
                    <Radio className="h-3 w-3" strokeWidth={1.5} />
                    QOL · {goal.minute}
                  </span>
                  <span className="font-mono text-[10px] text-[#94A3B8] truncate">
                    {goal.leagueShort}
                  </span>
                  <button
                    type="button"
                    onClick={() => dismissGoalAlert(goal.eventId)}
                    aria-label="Qol bildirişini bağla"
                    className="rounded-md p-1 text-[#94A3B8] hover:text-white cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <ClubLogo
                      logoUrl={goal.homeLogo}
                      shortCode={goal.homeShort}
                      name={goal.homeTeamName}
                      size="xs"
                    />
                    <span
                      className={`truncate text-xs font-semibold ${
                        goal.scoringSide === 'home' ? 'text-[#2BD576]' : 'text-[#F3F6FA]'
                      }`}
                    >
                      {goal.homeShort}
                    </span>
                  </div>

                  <div className="rounded-md bg-[#0B0F14] border border-[#1E2733] px-2.5 py-1 font-score text-xl font-bold tracking-wider text-white tabular-nums">
                    <span className={goal.scoringSide === 'home' ? 'text-[#2BD576]' : ''}>
                      {goal.homeScore}
                    </span>
                    <span className="mx-1 text-[#64748B]">:</span>
                    <span className={goal.scoringSide === 'away' ? 'text-[#2BD576]' : ''}>
                      {goal.awayScore}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`truncate text-xs font-semibold ${
                        goal.scoringSide === 'away' ? 'text-[#2BD576]' : 'text-[#F3F6FA]'
                      }`}
                    >
                      {goal.awayShort}
                    </span>
                    <ClubLogo
                      logoUrl={goal.awayLogo}
                      shortCode={goal.awayShort}
                      name={goal.awayTeamName}
                      size="xs"
                    />
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-[#94A3B8]">
                  <span className="truncate">
                    {goal.scorerName
                      ? `${goal.scorerName}${
                          goal.isPenalty ? ' (Penalti)' : goal.isOwnGoal ? ' (Avtoqol)' : ''
                        }`
                      : `${goal.scoringTeamName} qol vurdu`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      dismissGoalAlert(goal.eventId);
                      handleOpenMatchDrawer(goal.matchId);
                    }}
                    className="shrink-0 font-semibold text-[#2BD576] hover:underline cursor-pointer"
                  >
                    Matça bax →
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Toast Feedback */}
      {bannerToast && (
        <div
          role="status"
          className="fixed bottom-18 left-1/2 z-[80] -translate-x-1/2 sm:left-6 sm:translate-x-0 rounded-lg border border-[#2BD576]/45 bg-[#121821] px-3.5 py-2 text-xs font-medium text-[#F3F6FA] shadow-lg"
        >
          {bannerToast}
        </div>
      )}

      <PortalNavbar
        theme={theme}
        onToggleTheme={onToggleTheme}
        lang={lang}
        onChangeLang={onChangeLang}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        customCouponCount={customLegs.length}
        user={
          firebaseUser
            ? { displayName: firebaseUser.displayName, email: firebaseUser.email }
            : null
        }
        onSignIn={() => void handleSignIn()}
        onSignOut={() => void handleSignOut()}
        onOpenAlerts={() => setAlertsOpen(true)}
        onOpenResponsible={() => setResponsibleOpen(true)}
        onOpenCouponDrawer={() => setCouponDrawerOpen(true)}
        onOpenProAnalytics={onOpenProAnalytics}
      />

      <LiveScoresTicker
        matches={platformMatches}
        loading={matchesLoading}
        recentGoalFlashes={recentGoalFlashes}
        onSelectMatch={(id) => handleOpenMatchDrawer(id)}
      />

      <main>
        <AnimatePresence mode="wait">
          {activeTab === 'match-detail' && activePlatformMatch ? (
            <motion.div
              key={`mc-${activePlatformMatch.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <DeepMatchDetailView
                platformMatch={activePlatformMatch}
                standings={standings}
                onBack={() => setActiveTab('home')}
                onAddCouponLeg={handleAddCouponLeg}
                customCouponLegIds={customCouponLegIds}
                onAskAiAboutMatch={handleAskAiPrompt}
              />
            </motion.div>
          ) : activeTab === 'predictions' ? (
            <motion.div
              key="predictions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ValueBetsHubView
                matches={platformMatches}
                customCouponLegIds={customCouponLegIds}
                onAddCouponLeg={handleAddCouponLeg}
                onSelectMatch={handleOpenMatchCenter}
              />
            </motion.div>
          ) : activeTab === 'coupons' ? (
            <motion.div
              key="coupons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <CouponBankrollView
                smartCoupons={smartCoupons}
                candidateLegs={allMarketCandidateLegs}
                customLegs={customLegs}
                onAddLeg={handleAddCouponLeg}
                onRemoveLeg={(id) => setCustomLegs((prev) => prev.filter((x) => x.id !== id))}
                onReplaceLeg={(oldId, nextLeg) =>
                  setCustomLegs((prev) => prev.map((x) => (x.id === oldId ? nextLeg : x)))
                }
                onLoadCouponIntoBuilder={(legs) => {
                  setCustomLegs(legs);
                  showToast('Real kupon konstruktora yükləndi!');
                }}
                onClearCustomCoupon={() => setCustomLegs([])}
                onSaveCustomCoupon={(title, combinedOdds, combinedProb) => {
                  if (firebaseUser) {
                    void saveUserCouponToFirestore({
                      uid: firebaseUser.uid,
                      couponId: `cp-${Date.now()}`,
                      title,
                      legs: customLegs,
                      combinedOdds,
                      combinedProb,
                    }).catch(() => {});
                  }
                  showToast(`"${title}" yadda saxlandı!`);
                }}
                onAskAiToAuditCoupon={() => handleAskAiPrompt('Bu kuponu yoxla')}
                bets={bankrollBets}
                onAddBet={(bet) => {
                  const created: PersistedBankrollBet = {
                    ...bet,
                    id: `bet-${Date.now()}`,
                    createdAtIso: new Date().toISOString(),
                  };
                  setBankrollBets((prev) => [created, ...prev]);
                  if (firebaseUser) {
                    void saveBankrollBetToFirestore(firebaseUser.uid, created).catch(() => {});
                  }
                  showToast('Bankroll qeydiyyatı əlavə edildi.');
                }}
                onSettleBet={(betId, status) =>
                  setBankrollBets((prev) =>
                    prev.map((b) => (b.id === betId ? { ...b, status } : b))
                  )
                }
              />
            </motion.div>
          ) : activeTab === 'ai-chat' ? (
            <motion.div
              key="ai-chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <PlatformAIChat
                mode="fullpage"
                lang={lang}
                activeCouponLegs={customLegs}
                topMatchLabel={topMatchLabel}
                queuedPrompt={queuedAiPrompt}
                onConsumeQueuedPrompt={() => setQueuedAiPrompt(null)}
              />
            </motion.div>
          ) : activeTab === 'contest' ? (
            <motion.div
              key="contest"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <PredictionContestView
                matches={platformMatches}
                userDisplayName={firebaseUser?.displayName || 'Analitik'}
                isSignedIn={Boolean(firebaseUser)}
                onSignIn={() => void handleSignIn()}
                entries={contestEntries}
                onSavePrediction={(matchId, homeScore, awayScore) => {
                  const entry: PersistedContestEntry = {
                    id: `${matchId}`,
                    matchId,
                    displayName: firebaseUser?.displayName || 'Analitik',
                    homeScore,
                    awayScore,
                    points: 0,
                  };
                  setContestEntries((prev) => ({ ...prev, [matchId]: entry }));
                  if (firebaseUser) {
                    void saveContestPredictionToFirestore(firebaseUser.uid, entry).catch(() => {});
                  }
                  showToast(`Təxmininiz (${homeScore}:${awayScore}) qeydə alındı!`);
                }}
              />
            </motion.div>
          ) : activeTab === 'tipsters' ? (
            <motion.div
              key="tipsters"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TipstersView
                transparency={transparency}
                isSignedIn={Boolean(firebaseUser)}
                onSignIn={() => void handleSignIn()}
                onOpenTransparency={() => {
                  setActiveTab('transparency');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </motion.div>
          ) : activeTab === 'transparency' ? (
            <motion.div
              key="transparency"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TransparencyArchiveView data={transparency} loading={transparencyLoading} />
            </motion.div>
          ) : activeTab === 'premium' ? (
            <motion.div
              key="premium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <PremiumPlansView currentPlan={userPlan} onSelectPlan={setUserPlan} />
            </motion.div>
          ) : activeTab === 'admin' ? (
            <motion.div
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminPanelView
                isAuthenticatedAdmin={isAdminUser}
                userEmail={firebaseUser?.email}
                featureFlags={featureFlags}
                onToggleFeatureFlag={(key) =>
                  setFeatureFlags((prev) =>
                    prev.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f))
                  )
                }
                transparency={transparency}
                totalLiveMatches={platformMatches.length}
                oddsMatchCount={realOddsMatchCount}
                onForceRefreshAll={() => {
                  void refreshPlatformMatches(true, selectedCalendarDate);
                  void fetchSecondaryLiveFeeds(true);
                  showToast('Bütün canlı ESPN və Odds API məlumatları yenilənir...');
                }}
                refreshing={refreshing}
              />
            </motion.div>
          ) : (
            <motion.div
              key="portal-home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              <HeroSection
                featuredMatch={featuredMatch}
                totalMatches={platformMatches.length}
                liveCount={liveCount}
                valueBetCount={valueBetCount}
                sourceLabel={sourceLabel}
                loading={matchesLoading}
                onOpenMatchCenter={(id) => handleOpenMatchCenter(id)}
                onScrollToFixtures={() => {
                  const el = document.getElementById('oyunlar');
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                onAskAiAboutMatch={handleAskAiPrompt}
              />

              {/* Arena.az-Style Full Real Match Center */}
              <ArenaMatchCenter
                matches={platformMatches}
                loading={matchesLoading}
                sourceLabel={sourceLabel}
                selectedCalendarDate={selectedCalendarDate}
                onSelectCalendarDate={setSelectedCalendarDate}
                favoriteTeams={favoriteTeams}
                favoriteLeagues={favoriteLeagues}
                onToggleFavoriteTeam={handleToggleFavoriteTeam}
                onToggleFavoriteLeague={handleToggleFavoriteLeague}
                onSelectMatch={handleOpenMatchDrawer}
                onAddCouponLeg={handleAddCouponLeg}
                customCouponLegIds={customCouponLegIds}
                autoRefreshEnabled={autoRefreshEnabled}
                onToggleAutoRefresh={() => setAutoRefreshEnabled((v) => !v)}
                onManualRefresh={() => void refreshPlatformMatches(true, selectedCalendarDate)}
                refreshing={refreshing}
                showValueBadges={flagEnabled('value_bet_scanner')}
                showSharpDropBadges={flagEnabled('sharp_odds_alerts')}
                recentGoalFlashes={recentGoalFlashes}
                goalSoundEnabled={goalSoundEnabled}
                onToggleGoalSound={() => setGoalSoundEnabled((v) => !v)}
                onOpenHowItWorks={() => setHowItWorksOpen(true)}
              />

              <PitchDivider />

              <LeagueTableSection standings={standings} loading={standingsLoading} />

              <PitchDivider />

              <NewsGridSection articles={newsArticles} loading={newsLoading} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Responsible Gambling Mandatory Footer Strip */}
      <div className="border-t border-[#DCE2EA] dark:border-[#1E2733] bg-[#EEF1F5] dark:bg-[#0E131B] px-4 py-3.5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-xs text-[#475569] dark:text-[#94A3B8]">
          <div className="flex items-center gap-2">
            <span className="rounded-[4px] border border-[#F5A524]/40 bg-[#F5A524]/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#A5620A] dark:text-[#F5A524]">
              18+
            </span>
            <span>
              <strong className="text-[#111827] dark:text-[#F3F6FA]">
                {MANDATORY_DISCLAIMER_AZ}
              </strong>{' '}
              Sayt yalnız statistika təqdim edir, mərc qəbul etmir.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setResponsibleOpen(true)}
            className="font-semibold text-[#168A4A] dark:text-[#2BD576] hover:underline cursor-pointer"
          >
            Məsuliyyətli Oyun & Yardım →
          </button>
        </div>
      </div>

      <NewsletterFooter
        customCursorEnabled={customCursorEnabled}
        onToggleCursor={() => setCustomCursorEnabled((prev) => !prev)}
        onNavigateSection={(sectionId) => {
          setActiveTab('home');
          window.setTimeout(() => {
            document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
        onOpenMatchCenter={() => handleOpenMatchCenter()}
      />

      {/* Persistent Floating AI Chat Assistant */}
      {activeTab !== 'ai-chat' && flagEnabled('ai_chat_assistant') && (
        <PlatformAIChat
          mode="floating"
          lang={lang}
          activeCouponLegs={customLegs}
          topMatchLabel={topMatchLabel}
          isOpen={floatingChatOpen}
          onToggleOpen={setFloatingChatOpen}
          onExpandFullPage={() => {
            setFloatingChatOpen(false);
            setActiveTab('ai-chat');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          queuedPrompt={queuedAiPrompt}
          onConsumeQueuedPrompt={() => setQueuedAiPrompt(null)}
        />
      )}
      {/* Offline Connectivity Indicator (PWA) */}
      <OfflineIndicator label="Oflayn rejim — keşlənmiş məlumatlar göstərilir." />
    </div>
  );
};
