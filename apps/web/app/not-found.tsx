'use client';

import Link from 'next/link';
import { AlertCircle, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ink via-ink to-coral/10 px-5">
      <div className="w-full max-w-lg text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <AlertCircle size={80} className="text-coral animate-pulse" />
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-6xl font-black text-white">404</h1>
          <h2 className="text-2xl font-bold text-white">Page Not Found</h2>
          <p className="text-white/70 leading-relaxed">
            The page you're looking for doesn't exist. It might have been moved, deleted, or the URL might be incorrect.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <Link
            href="/"
            className="flex-1 bg-gradient-to-r from-coral to-mint text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-coral/50 flex items-center justify-center gap-2 transition"
          >
            <Home size={20} />
            Back to Home
          </Link>
        </div>

        {/* Footer */}
        <p className="text-xs text-white/40 pt-4">
          Error Code: 404 | If you believe this is a mistake, please{' '}
          <Link href="/contact" className="text-coral hover:underline">
            contact us
          </Link>
        </p>
      </div>
    </div>
  );
}
