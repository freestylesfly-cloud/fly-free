'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import VerifyEmailContent from './content';

function VerifyEmailLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: 'var(--color-primary)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading verification...</p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailLoading />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
