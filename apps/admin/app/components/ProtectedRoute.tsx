'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../stores/authStore';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const hydrated = useAuthStore((state) => state.hydrated);
  const loginHref = `/login?next=${encodeURIComponent(pathname || '/')}`;

  useEffect(() => {
    if (!useAuthStore.getState().hydrated) {
      useAuthStore.getState().checkAuth();
    }
  }, []);

  useEffect(() => {
    if (hydrated && !loading && !user) {
      window.location.replace(loginHref);
    }
  }, [hydrated, loading, loginHref, user]);

  if (!hydrated || (loading && !user)) {
    return (
      <div className="min-h-screen bg-[#f6f7fb]">
        <div className="h-1 w-full overflow-hidden bg-black/5">
          <div className="h-full w-1/3 animate-pulse bg-coral" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f7fb] px-5">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-ink">
            <span className="text-lg font-black text-white">FF</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-ink">Opening login</h1>
            <p className="text-sm leading-6 text-black/60">
              Your admin session is not active. If the page does not move automatically, use the button below.
            </p>
          </div>
          <a
            href={loginHref}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-coral px-5 text-sm font-bold text-white transition hover:bg-coral/90"
          >
            Go to login
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
