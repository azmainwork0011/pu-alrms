import { create } from 'zustand';

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'CR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  coverPhoto?: string;
  rollNumber?: string;
  batch?: string;
  department?: string;
  phone?: string;
  bio?: string;
}

export type PageView =
  | 'dashboard'
  | 'assignments'
  | 'lab-reports'
  | 'assignment-detail'
  | 'create-assignment'
  | 'submissions'
  | 'ai-chat'
  | 'leaderboard'
  | 'notifications'
  | 'profile'
  | 'student-community'
  | 'announcements'
  | 'quiz'
  | 'books';

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  mounted: boolean;

  // Navigation
  currentPage: PageView;
  selectedAssignmentId: string | null;

  // UI State
  sidebarOpen: boolean;
  notificationCount: number;

  // Actions
  setAuth: (user: User, token: string) => void;
  updateUser: (data: Partial<User>) => void;
  logout: () => void;
  setPage: (page: PageView) => void;
  setAssignmentId: (id: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setNotificationCount: (count: number) => void;
  hydrate: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  mounted: false,
  currentPage: 'dashboard',
  selectedAssignmentId: null,
  sidebarOpen: false,
  notificationCount: 0,

  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ user, token, isAuthenticated: true });
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    set({ user: null, token: null, isAuthenticated: false, currentPage: 'dashboard', notificationCount: 0 });
  },

  setPage: (page) => set({ currentPage: page, sidebarOpen: false }),
  setAssignmentId: (id) => set({ selectedAssignmentId: id, currentPage: 'assignment-detail' }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setNotificationCount: (count) => set({ notificationCount: count }),

  hydrate: () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true, mounted: true });
      } else {
        set({ mounted: true });
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ mounted: true });
    }
  },
}));
