'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { AuthDrawerShell } from '../components/AuthDrawerShell';
import { readGoogleSignInResult } from '../../lib/googleSignIn';
import { useAuthStore } from '../../stores/authStore';

/**
 * Where "Continue with Google" lands. The API has already checked the sign-in
 * with Google and put our own login token in the URL fragment; this page checks
 * it belongs to this tab, stores it, and moves on.
 */
function AuthCallbackContent() {
  const router = useRouter();
  const googleLogin = useAuthStore((state) => state.googleLogin);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function finishLogin() {
      const result = readGoogleSignInResult();
      if (!result) {
        // Nothing to finish (a refresh, or opened directly): start over.
        router.replace('/auth/login');
        return;
      }
      if (!result.ok) {
        setError(result.error);
        return;
      }
      try {
        await googleLogin(result.token);
        if (!cancelled) router.replace(result.next);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not finish Google sign-in.');
      }
    }

    finishLogin();
    return () => {
      cancelled = true;
    };
  }, [googleLogin, router]);

  return (
    <AuthDrawerShell title={error ? 'Sign-in failed' : 'Signing you in'} subtitle="Connecting your Google account to Fly Free.">
      {error ? (
        <div className="flex gap-3 rounded-lg border-2 p-4" style={{ borderColor: 'var(--color-accent)', backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)' }}>
          <AlertCircle size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--color-accent)' }} />
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{error}</p>
            <a href="/auth/login" className="mt-2 inline-block text-sm font-black underline" style={{ color: 'var(--color-primary)' }}>
              Back to sign in
            </a>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <Loader2 size={34} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
          <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>Please wait...</p>
        </div>
      )}
    </AuthDrawerShell>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthDrawerShell title="Signing you in"><div className="h-10" /></AuthDrawerShell>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
