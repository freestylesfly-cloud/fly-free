import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface User {
  id: string;
  email: string;
  name: string;
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
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string; image?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  checkAuth: () => Promise<void>;
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
          const response = await fetch(`${API_URL}/auth/user/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Login failed');
          }

          set({
            user: data.user,
            token: data.token,
            loading: false,
            hydrated: true
          });

          localStorage.setItem('flyfree_user_token', data.token);
          localStorage.setItem('flyfree_user_data', JSON.stringify(data.user));
        } catch (error) {
          set({ loading: false, hydrated: true });
          throw error;
        }
      },

      logout: async () => {
        const token = get().token;
        set({ loading: true });

        try {
          if (token) {
            await fetch(`${API_URL}/auth/user/logout`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` }
            });
          }
        } finally {
          localStorage.removeItem('flyfree_user_token');
          localStorage.removeItem('flyfree_user_data');
          set({ user: null, token: null, loading: false, hydrated: true });
        }
      },

      signup: async (name: string, email: string, phone: string, password: string) => {
        set({ loading: true });
        try {
          const response = await fetch(`${API_URL}/auth/user/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, password })
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Signup failed');
          }

          set({ loading: false, hydrated: true });
        } catch (error) {
          set({ loading: false, hydrated: true });
          throw error;
        }
      },

      verifyEmail: async (email: string, code: string) => {
        set({ loading: true });
        try {
          const response = await fetch(`${API_URL}/auth/user/verify-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code })
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Verification failed');
          }

          set({ loading: false, hydrated: true });
        } catch (error) {
          set({ loading: false, hydrated: true });
          throw error;
        }
      },

      resendVerificationEmail: async (email: string) => {
        set({ loading: true });
        try {
          const response = await fetch(`${API_URL}/auth/user/resend-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Resend failed');
          }

          set({ loading: false });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      updateProfile: async (data: { name?: string; phone?: string; image?: string }) => {
        const token = get().token;
        if (!token) throw new Error('Not authenticated');

        set({ loading: true });
        try {
          const response = await fetch(`${API_URL}/auth/user/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(data)
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Update failed');
          }

          set({ user: result.user, loading: false });
          localStorage.setItem('flyfree_user_data', JSON.stringify(result.user));
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
          const response = await fetch(`${API_URL}/auth/user/change-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Password change failed');
          }

          set({ loading: false });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      checkAuth: async () => {
        const token = localStorage.getItem('flyfree_user_token');
        const userData = localStorage.getItem('flyfree_user_data');

        if (token && userData) {
          set({ user: JSON.parse(userData), token, hydrated: true });

          try {
            const response = await fetch(`${API_URL}/auth/user/profile`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
              throw new Error('Token invalid');
            }

            const data = await response.json();
            set({ user: data, token, loading: false, hydrated: true });
            localStorage.setItem('flyfree_user_data', JSON.stringify(data));
          } catch {
            localStorage.removeItem('flyfree_user_token');
            localStorage.removeItem('flyfree_user_data');
            set({ user: null, token: null, loading: false, hydrated: true });
          }
        } else {
          set({ user: null, token: null, loading: false, hydrated: true });
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
