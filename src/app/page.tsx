'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSession, signOut } from 'next-auth/react';
import { useAppStore, type User } from '@/store/app';

// ─── Client-only page imports (no SSR → no hydration) ──────
const AuthPage = dynamic(() => import('@/components/pages/AuthPage'), { ssr: false });
const AppLayout = dynamic(() => import('@/components/layout/AppLayout'), { ssr: false });

// ─── Error Fallback ───────────────────────────────────────
function ErrorFallback({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0a0d14 0%, #0d1117 40%, #111827 100%)' }}>
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-sm text-slate-400 mb-5">{error.message}</p>
        <button onClick={onRetry} className="px-6 py-2.5 text-white text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105 active:scale-95" style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)', boxShadow: '0 4px 16px rgba(236,72,153,0.25)' }}>Retry</button>
      </div>
    </div>
  );
}

function OAuthProcessing() {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 15_000);
    return () => clearTimeout(timer);
  }, []);

  if (timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0a0d14 0%, #0d1117 40%, #111827 100%)' }}>
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Sign-in is taking too long</h2>
          <p className="text-sm text-slate-400 mb-5">This might be a network issue.</p>
          <button
            onClick={() => { window.location.href = '/'; }}
            className="px-6 py-2.5 text-white text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)', boxShadow: '0 4px 16px rgba(236,72,153,0.25)' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0d14 0%, #0d1117 40%, #111827 100%)' }}>
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full border-2 border-white/5" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-500 animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-teal-400 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
        </div>
        <p className="text-white/80 text-sm font-medium mb-1">Completing sign in...</p>
        <p className="text-white/40 text-xs">Please wait while we set up your account</p>
      </div>
    </div>
  );
}

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  Configuration: 'Google sign-in is not configured. Please contact the administrator.',
  Callback: 'Authentication was interrupted. Please try again.',
  CreateAccount: 'Failed to create your account. Please try again.',
  AccountNotLinked: 'An account with this email already exists. Please sign in with your password first.',
  NoEmail: 'Google account has no email. Please use a different Google account.',
  AccessDenied: 'Sign-in was cancelled.',
 DATABASE_UNAVAILABLE: 'Database is not configured. Please contact the administrator.',
  Default: 'Authentication failed. Please try again.',
};

function getInitialOAuthError(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const errorParam = params.get('error');
  if (errorParam) {
    window.history.replaceState({}, '', '/');
    return OAUTH_ERROR_MESSAGES[errorParam] || OAUTH_ERROR_MESSAGES.Default;
  }
  return null;
}

export default function Home() {
  const [error, setError] = useState<Error | null>(null);
  const [oauthError] = useState<string | null>(getInitialOAuthError);
  const [bridgeDone, setBridgeDone] = useState(false);
  const [bridgeFailed, setBridgeFailed] = useState<string | null>(null);

  const mounted = useAppStore((state) => state.mounted);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const setAuth = useAppStore((state) => state.setAuth);

  const { data: nextAuthSession, status: nextAuthStatus } = useSession();

  // ── Auth bridge effect ──
  // On first render where NextAuth is authenticated and has our JWT,
  // bridge the session into Zustand. The state flags (bridgeDone/bridgeFailed)
  // are only set via async callbacks (.then()), never synchronously.
  useEffect(() => {
    if (bridgeDone || bridgeFailed) return;
    if (nextAuthStatus !== 'authenticated') return;
    if (!nextAuthSession?.customJwt) return;
    const jwt = nextAuthSession.customJwt;

    const sessionError = (nextAuthSession as unknown as Record<string, unknown>)?.error;
    if (sessionError === 'ACCOUNT_BANNED') {
      signOut({ redirect: false }).catch(() => {}).finally(() => {
        setBridgeFailed('Your account has been banned. Contact support.');
      });
      return;
    }
    if (sessionError === 'ACCOUNT_SUSPENDED') {
      signOut({ redirect: false }).catch(() => {}).finally(() => {
        setBridgeFailed('Your account is suspended. Contact an administrator.');
      });
      return;
    }
    if (sessionError === 'DATABASE_UNAVAILABLE') {
      signOut({ redirect: false }).catch(() => {}).finally(() => {
        setBridgeFailed('Database is not configured. Please contact the administrator.');
      });
      return;
    }

    const user: User = {
      id: nextAuthSession.userId || '',
      name: nextAuthSession.user?.name || '',
      email: nextAuthSession.user?.email || '',
      role: (nextAuthSession.role || 'STUDENT') as User['role'],
      avatar: nextAuthSession.avatar || nextAuthSession.user?.image || undefined,
      verified: false,
    };

    // Use microtask to defer state updates outside the synchronous effect body
    Promise.resolve().then(() => {
      setAuth(user, jwt);
      setBridgeDone(true);
    });
  }, [nextAuthStatus, nextAuthSession, setAuth, bridgeDone, bridgeFailed]);

  // ── Hydrate on mount ──
  useEffect(() => {
    document.documentElement.classList.add('hydrated');
    const overlayEl = document.getElementById('pu-loading-overlay');
    if (overlayEl) {
      setTimeout(() => { try { overlayEl.remove(); } catch {} }, 600);
    }
    useAppStore.getState().hydrate();
  }, []);

  // ── Global error handler ──
  useEffect(() => {
    if (!mounted) return;
    const handler = (event: ErrorEvent) => {
      const msg = event.message || '';
      if (msg.includes('fetch') || msg.includes('Network') || msg.includes('localStorage') || msg.includes('timeout') || msg.includes('AbortError') || msg.includes('Authentication') || msg.includes('Login')) return;
      event.preventDefault();
      setError(new Error(msg || 'An unexpected error occurred'));
    };
    const rejHandler = (event: PromiseRejectionEvent) => {
      const msg = event.reason?.message || String(event.reason);
      if (msg.includes('fetch') || msg.includes('Network') || msg.includes('localStorage') || msg.includes('HTTP 4') || msg.includes('HTTP 5')) return;
      event.preventDefault();
      setError(new Error(msg));
    };
    window.addEventListener('error', handler);
    window.addEventListener('unhandledrejection', rejHandler);
    return () => { window.removeEventListener('error', handler); window.removeEventListener('unhandledrejection', rejHandler); };
  }, [mounted]);

  // ── Render logic ──
  if (!mounted) return <div className="min-h-screen" />;
  if (bridgeFailed) return <ErrorFallback error={new Error(bridgeFailed)} onRetry={() => { setError(null); setBridgeFailed(null); window.location.href = '/'; }} />;
  if (error) return <ErrorFallback error={error} onRetry={() => { setError(null); window.location.reload(); }} />;
  // Only show OAuthProcessing briefly — if NextAuth authenticated but bridge
  // didn't complete in time, check for customJwt absence and reset
  if (nextAuthStatus === 'authenticated' && !nextAuthSession?.customJwt && !bridgeFailed) {
    // NextAuth authenticated but has no customJwt (JWT callback may have failed)
    // Clear the NextAuth session and show login page
    signOut({ redirect: false }).catch(() => {});
  }
  if (nextAuthStatus === 'loading' || (!bridgeDone && nextAuthStatus === 'authenticated' && nextAuthSession?.customJwt)) return <OAuthProcessing />;
  if (isAuthenticated) return <AppLayout />;
  return <AuthPage oauthError={oauthError} />;
}
