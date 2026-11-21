import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import type { CouponLeg } from '../utils/bettingInsightsEngine';

export interface AlertPreferences {
  push: boolean;
  email: boolean;
  telegram: boolean;
  lineupConfirmed: boolean;
  valueBetFound: boolean;
  followedGoal: boolean;
}

export interface UserProfileRecord {
  uid: string;
  displayName: string;
  email?: string;
  language: 'az' | 'en' | 'ru';
  theme: 'dark' | 'light';
  plan: 'free' | 'pro';
  favoriteTeams: string[];
  favoriteLeagues: string[];
  alertPrefs: AlertPreferences;
}

export interface PersistedBankrollBet {
  id: string;
  matchLabel: string;
  selection: string;
  stake: number;
  odds: number;
  status: 'pending' | 'won' | 'lost' | 'void';
  createdAtIso: string;
}

export interface PersistedContestEntry {
  id: string;
  matchId: string;
  displayName: string;
  homeScore: number;
  awayScore: number;
  points: number;
}

export const DEFAULT_ALERT_PREFS: AlertPreferences = {
  push: true,
  email: false,
  telegram: true,
  lineupConfirmed: true,
  valueBetFound: true,
  followedGoal: true,
};

export function subscribeAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle(): Promise<User> {
  const res = await signInWithPopup(auth, googleProvider);
  return res.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export async function checkIsAdminUser(uid: string): Promise<boolean> {
  const path = `admins/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function loadOrCreateUserProfile(
  user: User,
  defaults: {
    language: 'az' | 'en' | 'ru';
    theme: 'dark' | 'light';
    favoriteTeams: string[];
    favoriteLeagues: string[];
    alertPrefs: AlertPreferences;
  }
): Promise<UserProfileRecord> {
  const path = `users/${user.uid}`;
  try {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as Partial<UserProfileRecord>;
      return {
        uid: user.uid,
        displayName: (data.displayName || user.displayName || 'İstifadəçi').slice(0, 80),
        email: data.email || user.email || undefined,
        language: data.language === 'en' || data.language === 'ru' ? data.language : 'az',
        theme: data.theme === 'light' ? 'light' : 'dark',
        plan: data.plan === 'pro' ? 'pro' : 'free',
        favoriteTeams: Array.isArray(data.favoriteTeams) ? data.favoriteTeams.slice(0, 20) : [],
        favoriteLeagues: Array.isArray(data.favoriteLeagues) ? data.favoriteLeagues.slice(0, 10) : [],
        alertPrefs: { ...DEFAULT_ALERT_PREFS, ...(data.alertPrefs ?? {}) },
      };
    }

    const payload = {
      uid: user.uid,
      displayName: (user.displayName || 'ARENA İstifadəçisi').slice(0, 80),
      ...(user.email ? { email: user.email.slice(0, 160) } : {}),
      language: defaults.language,
      theme: defaults.theme,
      plan: 'free' as const,
      favoriteTeams: defaults.favoriteTeams.slice(0, 20),
      favoriteLeagues: defaults.favoriteLeagues.slice(0, 10),
      alertPrefs: defaults.alertPrefs,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, payload);
    return {
      uid: user.uid,
      displayName: payload.displayName,
      email: payload.email,
      language: payload.language,
      theme: payload.theme,
      plan: 'free',
      favoriteTeams: payload.favoriteTeams,
      favoriteLeagues: payload.favoriteLeagues,
      alertPrefs: payload.alertPrefs,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserPreferences(
  uid: string,
  patch: Partial<
    Pick<
      UserProfileRecord,
      'displayName' | 'language' | 'theme' | 'favoriteTeams' | 'favoriteLeagues' | 'alertPrefs'
    >
  >
): Promise<void> {
  const path = `users/${uid}`;
  try {
    const clean: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (patch.displayName) clean.displayName = patch.displayName.slice(0, 80);
    if (patch.language) clean.language = patch.language;
    if (patch.theme) clean.theme = patch.theme;
    if (patch.favoriteTeams) clean.favoriteTeams = patch.favoriteTeams.slice(0, 20);
    if (patch.favoriteLeagues) clean.favoriteLeagues = patch.favoriteLeagues.slice(0, 10);
    if (patch.alertPrefs) clean.alertPrefs = patch.alertPrefs;
    await updateDoc(doc(db, 'users', uid), clean);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveUserCouponToFirestore(params: {
  uid: string;
  couponId: string;
  title: string;
  legs: CouponLeg[];
  combinedOdds: number;
  combinedProb: number;
}): Promise<void> {
  const safeId = params.couponId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80) || `cp-${Date.now()}`;
  const path = `coupons/${safeId}`;
  try {
    await setDoc(doc(db, 'coupons', safeId), {
      ownerId: params.uid,
      title: params.title.slice(0, 100),
      legs: params.legs.slice(0, 12),
      combinedOdds: Math.max(1.01, Math.min(10000, params.combinedOdds)),
      combinedProb: Math.max(0, Math.min(100, params.combinedProb)),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function saveBankrollBetToFirestore(
  uid: string,
  bet: PersistedBankrollBet
): Promise<void> {
  const safeId = bet.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80) || `bet-${Date.now()}`;
  const path = `bankrollBets/${safeId}`;
  try {
    await setDoc(doc(db, 'bankrollBets', safeId), {
      ownerId: uid,
      matchLabel: bet.matchLabel.slice(0, 120),
      selection: bet.selection.slice(0, 80),
      stake: Math.max(0.5, Math.min(1000000, bet.stake)),
      odds: Math.max(1.01, Math.min(1000, bet.odds)),
      status: bet.status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function loadUserBankrollBets(uid: string): Promise<PersistedBankrollBet[]> {
  const path = 'bankrollBets';
  try {
    const q = query(collection(db, path), where('ownerId', '==', uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        matchLabel: String(data.matchLabel ?? ''),
        selection: String(data.selection ?? ''),
        stake: Number(data.stake ?? 0),
        odds: Number(data.odds ?? 1.5),
        status: (data.status as PersistedBankrollBet['status']) ?? 'pending',
        createdAtIso: new Date().toISOString(),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveContestPredictionToFirestore(
  uid: string,
  entry: PersistedContestEntry
): Promise<void> {
  const safeId = `${uid.slice(0, 24)}_${entry.matchId}`.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
  const path = `contestPredictions/${safeId}`;
  try {
    await setDoc(doc(db, 'contestPredictions', safeId), {
      ownerId: uid,
      displayName: entry.displayName.slice(0, 80),
      matchId: entry.matchId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80),
      homeScore: Math.max(0, Math.min(20, Math.round(entry.homeScore))),
      awayScore: Math.max(0, Math.min(20, Math.round(entry.awayScore))),
      points: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function loadUserContestPredictions(
  uid: string
): Promise<Record<string, PersistedContestEntry>> {
  const path = 'contestPredictions';
  try {
    const q = query(collection(db, path), where('ownerId', '==', uid));
    const snap = await getDocs(q);
    const map: Record<string, PersistedContestEntry> = {};
    snap.docs.forEach((d) => {
      const data = d.data();
      const matchId = String(data.matchId ?? '');
      if (!matchId) return;
      map[matchId] = {
        id: d.id,
        matchId,
        displayName: String(data.displayName ?? 'Analitik'),
        homeScore: Number(data.homeScore ?? 0),
        awayScore: Number(data.awayScore ?? 0),
        points: Number(data.points ?? 0),
      };
    });
    return map;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function toggleTipsterFollowInFirestore(
  uid: string,
  tipsterId: string,
  shouldFollow: boolean
): Promise<void> {
  const safeId = `${uid.slice(0, 24)}_${tipsterId}`.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
  const path = `tipsterFollows/${safeId}`;
  try {
    if (shouldFollow) {
      await setDoc(doc(db, 'tipsterFollows', safeId), {
        ownerId: uid,
        tipsterId: tipsterId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80),
        createdAt: serverTimestamp(),
      });
    } else {
      await deleteDoc(doc(db, 'tipsterFollows', safeId));
    }
  } catch (error) {
    handleFirestoreError(error, shouldFollow ? OperationType.CREATE : OperationType.DELETE, path);
  }
}
