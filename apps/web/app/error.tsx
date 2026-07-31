'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RotateCcw, ShoppingBag } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <main
      className="flex min-h-[70vh] items-center justify-center px-5 py-16"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="w-full max-w-xl text-center">
        <div className="flex justify-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }}
          >
            <AlertTriangle size={30} style={{ color: 'var(--color-primary)' }} />
          </span>
        </div>

        <p
          className="mt-6 text-sm font-black uppercase tracking-[0.3em]"
          style={{ color: 'var(--color-primary)' }}
        >
          Something broke
        </p>

        <h1
          className="mt-3 text-3xl font-black leading-tight sm:text-4xl"
          style={{ color: 'var(--text-primary)' }}
        >
          That didn&apos;t load properly
        </h1>

        <p className="mx-auto mt-4 max-w-md leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          This is on us, not you. Nothing in your cart or account has changed. Try again, or head back
          and pick up where you left off.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-black text-white transition hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <RotateCcw size={18} /> Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border-2 px-6 py-3 font-black transition hover:opacity-70"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <Home size={18} /> Home
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-lg border-2 px-6 py-3 font-black transition hover:opacity-70"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <ShoppingBag size={18} /> Shop
          </Link>
        </div>

        {/* The message is only useful while developing; production shows the digest. */}
        {process.env.NODE_ENV === 'development' && (
          <pre
            className="mt-8 overflow-x-auto rounded-lg border p-4 text-left text-xs"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
            }}
          >
            {error.message}
          </pre>
        )}

        {error.digest && (
          <p className="mt-6 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Reference: {error.digest} ·{' '}
            <Link href="/contact" className="underline" style={{ color: 'var(--color-primary)' }}>
              Contact support
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
