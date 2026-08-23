'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { AuthDrawerShell } from '../components/AuthDrawerShell';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabaseLogin = useAuthStore((state) => state.supabaseLogin);
  const [error, setError] = useState('');
  const nextPath = searchParams.get('next') || '/';

  useEffect(() => {
    let cancelled = false;

    async function finishLogin() {
      try {
        if (!supabase) {
          throw new Error('Supabase auth is not configured.');
        }

        let sessionResult = await supabase.auth.getSession();
        if (sessionResult.error) throw sessionResult.error;

        if (!sessionResult.data.session?.access_token && window.location.hash.includes('access_token=')) {
          await new Promise((resolve) => setTimeout(resolve, 250));
          sessionResult = await supabase.auth.getSession();
          if (sessionResult.error) throw sessionResult.error;
        }

        if (!sessionResult.data.session?.access_token) {
          throw new Error('Google sign-in did not return a Supabase session.');
        }

        await supabaseLogin(sessionResult.data.session.access_token);
        if (!cancelled) router.replace(nextPath);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not finish Google sign-in.');
        }
      }
    }

    finishLogin();

    return () => {
      cancelled = true;
    };
  }, [nextPath, router, supabaseLogin]);

  return (
    <AuthDrawerShell title={error ? 'Sign-in failed' : 'Signing you in'} subtitle="Connecting your Google account to Fly Free.">
      {error ? (
        <div className="flex gap-3 rounded-lg border-2 p-4" style={{ borderColor: '#dc2626', backgroundColor: 'rgba(220, 38, 38, 0.1)' }}>
          <AlertCircle size={18} className="mt-0.5 shrink-0" style={{ color: '#dc2626' }} />
          <p className="text-sm font-bold" style={{ color: '#dc2626' }}>{error}</p>
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
