'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { AuthDrawerShell } from '../components/AuthDrawerShell';

export default function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const emailFromQuery = searchParams.get('email');
    if (emailFromQuery) setEmail(emailFromQuery);
  }, [searchParams]);

  function validateForm() {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email');
      return false;
    }

    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6-digit OTP code from your email');
      return false;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          newPassword: password
        })
      });

      if (!res.ok) {
        const err = await parseResponseError(res);
        throw new Error(err.error || err.message || 'Failed to reset password');
      }

      setSuccess(true);
      setTimeout(() => router.push('/auth/login'), 1800);
    } catch (err) {
      setError(err instanceof TypeError ? 'Could not reach the server. Please make sure the API is running on port 3001.' : err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthDrawerShell title="Set a new password" subtitle="Enter the code from your email and choose a new password.">
      {success ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center space-y-4 text-center">
          <CheckCircle size={64} style={{ color: 'var(--color-primary)' }} />
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Password updated</h1>
          <p className="leading-7" style={{ color: 'var(--text-secondary)' }}>Your password was changed. Redirecting to login...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex gap-3 rounded-lg border-2 p-4" style={{ borderColor: 'var(--color-accent)', backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)' }}>
              <AlertCircle size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--color-accent)' }} />
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{error}</p>
            </div>
          )}

          <label className="block">
            <span className="mb-2 block text-sm font-black" style={{ color: 'var(--text-primary)' }}>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              autoComplete="email"
              className="h-12 w-full rounded-lg border-2 px-4 text-base font-medium transition focus:outline-none"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-black" style={{ color: 'var(--text-primary)' }}>OTP Code</span>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="h-12 w-full rounded-lg border-2 px-4 text-center text-xl font-black tracking-[0.35em] transition focus:outline-none"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-black" style={{ color: 'var(--text-primary)' }}>New Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              className="h-12 w-full rounded-lg border-2 px-4 text-base font-medium transition focus:outline-none"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-black" style={{ color: 'var(--text-primary)' }}>Confirm Password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              autoComplete="new-password"
              className="h-12 w-full rounded-lg border-2 px-4 text-base font-medium transition focus:outline-none"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg font-black uppercase tracking-wide text-white transition hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-primary)', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            <span>{loading ? 'Updating...' : 'Change Password'}</span>
          </button>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold">
            <Link href="/auth/forgot-password" className="transition hover:opacity-80" style={{ color: 'var(--color-primary)' }}>
              Send code again
            </Link>
            <Link href="/auth/login" className="transition hover:opacity-80" style={{ color: 'var(--color-primary)' }}>
              Back to login
            </Link>
          </div>
        </form>
      )}
    </AuthDrawerShell>
  );
}

async function parseResponseError(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return { error: text || `Request failed with status ${response.status}` };
}
