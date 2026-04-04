import { create } from 'zustand';
import api from '../lib/axios';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'buyer' | 'superadmin';
  plan?: string;
  status?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  register: (name: string, email: string, password: string, phone: string, plan: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isLoading: true,

  register: async (name, email, password, phone, plan) => {
    const { data } = await api.post('/auth/register', { name, email, password, phone, plan });
    localStorage.setItem('token', data.token);
    set({ user: data, token: data.token });
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    set({ user: data, token: data.token });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    const { user, isLoading } = useAuthStore.getState();
    // Only fetch if we don't have a user and we're not currently loading
    // Or if we need to refresh (could add more complex logic here if needed)
    if (user) {
      set({ isLoading: false });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const { data } = await api.get('/auth/me');
      set({ user: data, isLoading: false });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, isLoading: false });
    }
  },
}));
