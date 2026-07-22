'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, signInWithEmail, signUpWithEmail, signOut, getCurrentUser, getSession, resetPassword, updatePassword } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  image?: string;
  emailVerified?: boolean;
}

interface AuthStore {
  user: User | null;
  session: any;
  token: string | null;
  loading: boolean;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (name: string, email: string, phone: string, password: string) => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string; image?: string }) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      token: null,
      loading: false,
      hydrated: false,

      login: async (email: string, password: string) => {
        set({ loading: true });
        try {
          const { data, error } = await signInWithEmail(email, password);

          if (error) {
            throw new Error(error.message || 'Login failed');
          }

          if (data?.user) {
            const user: User = {
              id: data.user.id,
              email: data.user.email || '',
              name: data.user.user_metadata?.name,
              phone: data.user.user_metadata?.phone,
              emailVerified: data.user.email_confirmed_at ? true : false
            };

            const token = data.session?.access_token || null;

            set({
              user,
              session: data.session,
              token,
              loading: false,
              hydrated: true
            });

            if (token) {
              localStorage.setItem('flyfree_auth_token', token);
              localStorage.setItem('flyfree_user_data', JSON.stringify(user));
            }
          }
        } catch (error) {
          set({ loading: false, hydrated: true });
          throw error;
        }
      },

      logout: async () => {
        set({ loading: true });
        try {
          await signOut();
        } finally {
          localStorage.removeItem('flyfree_auth_token');
          localStorage.removeItem('flyfree_user_data');
          set({ user: null, session: null, token: null, loading: false, hydrated: true });
        }
      },

      signup: async (name: string, email: string, phone: string, password: string) => {
        set({ loading: true });
        try {
          const { data, error } = await signUpWithEmail(email, password, { name, phone });

          if (error) {
            throw new Error(error.message || 'Signup failed');
          }

          set({ loading: false, hydrated: true });
        } catch (error) {
          set({ loading: false, hydrated: true });
          throw error;
        }
      },

      checkAuth: async () => {
        try {
          const session = await getSession();

          if (session?.user) {
            const user: User = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name,
              phone: session.user.user_metadata?.phone,
              emailVerified: session.user.email_confirmed_at ? true : false
            };

            const token = session.access_token || null;

            set({
              user,
              session,
              token,
              loading: false,
              hydrated: true
            });

            if (token) {
              localStorage.setItem('flyfree_auth_token', token);
              localStorage.setItem('flyfree_user_data', JSON.stringify(user));
            }
          } else {
            const savedToken = localStorage.getItem('flyfree_auth_token');
            if (savedToken) {
              localStorage.removeItem('flyfree_auth_token');
              localStorage.removeItem('flyfree_user_data');
            }
            set({ user: null, session: null, token: null, loading: false, hydrated: true });
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('flyfree_auth_token');
          localStorage.removeItem('flyfree_user_data');
          set({ user: null, session: null, token: null, loading: false, hydrated: true });
        }
      },

      updateProfile: async (data: { name?: string; phone?: string; image?: string }) => {
        const currentUser = get().user;
        if (!currentUser) throw new Error('Not authenticated');
        if (!supabase) throw new Error('Supabase not initialized');

        set({ loading: true });
        try {
          const { error } = await supabase.auth.updateUser({
            data: {
              name: data.name,
              phone: data.phone,
              image: data.image,
            },
          });

          if (error) {
            throw new Error(error.message);
          }

          const updatedUser: User = {
            ...currentUser,
            name: data.name || currentUser.name,
            phone: data.phone || currentUser.phone,
            image: data.image || currentUser.image,
          };

          set({ user: updatedUser, loading: false });
          localStorage.setItem('flyfree_user_data', JSON.stringify(updatedUser));
          return true;
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        set({ loading: true });
        try {
          const { error } = await updatePassword(newPassword);

          if (error) {
            throw new Error(error.message);
          }

          set({ loading: false });
          return true;
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      setUser: (user: User | null) => set({ user }),
      setToken: (token: string | null) => set({ token })
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        session: state.session
      })
    }
  )
);

export { useAuthStore };
