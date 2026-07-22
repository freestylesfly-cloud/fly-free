'use client';

import Link from 'next/link';

export function AuthLogo() {
  return (
    <Link href="/" className="inline-flex flex-col items-center gap-2">
      <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
        <span className="text-3xl font-black">FF</span>
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Fly Free</h1>
      </div>
    </Link>
  );
}
