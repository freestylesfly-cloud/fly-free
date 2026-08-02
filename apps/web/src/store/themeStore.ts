import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Light/dark preference only.
 *
 * Brand colours, fonts and motion are compile-time constants in
 * `app/lib/design.ts` — they are no longer fetched from the API, so there is
 * nothing here to load and nothing to flash on first paint.
 */
interface ThemeState {
  uiTheme: 'light' | 'dark' | 'system';
  resolvedUiTheme: 'light' | 'dark';

  setUiTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleUiTheme: () => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      uiTheme: 'system',
      resolvedUiTheme: 'light',

      setUiTheme: (theme) => {
        set({ uiTheme: theme });
        applyUiTheme(theme);
      },

      toggleUiTheme: () => {
        const next = get().resolvedUiTheme === 'dark' ? 'light' : 'dark';
        set({ uiTheme: next });
        applyUiTheme(next);
      },

      initTheme: () => {
        applyUiTheme(get().uiTheme || 'system');

        if (typeof window !== 'undefined') {
          window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (get().uiTheme === 'system') applyUiTheme('system');
          });
        }
      }
    }),
    {
      name: 'fly-free-theme',
      partialize: (state) => ({ uiTheme: state.uiTheme })
    }
  )
);

function applyUiTheme(theme: 'light' | 'dark' | 'system') {
  if (typeof window === 'undefined') return;

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  useThemeStore.setState({ resolvedUiTheme: isDark ? 'dark' : 'light' });
}
