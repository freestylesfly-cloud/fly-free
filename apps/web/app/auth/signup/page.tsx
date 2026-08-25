'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { AuthDrawerShell } from '../components/AuthDrawerShell';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || searchParams.get('redirect') || '/';
  const invitedEmail = (searchParams.get('email') || '').trim();
  const isInvited = searchParams.get('invited') === '1';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: invitedEmail,
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Please enter a valid email';
    if (!formData.password) return 'Password is required';
    if (formData.password.length < 8) return 'Password must be at least 8 characters';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationError = validateForm();
    setError(validationError);
    if (validationError) return;

    setLoading(true);
    try {
      const name = [formData.firstName.trim(), formData.lastName.trim()].filter(Boolean).join(' ');
      const res = await fetch('/api/auth/user/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          name
        })
      });

      if (!res.ok) {
        // Handle specific HTTP status codes
        if (res.status === 409) {
          throw new Error('This email is already registered. Please login or use a different email.');
        }

        try {
          const err = await res.json();
          const message = Array.isArray(err.message) ? err.message.join(', ') : err.message;
          throw new Error(message || err.error || 'Signup failed');
        } catch (parseError) {
          throw new Error('Signup failed. Please try again.');
        }
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}&next=${encodeURIComponent(nextPath)}`);
      }, 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthDrawerShell title="Create your account" subtitle="One account for orders, addresses, and saved items.">
        <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
          <CheckCircle size={64} className="mb-5" style={{ color: 'var(--color-primary)' }} />
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Check your email</h1>
          <p className="mt-3 leading-7" style={{ color: 'var(--text-secondary)' }}>We sent a verification code to continue your Fly Free account setup.</p>
        </div>
      </AuthDrawerShell>
    );
  }

  return (
    <AuthDrawerShell title="Create your account" subtitle="One account for orders, addresses, and saved items.">
      <form onSubmit={handleSubmit} className="space-y-6">
        {isInvited && !error && (
          <div className="flex gap-3 rounded-lg border-2 p-4" style={{ borderColor: 'var(--color-primary)', backgroundColor: 'color-mix(in srgb, var(--color-primary) 8%, transparent)' }}>
            <CheckCircle size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              You have been invited to Fly Free. Set a password to finish creating your account.
            </p>
          </div>
        )}

        {error && (
          <div className="flex gap-3 rounded-lg border-2 p-4" style={{ borderColor: 'var(--color-accent)', backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)' }}>
            <AlertCircle size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--color-accent)' }} />
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <label className="block">
            <span className="sr-only">First Name</span>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="First Name"
              autoComplete="given-name"
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
          <label className="block">
            <span className="sr-only">Last Name</span>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Last Name (optional)"
              autoComplete="family-name"
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
          <label className="block">
            <span className="sr-only">Email</span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
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
          <label className="block">
            <span className="sr-only">Password</span>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              autoComplete="new-password"
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
        </div>

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
          <span>{loading ? 'Creating account...' : 'Create Account'}</span>
        </button>

        <Link href={`/auth/login?next=${encodeURIComponent(nextPath)}`} className="inline-block text-sm font-bold transition hover:opacity-80" style={{ color: 'var(--color-primary)' }}>
          Already have an account? Login here
        </Link>
      </form>
    </AuthDrawerShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthDrawerShell title="Create your account" subtitle="One account for orders, addresses, and saved items."><div className="h-10" /></AuthDrawerShell>}>
      <SignupContent />
    </Suspense>
  );
}
