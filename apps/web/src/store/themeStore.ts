import { create } from 'zustand';
import { persist } from 'zustand/middleware';

function getApiBaseUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const baseUrl = rawUrl.replace(/\/$/, '');
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
}

interface WebsiteTheme {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor: string;
  fontFamily: string;
  animationStyle: string;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroDesktopImageUrl?: string | null;
  heroMobileImageUrl?: string | null;
  heroCtaLabel?: string | null;
  heroHref?: string | null;
}

interface ThemeState {
  // UI Theme (light/dark/system)
  uiTheme: 'light' | 'dark' | 'system';
  resolvedUiTheme: 'light' | 'dark';

  // Admin Website Theme (global app skin)
  adminTheme: WebsiteTheme | null;
  adminThemeLoading: boolean;

  // Methods
  setUiTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleUiTheme: () => void;
  setAdminTheme: (theme: WebsiteTheme) => void;
  fetchActiveTheme: () => Promise<void>;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      uiTheme: 'system',
      resolvedUiTheme: 'light',
      adminTheme: null,
      adminThemeLoading: false,

      setUiTheme: (theme: 'light' | 'dark' | 'system') => {
        set({ uiTheme: theme });
        applyUiTheme(theme);
      },

      toggleUiTheme: () => {
        const state = get();
        const newTheme = state.resolvedUiTheme === 'dark' ? 'light' : 'dark';
        set({ uiTheme: newTheme });
        applyUiTheme(newTheme);
      },

      setAdminTheme: (theme: AdminTheme) => {
        set({ adminTheme: theme });
        applyAdminTheme(theme);
      },

      fetchActiveTheme: async () => {
        set({ adminThemeLoading: true });
        try {
          const response = await fetch(`${getApiBaseUrl()}/cms/home`);
          if (response.ok) {
            const home = await response.json();
            const websiteTheme = home?.websiteTheme;
            if (websiteTheme) {
              set({ adminTheme: websiteTheme });
              applyAdminTheme(websiteTheme);
            }
          }
        } catch (error) {
          console.error('Failed to fetch active theme:', error);
        } finally {
          set({ adminThemeLoading: false });
        }
      },

      initTheme: () => {
        const stored = localStorage.getItem('fly-free-theme');
        if (stored) {
          try {
            const { state } = JSON.parse(stored);
            applyUiTheme(state.uiTheme || 'system');
          } catch {
            applyUiTheme('system');
          }
        } else {
          applyUiTheme('system');
        }

        // Fetch active admin theme
        get().fetchActiveTheme();

        // Listen for system theme changes
        if (typeof window !== 'undefined') {
          window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            const store = get();
            if (store.uiTheme === 'system') {
              applyUiTheme('system');
            }
          });
        }
      },
    }),
    {
      name: 'fly-free-theme',
      partialize: (state) => ({
        uiTheme: state.uiTheme,
        adminTheme: state.adminTheme,
      }),
    }
  )
);

function applyUiTheme(theme: 'light' | 'dark' | 'system') {
  const html = document.documentElement;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    html.setAttribute('data-theme', 'dark');
    useThemeStore.setState({ resolvedUiTheme: 'dark' });
  } else {
    html.setAttribute('data-theme', 'light');
    useThemeStore.setState({ resolvedUiTheme: 'light' });
  }
}

function applyAdminTheme(theme: WebsiteTheme) {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.primaryColor);
  root.style.setProperty('--color-secondary', theme.secondaryColor);
  root.style.setProperty('--color-accent', theme.accentColor);
  if (theme.backgroundColor) root.style.setProperty('--website-bg', theme.backgroundColor);
  if (theme.textColor) root.style.setProperty('--website-text', theme.textColor);
  root.style.setProperty('--font-family', theme.fontFamily);
  root.style.setProperty('--campaign-gradient', `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`);
  root.setAttribute('data-website-theme', theme.slug);
  root.setAttribute('data-campaign-motion', theme.animationStyle || 'fade');
}
