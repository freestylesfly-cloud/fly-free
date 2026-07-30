'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { AuthDrawerShell } from '../components/AuthDrawerShell';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/user/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      if (!res.ok) {
        const err = await res.json();
        const message = Array.isArray(err.message) ? err.message.join(', ') : err.message;
        throw new Error(message || err.error || 'Failed to send reset email');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthDrawerShell title="Reset">
      {success ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center text-center space-y-4">
          <CheckCircle size={64} style={{ color: 'var(--color-primary)' }} />
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Check your email</h1>
          <p className="mt-3 leading-7" style={{ color: 'var(--text-secondary)' }}>We sent password reset instructions to <strong>{email}</strong>.</p>
          <Link href="/auth/login" className="mt-8 text-base font-semibold underline underline-offset-2 hover:opacity-80 transition" style={{ color: 'var(--color-primary)' }}>
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex gap-3 rounded-lg border-2 p-4" style={{ borderColor: '#dc2626', backgroundColor: 'rgba(220, 38, 38, 0.1)' }}>
              <AlertCircle size={18} className="mt-0.5 shrink-0" style={{ color: '#dc2626' }} />
              <p className="text-sm font-bold" style={{ color: '#dc2626' }}>{error}</p>
            </div>
          )}

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
            <span>{loading ? 'Sending...' : 'Send Reset Link'}</span>
          </button>

          <Link href="/auth/login" className="inline-block text-sm font-semibold transition hover:opacity-80" style={{ color: 'var(--color-primary)' }}>
            Remember your password? Login here
          </Link>
        </form>
      )}
    </AuthDrawerShell>
  );
}
