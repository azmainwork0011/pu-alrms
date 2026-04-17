'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/store/app';

// ─── Client-only page imports (no SSR → no hydration) ──────
const AuthPage = dynamic(() => import('@/components/pages/AuthPage'), { ssr: false });
const AppLayout = dynamic(() => import('@/components/layout/AppLayout'), { ssr: false });

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
    // Mark document as hydrated (hides CSS-only loading overlay)
    document.documentElement.classList.add('hydrated');

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

  // ── Server + pre-mount client: render NOTHING ──
  // Both server and client output identical empty content.
  // The CSS-only loading overlay (on <html> pseudo-elements) provides
  // visual feedback during this brief period.
  // No browser extension can cause a mismatch because there is no
  // server-rendered markup to conflict with.
  if (!mounted) return null;

  // ── Client-only after mount: render real UI ──
  // These are loaded with ssr: false, so they render client-side only.
  // No hydration occurs for these components.
  if (error) {
    return <ErrorFallback error={error} onRetry={handleRetry} />;
  }

  const isAuthenticated = useAppStore.getState().isAuthenticated;
  return isAuthenticated ? <AppLayout /> : <AuthPage />;
}
