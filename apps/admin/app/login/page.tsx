'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function AdminLoginPage() {
  const login = useAuthStore((state) => state.login);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const authLoading = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [nextPath, setNextPath] = useState('/');

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get('next');
    if (next?.startsWith('/')) {
      setNextPath(next);
    }

    void checkAuth();
  }, [checkAuth]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      window.location.replace(nextPath);
    }
  }, [user, nextPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await login(email, password);
      setSuccess('Login successful. Opening dashboard...');

      // Wait a moment for state to update, then redirect
      setTimeout(() => {
        window.location.href = nextPath;
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 px-5 py-10">
      <div className="w-full max-w-md">
        {/* Logo renders at its natural aspect ratio — no square crop box. */}
        <div className="mb-9 text-center">
          <img
            src="/brand/logo.png"
            alt="Fly Free"
            className="mx-auto object-contain"
            style={{ height: 72, width: 'auto', maxWidth: 240 }}
          />
          <h1 className="mt-6 text-3xl font-black tracking-tight text-gray-900">Fly Free Admin</h1>
          <p className="mt-2 text-sm text-gray-500">Secure administrator login</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-xl"
        >
          {error && (
            <div className="animate-shake rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
              {success}
            </div>
          )}

          <div>
            <label htmlFor="admin-email" className="mb-2 block text-sm font-bold text-gray-700">
              Email
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@flyfree.com"
                className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-gray-900 placeholder:text-gray-400 transition-all focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-200"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-password" className="mb-2 block text-sm font-bold text-gray-700">
              Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-11 text-gray-900 placeholder:text-gray-400 transition-all focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400 transition hover:text-gray-900"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gray-900 font-semibold text-white transition-all duration-300 hover:bg-black hover:shadow-lg disabled:opacity-60"
          >
            {authLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Signing in...
              </>
            ) : (
              'Login to Dashboard'
            )}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </main>
  );
}
