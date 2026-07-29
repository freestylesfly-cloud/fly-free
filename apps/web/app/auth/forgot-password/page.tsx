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
        <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
          <CheckCircle size={64} className="mb-5 text-primary" />
          <h1 className="text-2xl font-black">Check your email</h1>
          <p className="mt-3 leading-7 text-black/60">We sent password reset instructions to {email}.</p>
          <Link href="/auth/login" className="mt-8 text-base text-primary underline underline-offset-2">
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-9">
          {error && (
            <div className="flex gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email *"
            autoComplete="email"
            className="h-[52px] w-full border border-black/30 px-4 text-base outline-none transition focus:border-black"
          />

          <button
            type="submit"
            disabled={loading}
            className="flex h-[50px] w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <Link href="/auth/login" className="inline-block text-base text-black/55 underline underline-offset-2 hover:text-black">
            Remember your password? Login here
          </Link>
        </form>
      )}
    </AuthDrawerShell>
  );
}
