'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app';
import { GraduationCap } from 'lucide-react';
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

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center animate-spin" style={{ animationDuration: '2s' }}>
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">PU-ALRMS</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <AppLayout />;
}
