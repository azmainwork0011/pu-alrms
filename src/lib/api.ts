/**
 * PU-ALRMS API Client — Improved with retry, cache-aware headers, and better types
 *
 * This is the LOW-LEVEL fetch wrapper. For UI components, prefer the
 * React Query hooks exported from `@/lib/hooks/use-queries` instead.
 */

const API_BASE = '';

// ─── Config ────────────────────────────────────────────────
const DEFAULT_TIMEOUT = 30000; // 30s for complex queries
const AUTH_TIMEOUT = 20000;
const UPLOAD_TIMEOUT = 60000; // 60s for uploads
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// Auth endpoints where 401 means "wrong credentials" (not expired session)
const AUTH_ENDPOINTS = ['/api/auth/login', '/api/auth/register'];

// Endpoints that should NOT be retried (mutations, uploads)
const NO_RETRY_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

// ─── Error Classes ─────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network error — please check your connection') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string = 'Request timed out — please check your connection and try again') {
    super(message);
    this.name = 'TimeoutError';
  }
}

// ─── Helpers ───────────────────────────────────────────────
export function isNetworkError(err: unknown): boolean {
  if (err instanceof NetworkError) return true;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('Network request failed') ||
    msg.includes('net::ERR_') ||
    msg.includes('ECONNREFUSED')
  );
}

export function isTimeoutError(err: unknown): boolean {
  if (err instanceof TimeoutError) return true;
  return err instanceof Error && err.name === 'AbortError';
}

export function isServerError(err: unknown): boolean {
  if (err instanceof ApiError) return err.status >= 500;
  return false;
}

/**
 * Silent error logger — suppresses expected auth/network errors from console
 * while still reporting genuine unexpected issues.
 */
export function silentError(err: unknown, context?: string): void {
  const msg = err instanceof Error ? err.message : String(err);
  const silentPatterns = [
    'Authentication required',
    'HTTP 401',
    'Request timed out',
    'Failed to fetch',
    'NetworkError',
    'token',
  ];
  if (silentPatterns.some(p => msg.includes(p))) return;
  console.error(context ? `${context}:` : 'Error:', err);
}

// ─── Auth Expiry Handler ───────────────────────────────────
let authExpiredFired = false;
let authExpiredTimer: ReturnType<typeof setTimeout> | null = null;

function handleAuthExpired() {
  if (authExpiredFired) return;
  authExpiredFired = true;
  try { localStorage.removeItem('token'); } catch {}
  try { localStorage.removeItem('user'); } catch {}
  window.dispatchEvent(new Event('auth-expired'));
  if (authExpiredTimer) clearTimeout(authExpiredTimer);
  authExpiredTimer = setTimeout(() => { authExpiredFired = false; }, 2000);
}

// ─── Low-level fetch with timeout ──────────────────────────
export function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT,
): Promise<Response> {
  const controller = new AbortController();
  const { signal, ...restOptions } = options;

  const linkedSignal = signal
    ? AbortSignal.any([signal, controller.signal])
    : controller.signal;

  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { ...restOptions, signal: linkedSignal })
    .then((response) => {
      clearTimeout(timeoutId);
      return response;
    })
    .catch((err) => {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new TimeoutError();
      }
      throw new NetworkError(err instanceof Error ? err.message : undefined);
    });
}

// ─── Retry helper ──────────────────────────────────────────
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  timeoutMs: number,
): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase();
  const shouldRetry = !NO_RETRY_METHODS.includes(method);

  if (!shouldRetry) {
    return fetchWithTimeout(url, options, timeoutMs);
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, timeoutMs);
      // Only retry on 5xx server errors or network timeouts
      if (response.status >= 500 || response.status === 429) {
        lastError = new ApiError(
          response.status === 429 ? 'Too many requests — please slow down' : 'Server error',
          response.status,
        );
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * Math.pow(2, attempt)); // exponential backoff
          continue;
        }
      }
      return response;
    } catch (err) {
      lastError = err;
      if (isNetworkError(err) || isTimeoutError(err)) {
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * Math.pow(2, attempt));
          continue;
        }
      }
      // Don't retry 4xx client errors
      throw err;
    }
  }
  throw lastError;
}

// ─── Get auth token ────────────────────────────────────────
function getAuthToken(): string | null {
  try { return localStorage.getItem('token'); } catch { return null; }
}

// ─── Core apiFetch ─────────────────────────────────────────
export interface FetchOptions extends RequestInit {
  /** Override the default timeout (ms) */
  timeout?: number;
  /** Skip the retry logic entirely */
  noRetry?: boolean;
  /** Skip adding auth header */
  noAuth?: boolean;
}

// Write methods (kept for reference)
const WRITE_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { timeout, noRetry, noAuth, headers: extraHeaders, ...restOptions } = options;
  const method = (restOptions.method || 'GET').toUpperCase();

  const headers: Record<string, string> = {
    ...(extraHeaders as Record<string, string>),
  };

  // Only set Content-Type for non-FormData bodies
  if (!(restOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (!noAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

  }

  const isAuthEndpoint = AUTH_ENDPOINTS.some(ep => endpoint.startsWith(ep));
  const timeoutMs = timeout ?? (isAuthEndpoint ? AUTH_TIMEOUT : DEFAULT_TIMEOUT);

  const url = `${API_BASE}${endpoint}`;

  let response: Response;
  if (noRetry) {
    response = await fetchWithTimeout(url, { ...restOptions, headers }, timeoutMs);
  } else {
    response = await fetchWithRetry(url, { ...restOptions, headers }, timeoutMs);
  }

  if (!response.ok) {
    if (response.status === 401 && !isAuthEndpoint) {
      handleAuthExpired();
    }
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(
      errorData.error || `HTTP ${response.status}`,
      response.status,
      errorData.code,
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ═══════════════════════════════════════════════════════════════
// API Namespaces — keep these for backward compatibility
// New code should prefer the React Query hooks from @/lib/hooks
// ═══════════════════════════════════════════════════════════════

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      timeout: AUTH_TIMEOUT,
    }),

  register: (data: { name: string; email: string; password: string; role?: string }) =>
    apiFetch<{ token: string; user: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      timeout: AUTH_TIMEOUT,
    }),

  getProfile: () =>
    apiFetch<any>('/api/auth/profile'),

  updateProfile: (data: { name?: string; rollNumber?: string; batch?: string; department?: string; phone?: string; bio?: string }) =>
    apiFetch<{ user: any }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  uploadProfilePhoto: (file: File, type: 'avatar' | 'cover') => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return fetchWithTimeout('/api/auth/profile', {
      method: 'PUT',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(isDemoUser() ? { 'X-Demo-Mode': 'true' } : {}),
      },
      body: formData,
    }, UPLOAD_TIMEOUT).then(async (res) => {
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new ApiError(error.error || `HTTP ${res.status}`, res.status);
      }
      return res.json() as Promise<{ success: boolean; url: string }>;
    });
  },

};

export const assignmentApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<any[]>('/api/assignments' + query);
  },
  get: (id: string) =>
    apiFetch<any>(`/api/assignments/${id}`),
  create: (data: any) =>
    apiFetch<any>('/api/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    apiFetch<any>(`/api/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch<any>(`/api/assignments/${id}`, {
      method: 'DELETE',
    }),
};

export const submissionApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<any[]>('/api/submissions' + query);
  },
  create: (data: { assignmentId: string; fileName: string; fileUrl?: string }) =>
    apiFetch<any>('/api/submissions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  grade: (id: string, data: { marks: number; feedback: string }) =>
    apiFetch<any>(`/api/submissions/${id}/grade`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export const commentApi = {
  list: (assignmentId: string) =>
    apiFetch<any[]>(`/api/comments?assignmentId=${assignmentId}`),
  create: (data: { assignmentId: string; content: string }) =>
    apiFetch<any>('/api/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const notificationApi = {
  list: () =>
    apiFetch<any[]>('/api/notifications'),
  markRead: (id: string) =>
    apiFetch<any>(`/api/notifications/${id}/read`, {
      method: 'PUT',
    }),
};

export const dashboardApi = {
  getStats: () =>
    apiFetch<any>('/api/dashboard'),
};

export const leaderboardApi = {
  get: () =>
    apiFetch<any[]>('/api/leaderboard'),
};

export const subjectApi = {
  list: () =>
    apiFetch<any[]>('/api/subjects'),
  create: (data: { name: string; code: string; batch?: string }) =>
    apiFetch<any>('/api/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const announcementApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<any[]>('/api/announcements' + query);
  },
  get: (id: string) =>
    apiFetch<any>(`/api/announcements/${id}`),
  create: (data: { title: string; message: string; type?: string; priority?: string }) =>
    apiFetch<any>('/api/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    apiFetch<any>(`/api/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch<any>(`/api/announcements/${id}`, {
      method: 'DELETE',
    }),
};

export const aiApi = {
  chat: (message: string, mode: 'single' | 'battle' = 'single', modelId?: string, selectedModels?: string[]) =>
    apiFetch<any>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, mode, modelId, selectedModels }),
      timeout: 60000, // AI responses can take up to 60s
    }),
  voteBattle: (battleId: string, label: string) =>
    apiFetch<{ success: boolean; votes: any; reveals: Record<string, string> }>('/api/ai/chat', {
      method: 'PUT',
      body: JSON.stringify({ battleId, label }),
    }),
  clearChat: () =>
    apiFetch<{ success: boolean }>('/api/ai/chat', { method: 'DELETE' }),
  generateImage: (prompt: string) =>
    apiFetch<{ image: string; prompt: string }>('/api/ai/generate-image', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
      timeout: 60000, // Image gen can take up to 60s
    }),
  scanImage: (image: string, question: string) =>
    apiFetch<{ response: string }>('/api/ai/scan', {
      method: 'POST',
      body: JSON.stringify({ image, question }),
      timeout: 60000, // Vision scan can take up to 60s
    }),
};

// ─── New API namespaces for previously raw fetch() callers ──
export const booksApi = {
  search: (params: Record<string, string>) => {
    const query = '?' + new URLSearchParams(params).toString();
    return apiFetch<any>('/api/books/search' + query);
  },
  getSaved: () =>
    apiFetch<any[]>('/api/books/saved'),
  save: (data: { bookId: string; title: string; authors: string; coverUrl?: string; category?: string; language?: string; description?: string; infoLink?: string; pdfLink?: string }) =>
    apiFetch<any>('/api/books/saved', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    apiFetch<any>(`/api/books/saved/${id}`, {
      method: 'DELETE',
    }),
};

export const quizApi = {
  getProfile: () =>
    apiFetch<any>('/api/quiz/profile'),
  updateProfile: (data: any) =>
    apiFetch<any>('/api/quiz/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getCategories: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<any[]>('/api/quiz/categories' + query);
  },
  getQuestions: (categoryId: string, count?: number) => {
    const query = '?' + new URLSearchParams({ category: categoryId, ...(count ? { count: String(count) } : {}) }).toString();
    return apiFetch<any[]>('/api/quiz/questions' + query);
  },
  submitAttempt: (data: { categoryId: string; score: number; totalPoints: number; correctCount: number; totalQuestions: number; accuracy: number; timeTaken: number }) =>
    apiFetch<any>('/api/quiz/attempt', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getAttempts: (categoryId?: string) => {
    const query = categoryId ? `?category=${categoryId}` : '';
    return apiFetch<any[]>('/api/quiz/attempts' + query);
  },
};

export const batchApi = {
  list: () =>
    apiFetch<any[]>('/api/batches'),
};
