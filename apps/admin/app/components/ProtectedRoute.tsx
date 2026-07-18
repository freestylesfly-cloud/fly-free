'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/authStore';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const hydrated = useAuthStore((state) => state.hydrated);
  const loginHref = `/login?next=${encodeURIComponent(pathname || '/')}`;

  useEffect(() => {
    useAuthStore.getState().checkAuth();
  }, []);

  useEffect(() => {
    if (hydrated && !loading && !user) {
      router.replace(loginHref);
    }
  }, [hydrated, loading, loginHref, router, user]);

  if (!hydrated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ink via-ink to-coral/10">
        <div className="text-center space-y-4">
          <div className="inline-block">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-coral to-mint animate-spin" />
          </div>
          <p className="text-white font-bold text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ink via-ink to-coral/10 px-5">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-coral to-mint">
            <span className="text-lg font-black text-white">FF</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-white">Opening login...</h1>
            <p className="text-sm leading-6 text-white/65">
              Your admin session is not active. If the page does not move automatically, use the button below.
            </p>
          </div>
          <Link
            href={loginHref}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-coral px-5 text-sm font-bold text-white transition hover:bg-coral/90"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
