'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/profile/info');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: 'var(--color-primary)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading profile...</p>
      </div>
    </div>
  );
}
