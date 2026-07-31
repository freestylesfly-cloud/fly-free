'use client';

import Link from 'next/link';
import { Shirt } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center pb-28 md:pb-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-full max-w-sm px-5 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <Shirt size={64} style={{ color: 'var(--color-primary)' }} />
        </div>

        {/* Content */}
        <div className="space-y-4 mb-8">
          <h1 className="text-6xl font-black" style={{ color: 'var(--text-primary)' }}>404</h1>
          <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Page Not Found</h2>
          <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Sorry, the page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-8 py-3 font-black text-white rounded-lg transition hover:opacity-90"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          ← Back to Shop
        </Link>

        {/* Footer */}
        <p className="text-xs mt-8" style={{ color: 'var(--text-tertiary)' }}>
          Error Code: 404
        </p>
      </div>
    </main>
  );
}
