'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app';
import AuthPage from '@/components/pages/AuthPage';
import AppLayout from '@/components/layout/AppLayout';

export default function Home() {
  const { mounted, isAuthenticated, hydrate } = useAppStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Delay ready state slightly to let client-side hydration settle
  useEffect(() => {
    if (mounted) {
      const t = requestAnimationFrame(() => setReady(true));
      return () => cancelAnimationFrame(t);
    }
  }, [mounted]);

  // suppressHydrationWarning on wrapper prevents browser extension
  // injected DOM (e.g. donate-widget) from causing hydration mismatch
  const content = !ready ? (
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
  ) : !isAuthenticated ? (
    <AuthPage />
  ) : (
    <AppLayout />
  );

  return <div suppressHydrationWarning>{content}</div>;
}
