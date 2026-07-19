'use client';

import { useEffect, useState } from 'react';
import type React from 'react';
import { Heart, Home, PackageSearch, ShoppingBag, Menu, X, Sun, Moon, Megaphone, User } from 'lucide-react';
import { useThemeStore } from '../../src/store/themeStore';
import Link from 'next/link';
import { getApiBaseUrl } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';

const API_BASE = getApiBaseUrl();

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [activeAnnouncement, setActiveAnnouncement] = useState(0);
  const [loginPrompt, setLoginPrompt] = useState('');
  const { resolvedUiTheme, toggleUiTheme } = useThemeStore();
  const user = useAuthStore((state) => state.user);
  const cartCount = useCartStore((state) => state.getItemCount());
  const announcement = announcements[activeAnnouncement % Math.max(announcements.length, 1)];

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
    <header className="sticky top-0 z-40 transition" style={{ borderColor: 'var(--border-color)', backgroundColor: `var(--bg-secondary)`, borderBottomWidth: '1px' }}>
      {announcement && (
        <Link
          href={announcement.href || '#'}
          className="block px-4 py-2 text-center text-sm font-bold text-white transition"
          style={{
            background: announcement.theme
              ? `linear-gradient(90deg, ${announcement.theme.primaryColor}, ${announcement.theme.secondaryColor})`
              : `linear-gradient(90deg, var(--color-primary), var(--color-secondary))`,
            fontFamily: announcement.theme?.fontFamily || 'var(--font-family, inherit)'
          }}
        >
          <span className="inline-flex items-center gap-2">
            <Megaphone size={15} />
            <span>{announcement.title}</span>
            <span className="hidden opacity-80 sm:inline">- {announcement.message}</span>
            {announcement.ctaLabel && <span className="underline underline-offset-4">{announcement.ctaLabel}</span>}
          </span>
        </Link>
      )}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        {/* Logo */}
        <Link href="/" className="text-xl font-black uppercase tracking-wide hover:opacity-80">
          Fly Free
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden gap-8 text-sm font-semibold md:flex">
          <Link href="/products" className="transition hover:text-coral">Shop</Link>
          <Link href="/gifting" className="transition hover:text-coral">Gifting</Link>
          <Link href="/#reviews" className="transition hover:text-coral">Reviews</Link>
        </nav>

        {/* Desktop Controls */}
        <div className="hidden gap-3 md:flex items-center">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => toggleUiTheme()}
            className="p-2 rounded-lg border border-transparent hover:border-current transition"
            title={resolvedUiTheme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {resolvedUiTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <Link
            href={user ? '/wishlist' : '#'}
            onClick={(event) => {
              if (!user) {
                event.preventDefault();
                setLoginPrompt('wishlist');
              }
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border transition"
            style={{ borderColor: 'var(--border-color)' }}
            aria-label="Open wishlist"
          >
            <Heart size={18} />
          </Link>

          <Link
            href={user ? '/profile' : '/auth/login'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border transition"
            style={{ borderColor: 'var(--border-color)' }}
            aria-label={user ? 'Open profile' : 'Login'}
          >
            <User size={18} />
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full transition"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
            aria-label="Open cart"
          >
            <ShoppingBag size={18} />
            {cartCount > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-coral px-1.5 py-0.5 text-[10px] font-black text-white">{cartCount}</span>}
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden transition" style={{ borderTopColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', borderTopWidth: '1px' }}>
          <nav className="flex flex-col gap-0">
            <Link href="/products" className="px-5 py-3 font-semibold transition" style={{ borderBottomColor: 'var(--border-light)', borderBottomWidth: '1px' }}>Shop</Link>
            <Link href="/gifting" className="px-5 py-3 font-semibold transition" style={{ borderBottomColor: 'var(--border-light)', borderBottomWidth: '1px' }}>Gifting</Link>
            <Link href="/#reviews" className="px-5 py-3 font-semibold transition" style={{ borderBottomColor: 'var(--border-light)', borderBottomWidth: '1px' }}>Reviews</Link>
            <Link href={user ? '/orders' : '#'} onClick={(event) => { if (!user) { event.preventDefault(); setLoginPrompt('orders'); } }} className="px-5 py-3 font-semibold transition" style={{ borderBottomColor: 'var(--border-light)', borderBottomWidth: '1px' }}>My Orders</Link>
            <Link href={user ? '/profile' : '/auth/login'} className="px-5 py-3 font-semibold transition" style={{ borderBottomColor: 'var(--border-light)', borderBottomWidth: '1px' }}>{user ? 'My Profile' : 'Login / Register'}</Link>

            {/* Mobile Dark Mode */}
            <button
              onClick={() => toggleUiTheme()}
              className="px-5 py-3 font-semibold flex items-center gap-2 justify-between transition"
              style={{ borderBottomColor: 'var(--border-light)', borderBottomWidth: '1px' }}
            >
              <span>{resolvedUiTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              {resolvedUiTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Mobile Cart */}
            <Link href="/cart" className="px-5 py-3 font-semibold flex items-center gap-2 transition">
              <ShoppingBag size={18} />
              <span>Cart</span>
            </Link>
          </nav>
        </div>
      )}
    </header>

    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t md:hidden" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
      <MobileTab href="/" icon={<Home size={19} />} label="Home" />
      <MobileTab href="/products" icon={<PackageSearch size={19} />} label="Shop" />
      <MobileTab href="/cart" icon={<ShoppingBag size={19} />} label={`Cart${cartCount ? ` ${cartCount}` : ''}`} />
      <MobileTab href={user ? '/wishlist' : '#'} onClick={() => !user && setLoginPrompt('wishlist')} icon={<Heart size={19} />} label="Saved" />
      <MobileTab href={user ? '/profile' : '/auth/login'} icon={<User size={19} />} label={user ? 'Profile' : 'Login'} />
    </nav>

    {loginPrompt && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
        <div className="w-full max-w-sm rounded border p-5 shadow-2xl" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <h2 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>Login for {loginPrompt}</h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>You can browse products without login. Saved items, orders, profile, and better checkout need your account.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button onClick={() => setLoginPrompt('')} className="rounded border px-4 py-2 font-bold" style={{ borderColor: 'var(--border-color)' }}>Later</button>
            <Link href="/auth/login" className="rounded px-4 py-2 text-center font-black text-white" style={{ backgroundColor: 'var(--color-primary)' }}>Login</Link>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function MobileTab({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={(event) => {
        if (href === '#') event.preventDefault();
        onClick?.();
      }}
      className="flex min-h-[58px] flex-col items-center justify-center gap-1 text-[11px] font-black"
      style={{ color: 'var(--text-primary)' }}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
