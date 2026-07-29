'use client';

import { useRouter, usePathname } from 'next/navigation';
import { User, Heart, Package, MapPin, Lock, LogOut, Menu, X, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useEffect, useState } from 'react';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const logout = useAuthStore((state) => state.logout);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (hydrated && !user) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname || '/profile/info')}`);
    }
  }, [hydrated, pathname, router, user]);

  const handleLogout = async () => {
    if (confirm('Logout from your account?')) {
      await logout();
      router.push('/');
    }
  };

  const navItems = [
    { icon: User, label: 'Profile', href: '/profile/info' },
    { icon: Heart, label: 'Wishlist', href: '/profile/wishlist' },
    { icon: Package, label: 'Orders', href: '/profile/orders' },
    { icon: MapPin, label: 'Addresses', href: '/profile/addresses' },
    { icon: Lock, label: 'Password', href: '/profile/password' },
  ];

  const isActive = (href: string) => pathname === href || (href === '/profile/info' && pathname === '/profile');

  if (!hydrated || !user) {
    return (
      <main className="min-h-screen bg-[#f7f4ef] px-4 py-16">
        <div className="mx-auto flex min-h-[360px] max-w-md flex-col items-center justify-center rounded-lg border border-black/10 bg-white text-center shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
            <ShieldCheck size={22} />
          </div>
          <h1 className="text-2xl font-black text-[#1f1f1f]">Checking your account</h1>
          <p className="mt-2 text-sm text-[#666]">Opening the secure profile area.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ef]">
      <section className="border-b border-black/10 bg-white px-4 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-[#f04423]">Fly Free Account</p>
            <h1 className="text-3xl font-black text-[#1f1f1f] md:text-4xl">My Profile</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#666]">
              Manage personal details, saved items, orders, delivery addresses, and sign-in security.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-black/10 bg-[#fafafa] px-4 py-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1f1f1f] text-lg font-black text-white">
              {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[#1f1f1f]">{user.name || 'Fly Free Customer'}</p>
              <p className="truncate text-xs text-[#777]">{user.email}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="sticky top-0 z-40 border-b border-black/10 bg-white px-4 py-3 md:hidden">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex items-center gap-2 text-sm font-black text-[#1f1f1f]"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          Account Menu
        </button>
      </div>

      <div className="px-4 py-6 md:py-10">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-[280px_1fr]">
          <aside
            className={`${
              mobileMenuOpen ? 'block' : 'hidden'
            } h-fit overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm md:sticky md:top-8 md:block`}
          >
            <div className="border-b border-black/10 bg-[#1f1f1f] p-5 text-white">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl font-black text-[#1f1f1f]">
                {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <h2 className="truncate text-base font-black">{user.name || 'Customer'}</h2>
              <p className="mt-1 truncate text-xs text-white/70">{user.email}</p>
            </div>

            <nav className="space-y-1 border-b border-black/10 p-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      router.push(item.href);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-black transition ${
                      active
                        ? 'bg-[#f04423] text-white shadow-sm'
                        : 'text-[#555] hover:bg-[#f7f4ef] hover:text-[#1f1f1f]'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-2">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-sm font-black text-[#9f1d1d] transition hover:bg-[#fff1f1]"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </aside>

          <section className="min-w-0 rounded-lg border border-black/10 bg-white p-4 shadow-sm md:p-8">
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
