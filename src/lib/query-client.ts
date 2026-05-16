'use client';

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError, isNetworkError, isTimeoutError } from '@/lib/api';

/**
 * Global QueryClient with performance-optimized defaults:
 * - GET requests: cache 60s, retry 1× (fail fast), no refetch on mount
 * - Mutations: no retry, no cache
 * - Global error handler with toast notifications
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,        // 60 seconds — data is fresh for 1 min
        gcTime: 5 * 60_000,       // 5 minutes — unused cache cleaned up
        retry: (failureCount, error) => {
          // Only retry network/timeout errors once; don't retry 4xx client errors
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
          return failureCount < 1; // Max 1 retry (was 2) — fail fast
        },
        retryDelay: 500, // 500ms fixed (was exponential — reduces wait)
        refetchOnWindowFocus: false, // Don't refetch on tab focus — use cached data
        refetchOnMount: false,       // Don't refetch on mount if cached data exists
        refetchOnReconnect: true,    // Refetch when reconnecting after offline
        networkMode: 'offlineFirst', // Show cached data first when offline
      },
      mutations: {
        retry: false,
      },
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        const key = query.queryKey[0] as string;
        if (key?.startsWith('auth')) return;
        if (key?.startsWith('seed')) return;
        if (query.meta?.suppressToast) return;

        if (isNetworkError(error)) {
          toast.error('Network error — check your connection');
        } else if (isTimeoutError(error)) {
          toast.error('Request timed out — try again');
        } else if (error instanceof ApiError && error.status >= 500) {
          toast.error('Server error — please try again');
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (mutation.meta?.suppressToast) return;
        if (mutation.meta?.domain === 'auth') return;

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
export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    profile: ['auth', 'profile'] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    stats: ['dashboard', 'stats'] as const,
  },
  assignments: {
    all: ['assignments'] as const,
    lists: (params?: Record<string, string>) => ['assignments', 'list', params] as const,
    detail: (id: string) => ['assignments', 'detail', id] as const,
  },
  submissions: {
    all: ['submissions'] as const,
    lists: (params?: Record<string, string>) => ['submissions', 'list', params] as const,
  },
  subjects: {
    all: ['subjects'] as const,
  },
  batches: {
    all: ['batches'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
  },
  leaderboard: {
    all: ['leaderboard'] as const,
  },
  announcements: {
    all: ['announcements'] as const,
    lists: (params?: Record<string, string>) => ['announcements', 'list', params] as const,
    detail: (id: string) => ['announcements', 'detail', id] as const,
  },
  books: {
    all: ['books'] as const,
    search: (params: Record<string, string>) => ['books', 'search', params] as const,
    saved: ['books', 'saved'] as const,
  },
  quiz: {
    all: ['quiz'] as const,
    profile: ['quiz', 'profile'] as const,
    categories: (params?: Record<string, string>) => ['quiz', 'categories', params] as const,
    attempts: (categoryId?: string) => ['quiz', 'attempts', categoryId] as const,
  },
  comments: {
    all: ['comments'] as const,
    forAssignment: (assignmentId: string) => ['comments', assignmentId] as const,
  },
};
