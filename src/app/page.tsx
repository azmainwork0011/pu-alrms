'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/app';
import { GraduationCap } from 'lucide-react';
import AuthPage from '@/components/pages/AuthPage';
import AppLayout from '@/components/layout/AppLayout';

export default function Home() {
  const { mounted, isAuthenticated, hydrate } = useAppStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!mounted) {
    return (
      <div suppressHydrationWarning className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/20">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <GraduationCap className="w-8 h-8 text-white" />
          </motion.div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">PU-ALRMS</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <AppLayout />;
}
