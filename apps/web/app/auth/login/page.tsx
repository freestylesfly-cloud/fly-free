'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/app/stores/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { login, checkAuth, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Redirect if already logged in (non-blocking)
  useEffect(() => {
    if (user) {
      router.push('/');
    } else {
      // Check auth in background without blocking UI
      checkAuth().catch((err) => console.error('Auth check failed:', err));
    }
  }, [user, router, checkAuth]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed';
      console.error('Login error:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="w-full max-w-sm space-y-8">
        {/* Header with Logo */}
        <div className="text-center space-y-4">
          <Link href="/" className="inline-block">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)', borderWidth: '1px', borderColor: 'var(--border-color)' }}>
              <span className="text-3xl font-black" style={{ color: 'var(--color-primary)' }}>FF</span>
            </div>
          </Link>
          <h1 className="text-3xl font-black">Fly Free</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back to Fly Free</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Error Alert */}
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

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Password</label>
              <Link href="/auth/forgot-password" className="text-xs hover:underline" style={{ color: 'var(--color-primary)' }}>
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3" style={{ color: 'var(--text-secondary)' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        {/* Links */}
        <div className="text-center space-y-3">
          <p style={{ color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link href="/auth/signup" className="font-bold hover:underline" style={{ color: 'var(--color-primary)' }}>
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
