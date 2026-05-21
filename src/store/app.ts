import { create } from 'zustand';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DEVELOPER' | 'TEACHER' | 'STUDENT' | 'CR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  verified?: boolean;
  status?: string;
  avatar?: string;
  coverPhoto?: string;
  rollNumber?: string;
  batch?: string;
  department?: string;
  phone?: string;
  bio?: string;
}

export type PageView =
  | 'admin-panel'
  | 'dashboard'
  | 'assignments'
  | 'lab-reports'
  | 'assignment-detail'
  | 'create-assignment'
  | 'submissions'
  | 'student-tasks'
  | 'ai-chat'
  | 'leaderboard'
  | 'notifications'
  | 'profile'
  | 'student-community'
  | 'announcements'
  | 'quiz'
  | 'code-quest'
  | 'books'
  | 'cr-dashboard';

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  mounted: boolean;

  // Demo mode
  isDemoUser: boolean;

  // Database status
  dbConnected: boolean | null;  // null = not checked yet, true/false = result

  // Navigation
  currentPage: PageView;
  pageHistory: PageView[];
  selectedAssignmentId: string | null;

  // UI State
  sidebarOpen: boolean;
  notificationCount: number;

  // Actions
  setAuth: (user: User, token: string, isDemo?: boolean) => void;
  setDemoMode: (isDemo: boolean) => void;
  updateUser: (data: Partial<User>) => void;
  logout: () => void;
  setPage: (page: PageView) => void;
  goBack: () => void;
  canGoBack: () => boolean;
  setAssignmentId: (id: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setNotificationCount: (count: number) => void;
  setDbConnected: (connected: boolean) => void;
  checkDatabase: () => Promise<void>;
  hydrate: () => void;
}

// Client-side JWT expiry check (no signature verification needed - server does that)
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    // Consider token expired if within 30 seconds of actual expiry
    return (payload.exp || 0) < (Date.now() / 1000) + 30;
  } catch {
    return true;
  }
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  mounted: false,
  isDemoUser: false,
  dbConnected: null,
  currentPage: 'dashboard',
  pageHistory: [],
  selectedAssignmentId: null,
  sidebarOpen: false,
  notificationCount: 0,

  setAuth: (user, token, isDemo = false) => {
    // Always update Zustand state first (guaranteed to work)
    set({ user, token, isAuthenticated: true, isDemoUser: isDemo });
    // Persist to localStorage — failures are silently ignored so login never gets stuck
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        if (isDemo) {
          localStorage.setItem('is-demo', 'true');
        } else {
          localStorage.removeItem('is-demo');
        }
      } catch {
        // localStorage might be full, blocked (private mode), or unavailable
      }
    }
  },

  setDemoMode: (isDemo) => {
    set({ isDemoUser: isDemo });
    if (typeof window !== 'undefined') {
      try {
        if (isDemo) localStorage.setItem('is-demo', 'true');
        else localStorage.removeItem('is-demo');
      } catch { /* ignore */ }
    }
  },

  updateUser: (data) => set((state) => {
    if (typeof window !== 'undefined' && state.user) {
      const updated = { ...state.user, ...data };
      localStorage.setItem('user', JSON.stringify(updated));
    }
    return { user: state.user ? { ...state.user, ...data } : null };
  }),

  logout: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('login-email');
        localStorage.removeItem('login-role');
      } catch {
        // Ignore localStorage errors during logout
      }
    }
    set({ user: null, token: null, isAuthenticated: false, isDemoUser: false, currentPage: 'dashboard', pageHistory: [], notificationCount: 0 });
    // Also sign out from NextAuth if available (clears Google OAuth session cookie)
    // This is a fire-and-forget call — we don't await it to avoid blocking logout
    if (typeof window !== 'undefined') {
      import('next-auth/react').then(({ signOut }) => {
        signOut({ redirect: false }).catch(() => {});
      }).catch(() => {});
    }
  },

  setPage: (page) => {
    const state = useAppStore.getState();
    const current = state.currentPage;
    // Don't push to history if navigating to the same page
    if (page !== current) {
      // Push current page to history stack (limit to 50 entries)
      const newHistory = [...state.pageHistory, current].slice(-50);
      set({ currentPage: page, sidebarOpen: false, pageHistory: newHistory });
      // Sync browser History API so browser back button works
      if (typeof window !== 'undefined') {
        try {
          window.history.pushState({ page, pageHistory: newHistory }, '');
        } catch {
          // Ignore in environments where history manipulation is restricted
        }
      }
    } else {
      set({ sidebarOpen: false });
    }
  },

  goBack: () => {
    const state = useAppStore.getState();
    if (state.pageHistory.length === 0) return;
    // Pop the last entry from history
    const newHistory = [...state.pageHistory];
    const previousPage = newHistory.pop()!;
    set({ currentPage: previousPage, pageHistory: newHistory, sidebarOpen: false });
    // We already navigated back in history via popstate, so don't push again
  },

  canGoBack: () => {
    return useAppStore.getState().pageHistory.length > 0;
  },

  setAssignmentId: (id) => {
    const state = useAppStore.getState();
    const current = state.currentPage;
    const newHistory = [...state.pageHistory, current].slice(-50);
    set({ selectedAssignmentId: id, currentPage: 'assignment-detail', pageHistory: newHistory, sidebarOpen: false });
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState({ page: 'assignment-detail', pageHistory: newHistory }, '');
      } catch { /* ignore */ }
    }
  },
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setNotificationCount: (count) => set({ notificationCount: count }),
  setDbConnected: (connected) => set({ dbConnected: connected }),

  checkDatabase: async () => {
    try {
      const res = await fetch('/api/health/db');
      const data = await res.json();
      set({ dbConnected: data.ok === true });
    } catch {
      set({ dbConnected: false });
    }
  },

  hydrate: () => {
    try {
      if (typeof window === 'undefined') {
        set({ mounted: true });
        return;
      }
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        // Check token expiry client-side to avoid dashboard flash
        if (isTokenExpired(token)) {
          try { localStorage.removeItem('token'); } catch {}
          try { localStorage.removeItem('user'); } catch {}
          set({ user: null, token: null, isAuthenticated: false, mounted: true });
          return;
        }
        const user = JSON.parse(userStr);
        const isDemo = localStorage.getItem('is-demo') === 'true';
        set({ user, token, isAuthenticated: true, isDemoUser: isDemo, mounted: true });
      } else {
        set({ mounted: true });
      }
    } catch {
      try { localStorage.removeItem('token'); } catch {}
      try { localStorage.removeItem('user'); } catch {}
      set({ user: null, token: null, isAuthenticated: false, mounted: true });
    }
  },
}));
