'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/authStore';
import Link from 'next/link';
import { Menu, X, LogOut, Home, Package, BarChart3, Users, Settings } from 'lucide-react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !token) {
      router.push('/admin/login');
    }
  }, [token, isMounted, router]);

  if (!isMounted || !token) {
    return null;
  }

  const sidebarItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
    { label: 'Orders', href: '/admin/dashboard/orders', icon: '📦' },
    { label: 'Products', href: '/admin/dashboard/products', icon: '🛍️' },
    { label: 'Custom Orders', href: '/admin/dashboard/custom-orders', icon: '✏️' },
    { label: 'Users', href: '/admin/dashboard/users', icon: '👥' },
    { label: 'Reviews', href: '/admin/dashboard/reviews', icon: '⭐' },
    { label: 'Themes', href: '/admin/dashboard/themes', icon: '🎨' },
    { label: 'Announcements', href: '/admin/dashboard/announcements', icon: '📢' },
  ];

  const bottomNavItems = [
    { label: 'Home', href: '/admin/dashboard', icon: Home },
    { label: 'Orders', href: '/admin/dashboard/orders', icon: Package },
    { label: 'Analytics', href: '/admin/dashboard/analytics', icon: BarChart3 },
    { label: 'Users', href: '/admin/dashboard/users', icon: Users },
    { label: 'Settings', href: '/admin/dashboard/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottomWidth: '1px',
          borderBottomColor: 'var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          gap: '12px'
        }}
      >
        {/* Left: Hamburger + Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              color: 'var(--text-primary)'
            }}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <img
            src="/logo.png"
            alt="Logo"
            style={{ width: '40px', height: '40px', objectFit: 'contain' }}
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <h1 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
            Fly Free
          </h1>
        </div>

        {/* Right: Logout */}
        <button
          onClick={() => {
            logout();
            router.push('/admin/login');
          }}
          style={{
            padding: '8px 12px',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px'
          }}
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', paddingBottom: '80px' }}>
        {/* Sidebar */}
        <aside
          style={{
            position: isOpen ? 'fixed' : 'absolute',
            left: 0,
            top: '60px',
            width: '280px',
            height: 'calc(100vh - 60px)',
            backgroundColor: 'var(--bg-secondary)',
            borderRightWidth: '1px',
            borderRightColor: 'var(--border-color)',
            overflowY: 'auto',
            zIndex: isOpen ? 20 : -1,
            transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s',
            display: isOpen ? 'flex' : 'none',
            flexDirection: 'column'
          }}
          className="md:relative md:flex md:transform-none md:z-auto"
        >
          <nav style={{ display: 'flex', flexDirection: 'column', padding: '12px 0' }}>
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                style={{
                  padding: '12px 16px',
                  borderLeftWidth: '4px',
                  borderLeftColor: isActive(item.href) ? 'var(--color-primary)' : 'transparent',
                  backgroundColor: isActive(item.href) ? 'var(--color-primary)' : 'transparent',
                  color: isActive(item.href) ? 'white' : 'var(--text-primary)',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile Overlay */}
        {isOpen && (
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              zIndex: 10,
              display: isOpen ? 'block' : 'none'
            }}
            className="md:hidden"
          />
        )}

        {/* Page Content */}
        <main style={{ flex: 1, overflow: 'auto', backgroundColor: 'var(--bg-primary)' }}>
          {children}
        </main>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '4px',
          padding: '8px',
          backgroundColor: 'var(--bg-secondary)',
          borderTopWidth: '1px',
          borderTopColor: 'var(--border-color)',
          zIndex: 30
        }}
        className="md:hidden"
      >
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: isActive(item.href) ? 'white' : 'var(--text-primary)',
                backgroundColor: isActive(item.href) ? 'var(--color-primary)' : 'transparent',
                fontWeight: 'bold',
                fontSize: '11px',
                gap: '4px',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
