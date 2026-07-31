'use client';

import { useEffect, useState, useRef } from 'react';
import type React from 'react';
import { Heart, PackageSearch, Package, ShoppingBag, Menu, X, Megaphone, User, Search, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getApiBaseUrl } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';
import { Logo } from './Logo';

const API_BASE = getApiBaseUrl();

export function Header() {
  const router = useRouter();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loginPrompt, setLoginPrompt] = useState('');
  const [hoveredMenuItem, setHoveredMenuItem] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const cartCount = useCartStore((state) => state.getItemCount());
  const displayedCartCount = hasMounted ? cartCount : 0;
  const pathname = usePathname();
  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  const handleLogout = async () => {
    try {
      await logout();
      setIsProfileOpen(false);
      setIsOpen(false);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isProfileOpen]);

  useEffect(() => {
    fetch(`${API_BASE}/cms/announcements`)
      .then((response) => response.ok ? response.json() : [])
      .then((data) => {
        const items = Array.isArray(data) ? data : (data?.data ? data.data : []);
        // Remove duplicates based on title
        const unique = items.filter((item: any, index: number, self: any[]) =>
          index === self.findIndex((t: any) => t.title === item.title)
        );
        setAnnouncements(unique);
      })
      .catch(() => setAnnouncements([]));
  }, []);

  return (
    <>
      {/* Announcement marquee */}
      {announcements.length > 0 && (
        <div
          className="overflow-hidden whitespace-nowrap"
          style={{ backgroundColor: 'var(--text-primary)', borderBottom: '2px solid var(--border-color)', padding: '10px 0' }}
        >
          <div className="mo-marquee-track">
            {[0, 1].map((rep) => (
              <span key={rep} className="inline-flex items-center">
                {announcements.map((item, idx) => (
                  <Link
                    key={`${rep}-${item.id ?? idx}`}
                    href={item.href || '#'}
                    className="inline-flex items-center gap-2 px-6 text-sm font-bold uppercase tracking-wide text-white hover:opacity-80"
                  >
                    <Megaphone size={14} />
                    <span>{item.title}</span>
                    {item.ctaLabel && <span className="underline underline-offset-4">{item.ctaLabel}</span>}
                  </Link>
                ))}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Header */}
      <header
        className="sticky top-0 z-40 transition"
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          borderBottomWidth: '2px'
        }}
      >
        {/* Mobile Header - Logo Centered */}
        <div className="md:hidden px-3 py-3 flex items-center justify-between gap-2">
          {/* Left: Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 transition hover:opacity-70"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Center: Logo */}
          <Link href="/" className="flex-1 flex items-center justify-center hover:opacity-80">
            <Logo size="md" showText={false} />
          </Link>

          {/* Right: Search & Cart */}
          <div className="flex items-center gap-1">
            <Link
              href="/products"
              className="p-2 transition hover:opacity-70"
              title="Search"
              aria-label="Search products"
            >
              <Search size={20} />
            </Link>
            <Link
              href="/cart"
              className="relative p-2 transition hover:opacity-70"
              title="Cart"
              aria-label="Shopping cart"
            >
              <ShoppingBag size={20} />
              <span
                className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full flex items-center justify-center text-xs font-black text-white"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  display: displayedCartCount > 0 ? 'flex' : 'none'
                }}
              >
                {displayedCartCount > 0 && displayedCartCount}
              </span>
            </Link>
          </div>
        </div>

        {/* Desktop Header - Professional Layout */}
        <div className="hidden md:flex items-center justify-between px-6 py-4 max-w-7xl mx-auto gap-8">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center justify-center hover:opacity-80 whitespace-nowrap flex-shrink-0">
            <Logo size="md" showText={false} />
          </Link>

          {/* Center: Navigation Menu */}
          <nav className="flex gap-8 text-sm font-semibold flex-1 justify-center">
            <DesktopNavLink href="/products" label="Shop" active={isActive('/products')} />
            <DesktopNavLink href="/about" label="About" active={isActive('/about')} />
            <DesktopNavLink href="/influencers" label="Influencers" active={isActive('/influencers')} />
            <DesktopNavLink href="/#reviews" label="Reviews" active={false} />
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 whitespace-nowrap flex-shrink-0">
            {/* Search */}
            <Link
              href="/products"
              className="p-2.5 border-2 transition hover:opacity-70"
              style={{ borderColor: 'var(--border-color)' }}
              title="Search products"
            >
              <Search size={18} />
            </Link>

            {/* Wishlist */}
            <Link
              href={user ? '/profile/wishlist' : '/auth/login'}
              className="p-2.5 border-2 transition hover:opacity-70"
              style={{ borderColor: 'var(--border-color)' }}
              aria-label="Open wishlist"
            >
              <Heart size={18} />
            </Link>

            {/* Profile Dropdown */}
            {user ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="p-2.5 border-2 transition hover:shadow-md"
                  style={{
                    borderColor: isProfileOpen ? 'var(--color-primary)' : 'var(--border-color)',
                    backgroundColor: isProfileOpen ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)' : 'transparent'
                  }}
                  aria-label="Open profile menu"
                >
                  <User size={18} style={{ color: isProfileOpen ? 'var(--color-primary)' : 'var(--text-primary)' }} />
                </button>
                {isProfileOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 border-2 shadow-xl overflow-hidden z-50"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--bg-secondary)'
                    }}
                  >
                    <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'color-mix(in srgb, var(--color-primary) 5%, transparent)' }}>
                      <p className="text-xs font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>Account</p>
                      <p className="text-sm font-bold mt-1 line-clamp-1" style={{ color: 'var(--text-primary)' }} title={user.email}>{user.email}</p>
                    </div>
                    <nav className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="px-4 py-3 text-sm font-semibold transition flex items-center gap-3"
                        style={{ color: 'var(--text-primary)' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-primary) 8%, transparent)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <User size={16} />
                        My Profile
                      </Link>
                      <Link
                        href="/profile/orders"
                        onClick={() => setIsProfileOpen(false)}
                        className="px-4 py-3 text-sm font-semibold transition flex items-center gap-3"
                        style={{ color: 'var(--text-primary)' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-primary) 8%, transparent)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Package size={16} />
                        My Orders
                      </Link>
                      <Link
                        href="/profile/wishlist"
                        onClick={() => setIsProfileOpen(false)}
                        className="px-4 py-3 text-sm font-semibold transition flex items-center gap-3"
                        style={{ color: 'var(--text-primary)' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-primary) 8%, transparent)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Heart size={16} />
                        Wishlist
                      </Link>
                    </nav>
                    <div className="border-t py-1" style={{ borderColor: 'var(--border-color)' }}>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 text-sm font-semibold text-left flex items-center gap-3 transition"
                        style={{ color: 'var(--text-primary)' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, red 15%, transparent)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:opacity-90"
                style={{ backgroundColor: 'var(--color-primary)' }}
                title="Login or Register"
              >
                Login
              </Link>
            )}

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2.5 transition text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
              aria-label="Open cart"
            >
              <ShoppingBag size={18} />
              <span
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center text-xs font-black text-white bg-red-500"
                style={{ display: displayedCartCount > 0 ? 'flex' : 'none' }}
              >
                {displayedCartCount > 0 && displayedCartCount}
              </span>
            </Link>
          </div>
        </div>

        {/* Mobile Menu Drawer - Professional Navigation */}
        {isOpen && (
          <div
            className="md:hidden fixed inset-0 top-20 z-30 flex flex-col overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-secondary)',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsOpen(false);
              }
            }}
          >
            {/* Close Button - Top Right */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 p-2 z-40"
              aria-label="Close menu"
              style={{ color: 'var(--text-primary)' }}
            >
              <X size={24} />
            </button>

            <nav className="flex-1 overflow-y-scroll pb-20 pt-2 scrollbar-hide">
              {/* Main Navigation Section */}
              <div className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                <p className="px-5 py-3 text-xs font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>
                  Navigation
                </p>
                <MobileDrawerLink href="/" label="Home" active={isActive('/')} onClick={() => setIsOpen(false)} icon="🏠" />
                <MobileDrawerLink href="/products" label="Shop" active={isActive('/products')} onClick={() => setIsOpen(false)} icon="🛍️" />
                <MobileDrawerLink href="/about" label="About" active={isActive('/about')} onClick={() => setIsOpen(false)} icon="ℹ️" />
                <MobileDrawerLink href="/influencers" label="Influencers" active={isActive('/influencers')} onClick={() => setIsOpen(false)} icon="⭐" />
                <MobileDrawerLink href="/#reviews" label="Reviews" active={false} onClick={() => setIsOpen(false)} icon="⭐" />
              </div>

              {/* Account Section */}
              <div className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                <p className="px-5 py-3 text-xs font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>
                  Account
                </p>
                {user ? (
                  <>
                    <MobileDrawerLink
                      href="/profile/orders"
                      label="My Orders"
                      active={isActive('/profile/orders')}
                      onClick={() => setIsOpen(false)}
                      icon={<Package size={16} />}
                    />
                    <MobileDrawerLink
                      href="/profile/wishlist"
                      label="Saved Items"
                      active={isActive('/profile/wishlist')}
                      onClick={() => setIsOpen(false)}
                      icon={<Heart size={16} />}
                    />
                    <MobileDrawerLink
                      href="/profile"
                      label="My Profile"
                      active={isActive('/profile')}
                      onClick={() => setIsOpen(false)}
                      icon={<User size={16} />}
                    />
                  </>
                ) : (
                  <MobileDrawerLink
                    href="/auth/login"
                    label="Login / Register"
                    active={isActive('/auth')}
                    onClick={() => setIsOpen(false)}
                    icon="🔐"
                  />
                )}
              </div>

              {/* Logout Button - Only for logged-in users */}
              {user && (
                <div className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <button
                    onClick={handleLogout}
                    className="w-full px-5 py-3 font-semibold uppercase tracking-wide text-sm flex items-center gap-3 transition"
                    style={{
                      color: '#dc2626',
                      borderBottom: `1px solid var(--border-light)`,
                      backgroundColor: hoveredMenuItem === 'logout' ? 'rgba(220, 38, 38, 0.1)' : 'transparent',
                    }}
                    onMouseEnter={() => setHoveredMenuItem('logout')}
                    onMouseLeave={() => setHoveredMenuItem(null)}
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </nav>

            {/* Close Info */}
            <div
              className="px-5 py-4 border-t text-center text-xs font-bold"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            >
              Tap outside to close
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar - Professional */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t md:hidden"
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          boxShadow: '0 -2px 12px rgba(26, 26, 26, 0.08)',
          borderTopWidth: '2px',
        }}
      >
        <MobileTab href="/" label="Home" active={isActive('/')} icon="🏠" />
        <MobileTab href="/products" label="Shop" active={isActive('/products')} icon="🛍️" />
        <MobileTab
          href="/cart"
          label={`Cart${displayedCartCount > 0 ? ` ${displayedCartCount}` : ''}`}
          cartCount={displayedCartCount}
          active={isActive('/cart')}
          icon="🛒"
        />
        <MobileTab
          href={user ? '/profile/wishlist' : '/auth/login'}
          label="Saved"
          active={isActive('/profile/wishlist') || isActive('/wishlist')}
          icon="❤️"
        />
        <MobileTab
          href={user ? '/profile' : '/auth/login'}
          label={user ? 'Profile' : 'Login'}
          active={isActive(user ? '/profile' : '/auth')}
          icon={user ? '👤' : '🔓'}
        />
      </nav>

      {/* Login Prompt Modal */}
      {loginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div
            className="w-full max-w-sm border-2 p-6 shadow-2xl"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--bg-secondary)'
            }}
          >
            <h2 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
              Login for {loginPrompt}
            </h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              You need an account to access this feature. Browse products freely without login.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => setLoginPrompt('')}
                className="px-4 py-2 font-bold border-2 transition hover:opacity-70"
                style={{ borderColor: 'var(--border-color)' }}
              >
                Later
              </button>
              <Link
                href="/auth/login"
                className="px-4 py-2 text-center font-black text-white transition hover:opacity-90"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MobileTab({
  href,
  label,
  onClick,
  cartCount,
  active,
  icon,
}: {
  href: string;
  label: string;
  onClick?: () => void;
  cartCount?: number;
  active?: boolean;
  icon?: string;
}) {
  const getIcon = () => {
    if (icon) return <span className="text-xl">{icon}</span>;

    switch (href) {
      case '/':
        return <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
      case '/products':
        return <PackageSearch size={20} />;
      case '/cart':
        return <ShoppingBag size={20} />;
      case '/wishlist':
      case '/profile/wishlist':
        return <Heart size={20} />;
      default:
        return <User size={20} />;
    }
  };

  return (
    <Link
      href={href}
      onClick={(event) => {
        if (href === '#') event.preventDefault();
        onClick?.();
      }}
      className="flex min-h-16 flex-col items-center justify-center gap-1.5 text-[11px] font-bold transition"
      style={{
        color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
        borderTop: active ? '3px solid var(--color-primary)' : '3px solid transparent',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <div className="relative">
        {getIcon()}
        {href === '/cart' && cartCount && cartCount > 0 && (
          <span
            className="absolute -top-2.5 -right-2.5 h-5 w-5 rounded-full flex items-center justify-center text-xs font-black text-white"
            style={{
              backgroundColor: 'var(--color-primary)',
              fontSize: '10px',
            }}
          >
            {cartCount}
          </span>
        )}
      </div>
      <span className="uppercase tracking-wide">{label}</span>
    </Link>
  );
}

function DesktopNavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className="relative px-1 py-2 text-xs font-bold uppercase tracking-wide transition hover:opacity-70"
      style={{
        color: active ? 'var(--color-primary)' : 'var(--text-primary)',
        borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent'
      }}
    >
      {label}
    </Link>
  );
}

function MobileDrawerLink({
  href,
  label,
  active,
  onClick,
  icon
}: {
  href: string;
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={href}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="px-5 py-3 font-semibold uppercase tracking-wide text-sm border-b transition flex items-center gap-3"
      style={{
        borderColor: 'var(--border-light)',
        borderLeft: active ? '4px solid var(--color-primary)' : '4px solid transparent',
        color: active ? 'var(--color-primary)' : 'var(--text-primary)',
        backgroundColor: isHovered ? 'var(--bg-tertiary)' : 'transparent',
      }}
    >
      {icon && <span style={{ color: 'var(--color-primary)' }}>{icon}</span>}
      {label}
    </Link>
  );
}
