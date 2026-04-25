'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/store/app';

// ─── Client-only page imports (no SSR → no hydration) ──────
const AuthPage = dynamic(() => import('@/components/pages/AuthPage'), { ssr: false });
const AppLayout = dynamic(() => import('@/components/layout/AppLayout'), { ssr: false });
const FirebaseGuidePage = dynamic(() => import('@/components/pages/FirebaseGuidePage'), { ssr: false });

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
        <p className="text-sm text-slate-400 mb-5">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={onRetry}
          className="px-6 py-2.5 text-white text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)', boxShadow: '0 4px 16px rgba(236,72,153,0.25)' }}
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [error, setError] = useState<Error | null>(null);
  const [showGuide, setShowGuide] = useState(true);

  // Subscribe to auth state — MUST be before any conditional returns (React hooks rule)
  // Zustand's mounted flag is set to true by hydrate() on the client side.
  // During SSR, it stays false (default), so we render null → no hydration mismatch.
  const mounted = useAppStore((state) => state.mounted);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  // ── Client mount: hydrate auth state from localStorage ──
  useEffect(() => {
    // Mark document as hydrated (hides CSS-only loading overlay)
    document.documentElement.classList.add('hydrated');

    // Remove the script-injected loading overlay DOM after fade-out transition
    const overlayEl = document.getElementById('pu-loading-overlay');
    if (overlayEl) {
      setTimeout(() => {
        try { overlayEl.remove(); } catch {}
      }, 600);
    }

    // Hydrate auth state from localStorage — this sets store.mounted = true
    useAppStore.getState().hydrate();
  }, []);

  // ── Global error handler — only catches truly unexpected errors ──
  useEffect(() => {
    if (!mounted) return;

    const handler = (event: ErrorEvent) => {
      // Ignore errors from login/auth — AuthPage handles these with inline error display
      const msg = event.message || '';
      if (
        msg.includes('Internal server error') ||
        msg.includes('Login failed') ||
        msg.includes('Authentication') ||
        msg.includes('Invalid email') ||
        msg.includes('Network') ||
        msg.includes('fetch') ||
        msg.includes('localStorage') ||
        msg.includes('timeout') ||
        msg.includes('AbortError')
      ) {
        return; // Let the component handle these
      }
      event.preventDefault();
      setError(new Error(msg || 'An unexpected error occurred'));
    };
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      const msg = event.reason?.message || String(event.reason);
      // Only show ErrorFallback for truly unexpected promise rejections
      // Auth/network errors are handled by apiFetch and component error handlers
      if (
        msg.includes('Failed to fetch') ||
        msg.includes('NetworkError') ||
        msg.includes('localStorage') ||
        msg.includes('Internal server error') ||
        msg.includes('Login failed') ||
        msg.includes('Invalid email') ||
        msg.includes('timeout') ||
        msg.includes('HTTP 4') ||
        msg.includes('HTTP 5')
      ) {
        return; // Expected — handled elsewhere
      }
      event.preventDefault();
      setError(new Error(msg));
    };
    window.addEventListener('error', handler);
    window.addEventListener('unhandledrejection', rejectionHandler);
    return () => {
      window.removeEventListener('error', handler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, [mounted]);

  const handleRetry = useCallback(() => {
    setError(null);
    window.location.reload();
  }, []);

  // ── Server + pre-mount client: render NOTHING ──
  // mounted starts as false. hydrate() sets it to true on first client render.
  // The CSS-only loading overlay provides visual feedback during this brief period.
  if (!mounted) return null;

  // ── Client-only after mount: render real UI ──
  if (error) {
    return <ErrorFallback error={error} onRetry={handleRetry} />;
  }

  // If authenticated, show app layout (guide is not needed)
  if (isAuthenticated) {
    return <AppLayout />;
  }

  // Not authenticated: show Firebase Guide (with option to go back to login)
  return (
    <div className="relative">
      {/* Floating button to toggle between guide and login */}
      <button
        onClick={() => setShowGuide(!showGuide)}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium
          bg-card/90 border border-border backdrop-blur-md shadow-lg
          hover:bg-accent hover:text-accent-foreground transition-all duration-200
          hover:scale-105 active:scale-95"
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
      >
        {showGuide ? (
          <>
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Login
          </>
        ) : (
          <>
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              <line x1="8" y1="7" x2="16" y2="7"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
            Firebase Guide
          </>
        )}
      </button>

      {showGuide ? <FirebaseGuidePage /> : <AuthPage />}
    </div>
  );
}
