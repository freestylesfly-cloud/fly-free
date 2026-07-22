'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, Phone, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { signUpWithEmail } from '../../lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }

    if (formData.name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return false;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email');
      return false;
    }

    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      setError('Phone must be exactly 10 digits');
      return false;
    }

    if (!formData.password) {
      setError('Password is required');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }

    if (!/[A-Z]/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }

    if (!/[a-z]/.test(formData.password)) {
      setError('Password must contain at least one lowercase letter');
      return false;
    }

    if (!/[0-9]/.test(formData.password)) {
      setError('Password must contain at least one number');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await signUpWithEmail(
        formData.email.trim(),
        formData.password,
        {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle size={64} style={{ color: 'var(--color-primary)' }} className="animate-bounce" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black">Almost there!</h1>
            <p style={{ color: 'var(--text-secondary)' }}>We've sent a verification link to your email. Redirecting...</p>
          </div>
        </div>
      </div>
    );
  }

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
          <p style={{ color: 'var(--text-secondary)' }}>Create your account</p>
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

          {/* Name Field */}
          <div className="space-y-2">
            <label className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Full Name</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-3" style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
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

          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-3" style={{ color: 'var(--text-secondary)' }} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
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

          {/* Phone Field */}
          <div className="space-y-2">
            <label className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Phone (10 digits)</label>
            <div className="relative">
              <Phone size={18} className="absolute left-3 top-3" style={{ color: 'var(--text-secondary)' }} />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210"
                maxLength={10}
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
            <label className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3" style={{ color: 'var(--text-secondary)' }} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter strong password"
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
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
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
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Links */}
        <div className="text-center space-y-3">
          <p style={{ color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link href="/auth/login" className="font-bold hover:underline" style={{ color: 'var(--color-primary)' }}>
              Login here
            </Link>
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            By signing up, you agree to our{' '}
            <Link href="/terms" className="font-bold hover:underline" style={{ color: 'var(--color-primary)' }}>
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="font-bold hover:underline" style={{ color: 'var(--color-primary)' }}>
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
