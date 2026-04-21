'use client';

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError, isNetworkError, isTimeoutError } from '@/lib/api';

/**
 * Global QueryClient with sensible defaults:
 * - GET requests: cache 30s, retry 2× with backoff, refetch on window focus
 * - Mutations: no retry, no cache
 * - Global error handler with toast notifications
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,        // 30 seconds — data is fresh for 30s
        gcTime: 5 * 60_000,       // 5 minutes — unused cache cleaned up
        retry: (failureCount, error) => {
          // Retry network/timeout errors up to 2 times; don't retry 4xx client errors
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
          return failureCount < 2;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000), // 1s, 2s, 4s cap
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        refetchOnReconnect: true,
        networkMode: 'offlineFirst', // Show cached data first when offline
      },
      mutations: {
        retry: false, // Mutations should not auto-retry
      },
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Don't toast for auth-related queries (handled by AuthPage)
        const key = query.queryKey[0] as string;
        if (key?.startsWith('auth')) return;
        if (key?.startsWith('seed')) return;

        // Don't toast if a custom error handler is set on the query
        if (query.meta?.suppressToast) return;

        if (isNetworkError(error)) {
          toast.error('Network error — check your connection');
        } else if (isTimeoutError(error)) {
          toast.error('Request timed out — try again');
        } else if (error instanceof ApiError && error.status >= 500) {
          toast.error('Server error — please try again');
        }
        // 4xx errors are handled by the mutation/query itself (no global toast)
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        // Don't toast if suppressToast is set
        if (mutation.meta?.suppressToast) return;
        // Don't toast for auth mutations
        if (mutation.meta?.domain === 'auth') return;

        // Only toast unexpected errors
        if (isNetworkError(error)) {
          toast.error('Network error — check your connection');
        } else if (isTimeoutError(error)) {
          toast.error('Request timed out — try again');
        } else if (error instanceof ApiError && error.status >= 500) {
          toast.error('Server error — please try again');
        }
      },
    }),
  });
}

// ─── Query Key Factory ─────────────────────────────────────
// Centralized query keys for consistent cache management
export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    profile: ['auth', 'profile'] as const,
  },

  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: ['dashboard', 'stats'] as const,
  },

  // Assignments
  assignments: {
    all: ['assignments'] as const,
    lists: (params?: Record<string, string>) => ['assignments', 'list', params] as const,
    detail: (id: string) => ['assignments', 'detail', id] as const,
  },

  // Submissions
  submissions: {
    all: ['submissions'] as const,
    lists: (params?: Record<string, string>) => ['submissions', 'list', params] as const,
  },

  // Subjects
  subjects: {
    all: ['subjects'] as const,
  },

  // Batches
  batches: {
    all: ['batches'] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
  },

  // Leaderboard
  leaderboard: {
    all: ['leaderboard'] as const,
  },

  // Announcements
  announcements: {
    all: ['announcements'] as const,
    lists: (params?: Record<string, string>) => ['announcements', 'list', params] as const,
    detail: (id: string) => ['announcements', 'detail', id] as const,
  },

  // Books
  books: {
    all: ['books'] as const,
    search: (params: Record<string, string>) => ['books', 'search', params] as const,
    saved: ['books', 'saved'] as const,
  },

  // Quiz
  quiz: {
    all: ['quiz'] as const,
    profile: ['quiz', 'profile'] as const,
    categories: (params?: Record<string, string>) => ['quiz', 'categories', params] as const,
    attempts: (categoryId?: string) => ['quiz', 'attempts', categoryId] as const,
  },

  // Comments
  comments: {
    all: ['comments'] as const,
    forAssignment: (assignmentId: string) => ['comments', assignmentId] as const,
  },
};
