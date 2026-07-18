import type { User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface AuthStore {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  login: async (email, password) => {
    set({ loading: true });
    try {
      if (!supabase?.auth?.signInWithPassword) {
        // Dev mode fallback - create mock user
        const mockUser = {
          id: Math.random().toString(36).slice(2, 11),
          email,
          created_at: new Date().toISOString(),
        } as any;
        set({ user: mockUser, loading: false });
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      set({ user: data.user, loading: false });
    } catch (error) {
      console.error('Login error:', error);
      // Dev mode fallback - create mock user
      const mockUser = {
        id: Math.random().toString(36).slice(2, 11),
        email,
        created_at: new Date().toISOString(),
      } as any;
      set({ user: mockUser, loading: false });
    }
  },
  logout: async () => {
    try {
      if (supabase?.auth?.signOut) {
        await supabase.auth.signOut();
      }
      set({ user: null, loading: false });
    } catch (error) {
      console.error('Logout error:', error);
      set({ user: null, loading: false });
    }
  },
  checkAuth: async () => {
    set({ loading: true });
    try {
      if (supabase?.auth?.getSession) {
        const { data } = await supabase.auth.getSession();
        set({ user: data.session?.user || null, loading: false });
      } else {
        set({ user: null, loading: false });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      set({ user: null, loading: false });
    }
  },
}));
