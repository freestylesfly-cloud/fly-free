import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface AuthStore {
  user: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: false,
  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      set({ user: data.user, loading: false });
    } catch (error) {
      set({ loading: false });
      console.error('Login error:', error);
      throw error;
    }
  },
  logout: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },
  checkAuth: async () => {
    try {
      const { data } = await supabase.auth.getSession();
      set({ user: data.session?.user || null, loading: false });
    } catch (error) {
      console.error('Auth check error:', error);
      set({ loading: false });
    }
  },
}));
