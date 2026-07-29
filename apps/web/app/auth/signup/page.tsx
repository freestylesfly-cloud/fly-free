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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
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
        const err = await res.json();
        const message = Array.isArray(err.message) ? err.message.join(', ') : err.message;
        throw new Error(message || err.error || 'Signup failed');
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
      <AuthDrawerShell title="Register">
        <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
          <CheckCircle size={64} className="mb-5 text-primary" />
          <h1 className="text-2xl font-black">Check your email</h1>
          <p className="mt-3 leading-7 text-black/60">We sent a verification code to continue your Fly Free account setup.</p>
        </div>
      </AuthDrawerShell>
    );
  }

  return (
    <AuthDrawerShell title="Register">
      <form onSubmit={handleSubmit} className="space-y-9">
        {error && (
          <div className="flex gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-9">
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="First Name"
            autoComplete="given-name"
            className="h-[52px] w-full border border-black/15 px-4 text-base outline-none transition focus:border-black"
          />
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Last Name"
            autoComplete="family-name"
            className="h-[52px] w-full border border-black/15 px-4 text-base outline-none transition focus:border-black"
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email *"
            autoComplete="email"
            className="h-[52px] w-full border border-black/15 px-4 text-base outline-none transition focus:border-black"
          />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password *"
            autoComplete="new-password"
            className="h-[52px] w-full border border-black/15 px-4 text-base outline-none transition focus:border-black"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex h-[50px] w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? 'Creating account...' : 'Register'}
        </button>

        <Link href={`/auth/login?next=${encodeURIComponent(nextPath)}`} className="inline-block text-base text-black/55 underline underline-offset-2 hover:text-black">
          Already have an account? Login here
        </Link>
      </form>
    </AuthDrawerShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthDrawerShell title="Register"><div className="h-10" /></AuthDrawerShell>}>
      <SignupContent />
    </Suspense>
  );
}
