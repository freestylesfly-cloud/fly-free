'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Loader2, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { AuthLogo } from '../../components/AuthLogo';
import { getApiBaseUrl } from '../../lib/api';

const API_URL = getApiBaseUrl();

export default function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/user/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Verification failed');
      }

      setSuccess(true);
      setTimeout(() => router.push('/auth/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/user/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!res.ok) throw new Error('Failed to resend');

      setResendTimer(60);
      setError('');
    } catch (err) {
      setError('Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-full max-w-sm text-center space-y-6">
          <CheckCircle size={64} className="mx-auto" style={{ color: 'var(--color-primary)' }} />
          <div className="space-y-2">
            <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Email Verified!</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Your email has been verified successfully. Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <AuthLogo />
        </div>

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Verify Your Email</h1>
            <p style={{ color: 'var(--text-secondary)' }}>We sent a 6-digit code to {email}</p>
          </div>

          {error && (
            <div className="rounded-lg border p-4 flex gap-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'color-mix(in srgb, red 10%, transparent)' }}>
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Verification Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest rounded-lg focus:outline-none focus:ring-2 transition"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  borderWidth: '1px',
                  letterSpacing: '0.5em'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full text-white font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify Email
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={handleResend}
              disabled={resendTimer > 0 || resendLoading}
              className="text-sm font-bold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: 'var(--color-primary)' }}
            >
              {resendLoading ? (
                'Sending...'
              ) : resendTimer > 0 ? (
                `Resend code in ${resendTimer}s`
              ) : (
                "Didn't receive code? Resend"
              )}
            </button>
          </div>
        </div>

        <div className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          Want to change email?
          <Link href="/auth/signup" className="font-bold hover:underline" style={{ color: 'var(--color-primary)' }}>
            Create new account
          </Link>
        </div>
      </div>
    </div>
  );
}
