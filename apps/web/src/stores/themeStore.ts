import { create } from 'zustand';
import { getApiBaseUrl } from '../../app/lib/api';

const API_URL = getApiBaseUrl();

export interface WebsiteTheme {
  id: string;
  name: string;
  slug: string;
  description?: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  animationStyle?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroDesktopImageUrl?: string;
  heroMobileImageUrl?: string;
  heroCtaLabel?: string;
  heroHref?: string;
  priority?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ThemeStore {
  theme: WebsiteTheme | null;
  loading: boolean;
  error: string | null;
  fetchActiveTheme: () => Promise<void>;
  setTheme: (theme: WebsiteTheme | null) => void;
  applyThemeToDOM: (theme: WebsiteTheme) => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: null,
  loading: false,
  error: null,

  fetchActiveTheme: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/admin/themes/active`);
      if (response.ok) {
        const theme = await response.json();
        set({ theme, loading: false });
        useThemeStore.getState().applyThemeToDOM(theme);
      } else {
        set({ error: 'Failed to fetch theme', loading: false });
      }
    } catch (error) {
      set({ error: 'Error fetching theme', loading: false });
      console.error('Theme fetch error:', error);
    }
  },

  setTheme: (theme) => {
    set({ theme });
    if (theme) {
      useThemeStore.getState().applyThemeToDOM(theme);
    }
  },

  applyThemeToDOM: (theme) => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    root.style.setProperty('--color-primary', theme.primaryColor);
    root.style.setProperty('--color-secondary', theme.secondaryColor);
    root.style.setProperty('--bg-primary', theme.backgroundColor);
    root.style.setProperty('--text-primary', theme.textColor);
    root.style.setProperty('--color-accent', theme.accentColor);
    root.style.setProperty('--font-family', theme.fontFamily);

    localStorage.setItem('flyfree_theme', JSON.stringify(theme));
  }
}));
