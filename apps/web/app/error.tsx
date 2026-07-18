'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ink via-ink to-coral/10 px-5">
      <div className="w-full max-w-lg text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <AlertTriangle size={80} className="text-red-500 animate-pulse" />
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-white">Something Went Wrong</h1>
          <p className="text-white/70 leading-relaxed">
            We encountered an error while processing your request. Our team has been notified. Please try again.
          </p>

          {/* Error Details (Dev Only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-left mt-4">
              <p className="text-xs font-mono text-red-400 break-all">{error.message}</p>
              {error.digest && <p className="text-xs text-white/40 mt-2">Digest: {error.digest}</p>}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4 flex-col sm:flex-row">
          <button
            onClick={reset}
            className="flex-1 bg-gradient-to-r from-coral to-mint text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-coral/50 flex items-center justify-center gap-2 transition"
          >
            <RotateCcw size={20} />
            Try Again
          </button>
          <Link
            href="/"
            className="flex-1 border-2 border-white/20 text-white font-bold py-3 rounded-lg hover:border-coral hover:text-coral flex items-center justify-center gap-2 transition"
          >
            <Home size={20} />
            Home
          </Link>
        </div>

        {/* Footer */}
        <p className="text-xs text-white/40 pt-4">
          Error ID: {error.digest || 'unknown'} | Need help?{' '}
          <Link href="/contact" className="text-coral hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
