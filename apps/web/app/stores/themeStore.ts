import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeStore {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  adminTheme: {
    primary: string;
    secondary: string;
    accentColor: string;
  } | null;
  setTheme: (theme: Theme) => void;
  setAdminTheme: (theme: any) => void;
  initTheme: () => void;
}

const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'system',
      resolvedTheme: 'dark',
      adminTheme: null,

      setTheme: (theme: Theme) => {
        set({ theme });
        applyTheme(theme);
      },

      setAdminTheme: (adminTheme) => {
        set({ adminTheme });
        applyAdminTheme(adminTheme);
      },

      initTheme: () => {
        const stored = localStorage.getItem('theme-store');
        if (stored) {
          const { state } = JSON.parse(stored);
          applyTheme(state.theme);
        } else {
          applyTheme('system');
        }
      }
    }),
    {
      name: 'theme-store'
    }
  )
);

function applyTheme(theme: Theme) {
  const html = document.documentElement;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    html.classList.add('dark');
    html.setAttribute('data-theme', 'dark');
    useThemeStore.setState({ resolvedTheme: 'dark' });
  } else {
    html.classList.remove('dark');
    html.setAttribute('data-theme', 'light');
    useThemeStore.setState({ resolvedTheme: 'light' });
  }
}

function applyAdminTheme(theme: any) {
  if (!theme) return;

  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.primary);
  root.style.setProperty('--color-secondary', theme.secondary);
  root.style.setProperty('--color-accent', theme.accentColor);
}

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const store = useThemeStore.getState();
    if (store.theme === 'system') {
      applyTheme('system');
    }
  });
}

export { useThemeStore };
