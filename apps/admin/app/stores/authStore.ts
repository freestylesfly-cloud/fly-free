import { create } from 'zustand';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const TOKEN_KEY = 'flyfree_admin_token';
const USER_KEY = 'flyfree_admin_user';

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role?: string;
  permissions?: unknown[];
};

interface AuthStore {
  user: AdminUser | null;
  token: string | null;
  loading: boolean;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

function readStoredSession() {
  if (typeof window === 'undefined') {
    return { token: null, user: null };
  }

  const token = window.localStorage.getItem(TOKEN_KEY);
  const rawUser = window.localStorage.getItem(USER_KEY);

  if (!token || !rawUser) {
    return { token: null, user: null };
  }

  try {
    return { token, user: JSON.parse(rawUser) as AdminUser };
  } catch {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    return { token: null, user: null };
  }
}

function writeStoredSession(token: string, user: AdminUser) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearStoredSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  loading: false,
  hydrated: false,

  login: async (email, password) => {
    set({ loading: true });

    const response = await fetch(`${API_BASE}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.error) {
      set({ loading: false, hydrated: true, user: null, token: null });
      throw new Error(result.error || `Login failed (${response.status})`);
    }

    const user: AdminUser = {
      id: result.adminId,
      email: result.email,
      name: result.name,
      role: result.role,
      permissions: result.permissions
    };

    writeStoredSession(result.token, user);
    set({ user, token: result.token, loading: false, hydrated: true });
  },

  logout: async () => {
    const token = get().token;
    set({ loading: true });

    try {
      if (token) {
        await fetch(`${API_BASE}/api/auth/admin/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } finally {
      clearStoredSession();
      set({ user: null, token: null, loading: false, hydrated: true });
    }
  },

  checkAuth: async () => {
    const stored = readStoredSession();

    if (!stored.token || !stored.user) {
      set({ user: null, token: null, loading: false, hydrated: true });
      return;
    }

    set({ user: stored.user, token: stored.token, loading: true, hydrated: true });

    try {
      const response = await fetch(`${API_BASE}/api/auth/admin/profile`, {
        headers: { Authorization: `Bearer ${stored.token}` }
      });

      if (!response.ok) {
        throw new Error(`Profile check failed (${response.status})`);
      }

      const profile = await response.json();
      const user: AdminUser = {
        id: profile?.id || stored.user.id,
        email: profile?.email || stored.user.email,
        name: profile?.name || stored.user.name,
        role: profile?.role?.name || stored.user.role,
        permissions: profile?.role?.permissions || stored.user.permissions
      };

      writeStoredSession(stored.token, user);
      set({ user, token: stored.token, loading: false, hydrated: true });
    } catch {
      clearStoredSession();
      set({ user: null, token: null, loading: false, hydrated: true });
    }
  }
}));
