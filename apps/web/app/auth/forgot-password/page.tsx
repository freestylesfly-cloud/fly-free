'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { resetPassword } from '@/app/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);

    try {
      const { data, error: resetError } = await resetPassword(email);

      if (resetError) {
        throw new Error(resetError.message);
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle size={64} style={{ color: 'var(--color-primary)' }} className="animate-bounce" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black">Check your email</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Click the link in the email to reset your password. Link expires in 24 hours.
            </p>
          </div>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 font-bold hover:underline"
            style={{ color: 'var(--color-primary)' }}
          >
            <ArrowLeft size={18} />
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <Link href="/" className="inline-block">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)', borderWidth: '1px', borderColor: 'var(--border-color)' }}>
              <span className="text-3xl font-black" style={{ color: 'var(--color-primary)' }}>FF</span>
            </div>
          </Link>
          <h1 className="text-3xl font-black">Fly Free</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Reset your password</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg border p-4 flex gap-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'color-mix(in srgb, red 10%, transparent)' }}>
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{error}</p>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-3" style={{ color: 'var(--text-secondary)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  borderWidth: '1px'
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Sending reset link...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        {/* Links */}
        <div className="text-center">
          <p style={{ color: 'var(--text-secondary)' }}>
            Remember your password?{' '}
            <Link href="/auth/login" className="font-bold hover:underline" style={{ color: 'var(--color-primary)' }}>
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
