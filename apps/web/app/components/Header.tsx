'use client';

import { useEffect, useState } from 'react';
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
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [activeAnnouncement, setActiveAnnouncement] = useState(0);
  const [loginPrompt, setLoginPrompt] = useState('');
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const cartCount = useCartStore((state) => state.getItemCount());
  const displayedCartCount = hasMounted ? cartCount : 0;
  const pathname = usePathname();
  const announcement = announcements[activeAnnouncement % Math.max(announcements.length, 1)];
  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  const handleLogout = async () => {
    await logout();
    setIsProfileOpen(false);
    router.push('/');
  };

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/cms/announcements`)
      .then((response) => response.ok ? response.json() : [])
      .then((data) => setAnnouncements(Array.isArray(data) ? data : []))
      .catch(() => setAnnouncements([]));
  }, []);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveAnnouncement((current) => (current + 1) % announcements.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [announcements.length]);

  return (
    <>
      {/* Announcement Banner */}
      {announcement && (
        <Link
          href={announcement.href || '#'}
          className="block px-4 py-2 text-center text-sm font-bold text-white transition"
          style={{
            background: announcement.websiteTheme
              ? `linear-gradient(90deg, ${announcement.websiteTheme.primaryColor}, ${announcement.websiteTheme.secondaryColor})`
              : announcement.theme
              ? `linear-gradient(90deg, ${announcement.theme.primaryColor}, ${announcement.theme.secondaryColor})`
              : `linear-gradient(90deg, var(--color-primary), var(--color-secondary))`,
            fontFamily: announcement.websiteTheme?.fontFamily || announcement.theme?.fontFamily || 'var(--font-family, inherit)'
          }}
        >
          <span className="inline-flex items-center gap-2 justify-center">
            <Megaphone size={15} />
            <span>{announcement.title}</span>
            <span className="hidden opacity-80 sm:inline">- {announcement.message}</span>
            {announcement.ctaLabel && <span className="underline underline-offset-4">{announcement.ctaLabel}</span>}
          </span>
        </Link>
      )}

      {/* Main Header */}
      <header
        className="sticky top-0 z-40 transition"
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          borderBottomWidth: '1px'
        }}
      >
        {/* Mobile Header - Logo Centered */}
        <div className="md:hidden px-3 py-3 flex items-center justify-between gap-2">
          {/* Left: Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg transition hover:opacity-70"
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
              className="p-2 rounded-lg transition hover:opacity-70"
              title="Search"
              aria-label="Search products"
            >
              <Search size={20} />
            </Link>
            <Link
              href="/cart"
              className="relative p-2 rounded-lg transition hover:opacity-70"
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
              className="p-2.5 rounded-lg border transition hover:opacity-70"
              style={{ borderColor: 'var(--border-color)' }}
              title="Search products"
            >
              <Search size={18} />
            </Link>

            {/* Wishlist */}
            <Link
              href={user ? '/wishlist' : '/auth/login'}
              className="p-2.5 rounded-lg border transition hover:opacity-70"
              style={{ borderColor: 'var(--border-color)' }}
              aria-label="Open wishlist"
            >
              <Heart size={18} />
            </Link>

            {/* Profile Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="p-2.5 rounded-lg border transition hover:shadow-md"
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
                    className="absolute right-0 mt-2 w-56 rounded-lg border shadow-xl overflow-hidden z-50"
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
                        href="/orders"
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
                        href="/wishlist"
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
                className="px-4 py-2.5 rounded-lg text-sm font-bold text-white transition hover:shadow-lg hover:opacity-90"
                style={{ backgroundColor: 'var(--color-primary)' }}
                title="Login or Register"
              >
                Login
              </Link>
            )}

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2.5 rounded-lg transition text-white"
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

        {/* Mobile Menu Dropdown */}
        {isOpen && (
          <div
            className="md:hidden border-t transition-all"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--bg-primary)'
            }}
          >
            <nav className="flex flex-col max-h-96 overflow-y-auto">
              <MobileDrawerLink href="/products" label="Shop" active={isActive('/products')} onClick={() => setIsOpen(false)} />
              <MobileDrawerLink href="/about" label="About Us" active={isActive('/about')} onClick={() => setIsOpen(false)} />
              <MobileDrawerLink href="/contact" label="Contact" active={isActive('/contact')} onClick={() => setIsOpen(false)} />
              <MobileDrawerLink href="/influencers" label="Influencers" active={isActive('/influencers')} onClick={() => setIsOpen(false)} />
              <MobileDrawerLink href="/#reviews" label="Reviews" active={false} onClick={() => setIsOpen(false)} />
              <Link
                href={user ? '/orders' : '/auth/login'}
                onClick={() => setIsOpen(false)}
                className="px-5 py-3 font-semibold border-b transition hover:opacity-70"
                style={{
                  borderColor: 'var(--border-light)',
                  color: 'var(--text-primary)'
                }}
              >
                {user ? 'My Orders' : 'Orders'}
              </Link>
              <Link
                href={user ? '/wishlist' : '/auth/login'}
                onClick={() => setIsOpen(false)}
                className="px-5 py-3 font-semibold border-b transition hover:opacity-70"
                style={{
                  borderColor: 'var(--border-light)',
                  color: 'var(--text-primary)'
                }}
              >
                {user ? 'Saved Items' : 'Wishlist'}
              </Link>
              <Link
                href={user ? '/profile' : '/auth/login'}
                onClick={() => setIsOpen(false)}
                className="px-5 py-3 font-semibold border-b transition hover:opacity-70"
                style={{
                  borderColor: 'var(--border-light)',
                  color: 'var(--text-primary)'
                }}
              >
                {user ? 'My Profile' : 'Login / Register'}
              </Link>
              {user && (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-5 py-3 font-semibold border-b transition hover:opacity-70 flex items-center gap-2"
                  style={{
                    borderColor: 'var(--border-light)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <LogOut size={18} />
                  Logout
                </button>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t md:hidden"
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
      >
        <MobileTab href="/" label="Home" active={isActive('/')} />
        <MobileTab href="/products" label="Shop" active={isActive('/products')} />
        <MobileTab href="/cart" label={`Cart${displayedCartCount > 0 ? ` ${displayedCartCount}` : ''}`} cartCount={displayedCartCount} active={isActive('/cart')} />
        <MobileTab
          href={user ? '/wishlist' : '/auth/login'}
          label="Saved"
          active={isActive('/wishlist')}
        />
        <div className="relative">
          <MobileTab
            href="#"
            label={user ? 'Profile' : 'Login'}
            onClick={() => user ? setIsProfileOpen(!isProfileOpen) : router.push('/auth/login')}
            active={isActive(user ? '/profile' : '/auth')}
          />
          {user && isProfileOpen && (
            <div
              className="absolute bottom-20 right-0 w-40 rounded-lg border shadow-lg overflow-hidden"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-secondary)'
              }}
            >
              <Link
                href="/profile"
                onClick={() => setIsProfileOpen(false)}
                className="block px-4 py-3 text-sm font-semibold border-b transition hover:opacity-70"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                My Profile
              </Link>
              <Link
                href="/orders"
                onClick={() => setIsProfileOpen(false)}
                className="block px-4 py-3 text-sm font-semibold border-b transition hover:opacity-70"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                My Orders
              </Link>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 text-sm font-semibold text-left flex items-center gap-2 transition hover:opacity-70"
                style={{ color: 'var(--text-primary)' }}
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Login Prompt Modal */}
      {loginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div
            className="w-full max-w-sm rounded-lg border p-6 shadow-2xl"
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
                className="rounded-lg px-4 py-2 font-bold border transition hover:opacity-70"
                style={{ borderColor: 'var(--border-color)' }}
              >
                Later
              </button>
              <Link
                href="/auth/login"
                className="rounded-lg px-4 py-2 text-center font-black text-white transition hover:opacity-90"
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
}: {
  href: string;
  label: string;
  onClick?: () => void;
  cartCount?: number;
  active?: boolean;
}) {
  const getIcon = () => {
    switch (href) {
      case '/':
        return <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
      case '/products':
        return <PackageSearch size={20} />;
      case '/cart':
        return <ShoppingBag size={20} />;
      case '/wishlist':
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
      className="flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-bold transition hover:opacity-70"
      style={{ color: active ? 'var(--color-primary)' : 'var(--text-primary)' }}
    >
      <div className="relative rounded-full px-3 py-1" style={{ backgroundColor: active ? 'color-mix(in srgb, var(--color-primary) 14%, transparent)' : 'transparent' }}>
        {getIcon()}
        {href === '/cart' && (
          <span
            className="absolute -top-2 -right-2 h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-black text-white"
            style={{
              backgroundColor: 'var(--color-primary)',
              display: cartCount && cartCount > 0 ? 'flex' : 'none'
            }}
          >
            {cartCount && cartCount > 0 && cartCount}
          </span>
        )}
      </div>
      <span>{label}</span>
    </Link>
  );
}

function DesktopNavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className="relative rounded-full px-3 py-2 transition hover:opacity-70"
      style={{
        color: active ? 'var(--color-primary)' : 'var(--text-primary)',
        backgroundColor: active ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)' : 'transparent'
      }}
    >
      {label}
    </Link>
  );
}

function MobileDrawerLink({ href, label, active, onClick }: { href: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="px-5 py-3 font-semibold border-b transition hover:opacity-70"
      style={{
        borderColor: 'var(--border-light)',
        color: active ? 'var(--color-primary)' : 'var(--text-primary)',
        backgroundColor: active ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)' : 'transparent'
      }}
    >
      {label}
    </Link>
  );
}
