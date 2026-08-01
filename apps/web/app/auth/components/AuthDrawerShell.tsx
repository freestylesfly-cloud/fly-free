'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../../components/Logo';

interface AuthDrawerShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/**
 * A single centred card for every auth screen. Deliberately plain: sign-in is a
 * task, not a place to market, and the previous split layout carried invented
 * statistics.
 */
export function AuthDrawerShell({ title, subtitle, children }: AuthDrawerShellProps) {
  return (
    <main
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div className="px-4 py-5 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold transition hover:gap-3"
          style={{ color: 'var(--color-primary)' }}
        >
          <ArrowLeft size={18} />
          Back to shop
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="flex justify-center">
              <Logo size="lg" showText={false} />
            </div>
            <h1 className="mt-6 text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {subtitle}
              </p>
            )}
          </div>

          <div
            className="rounded-2xl border p-6 shadow-lg sm:p-8"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
          >
            {children}
          </div>

          <p className="mt-6 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
            By continuing you agree to our{' '}
            <Link href="/terms" className="font-bold" style={{ color: 'var(--color-primary)' }}>
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="font-bold" style={{ color: 'var(--color-primary)' }}>
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
