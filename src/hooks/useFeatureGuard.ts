/**
 * useFeatureGuard Hook
 *
 * Returns whether a feature is available based on database connectivity.
 * - DB-dependent features: return false when db is not connected
 * - DB-free features: always return true
 *
 * Usage:
 *   const { allowed, reason } = useFeatureGuard('assignments');
 *   if (!allowed) return <DatabaseDisabled reason={reason} />;
 */
'use client';

import { useAppStore } from '@/store/app';
import type { PageView } from '@/store/app';

// Pages/features that work WITHOUT a database
const DB_FREE_PAGES: PageView[] = [
  'ai-chat',
  'books',
  'code-quest',
  'profile',
];

// Descriptive labels for DB-dependent features
const FEATURE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  'cr-dashboard': 'CR Dashboard',
  'admin-panel': 'Admin Panel',
  assignments: 'Assignments',
  'lab-reports': 'Lab Reports',
  'assignment-detail': 'Assignment Detail',
  'create-assignment': 'Create Assignment',
  submissions: 'Submissions',
  'student-tasks': 'My Tasks',
  leaderboard: 'Leaderboard',
  notifications: 'Notifications',
  'student-community': 'Batch Chat',
  announcements: 'Announcements',
  quiz: 'Quick Quiz',
};

export function useFeatureGuard(page: PageView) {
  const dbConnected = useAppStore((s) => s.dbConnected);
  const isDemoUser = useAppStore((s) => s.isDemoUser);

  // Demo users always have full access (local DB)
  if (isDemoUser) {
    return { allowed: true, reason: '' };
  }

  // DB-free features always work
  if (DB_FREE_PAGES.includes(page)) {
    return { allowed: true, reason: '' };
  }

  // If DB hasn't been checked yet, allow (optimistic — will re-render when check completes)
  if (dbConnected === null) {
    return { allowed: true, reason: '' };
  }

  // DB-dependent feature + DB not connected → disabled
  if (!dbConnected) {
    const label = FEATURE_LABELS[page] || page;
    return {
      allowed: false,
      reason: `${label} requires a database connection. This feature will be available once the database is configured.`,
    };
  }

  return { allowed: true, reason: '' };
}
