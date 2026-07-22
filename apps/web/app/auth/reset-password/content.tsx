'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { updatePassword, getSession } from '@/app/lib/supabase';

export default function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const session = await getSession();
    if (!session) {
      setError('Session expired. Please request a new password reset link.');
      return;
    }
    setIsValidSession(true);
  };

  const validatePassword = (): boolean => {
    if (!password) {
      setError('Password is required');
      return false;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }

    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter');
      return false;
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validatePassword()) {
      return;
    }

    setLoading(true);

    try {
      const { data, error: updateError } = await updatePassword(password);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!isValidSession && error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="flex justify-center">
            <AlertCircle size={64} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black">Session Expired</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
          </div>
          <Link
            href="/auth/forgot-password"
            className="inline-flex items-center gap-2 font-bold hover:underline"
            style={{ color: 'var(--color-primary)' }}
          >
            Request new reset link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle size={64} style={{ color: 'var(--color-primary)' }} className="animate-bounce" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black">Password Reset!</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Your password has been successfully updated. Redirecting to login...</p>
          </div>
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
          <p style={{ color: 'var(--text-secondary)' }}>Create a new password</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg border p-4 flex gap-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'color-mix(in srgb, red 10%, transparent)' }}>
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{error}</p>
            </div>
          )}

          {/* Password Field */}
          <div className="space-y-2">
            <label className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>New Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3" style={{ color: 'var(--text-secondary)' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  borderWidth: '1px'
                }}
              />
            </div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Min 8 chars, 1 uppercase, 1 lowercase, 1 number
            </p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Confirm Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3" style={{ color: 'var(--text-secondary)' }} />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
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
                Resetting password...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        {/* Links */}
        <div className="text-center">
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
    </div>
  );
}
