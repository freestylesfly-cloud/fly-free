'use client';

import { useEffect } from 'react';
import { useThemeStore } from '../../src/store/themeStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useThemeStore();

  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.setAttribute('data-theme', 'dark');
    } else {
      html.removeAttribute('data-theme');
    }
  }, [isDarkMode]);

  return <>{children}</>;
}
