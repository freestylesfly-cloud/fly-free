import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ThemeName } from '@flyfree/types';
import { DEFAULT_THEME } from '../config/themes';

interface ThemeState {
  currentTheme: ThemeName;
  isDarkMode: boolean;
  setTheme: (theme: ThemeName) => void;
  toggleDarkMode: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      currentTheme: DEFAULT_THEME,
      isDarkMode: false,

      setTheme: (theme: ThemeName) => {
        set({ currentTheme: theme });
        document.documentElement.setAttribute('data-theme', theme);
      },

      toggleDarkMode: () =>
        set((state) => {
          const newDarkMode = !state.isDarkMode;
          const theme = newDarkMode ? 'dark' : state.currentTheme;
          document.documentElement.setAttribute('data-theme', theme);
          return { isDarkMode: newDarkMode };
        }),
    }),
    {
      name: 'fly-free-theme',
      partialize: (state) => ({
        currentTheme: state.currentTheme,
        isDarkMode: state.isDarkMode,
      }),
    }
  )
);
