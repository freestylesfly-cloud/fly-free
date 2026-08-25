'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/app/stores/authStore';
import { AuthDrawerShell } from '../components/AuthDrawerShell';
import { signInWithGoogle } from '../../lib/supabase';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, checkAuth, user, hydrated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const nextPath = searchParams.get('next') || searchParams.get('redirect') || '/';

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Redirect after hydration check
  useEffect(() => {
    if (!hydrated) return;

    if (user) {
      setRedirecting(true);
      // Small delay to ensure state is fully updated
      const timer = setTimeout(() => {
        router.push(nextPath);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      checkAuth().catch(() => {});
    }
  }, [user, hydrated, router, checkAuth, nextPath]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setNeedsVerification(false);

    if (!email.trim() || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
      setRedirecting(true);
      // Don't manually redirect - let useEffect handle it
      // The useEffect will catch the user update and redirect
    } catch (err) {
      setRedirecting(false);
      const errorMsg = err instanceof Error ? err.message : 'Login failed';
      if (errorMsg.includes('verify your email') || errorMsg.includes('email first')) {
        setNeedsVerification(true);
        setError(null);
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const { error } = await signInWithGoogle(nextPath);
      if (error) throw error;
    } catch (err) {
      setGoogleLoading(false);
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    }
  };

  const handleResendCode = async () => {
    if (!email.trim()) return;

    setResendLoading(true);
    try {
      const response = await fetch('/api/auth/user/resend-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      if (!response.ok) throw new Error('Failed to resend');

      setResendTimer(60);
      setError(null);
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // Show loading state while redirecting
  if (redirecting) {
    return (
      <AuthDrawerShell title="Welcome back" subtitle="Sign in to checkout, track orders, and see your saved items.">
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <div className="w-8 h-8 border-4 border-transparent border-t-current rounded-full animate-spin" style={{ color: 'var(--color-primary)' }} />
          <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>Redirecting...</p>
        </div>
      </AuthDrawerShell>
    );
  }

  if (needsVerification) {
    return (
      <AuthDrawerShell title="Verify Your Email" subtitle="Check your inbox for a 6-digit code">
        <div className="space-y-6">
          <div className="text-center">
            <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
              Email not yet verified: <strong>{email}</strong>
            </p>
          </div>

          {error && (
            <div className="flex gap-3 rounded-lg border-2 p-4" style={{ borderColor: 'var(--color-accent)', backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)' }}>
              <AlertCircle size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--color-accent)' }} />
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleResendCode}
              disabled={resendLoading || resendTimer > 0}
              className="w-full h-12 rounded-lg font-black text-white transition flex items-center justify-center gap-2 uppercase tracking-wide hover:opacity-90 disabled:opacity-60"
              style={{
                backgroundColor: 'var(--color-primary)',
                cursor: (resendLoading || resendTimer > 0) ? 'not-allowed' : 'pointer',
              }}
            >
              {resendLoading && <Loader2 size={18} className="animate-spin" />}
              <span>
                {resendLoading
                  ? 'Sending...'
                  : resendTimer > 0
                  ? `Resend in ${resendTimer}s`
                  : 'Resend Code'}
              </span>
            </button>

            <Link
              href={`/auth/verify-email?email=${encodeURIComponent(email)}`}
              className="w-full h-12 rounded-lg font-bold transition flex items-center justify-center uppercase tracking-wide border-2 hover:bg-opacity-10"
              style={{
                borderColor: 'var(--color-primary)',
                color: 'var(--color-primary)',
                backgroundColor: 'transparent',
              }}
            >
              Enter Verification Code
            </Link>
          </div>

          <button
            onClick={() => { setNeedsVerification(false); setError(null); }}
            className="w-full text-sm font-bold transition hover:opacity-80"
            style={{ color: 'var(--color-primary)' }}
          >
            Back to Login
          </button>
        </div>
      </AuthDrawerShell>
    );
  }

  return (
    <AuthDrawerShell title="Welcome back" subtitle="Sign in to checkout, track orders, and see your saved items.">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex gap-3 rounded-lg border-2 p-4" style={{ borderColor: 'var(--color-accent)', backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)' }}>
            <AlertCircle size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--color-accent)' }} />
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border-2 bg-white px-4 font-black text-black transition hover:bg-slate-50 disabled:opacity-60"
            style={{ borderColor: 'var(--border-color)' }}
          >
            {googleLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            <span>{googleLoading ? 'Opening Google...' : 'Continue with Google'}</span>
          </button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center" style={{ borderTopColor: 'var(--border-color)', borderTopWidth: '2px' }} />
            <div className="relative flex justify-center text-sm" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <span className="px-2" style={{ color: 'var(--text-secondary)' }}>or use email</span>
            </div>
          </div>
        </div>

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
          className="w-full h-12 rounded-lg font-black text-white transition flex items-center justify-center gap-2 uppercase tracking-wide hover:opacity-90 disabled:opacity-60"
          style={{
            backgroundColor: 'var(--color-primary)',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
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
          className="w-full h-12 rounded-lg font-bold transition flex items-center justify-center uppercase tracking-wide border-2 hover:bg-opacity-10"
          style={{
            borderColor: 'var(--color-primary)',
            color: 'var(--color-primary)',
            backgroundColor: 'transparent',
          }}
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

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
