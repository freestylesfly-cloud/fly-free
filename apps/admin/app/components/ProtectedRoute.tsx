'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/authStore';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    // Check auth on mount
    useAuthStore.getState().checkAuth();
  }, []);

  useEffect(() => {
    // Redirect to login if not authenticated and not loading
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Show loading state
  if (loading) {
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

  // Show nothing while redirecting
  if (!user) {
    return null;
  }

  // User is authenticated, show content
  return <>{children}</>;
}
