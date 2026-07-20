'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Mail, Lock, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
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

      // Wait a moment for state to update, then redirect
      setTimeout(() => {
        window.location.href = nextPath;
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <main className="min-h-screen bg-[#101318] text-white">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_480px]">
        <section className="hidden min-h-screen flex-col justify-between bg-gradient-to-br from-[#101318] via-[#151922] to-[#243b3a] p-10 lg:flex">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded border border-white/15 bg-white shadow-xl overflow-hidden">
              <img src="/logo.png" alt="Fly Free" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-xl font-black uppercase tracking-wide">Fly Free</p>
              <p className="text-sm text-white/55">Admin operations suite</p>
            </div>
          </div>

          <div className="max-w-xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded border border-white/15 px-3 py-2 text-sm font-bold text-white/70">
              <ShieldCheck size={16} /> Secure admin access
            </p>
            <h1 className="text-6xl font-black leading-none tracking-normal">Commerce control, without the clutter.</h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-white/65">
              Manage orders, users, products, influencers, invoices, emails, pages, and notifications from one database-backed dashboard.
            </p>
          </div>

          <p className="text-sm text-white/45">Fly Free Admin / Production-ready workflow</p>
        </section>

        <section className="flex min-h-screen items-center justify-center bg-[#f7f7f4] px-5 py-8 text-ink">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:hidden">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded bg-ink overflow-hidden">
                <img src="/logo.png" alt="Fly Free" className="h-full w-full object-contain" />
              </div>
              <h1 className="text-3xl font-black">Fly Free Admin</h1>
              <p className="mt-1 text-sm text-black/55">Commerce operations dashboard</p>
            </div>

            <div className="mb-6">
              <p className="text-sm font-bold uppercase tracking-wide text-coral">Admin login</p>
              <h2 className="mt-2 text-3xl font-black">Welcome back</h2>
              <p className="mt-2 text-sm text-black/55">Use your admin account to continue.</p>
            </div>

        <form onSubmit={handleSubmit} className="rounded border border-black/10 bg-white p-6 shadow-sm space-y-5">
          {/* Error message */}
          {error && (
            <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 animate-shake">
              {error}
            </div>
          )}
          {success && (
            <div className="border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
              {success}
            </div>
          )}

          {/* Email field */}
          <div>
            <label className="block text-sm font-bold text-black/70 mb-2">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-3.5 text-black/35" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@flyfree.com"
                className="w-full rounded border border-black/10 bg-white pl-10 pr-4 py-3 text-ink placeholder:text-black/35 focus:outline-none focus:border-coral focus:ring-2 focus:ring-coral/20 transition-all"
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label className="block text-sm font-bold text-black/70 mb-2">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3.5 text-black/35" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded border border-black/10 bg-white pl-10 pr-10 py-3 text-ink placeholder:text-black/35 focus:outline-none focus:border-coral focus:ring-2 focus:ring-coral/20 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-black/35 hover:text-ink transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot password */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-black/55 hover:text-ink transition cursor-pointer">
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
            className="w-full bg-coral hover:bg-coral/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded transition-all duration-300 flex items-center justify-center gap-2 group"
          >
            {authLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <span className="group-hover:translate-x-1 transition-transform">-&gt;</span>
              </>
            )}
          </button>

        </form>

        {/* Footer */}
        <p className="text-center text-black/50 text-sm mt-6">
          Don't have access?{' '}
          <Link href="#" className="text-coral hover:text-coral/80 font-bold transition">
            Request invite
          </Link>
        </p>
          </div>
        </section>
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
