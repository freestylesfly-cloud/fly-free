'use client';

import { useEffect } from 'react';
import { useThemeStore } from '../../src/store/themeStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { resolvedUiTheme } = useThemeStore();

  useEffect(() => {
    const html = document.documentElement;
    if (resolvedUiTheme === 'dark') {
      html.setAttribute('data-theme', 'dark');
    } else {
      html.removeAttribute('data-theme');
    }
  }, [resolvedUiTheme]);

  return <>{children}</>;
}
