const API_BASE = '';

// Default request timeout (15 seconds)
const DEFAULT_TIMEOUT = 15000;

// Auth endpoints where 401 means "wrong credentials" (not expired session)
const AUTH_ENDPOINTS = ['/api/auth/login', '/api/auth/register', '/api/auth/temp-email', '/api/auth/google'];

// Debounce auth-expired to prevent multiple rapid events from parallel API calls
let authExpiredFired = false;
let authExpiredTimer: ReturnType<typeof setTimeout> | null = null;

function handleAuthExpired() {
  if (authExpiredFired) return; // Already handled recently
  authExpiredFired = true;
  try { localStorage.removeItem('token'); } catch {}
  try { localStorage.removeItem('user'); } catch {}
  window.dispatchEvent(new Event('auth-expired'));
  // Reset after 2 seconds to allow future auth-expired events
  if (authExpiredTimer) clearTimeout(authExpiredTimer);
  authExpiredTimer = setTimeout(() => { authExpiredFired = false; }, 2000);
}

// Create a fetch with timeout to prevent infinite loading
function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const { signal, ...restOptions } = options;

  // If the caller already provided a signal, link it to our controller
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
      // Convert AbortError to a more descriptive message
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error('Request timed out — please check your connection and try again');
      }
      throw err;
    });
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let token: string | null;
  try {
    token = localStorage.getItem('token');
  } catch {
    token = null;
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Use longer timeout for auth endpoints (server might be slow)
  const isAuthEndpoint = AUTH_ENDPOINTS.some(ep => endpoint.startsWith(ep));
  const timeout = isAuthEndpoint ? 20000 : DEFAULT_TIMEOUT;
  
  const response = await fetchWithTimeout(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  }, timeout);
  
  if (!response.ok) {
    // Handle token expiry: only for non-auth endpoints (where 401 means expired session)
    if (response.status === 401 && !isAuthEndpoint) {
      handleAuthExpired();
    }
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  
  register: (data: { name: string; email: string; password: string; role?: string }) =>
    apiFetch<{ token: string; user: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getProfile: () =>
    apiFetch<any>('/api/auth/profile'),

  updateProfile: (data: { name?: string; rollNumber?: string; batch?: string; department?: string; phone?: string; bio?: string }) =>
    apiFetch<{ user: any }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  uploadProfilePhoto: (file: File, type: 'avatar' | 'cover') => {
    let token: string | null;
    try { token = localStorage.getItem('token'); } catch { token = null; }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return fetchWithTimeout('/api/auth/profile', {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }, 30000).then(async (res) => {
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(error.error || `HTTP ${res.status}`);
      }
      return res.json();
    }) as Promise<{ success: boolean; url: string }>;
  },

  googleAuth: (data: { name: string; email: string; avatar?: string; role?: string }) =>
    apiFetch<{ token: string; user: any; isExisting: boolean }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  tempEmailAuth: (name?: string) => {
    // Use raw fetchWithTimeout for temp email to avoid auth-expired interference
    return fetchWithTimeout('/api/auth/temp-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }, 20000).then(async (res) => {
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Temp login failed' }));
        throw new Error(error.error || `HTTP ${res.status}`);
      }
      return res.json();
    }) as Promise<{ token: string; user: any; tempEmail: string }>;
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
    }),

  scanImage: (image: string, question: string) =>
    apiFetch<{ response: string }>('/api/ai/scan', {
      method: 'POST',
      body: JSON.stringify({ image, question }),
    }),
};
