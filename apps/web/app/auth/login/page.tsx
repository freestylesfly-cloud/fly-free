'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/app/stores/authStore';
import { AuthDrawerShell } from '../components/AuthDrawerShell';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, checkAuth, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const nextPath = searchParams.get('next') || searchParams.get('redirect') || '/';

  useEffect(() => {
    if (user) {
      router.push(nextPath);
    } else {
      checkAuth().catch(() => {});
    }
  }, [user, router, checkAuth, nextPath]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      router.push(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthDrawerShell title="Login">
      <form onSubmit={handleSubmit} className="space-y-9">
        {error && (
          <div className="flex gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-9">
          <label className="block">
            <span className="sr-only">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email *"
              autoComplete="email"
              className="h-[52px] w-full border border-black/30 px-4 text-base outline-none transition focus:border-black"
            />
          </label>

          <label className="block">
            <span className="sr-only">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password *"
              autoComplete="current-password"
              className="h-[52px] w-full border border-black/15 px-4 text-base outline-none transition focus:border-black"
            />
          </label>
        </div>

        <Link href="/auth/forgot-password" className="-mt-6 inline-block text-base text-black/55 underline underline-offset-2 hover:text-black">
          Forgot your password?
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="flex h-[50px] w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <Link href={`/auth/signup?next=${encodeURIComponent(nextPath)}`} className="inline-block text-base text-primary underline underline-offset-2 hover:opacity-80">
          New customer? Create your account
        </Link>
      </form>
    </AuthDrawerShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthDrawerShell title="Login"><div className="h-10" /></AuthDrawerShell>}>
      <LoginContent />
    </Suspense>
  );
}
