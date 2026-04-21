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
  const [error, setError] = useState<Error | null>(null);

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

  // isAuthenticated is reactive — when login calls setAuth(), this re-renders
  // and switches from AuthPage to AppLayout automatically.
  return isAuthenticated ? <AppLayout /> : <AuthPage />;
}
