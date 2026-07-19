'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { getApiBaseUrl, readApiResponse } from '../../lib/api';

const API_BASE = getApiBaseUrl();

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailLoading />}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/user/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(data?.error || 'Verification failed');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResending(true);

    try {
      const response = await fetch(`${API_BASE}/auth/user/resend-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to resend');
      }

      setCode('');
      setCooldown(60);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ink via-ink to-coral/10 px-5">
        <div className="w-full max-w-sm text-center space-y-6">
          <CheckCircle size={64} className="mx-auto text-coral animate-bounce" />
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">Email Verified!</h1>
            <p className="text-white/70">Your account is ready. Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ink via-ink to-coral/10 px-5 py-10">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Mail size={48} className="text-coral" />
          </div>
          <h1 className="text-3xl font-black text-white">Verify Your Email</h1>
          <p className="text-white/60">We sent a code to {email || 'your email'}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-5">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex gap-3">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Code Input */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-white">Verification Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-lg text-white text-center text-2xl font-bold placeholder:text-white/40 focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral tracking-widest"
            />
            <p className="text-xs text-white/50 text-center">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-gradient-to-r from-coral to-mint text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-coral/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Email'
            )}
          </button>
        </form>

        {/* Resend */}
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-white/60 text-sm">Didn't receive the code?</p>
          </div>

          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="w-full border-2 border-white/20 text-white font-bold py-2 rounded-lg hover:border-coral hover:text-coral disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {resending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
          </button>
        </div>

        {/* Links */}
        <div className="text-center">
          <Link href="/auth/login" className="text-coral font-bold hover:underline text-sm">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

function VerifyEmailLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ink via-ink to-coral/10 px-5">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={36} className="animate-spin text-coral" />
        <p className="font-bold text-white">Loading verification...</p>
      </div>
    </div>
  );
}
