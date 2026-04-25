'use client';

/**
 * Firebase Auth Provider
 * ──────────────────────
 * When Firebase configured: listens to auth state, exchanges ID tokens
 * for PU-ALRMS JWT, syncs with Zustand store.
 * When NOT configured: does nothing — app falls back to manual auth.
 *
 * All firebase SDK imports are fully dynamic to avoid SSR crashes
 * and Turbopack chunk loading issues.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/app';
import { toast } from 'sonner';

interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
}

interface FirebaseContextValue {
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isFirebaseReady: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutFirebase: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue>({
  firebaseUser: null,
  isLoading: false,
  isFirebaseReady: false,
  signInWithGoogle: async () => {},
  signOutFirebase: async () => {},
});

export function useFirebase() {
  return useContext(FirebaseContext);
}

// Store loaded firebase functions outside React state (survive re-renders)
let fbSignInWithGoogle: (() => Promise<FirebaseUser>) | null = null;
let fbSignOut: (() => Promise<void>) | null = null;
let fbGetIdToken: ((user: FirebaseUser, forceRefresh?: boolean) => Promise<string>) | null = null;
let fbOnAuthStateChanged: ((cb: (user: FirebaseUser | null) => void) => () => void) | null = null;
let fbIsConfigured = false;
let fbModuleLoaded = false;

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const initRef = useRef(false);

  const { setAuth, logout } = useAppStore();

  // Dynamic import (SSR-safe) — loads Firebase SDK entirely on client side
  useEffect(() => {
    if (initRef.current || fbModuleLoaded) return;
    initRef.current = true;

    // Check env vars BEFORE importing heavy SDK
    const hasConfig = !!(
      typeof window !== 'undefined' &&
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    );

    if (!hasConfig) {
      fbIsConfigured = false;
      setIsFirebaseReady(false);
      return;
    }

    // 15s timeout protection for SDK loading
    const loadTimeout = setTimeout(() => {
      console.warn('[Firebase] SDK load timed out');
      setIsFirebaseReady(false);
    }, 15000);

    Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
    ])
      .then(([appMod, authMod]) => {
        clearTimeout(loadTimeout);

        const { initializeApp, getApps, getApp } = appMod;
        const { getAuth, GoogleAuthProvider, signInWithPopup, signOut: fbSignOutFn, onAuthStateChanged: fbOnAuth } = authMod;

        const firebaseConfig = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
        };

        if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
          fbIsConfigured = false;
          return;
        }

        const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        const auth = getAuth(firebaseApp);

        const provider = new GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        provider.setCustomParameters({ prompt: 'select_account' });

        fbSignInWithGoogle = () => signInWithPopup(auth, provider).then(r => r.user);
        fbSignOut = () => fbSignOutFn(auth);
        fbGetIdToken = (user: FirebaseUser, force?: boolean) => user.getIdToken(force);
        fbOnAuthStateChanged = (cb) => fbOnAuth(auth, cb);
        fbIsConfigured = true;
        fbModuleLoaded = true;

        setIsFirebaseReady(true);
        console.log('[Firebase] Ready');
      })
      .catch((err) => {
        clearTimeout(loadTimeout);
        console.warn('[Firebase] SDK load failed:', err?.message);
        fbIsConfigured = false;
        setIsFirebaseReady(false);
      });
  }, []);

  // Listen to auth state
  useEffect(() => {
    if (!fbOnAuthStateChanged || !fbIsConfigured || !isFirebaseReady) return;
    setIsLoading(true);
    const unsub = fbOnAuthStateChanged(async (user: FirebaseUser | null) => {
      setFirebaseUser(user);
      setIsLoading(false);
      if (user && fbGetIdToken) {
        try {
          const idToken = await fbGetIdToken(user);
          const res = await fetch('/api/auth/firebase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const result = await res.json();
          setAuth(result.user, result.token);
          toast.success(result.isNewUser ? `Welcome to PU-ALRMS, ${result.user.name}!` : `Welcome back, ${result.user.name}!`);
        } catch (err: any) {
          console.error('[Firebase] Token exchange failed:', err?.message);
          toast.error('Firebase sign-in failed. Please try again.');
        }
      }
    });
    return () => { try { unsub(); } catch {} };
  }, [isFirebaseReady, setAuth]);

  const signInWithGoogle = useCallback(async () => {
    if (!fbSignInWithGoogle || !fbIsConfigured) {
      toast.error('Firebase not configured. Run setup-firebase.ps1.');
      return;
    }
    setIsLoading(true);
    try {
      await fbSignInWithGoogle();
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') return;
      if (err?.code === 'auth/unauthorized-domain') {
        toast.error('Domain not authorized. Add it in Firebase Console.');
        return;
      }
      toast.error(`Google sign-in failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOutFirebase = useCallback(async () => {
    if (fbSignOut) { try { await fbSignOut(); } catch {} }
    logout();
    toast.success('Signed out');
  }, [logout]);

  return (
    <FirebaseContext.Provider value={{ firebaseUser, isLoading, isFirebaseReady, signInWithGoogle, signOutFirebase }}>
      {children}
    </FirebaseContext.Provider>
  );
}
