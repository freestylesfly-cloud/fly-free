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
    <AuthDrawerShell title="Welcome Back">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex gap-3 rounded-lg border-2 p-4" style={{ borderColor: '#dc2626', backgroundColor: 'rgba(220, 38, 38, 0.1)' }}>
            <AlertCircle size={18} className="mt-0.5 shrink-0" style={{ color: '#dc2626' }} />
            <p className="text-sm font-bold" style={{ color: '#dc2626' }}>{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <label className="block">
            <span className="sr-only">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              autoComplete="email"
              className="w-full h-12 px-4 rounded-lg border-2 text-base font-medium transition focus:outline-none"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            />
          </label>

          <label className="block">
            <span className="sr-only">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full h-12 px-4 rounded-lg border-2 text-base font-medium transition focus:outline-none"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            />
          </label>
        </div>

        <Link
          href="/auth/forgot-password"
          className="inline-block text-sm font-bold transition hover:opacity-80"
          style={{ color: 'var(--color-primary)' }}
        >
          Forgot password?
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-lg font-black text-white transition flex items-center justify-center gap-2 uppercase tracking-wide"
          style={{
            backgroundColor: loading ? 'var(--color-primary)' : 'var(--color-primary)',
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
          onHover={(e) => !loading && (e.currentTarget.style.opacity = '0.9')}
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          <span>{loading ? 'Signing In...' : 'Sign In'}</span>
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" style={{ borderTopColor: 'var(--border-color)', borderTopWidth: '2px' }} />
          <div className="relative flex justify-center text-sm" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <span className="px-2" style={{ color: 'var(--text-secondary)' }}>New customer?</span>
          </div>
        </div>

        <Link
          href={`/auth/signup?next=${encodeURIComponent(nextPath)}`}
          className="w-full h-12 rounded-lg font-bold transition flex items-center justify-center uppercase tracking-wide border-2"
          style={{
            borderColor: 'var(--color-primary)',
            color: 'var(--color-primary)',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)' + '15'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          Create Account
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
