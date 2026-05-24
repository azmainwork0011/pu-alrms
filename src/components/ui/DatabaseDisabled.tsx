/**
 * DatabaseDisabled Component
 *
 * Shown when a user navigates to a database-dependent feature
 * but the database is not connected.
 */
'use client';

import { motion } from 'framer-motion';
import { Database, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app';

export function DatabaseDisabled({ reason }: { reason?: string }) {
  const checkDatabase = useAppStore((s) => s.checkDatabase);
  const dbConnected = useAppStore((s) => s.dbConnected);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-sm w-full text-center"
      >
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center bg-amber-500/10 border border-amber-500/20">
          <Database className="w-8 h-8 text-amber-400" />
        </div>

        {/* Title */}
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
          Database Not Connected
        </h2>

        {/* Description */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
          {reason || 'This feature requires a database connection. It will be available once the database is configured.'}
        </p>

        {/* Status indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 mb-6">
          <span className={`w-2 h-2 rounded-full ${dbConnected === false ? 'bg-red-400' : 'bg-gray-400'}`} />
          {dbConnected === false ? 'Disconnected' : 'Checking...'}
        </div>

        {/* Retry button */}
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => checkDatabase()}
            className="gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Check Again
          </Button>
        </div>

        {/* Tip */}
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-6">
          Ask your administrator to configure the database (Turso/SQLite).
        </p>
      </motion.div>
    </div>
  );
}
