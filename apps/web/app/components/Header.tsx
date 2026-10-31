'use client';

import { useEffect, useState, useRef } from 'react';
import type React from 'react';
import { ChevronDown, Heart, Home, Info, Package, Palette, Search, Shirt, ShoppingBag, Store, LogIn, Menu, X, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getApiBaseUrl } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';
import { Logo } from './Logo';
import { IMAGE_WIDTH, storageImage } from '../lib/image';

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
  // themes = design drops; productTypes = what we sell (T-Shirts, Hoodies…),
  // each with its styles. Types appear here once they have visible products.
  const [themes, setThemes] = useState<any[]>([]);
  const [productTypes, setProductTypes] = useState<any[]>([]);
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
        setProductTypes(data?.productTypes ?? []);
      })
      .catch(() => {
        setThemes([]);
        setProductTypes([]);
      });
  }, []);

  return (
    <>
      {/* Announcement marquee — brand strip, pauses on hover so a link is
          actually clickable. */}
      {announcements.length > 0 && (
        <div
          className="mo-marquee overflow-hidden whitespace-nowrap"
          style={{ backgroundColor: 'var(--color-primary)', padding: '7px 0' }}
        >
          <div className="mo-marquee-track">
            {[0, 1].map((rep) => (
              // The second pass is purely visual filler for the loop.
              <span key={rep} className="inline-flex items-center" aria-hidden={rep === 1}>
                {announcements.map((item, idx) => (
                  <AnnouncementItem key={`${rep}-${item.id ?? idx}`} item={item} />
                ))}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Header */}
      {/* Frosted bar: content scrolls softly underneath instead of hard-cutting. */}
      <header className="site-header sticky top-0 z-40">
        {/* Mobile Header - Logo Centered */}
        <div className="md:hidden px-3 py-1.5 flex items-center justify-between gap-2">
          {/* Left: Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="icon-btn"
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
            <Link href="/products" className="icon-btn" title="Search" aria-label="Search products">
              <Search size={20} />
            </Link>
            <Link href="/cart" className="icon-btn relative" title="Cart" aria-label="Shopping cart">
              <ShoppingBag size={20} />
              {displayedCartCount > 0 && <span className="count-badge">{displayedCartCount}</span>}
            </Link>
          </div>
        </div>

        {/* Desktop Header - Professional Layout */}
        <div className="hidden md:flex h-16 items-center justify-between px-6 max-w-7xl mx-auto gap-8">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center justify-center hover:opacity-80 whitespace-nowrap flex-shrink-0">
            <Logo size="md" showText={false} />
          </Link>

          {/* Center: Navigation Menu */}
          <nav className="flex gap-7 text-sm font-semibold flex-1 justify-center">
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

            {productTypes.map((type) => (
              <MegaMenu
                key={type.id}
                label={type.name}
                href={`/products?type=${type.slug}`}
                active={false}
                isOpen={hoveredMenuItem === `type-${type.slug}`}
                onOpen={() => setHoveredMenuItem(`type-${type.slug}`)}
                onClose={() => setHoveredMenuItem(null)}
                items={[
                  { key: `all-${type.id}`, label: `All ${type.name}`, href: `/products?type=${type.slug}`, imageUrl: type.imageUrl },
                  ...type.styles.map((style: any) => ({
                    key: style.id,
                    label: style.name,
                    href: `/products?type=${type.slug}&category=${style.slug}`,
                    imageUrl: style.imageUrl,
                  })),
                ]}
                emptyLabel="Coming soon"
              />
            ))}

            <DesktopNavLink href="/about" label="About" active={isActive('/about')} />
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 whitespace-nowrap flex-shrink-0">
            {/* Search */}
            <Link href="/products" className="icon-btn" title="Search products" aria-label="Search products">
              <Search size={18} />
            </Link>

            {/* Wishlist */}
            <Link href={user ? '/profile/wishlist' : '/auth/login'} className="icon-btn" title="Wishlist" aria-label="Open wishlist">
              <Heart size={18} />
            </Link>

            {/* Profile Dropdown */}
            {user ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="icon-btn"
                  data-open={isProfileOpen || undefined}
                  aria-label="Open profile menu"
                  aria-expanded={isProfileOpen}
                >
                  <User size={18} />
                </button>
                {isProfileOpen && (
                  <div
                    className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border shadow-xl z-50"
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
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
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
              <Link href="/auth/login" className="signin-btn" title="Sign in or create an account">
                <LogIn size={16} /> Sign in
              </Link>
            )}

            {/* Cart */}
            <Link href="/cart" className="icon-btn relative" title="Cart" aria-label="Open cart">
              <ShoppingBag size={18} />
              {displayedCartCount > 0 && <span className="count-badge">{displayedCartCount}</span>}
            </Link>
          </div>
        </div>

        {/* Overlay */}
        {isOpen && (
          <div
            onClick={() => setIsOpen(false)}
            className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
          />
        )}

        {/* Mobile Menu Drawer - Professional Sidebar */}
        <div
          className="md:hidden fixed inset-y-0 left-0 flex flex-col overflow-hidden z-50"
          style={{
            width: '312px',
            maxWidth: '86vw',
            backgroundColor: 'var(--bg-secondary)',
            transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: isOpen ? '4px 0 12px rgba(0, 0, 0, 0.15)' : 'none',
          }}
        >
          <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--border-light)' }}>
            <Link href="/" onClick={() => setIsOpen(false)} aria-label="Fly Free home">
              <Logo size="sm" showText={false} />
            </Link>
            <button onClick={() => setIsOpen(false)} className="icon-btn" aria-label="Close menu">
              <X size={22} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
              {!user && (
                <div className="m-4 rounded-xl p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <p className="text-base font-black" style={{ color: 'var(--text-primary)' }}>Welcome to Fly Free</p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Sign in to track orders and save favourites.</p>
                  <Link href="/auth/login" onClick={() => setIsOpen(false)} className="signin-btn mt-3 w-full justify-center">
                    <LogIn size={16} /> Sign in
                  </Link>
                </div>
              )}
              <div className="py-1">
                <MobileDrawerLink href="/" label="Home" active={isActive('/')} onClick={() => setIsOpen(false)} icon={<Home size={16} />} />
                <MobileDrawerLink href="/products" label="Shop" active={isActive('/products')} onClick={() => setIsOpen(false)} icon={<Store size={16} />} />

                <MobileDrawerGroup
                  label="Themes"
                  icon={<Palette size={16} />}
                  isOpen={openMobileGroup === 'themes'}
                  onToggle={() => setOpenMobileGroup(openMobileGroup === 'themes' ? null : 'themes')}
                  items={themes.map((theme) => ({
                    key: theme.id,
                    label: theme.name,
                    href: `/themes/${theme.slug}`,
                  }))}
                  onNavigate={() => setIsOpen(false)}
                />

                {productTypes.map((type) => (
                  <MobileDrawerGroup
                    key={type.id}
                    label={type.name}
                    icon={<Shirt size={16} />}
                    isOpen={openMobileGroup === `type-${type.slug}`}
                    onToggle={() => setOpenMobileGroup(openMobileGroup === `type-${type.slug}` ? null : `type-${type.slug}`)}
                    items={[
                      { key: `all-${type.id}`, label: `All ${type.name}`, href: `/products?type=${type.slug}` },
                      ...type.styles.map((style: any) => ({
                        key: style.id,
                        label: style.name,
                        href: `/products?type=${type.slug}&category=${style.slug}`,
                      })),
                    ]}
                    onNavigate={() => setIsOpen(false)}
                  />
                ))}

                <MobileDrawerLink href="/about" label="About" active={isActive('/about')} onClick={() => setIsOpen(false)} icon={<Info size={16} />} />
              </div>

              {/* Account Section */}
              {user && (
              <div className="border-t py-1" style={{ borderColor: 'var(--border-light)' }}>
                <p className="px-5 pb-1 pt-3 text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>
                  Your account
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
                    icon={<LogIn size={16} />}
                  />
                )}
              </div>
              )}

              {/* Logout Button - Only for logged-in users */}
              {user && (
                <div className="border-t" style={{ borderColor: 'var(--border-light)' }}>
                  <button
                    onClick={handleLogout}
                    className="w-full px-5 py-3.5 font-semibold text-sm flex items-center gap-3 transition"
                    style={{
                      color: 'var(--text-primary)',
                      borderBottom: `1px solid var(--border-light)`,
                      backgroundColor: hoveredMenuItem === 'logout' ? 'var(--bg-tertiary)' : 'transparent',
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

      {/* Mobile Bottom Navigation Bar */}
      <div
        data-canny-floor
        className="bottom-bar fixed inset-x-0 bottom-0 z-50 md:hidden"
        // Slides away while the side menu is open so it never covers the menu.
        data-hidden={isOpen || undefined}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <nav className="grid h-[62px] grid-cols-5 px-1" aria-label="Mobile primary navigation">
          <MobileTab href="/" label="Home" active={isActive('/')} icon="home" />
          <MobileTab href="/products" label="Shop" active={isActive('/products')} icon="shop" />
          <MobileTab
            href="/cart"
            label="Cart"
            cartCount={displayedCartCount}
            active={isActive('/cart')}
            icon="cart"
          />
          <MobileTab
            href={user ? '/profile/wishlist' : '/auth/login'}
            label="Saved"
            active={isActive('/profile/wishlist') || isActive('/wishlist')}
            icon="heart"
          />
          <MobileTab
            href={user ? '/profile' : '/auth/login'}
            label={user ? 'Profile' : 'Sign in'}
            active={isActive(user ? '/profile' : '/auth')}
            icon={user ? 'user' : 'login'}
          />
        </nav>
      </div>

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

/**
 * One announcement in the marquee. The link path is typed by hand in the admin,
 * so it is often blank — without a path this renders as plain text rather than
 * a dead `#` anchor that looks clickable and does nothing.
 */
function AnnouncementItem({ item }: { item: any }) {
  const label = (
    <>
      <span>{item.title}</span>
      {item.ctaLabel && (
        <span className="underline decoration-white/50 underline-offset-4">{item.ctaLabel}</span>
      )}
    </>
  );

  const shared = 'inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-white sm:text-[13px]';

  return (
    <span className="inline-flex items-center">
      {item.href ? (
        <Link href={item.href} className={`${shared} transition hover:text-white/75`}>
          {label}
        </Link>
      ) : (
        <span className={shared}>{label}</span>
      )}
      <span className="select-none px-5 text-white/40 sm:px-7" aria-hidden>
        &bull;
      </span>
    </span>
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
  icon: 'home' | 'shop' | 'cart' | 'heart' | 'user' | 'login';
}) {
  const getIcon = () => {
    const props = {
      size: 20,
      strokeWidth: active ? 2.4 : 1.9,
      fill: 'none',
    };

    switch (icon) {
      case 'home':
        return <Home {...props} />;
      case 'shop':
        return <Store {...props} />;
      case 'cart':
        return <ShoppingBag {...props} />;
      case 'heart':
        return <Heart {...props} />;
      case 'login':
        return <LogIn {...props} />;
      default:
        return <User {...props} />;
    }
  };

  return (
    <Link
      href={href}
      onClick={(event) => {
        if (href === '#') event.preventDefault();
        onClick?.();
      }}
      className="bottom-tab"
      data-active={active || undefined}
      aria-current={active ? 'page' : undefined}
    >
      <span className="bottom-tab-icon">
        {getIcon()}
        {href === '/cart' && cartCount && cartCount > 0 ? <span className="count-badge">{cartCount}</span> : null}
      </span>
      <span className="max-w-full truncate px-1 leading-none">{label}</span>
    </Link>
  );
}

function DesktopNavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className="nav-link"
      data-active={active || undefined}
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
        className="nav-link flex items-center gap-1"
        data-active={active || undefined}
        data-open={isOpen || undefined}
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
            className="mega-panel rounded-2xl border p-4 shadow-2xl"
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
                        <img src={storageImage(item.imageUrl, IMAGE_WIDTH.thumb)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
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
        className="flex w-full items-center gap-3 px-5 py-3.5 text-[15px] font-bold"
        style={{ color: 'var(--text-primary)' }}
        aria-expanded={isOpen}
      >
        <span style={{ color: 'var(--text-secondary)' }}>{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown
          size={16}
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}
        />
      </button>

      {isOpen && (
        <div className="pb-2">
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
                className="mx-3 block rounded-lg py-2.5 pl-11 pr-3 text-sm font-semibold transition hover:bg-[color:var(--bg-primary)]"
                style={{ color: 'var(--text-secondary)' }}
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
      className="mx-2 flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-bold transition"
      style={{
        color: 'var(--text-primary)',
        backgroundColor: active ? 'var(--bg-primary)' : isHovered ? 'var(--bg-primary)' : 'transparent',
        boxShadow: active ? 'inset 3px 0 0 var(--color-accent)' : 'none',
      }}
    >
      {icon && <span style={{ color: active ? 'var(--color-accent)' : 'var(--text-secondary)' }}>{icon}</span>}
      {label}
    </Link>
  );
}
