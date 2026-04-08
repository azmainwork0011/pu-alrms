import { create } from 'zustand';

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
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
  | 'profile';

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // Navigation
  currentPage: PageView;
  selectedAssignmentId: string | null;
  
  // UI State
  sidebarOpen: boolean;
  notificationCount: number;
  
  // Actions
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setPage: (page: PageView) => void;
  setAssignmentId: (id: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setNotificationCount: (count: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
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
}));

// Initialize from localStorage on client
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      useAppStore.setState({ user, token, isAuthenticated: true });
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
}
