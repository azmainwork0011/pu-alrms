const API_BASE = '';

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
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
};

export const aiApi = {
  chat: (message: string, context?: string) =>
    apiFetch<{ response: string }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    }),
};
