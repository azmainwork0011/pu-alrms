'use client';

/**
 * Custom React Query hooks for all API endpoints.
 *
 * Benefits over raw apiFetch calls:
 * ✅ Automatic caching (30s staleTime, 5min gcTime)
 * ✅ Request deduplication (same query = single request)
 * ✅ Automatic retry with exponential backoff (network/5xx errors)
 * ✅ Background refetch on window focus
 * ✅ Built-in loading/error states
 * ✅ Optimistic updates support
 * ✅ Request cancellation on unmount
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  apiFetch,
  authApi,
  dashboardApi,
  assignmentApi,
  submissionApi,
  commentApi,
  notificationApi,
  leaderboardApi,
  subjectApi,
  announcementApi,
  booksApi,
  quizApi,
  batchApi,
  ApiError,
} from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: () => dashboardApi.getStats(),
    staleTime: 20_000, // Dashboard refreshes every 20s
  });
}

// ═══════════════════════════════════════════════════════════════
// ASSIGNMENTS
// ═══════════════════════════════════════════════════════════════

export function useAssignments(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.assignments.lists(params),
    queryFn: () => assignmentApi.list(params),
  });
}

export function useAssignment(id: string | null) {
  return useQuery({
    queryKey: queryKeys.assignments.detail(id || ''),
    queryFn: () => assignmentApi.get(id!),
    enabled: !!id, // Don't fetch until we have an ID
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assignmentApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.assignments.all });
      qc.invalidateQueries({ queryKey: queryKeys.subjects.all });
      toast.success('Assignment created successfully!');
    },
  });
}

export function useUpdateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => assignmentApi.update(id, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.assignments.all });
      qc.invalidateQueries({ queryKey: queryKeys.assignments.detail(variables.id) });
      toast.success('Assignment updated successfully!');
    },
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assignmentApi.delete,
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await qc.cancelQueries({ queryKey: queryKeys.assignments.all });
      // Snapshot current data
      const snapshot = qc.getQueryData<any[]>(queryKeys.assignments.lists());
      // Optimistically remove from list
      qc.setQueryData(
        queryKeys.assignments.lists(),
        snapshot?.filter((a: any) => a.id !== id) ?? [],
      );
      return { snapshot };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.snapshot) {
        qc.setQueryData(queryKeys.assignments.lists(), context.snapshot);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.assignments.all });
    },
    onSuccess: () => {
      toast.success('Assignment deleted');
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// SUBMISSIONS
// ═══════════════════════════════════════════════════════════════

export function useSubmissions(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.submissions.lists(params),
    queryFn: () => submissionApi.list(params),
  });
}

export function useCreateSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submissionApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.submissions.all });
      qc.invalidateQueries({ queryKey: queryKeys.assignments.all });
      toast.success('Submitted successfully!');
    },
  });
}

export function useGradeSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { marks: number; feedback: string } }) =>
      submissionApi.grade(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.submissions.all });
      qc.invalidateQueries({ queryKey: queryKeys.assignments.all });
      toast.success('Grade saved');
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// SUBJECTS
// ═══════════════════════════════════════════════════════════════

export function useSubjects() {
  return useQuery({
    queryKey: queryKeys.subjects.all,
    queryFn: () => subjectApi.list(),
    staleTime: 60_000, // Subjects don't change often — cache for 1min
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: subjectApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.subjects.all });
      toast.success('Subject created!');
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// BATCHES
// ═══════════════════════════════════════════════════════════════

export function useBatches() {
  return useQuery({
    queryKey: queryKeys.batches.all,
    queryFn: () => batchApi.list(),
    staleTime: 60_000,
  });
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: () => notificationApi.list(),
    staleTime: 10_000, // Notifications should be fairly fresh
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════════════════════════

export function useLeaderboard() {
  return useQuery({
    queryKey: queryKeys.leaderboard.all,
    queryFn: () => leaderboardApi.get(),
    staleTime: 60_000, // Leaderboard updates are not urgent
  });
}

// ═══════════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ═══════════════════════════════════════════════════════════════

export function useAnnouncements(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.announcements.lists(params),
    queryFn: () => announcementApi.list(params),
  });
}

export function useAnnouncement(id: string | null) {
  return useQuery({
    queryKey: queryKeys.announcements.detail(id || ''),
    queryFn: () => announcementApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: announcementApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.announcements.all });
      toast.success('Announcement published!');
    },
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => announcementApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.announcements.all });
      toast.success('Announcement updated!');
    },
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: announcementApi.delete,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.announcements.all });
      const snapshot = qc.getQueryData<any[]>(queryKeys.announcements.lists());
      qc.setQueryData(
        queryKeys.announcements.lists(),
        snapshot?.filter((a: any) => a.id !== id) ?? [],
      );
      return { snapshot };
    },
    onError: (_err, _id, context) => {
      if (context?.snapshot) {
        qc.setQueryData(queryKeys.announcements.lists(), context.snapshot);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.announcements.all });
    },
    onSuccess: () => {
      toast.success('Announcement deleted');
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// COMMENTS
// ═══════════════════════════════════════════════════════════════

export function useComments(assignmentId: string | null) {
  return useQuery({
    queryKey: queryKeys.comments.forAssignment(assignmentId || ''),
    queryFn: () => commentApi.list(assignmentId!),
    enabled: !!assignmentId,
    staleTime: 15_000,
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: commentApi.create,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: queryKeys.comments.forAssignment(variables.assignmentId),
      });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// BOOKS
// ═══════════════════════════════════════════════════════════════

export function useBookSearch(params: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.books.search(params),
    queryFn: () => booksApi.search(params),
    enabled: Object.keys(params).length > 0,
    staleTime: 60_000,
  });
}

export function useSavedBooks() {
  return useQuery({
    queryKey: queryKeys.books.saved,
    queryFn: () => booksApi.getSaved(),
  });
}

export function useSaveBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: booksApi.save,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.books.saved });
      toast.success('Book saved!');
    },
  });
}

export function useRemoveBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: booksApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.books.saved });
      toast.success('Book removed');
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════

export function useQuizProfile() {
  return useQuery({
    queryKey: queryKeys.quiz.profile,
    queryFn: () => quizApi.getProfile(),
  });
}

export function useQuizCategories(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.quiz.categories(params),
    queryFn: () => quizApi.getCategories(params),
    staleTime: 60_000,
  });
}

export function useUpdateQuizProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: quizApi.updateProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.quiz.all });
    },
  });
}

export function useSubmitQuizAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: quizApi.submitAttempt,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.quiz.all });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// AUTH (mutations only — profile handled via Zustand)
// ═══════════════════════════════════════════════════════════════

export function useAuthProfile() {
  return useQuery({
    queryKey: queryKeys.auth.profile,
    queryFn: () => authApi.getProfile(),
    staleTime: 2 * 60_000, // 2 min — profile doesn't change often
    meta: { suppressToast: true },
  });
}

// ═══════════════════════════════════════════════════════════════
// UTILITY HOOKS
// ═══════════════════════════════════════════════════════════════

/**
 * Generic mutation hook for simple POST/PUT/DELETE operations
 * where you don't need a domain-specific hook.
 */
export function useApiMutation<TData = any, TVariables = any>(
  endpoint: string,
  options?: {
    method?: string;
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
    invalidateKeys?: readonly unknown[][];
    successMessage?: string;
  },
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variables: TVariables) =>
      apiFetch<TData>(endpoint, {
        method: options?.method || 'POST',
        body: JSON.stringify(variables),
      }),
    onSuccess: (data) => {
      // Invalidate any specified query keys
      options?.invalidateKeys?.forEach((key) => {
        qc.invalidateQueries({ queryKey: key as any });
      });
      // Show success toast
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        // Don't double-toast 4xx errors (the component handles these)
        return;
      }
      options?.onError?.(error);
    },
    meta: { suppressToast: true }, // We handle toasts here
  });
}
