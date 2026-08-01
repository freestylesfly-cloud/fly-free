'use client';

import { useEffect, useState, useRef } from 'react';
import type React from 'react';
import { ChevronDown, Heart, PackageSearch, Package, ShoppingBag, Menu, X, Megaphone, User, Search, LogOut } from 'lucide-react';
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
  // themes = design drops, fits = product types (regular, oversized, jersey, ...)
  const [themes, setThemes] = useState<any[]>([]);
  const [fits, setFits] = useState<any[]>([]);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);
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

  useEffect(() => {
    fetch(`${API_BASE}/catalog/filters`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        setThemes(data?.themes ?? []);
        setFits(data?.categories ?? []);
      })
      .catch(() => {
        setThemes([]);
        setFits([]);
      });
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
            <Logo size="lg" showText={false} />
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
            <Logo size="lg" showText={false} />
          </Link>

          {/* Center: Navigation Menu */}
          <nav className="flex gap-8 text-sm font-semibold flex-1 justify-center">
            <DesktopNavLink href="/" label="Home" active={isActive('/')} />
            <DesktopNavLink href="/products" label="Shop" active={isActive('/products')} />

            <MegaMenu
              label="Themes"
              href="/products"
              active={isActive('/themes')}
              isOpen={hoveredMenuItem === 'themes'}
              onOpen={() => setHoveredMenuItem('themes')}
              onClose={() => setHoveredMenuItem(null)}
              items={themes.map((theme) => ({
                key: theme.id,
                label: theme.name,
                href: `/themes/${theme.slug}`,
                imageUrl: theme.bannerImageUrl || theme.imageUrl,
                caption: theme.description,
              }))}
              emptyLabel="No themes yet"
            />

            <MegaMenu
              label="Fit"
              href="/products"
              active={false}
              isOpen={hoveredMenuItem === 'fits'}
              onOpen={() => setHoveredMenuItem('fits')}
              onClose={() => setHoveredMenuItem(null)}
              items={fits.map((fit) => ({
                key: fit.id,
                label: fit.name,
                href: `/products?category=${fit.slug}`,
                imageUrl: fit.imageUrl,
              }))}
              emptyLabel="No fits yet"
            />

            <DesktopNavLink href="/about" label="About" active={isActive('/about')} />
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

        {/* Overlay */}
        {isOpen && (
          <div
            onClick={() => setIsOpen(false)}
            className="md:hidden fixed inset-0 z-40 bg-black/40"
          />
        )}

        {/* Mobile Menu Drawer - Professional Sidebar */}
        <div
          className="md:hidden fixed inset-y-0 left-0 flex flex-col overflow-hidden z-50"
          style={{
            width: '280px',
            maxWidth: '85vw',
            backgroundColor: 'var(--bg-secondary)',
            transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: isOpen ? '4px 0 12px rgba(0, 0, 0, 0.15)' : 'none',
          }}
        >
          {/* Close Button - Top Right */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 p-2 z-50"
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

                <MobileDrawerGroup
                  label="Themes"
                  icon="🎨"
                  isOpen={openMobileGroup === 'themes'}
                  onToggle={() => setOpenMobileGroup(openMobileGroup === 'themes' ? null : 'themes')}
                  items={themes.map((theme) => ({
                    key: theme.id,
                    label: theme.name,
                    href: `/themes/${theme.slug}`,
                  }))}
                  onNavigate={() => setIsOpen(false)}
                />

                <MobileDrawerGroup
                  label="Fit"
                  icon="👕"
                  isOpen={openMobileGroup === 'fits'}
                  onToggle={() => setOpenMobileGroup(openMobileGroup === 'fits' ? null : 'fits')}
                  items={fits.map((fit) => ({
                    key: fit.id,
                    label: fit.name,
                    href: `/products?category=${fit.slug}`,
                  }))}
                  onNavigate={() => setIsOpen(false)}
                />

                <MobileDrawerLink href="/about" label="About" active={isActive('/about')} onClick={() => setIsOpen(false)} icon="ℹ️" />
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
        </div>
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

type MenuItem = {
  key: string;
  label: string;
  href: string;
  imageUrl?: string | null;
  caption?: string | null;
};

/** Desktop nav entry that reveals a panel of themes or fits on hover. */
function MegaMenu({
  label,
  href,
  active,
  isOpen,
  onOpen,
  onClose,
  items,
  emptyLabel
}: {
  label: string;
  href: string;
  active: boolean;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  items: MenuItem[];
  emptyLabel: string;
}) {
  return (
    <div className="relative" onMouseEnter={onOpen} onMouseLeave={onClose}>
      <Link
        href={href}
        className="relative flex items-center gap-1 px-1 py-2 text-xs font-bold uppercase tracking-wide transition hover:opacity-70"
        style={{
          color: active || isOpen ? 'var(--color-primary)' : 'var(--text-primary)',
          borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent'
        }}
      >
        {label}
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </Link>

      {isOpen && (
        <div
          className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3"
          style={{ minWidth: items.length > 0 ? '640px' : '220px' }}
        >
          <div
            className="rounded-lg border-2 p-4 shadow-xl"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
          >
            {items.length === 0 ? (
              <p className="px-2 py-3 text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                {emptyLabel}
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {items.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={onClose}
                    className="group flex items-center gap-3 rounded-lg p-2 transition"
                    style={{ backgroundColor: 'transparent' }}
                    onMouseEnter={(event) => (event.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                    onMouseLeave={(event) => (event.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <span
                      className="h-12 w-12 flex-shrink-0 overflow-hidden rounded"
                      style={{ backgroundColor: 'var(--bg-tertiary)' }}
                    >
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black" style={{ color: 'var(--text-primary)' }}>
                        {item.label}
                      </span>
                      {item.caption && (
                        <span className="block truncate text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {item.caption}
                        </span>
                      )}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Mobile drawer entry that expands to reveal themes or fits. */
function MobileDrawerGroup({
  label,
  icon,
  isOpen,
  onToggle,
  items,
  onNavigate
}: {
  label: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  items: MenuItem[];
  onNavigate: () => void;
}) {
  return (
    <div className="border-b" style={{ borderColor: 'var(--border-light)' }}>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-5 py-3 text-sm font-semibold uppercase tracking-wide"
        style={{ color: 'var(--text-primary)', borderLeft: '4px solid transparent' }}
        aria-expanded={isOpen}
      >
        <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown
          size={16}
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}
        />
      </button>

      {isOpen && (
        <div style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          {items.length === 0 ? (
            <p className="px-12 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Nothing here yet
            </p>
          ) : (
            items.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={onNavigate}
                className="block px-12 py-3 text-sm font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                {item.label}
              </Link>
            ))
          )}
        </div>
      )}
    </div>
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
