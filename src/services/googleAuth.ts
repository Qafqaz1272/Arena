import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

/**
 * Minimal user-authenticated Google Chat scopes configured via OAuth setup.
 * Keep in sync with OAuth brand scopes for this project.
 */
export const GOOGLE_CHAT_SCOPES = [
  'https://www.googleapis.com/auth/chat.spaces',
  'https://www.googleapis.com/auth/chat.messages',
  'https://www.googleapis.com/auth/chat.memberships.readonly',
] as const;

export const GOOGLE_CHAT_PROJECT_ID: string = firebaseConfig.projectId;

export const GOOGLE_CHAT_CONSOLE_CONFIG_URL = `https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat?project=${encodeURIComponent(
  firebaseConfig.projectId
)}`;

let firebaseApp: FirebaseApp | null = null;
let authInstance: Auth | null = null;

/**
 * In-memory OAuth access token cache ONLY.
 * Never persisted to localStorage or sessionStorage.
 */
let cachedAccessToken: string | null = null;

function ensureAuth(): Auth {
  if (authInstance) return authInstance;
  firebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  authInstance = getAuth(firebaseApp);
  return authInstance;
}

export interface AuthSessionState {
  user: User | null;
  accessToken: string | null;
}

export function initGoogleAuth(
  onChange: (state: AuthSessionState) => void
): () => void {
  const auth = ensureAuth();
  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      cachedAccessToken = null;
    }
    onChange({
      user,
      accessToken: user ? cachedAccessToken : null,
    });
  });
}

export function getGoogleAccessToken(): string | null {
  return cachedAccessToken;
}

export function clearGoogleAccessToken(): void {
  cachedAccessToken = null;
}

export function getCurrentGoogleUser(): User | null {
  return ensureAuth().currentUser;
}

export async function signInWithGoogleChat(
  forceConsent: boolean = false
): Promise<AuthSessionState> {
  const auth = ensureAuth();
  const provider = new GoogleAuthProvider();
  for (const scope of GOOGLE_CHAT_SCOPES) {
    provider.addScope(scope);
  }
  provider.setCustomParameters({
    prompt: forceConsent ? 'consent select_account' : 'select_account',
  });

  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken ?? null;
  cachedAccessToken = token;

  return {
    user: result.user,
    accessToken: token,
  };
}

export async function signOutGoogleChat(): Promise<void> {
  cachedAccessToken = null;
  const auth = ensureAuth();
  await signOut(auth);
}
