'use client';

import { useState } from 'react';
import { ShoppingBag, Menu, X, Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../src/store/themeStore';
import Link from 'next/link';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentTheme, isDarkMode, setTheme, setDarkMode, themes } = useThemeStore();

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        {/* Logo */}
        <Link href="/" className="text-xl font-black uppercase tracking-wide hover:opacity-80">
          Fly Free
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden gap-8 text-sm font-semibold md:flex">
          <Link href="/products" className="transition hover:text-coral">Shop</Link>
          <Link href="/designer" className="transition hover:text-coral">Design</Link>
          <Link href="#reviews" className="transition hover:text-coral">Reviews</Link>
        </nav>

        {/* Desktop Controls */}
        <div className="hidden gap-3 md:flex items-center">
          {/* Theme Selector */}
          <div className="relative group">
            <button
              className="px-3 py-2 rounded-lg border border-black/10 text-sm font-semibold hover:bg-black/5 flex items-center gap-2"
              title="Change theme"
            >
              <span className="w-4 h-4 rounded bg-current"></span>
              {currentTheme}
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-white rounded-lg border border-black/10 shadow-lg py-2 z-50 min-w-max">
              {Object.keys(themes).map((theme) => (
                <button
                  key={theme}
                  onClick={() => setTheme(theme as any)}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-black/5 ${
                    currentTheme === theme ? 'font-bold bg-black/5' : ''
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!isDarkMode)}
            className="p-2 rounded-lg border border-black/10 hover:bg-black/5 transition"
            title={isDarkMode ? 'Light mode' : 'Dark mode'}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Cart */}
          <Link
            href="/cart"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white hover:opacity-90 transition"
            aria-label="Open cart"
          >
            <ShoppingBag size={18} />
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
        <div className="md:hidden border-t border-black/10 bg-white">
          <nav className="flex flex-col gap-0">
            <Link href="/products" className="px-5 py-3 border-b border-black/5 hover:bg-black/5 font-semibold">Shop</Link>
            <Link href="/designer" className="px-5 py-3 border-b border-black/5 hover:bg-black/5 font-semibold">Design</Link>
            <Link href="#reviews" className="px-5 py-3 border-b border-black/5 hover:bg-black/5 font-semibold">Reviews</Link>

            {/* Mobile Theme Selector */}
            <div className="px-5 py-3 border-b border-black/5">
              <p className="text-xs font-semibold text-black/60 mb-2">Theme</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(themes).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => {
                      setTheme(theme as any);
                      setIsOpen(false);
                    }}
                    className={`px-3 py-2 rounded text-xs font-semibold border transition ${
                      currentTheme === theme
                        ? 'bg-ink text-white border-ink'
                        : 'border-black/10 hover:bg-black/5'
                    }`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Dark Mode */}
            <button
              onClick={() => setDarkMode(!isDarkMode)}
              className="px-5 py-3 border-b border-black/5 hover:bg-black/5 font-semibold flex items-center gap-2 justify-between"
            >
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Mobile Cart */}
            <Link href="/cart" className="px-5 py-3 hover:bg-black/5 font-semibold flex items-center gap-2">
              <ShoppingBag size={18} />
              <span>Cart</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
