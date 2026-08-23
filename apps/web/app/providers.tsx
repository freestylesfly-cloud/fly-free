'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from '../src/store/themeStore';
import { trackEvent } from './lib/analytics';

export function Providers({ children }: { children: ReactNode }) {
  const { checkAuth } = useAuthStore();
  const { initTheme } = useThemeStore();
  const pathname = usePathname();

  useEffect(() => {
    if (
      window.location.hash.includes('access_token=') &&
      !window.location.pathname.startsWith('/auth/callback')
    ) {
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      callbackUrl.hash = window.location.hash.slice(1);
      window.location.replace(callbackUrl.toString());
      return;
    }

    // Initialize UI theme and fetch admin theme
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

  useEffect(() => {
    const query = window.location.search;
    trackEvent('page_view', { path: `${pathname}${query}` });
  }, [pathname]);

  return <>{children}</>;
}
