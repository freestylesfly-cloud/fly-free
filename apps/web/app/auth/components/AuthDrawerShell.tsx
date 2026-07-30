'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../../components/Logo';

interface AuthDrawerShellProps {
  title: string;
  children: React.ReactNode;
}

export function AuthDrawerShell({ title, children }: AuthDrawerShellProps) {
  return (
    <main className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Desktop: Split Layout with Gradient */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:min-h-screen">
        {/* Left: Gradient Hero Section */}
        <div
          className="relative flex flex-col justify-center px-12 py-16"
          style={{
            background: 'var(--campaign-gradient)',
            color: 'white',
          }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('/brand/flyfree-logo.png')] bg-[length:300px_300px] bg-center bg-no-repeat" />
          </div>

          {/* Content */}
          <div className="relative z-10">
            <Logo size="lg" showText={false} />

            <div className="mt-16 max-w-md">
              <p className="text-sm font-black uppercase tracking-widest opacity-90">Fly Free Account</p>
              <h1 className="mt-6 text-5xl font-black leading-tight">
                Keep Your Drops, Orders & Saves in One Place
              </h1>
              <p className="mt-6 text-lg leading-relaxed opacity-90">
                Sign in to checkout, manage addresses, track orders, and save your favorite pieces for later.
              </p>
            </div>

            {/* Trust Elements */}
            <div className="mt-16 flex gap-8">
              <div>
                <p className="text-2xl font-black">10K+</p>
                <p className="text-sm opacity-90 mt-1">Happy Customers</p>
              </div>
              <div>
                <p className="text-2xl font-black">2-3 Days</p>
                <p className="text-sm opacity-90 mt-1">Fast Delivery</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Login Form */}
        <div className="flex flex-col justify-center px-12 py-16">
          <div className="max-w-sm">
            <h2 className="text-3xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h2>
            <div className="h-1 w-16 rounded mb-8" style={{ background: 'var(--campaign-gradient)' }} />
            {children}
          </div>
        </div>
      </div>

      {/* Mobile & Tablet: Full Width Centered */}
      <div className="lg:hidden min-h-screen flex flex-col">
        {/* Header */}
        <div
          className="px-4 py-6 border-b"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-bold transition hover:gap-3"
            style={{ color: 'var(--color-primary)' }}
          >
            <ArrowLeft size={18} />
            Back
          </Link>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center px-6 py-8">
          <div className="flex justify-center mb-8">
            <Logo size="sm" showText={false} />
          </div>

          <div className="space-y-2 mb-8">
            <h1 className="text-3xl font-black text-center" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h1>
            <div className="flex justify-center">
              <div className="h-1 w-12 rounded" style={{ background: 'var(--campaign-gradient)' }} />
            </div>
          </div>

          <div
            className="rounded-2xl border-2 p-6"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
            }}
          >
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-6 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
          By continuing, you agree to our{' '}
          <Link href="/terms" className="font-bold" style={{ color: 'var(--color-primary)' }}>
            Terms
          </Link>
        </div>
      </div>
    </main>
  );
}
