'use client';

import { ReactNode, useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';

export function Providers({ children }: { children: ReactNode }) {
  const { checkAuth } = useAuthStore();
  const { initTheme } = useThemeStore();

  useEffect(() => {
    // Initialize theme from localStorage
    initTheme();

    // Check if user is logged in
    checkAuth();

    // Check internet connectivity
    const handleOnline = () => {
      document.body.setAttribute('data-online', 'true');
      console.log('✅ Back online');
    };

    const handleOffline = () => {
      document.body.setAttribute('data-online', 'false');
      console.log('❌ No internet connection');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial online status
    if (navigator.onLine) {
      document.body.setAttribute('data-online', 'true');
    } else {
      document.body.setAttribute('data-online', 'false');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkAuth, initTheme]);

  return <>{children}</>;
}
