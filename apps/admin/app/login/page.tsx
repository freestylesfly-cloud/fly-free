'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
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
      window.location.replace(nextPath);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ink via-ink/95 to-ink/90 px-5">
      {/* Background animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-coral/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-mint/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-coral to-mint flex items-center justify-center">
              <span className="text-2xl font-black text-white">FF</span>
            </div>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Fly Free Admin</h1>
          <p className="text-white/60">Commerce operations dashboard</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 space-y-5">
          {/* Error message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm animate-shake">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/20 border border-green-500/50 text-green-100 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Email field */}
          <div>
            <label className="block text-sm font-bold text-white/80 mb-2">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-3.5 text-white/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@flyfree.com"
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-coral focus:ring-2 focus:ring-coral/50 transition-all"
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label className="block text-sm font-bold text-white/80 mb-2">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3.5 text-white/40" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-10 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-coral focus:ring-2 focus:ring-coral/50 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-white/40 hover:text-white/60 transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot password */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-white/60 hover:text-white/80 transition cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-white/20 accent-coral" />
              Remember me
            </label>
            <Link href="#" className="text-coral hover:text-coral/80 font-bold transition">
              Forgot password?
            </Link>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-gradient-to-r from-coral to-coral hover:from-coral/90 hover:to-coral/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 group"
          >
            {authLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gradient-to-br from-ink via-ink/95 to-ink/90 text-white/60">or continue with</span>
            </div>
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2 rounded-lg font-bold transition-all duration-300"
            >
              Google
            </button>
            <button
              type="button"
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2 rounded-lg font-bold transition-all duration-300"
            >
              GitHub
            </button>
          </div>
        </form>

        {/* Footer */}
        <p className="text-center text-white/60 text-sm mt-6">
          Don't have access?{' '}
          <Link href="#" className="text-coral hover:text-coral/80 font-bold transition">
            Request invite
          </Link>
        </p>
      </div>

      {/* Animated background shapes */}
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
