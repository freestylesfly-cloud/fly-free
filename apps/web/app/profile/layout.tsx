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
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (hydrated && !user) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname || '/profile/info')}`);
    }
  }, [hydrated, pathname, router, user]);

  // Refresh from the API so the sidebar shows the real name, not a login snapshot.
  useEffect(() => {
    if (user) void fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
      <main className="min-h-screen px-4 py-16 pb-28 lg:pb-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="mx-auto flex min-h-[360px] max-w-md flex-col items-center justify-center rounded-lg border bg-white text-center shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
            <ShieldCheck size={22} />
          </div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Checking your account</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Opening the secure profile area.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-28 lg:pb-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <section className="border-b bg-white px-4 py-8" style={{ borderColor: 'var(--border-color)' }}>
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.18em]" style={{ color: 'var(--color-primary)' }}>Fly Free Account</p>
            <h1 className="text-3xl font-black md:text-4xl" style={{ color: 'var(--text-primary)' }}>My Profile</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
              Manage personal details, saved items, orders, delivery addresses, and sign-in security.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border px-4 py-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-black text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
              {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black" style={{ color: 'var(--text-primary)' }}>{user.name || 'Fly Free Customer'}</p>
              <p className="truncate text-xs" style={{ color: 'var(--text-tertiary)' }}>{user.email}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="sticky top-0 z-40 border-b bg-white px-4 py-3 md:hidden" style={{ borderColor: 'var(--border-color)' }}>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex items-center gap-2 text-sm font-black"
          style={{ color: 'var(--text-primary)' }}
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
            } h-fit overflow-hidden rounded-lg border bg-white shadow-sm md:sticky md:top-8 md:block`}
            style={{ borderColor: 'var(--border-color)' }}
          >
            <div className="border-b p-5 text-white" style={{ borderColor: 'var(--border-color)', background: 'linear-gradient(135deg, var(--color-primary), var(--color-tertiary))' }}>
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl font-black" style={{ color: 'var(--color-primary)' }}>
                {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <h2 className="truncate text-base font-black">{user.name || 'Customer'}</h2>
              <p className="mt-1 truncate text-xs text-white/70">{user.email}</p>
            </div>

            <nav className="space-y-1 border-b p-2" style={{ borderColor: 'var(--border-color)' }}>
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
                    className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-black transition hover:bg-black/5"
                    style={{
                      backgroundColor: active ? 'var(--color-primary)' : 'transparent',
                      color: active ? 'white' : 'var(--text-secondary)',
                      boxShadow: active ? '0 4px 12px rgba(37,99,235,0.18)' : 'none'
                    }}
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
                className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-sm font-black transition hover:bg-black/5"
                style={{ color: 'var(--text-secondary)' }}
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </aside>

          <section className="min-w-0 rounded-lg border bg-white p-4 shadow-sm md:p-8" style={{ borderColor: 'var(--border-color)' }}>
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
