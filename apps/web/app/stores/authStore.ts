'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
      token: null,
      loading: false,
      hydrated: false,

      login: async (email: string, password: string) => {
        set({ loading: true });
        try {
          const res = await fetch(`/api/auth/user/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Login failed');
          }

          const data = await res.json();

          const user: User = {
            id: data.userId || data.user?.id,
            email: data.email,
            name: data.name,
            phone: data.phone,
            emailVerified: data.emailVerified
          };

          const token = data.token || data.access_token;

          set({
            user,
            token,
            loading: false,
            hydrated: true
          });

          if (token) {
            localStorage.setItem('flyfree_auth_token', token);
            localStorage.setItem('flyfree_user_data', JSON.stringify(user));
          }
        } catch (error) {
          set({ loading: false, hydrated: true });
          throw error;
        }
      },

      logout: async () => {
        set({ loading: true });
        try {
          const token = get().token;
          if (token) {
            await fetch(`/api/auth/user/logout`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
            }).catch(() => {});
          }
        } finally {
          localStorage.removeItem('flyfree_auth_token');
          localStorage.removeItem('flyfree_user_data');
          set({ user: null, token: null, loading: false, hydrated: true });
        }
      },

      signup: async (name: string, email: string, phone: string, password: string) => {
        set({ loading: true });
        try {
          const res = await fetch(`/api/auth/user/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name, phone })
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Signup failed');
          }

          set({ loading: false, hydrated: true });
        } catch (error) {
          set({ loading: false, hydrated: true });
          throw error;
        }
      },

      checkAuth: async () => {
        try {
          const savedToken = localStorage.getItem('flyfree_auth_token');
          const savedUser = localStorage.getItem('flyfree_user_data');

          if (savedToken && savedUser) {
            set({
              token: savedToken,
              user: JSON.parse(savedUser),
              loading: false,
              hydrated: true
            });
          } else {
            set({ user: null, token: null, loading: false, hydrated: true });
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('flyfree_auth_token');
          localStorage.removeItem('flyfree_user_data');
          set({ user: null, token: null, loading: false, hydrated: true });
        }
      },

      updateProfile: async (data: { name?: string; phone?: string; image?: string }) => {
        const currentUser = get().user;
        const token = get().token;
        if (!currentUser || !token) throw new Error('Not authenticated');

        set({ loading: true });
        try {
          const res = await fetch(`/api/auth/user/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Update failed');
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
        const token = get().token;
        if (!token) throw new Error('Not authenticated');

        set({ loading: true });
        try {
          const res = await fetch(`/api/auth/user/change-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Password change failed');
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
        token: state.token
      })
    }
  )
);

export { useAuthStore };
