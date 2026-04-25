/**
 * PU-ALRMS Firebase Configuration
 * ────────────────────────────────
 * Initializes Firebase App + Auth.
 * Config read from env vars set by setup-firebase.ps1.
 * When vars are empty → isConfigured() returns false → app uses fallback auth.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

let _configured: boolean | null = null;
let _app: ReturnType<typeof initializeApp> | null = null;
let _auth: ReturnType<typeof getAuth> | null = null;

function isFirebaseConfigured(): boolean {
  if (_configured !== null) return _configured;
  _configured = !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
  return _configured;
}

function getAppInstance() {
  if (!_app) _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  return _app;
}

function getAuthInstance() {
  if (!_auth) _auth = getAuth(getAppInstance());
  return _auth;
}

function createGoogleProvider() {
  const p = new GoogleAuthProvider();
  p.addScope('email');
  p.addScope('profile');
  p.setCustomParameters({ prompt: 'select_account' });
  return p;
}

export const firebase = {
  isConfigured: isFirebaseConfigured,

  signInWithGoogle: async (): Promise<FirebaseUser> => {
    const result = await signInWithPopup(getAuthInstance(), createGoogleProvider());
    return result.user;
  },

  signOut: async () => {
    await firebaseSignOut(getAuthInstance());
  },

  getIdToken: (user: FirebaseUser, forceRefresh = false): Promise<string> => {
    return user.getIdToken(forceRefresh);
  },

  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(getAuthInstance(), callback);
  },
};

export type { FirebaseUser };
export default firebase;
