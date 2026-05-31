'use client';

/**
 * Global Error Boundary for Next.js App Router
 *
 * Catches unhandled errors at the layout level.
 * This is the LAST resort error handler — when everything else fails,
 * this component renders instead of the default Next.js error page.
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0a0d14 0%, #0d1117 40%, #111827 100%)' }}>
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl overflow-hidden border border-white/10" style={{ boxShadow: '0 8px 32px rgba(16,185,129,0.1)' }}>
              <img src="/logo.png" alt="PU-ALRMS" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Application Error</h1>
            <p className="text-sm text-slate-400 mb-2">
              {error.message || 'An unexpected error occurred.'}
            </p>
            {error.digest && (
              <p className="text-xs text-slate-500 mb-4">Error ID: {error.digest}</p>
            )}
            <p className="text-xs text-slate-500 mb-6">
              Please try again. If the problem persists, clear your browser cookies and cache.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={reset}
                className="px-6 py-2.5 text-white text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)', boxShadow: '0 4px 16px rgba(236,72,153,0.25)' }}
              >
                Try Again
              </button>
              <button
                onClick={() => { window.location.href = '/'; }}
                className="px-6 py-2.5 text-white text-sm font-medium rounded-xl border border-white/10 hover:bg-white/5 transition-all duration-200"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
