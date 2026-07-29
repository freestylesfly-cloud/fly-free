'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { Logo } from '../../components/Logo';

interface AuthDrawerShellProps {
  title: string;
  children: React.ReactNode;
}

export function AuthDrawerShell({ title, children }: AuthDrawerShellProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-black">
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[url('/brand/flyfree-logo.png')] bg-[length:220px_220px] bg-[center_5rem] bg-no-repeat opacity-10" />
        <div className="absolute inset-0 bg-black/58" />
        <div className="relative mx-auto hidden h-full max-w-7xl px-6 lg:block">
          <header className="flex h-32 items-center justify-between">
            <Logo size="lg" showText={false} />
            <nav className="flex items-center gap-12 text-2xl font-bold text-white/90">
              <Link href="/">Home</Link>
              <Link href="/products">Shop</Link>
              <Link href="/influencers">Influencers</Link>
              <Link href="/reviews">Reviews</Link>
            </nav>
          </header>
          <section className="pt-16">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-white/60">Fly Free account</p>
            <h1 className="mt-5 max-w-3xl text-6xl font-black leading-none text-white">Keep your drops, orders, and saved styles in one place.</h1>
            <p className="mt-6 max-w-xl text-lg font-medium leading-8 text-white/72">Sign in to continue checkout, manage addresses, track orders, and save pieces for later.</p>
          </section>
        </div>
      </div>

      <aside className="fixed inset-y-0 right-0 z-10 flex w-full flex-col bg-white shadow-2xl sm:w-[426px]">
        <div className="flex min-h-20 items-center justify-between border-b border-black/10 px-6">
          <h2 className="text-xl font-bold uppercase tracking-wide">{title}</h2>
          <Link href="/" aria-label="Close" className="inline-flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-black/5">
            <X size={30} strokeWidth={1.8} />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {children}
        </div>
      </aside>
    </main>
  );
}
