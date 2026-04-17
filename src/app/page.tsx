'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/app';
import AuthPage from '@/components/pages/AuthPage';
import AppLayout from '@/components/layout/AppLayout';

// ─── Loading Screen ──────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/20">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          {/* Outer glow pulse */}
          <div className="absolute -inset-3 rounded-3xl bg-emerald-400/20 dark:bg-emerald-500/10 blur-xl animate-pulse" />
          {/* Logo */}
          <div
            className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-xl shadow-emerald-200/60 dark:shadow-emerald-900/40 border-2 border-white/60 dark:border-gray-700/60 animate-spin"
            style={{ animationDuration: '3s' }}
          >
            <img src="/logo.png" alt="PU-ALRMS" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">PU-ALRMS</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Loading your experience...</p>
        </div>
      </div>
    </div>
  );
}

// ─── Error Fallback ───────────────────────────────────────
function ErrorFallback({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/20 p-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={onRetry}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  // Use getState() to read hydration state without triggering React tracking
  // This avoids the "set-state-in-effect" lint warning from React Compiler
  const mounted = useAppStore((s) => s.mounted);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Hydrate auth state from localStorage — called once on mount
  // The store's hydrate() has its own try/catch and always sets mounted=true
  useEffect(() => {
    useAppStore.getState().hydrate();
  }, []);

  // Set ready state after mount — use rAF with a fallback timeout
  // This prevents the loading screen from getting stuck in background tabs
  // where requestAnimationFrame is throttled/paused
  useEffect(() => {
    if (!mounted) return;

    let cancelled = false;
    // Primary: use rAF for smooth transition
    const rafId = requestAnimationFrame(() => {
      if (!cancelled) setReady(true);
    });
    // Fallback: if rAF doesn't fire within 150ms (background tab), force ready
    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        cancelAnimationFrame(rafId);
        setReady(true);
      }
    }, 150);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, [mounted]);

  // Global error handler — catch any unhandled rendering errors
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      event.preventDefault();
      setError(new Error(event.message || 'An unexpected error occurred'));
    };
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      // Only catch unhandled promise rejections that are auth/network related
      const msg = event.reason?.message || String(event.reason);
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('localStorage')) {
        event.preventDefault();
        setError(new Error(msg));
      }
    };
    window.addEventListener('error', handler);
    window.addEventListener('unhandledrejection', rejectionHandler);
    return () => {
      window.removeEventListener('error', handler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []);

  // Retry handler — clear error and reload
  const handleRetry = useCallback(() => {
    setError(null);
    setReady(false);
    window.location.reload();
  }, []);

  // If there's an error, show the error fallback
  if (error) {
    return <ErrorFallback error={error} onRetry={handleRetry} />;
  }

  // suppressHydrationWarning on wrapper prevents browser extension
  // injected DOM (e.g. donate-widget) from causing hydration mismatch
  const content = !ready ? (
    <LoadingScreen />
  ) : !isAuthenticated ? (
    <AuthPage />
  ) : (
    <AppLayout />
  );

  return <div suppressHydrationWarning>{content}</div>;
}
