import { Suspense } from 'react';
import ResetPasswordContent from './content';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ backgroundColor: 'var(--bg-primary)' }} className="min-h-screen" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
