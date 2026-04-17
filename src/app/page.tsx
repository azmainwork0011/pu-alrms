'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/app';
import AuthPage from '@/components/pages/AuthPage';
import AppLayout from '@/components/layout/AppLayout';

// ─── Static Loading Shell ──────────────────────────────
// This renders IDENTICAL HTML on server and client.
// No animations, no dynamic classes, no browser APIs.
// The real UI is swapped in only after client-side mount.
function LoadingShell() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="flex flex-col items-center gap-5">
        <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-xl border-2 border-white/60">
          <img src="/logo.png" alt="PU-ALRMS" className="w-full h-full object-cover" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900">PU-ALRMS</h2>
          <p className="text-sm text-gray-500 mt-1">Loading your experience...</p>
        </div>
      </div>
    </div>
  );
}

// ─── Error Fallback ───────────────────────────────────────
function ErrorFallback({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-500 mb-4">
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
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ── Mount gate: client-only after this point ──
  useEffect(() => {
    // Hydrate auth state from localStorage (has its own try/catch)
    useAppStore.getState().hydrate();
    setMounted(true);
  }, []);

  // ── Global error handler ──
  useEffect(() => {
    if (!mounted) return;

    const handler = (event: ErrorEvent) => {
      event.preventDefault();
      setError(new Error(event.message || 'An unexpected error occurred'));
    };
    const rejectionHandler = (event: PromiseRejectionEvent) => {
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
  }, [mounted]);

  const handleRetry = useCallback(() => {
    setError(null);
    window.location.reload();
  }, []);

  // ── Server + pre-mount client: render identical static shell ──
  if (!mounted) {
    return <LoadingShell />;
  }

  // ── Client-only after mount: read store and render real UI ──
  if (error) {
    return <ErrorFallback error={error} onRetry={handleRetry} />;
  }

  const isAuthenticated = useAppStore.getState().isAuthenticated;
  return isAuthenticated ? <AppLayout /> : <AuthPage />;
}
