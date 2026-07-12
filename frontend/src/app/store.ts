import { create } from 'zustand'

export type AppView = 
  | 'dashboard'
  | 'fleet'
  | 'drivers'
  | 'trips'
  | 'maintenance'
  | 'expenses'
  | 'reports'
  | 'settings';

export interface User {
  id: number;
  email: string;
  role: 'Fleet Manager' | 'Dispatcher' | 'Safety Officer' | 'Financial Analyst';
  name?: string;
}

interface AppState {
  token: string | null;
  user: User | null;
  activeView: AppView;
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notifications: any[];
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  setView: (view: AppView) => void;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  setNotifications: (notes: any[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  token: localStorage.getItem('token'),
  user: (() => {
    const saved = localStorage.getItem('user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })(),
  activeView: 'dashboard',
  theme: 'light',
  sidebarOpen: true,
  notifications: [],
  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, activeView: 'dashboard' });
  },
  setView: (activeView) => set({ activeView }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setNotifications: (notifications) => set({ notifications }),
}));
