'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Zap } from 'lucide-react';

interface Theme {
  id: string;
  name: string;
  slug: string;
  description?: string;
  story?: string;
  imageUrl?: string;
  bannerImageUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  animationStyle?: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  images?: Array<{ url: string; alt?: string }>;
  price: number;
  themeId?: string;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  href?: string;
  imageUrl?: string;
  ctaLabel?: string;
  themeId?: string;
}

interface HeroThemeSectionProps {
  themes: Theme[];
  products: Product[];
  announcements: Announcement[];
  websiteTheme: any;
  settings: any;
}

export function HeroThemeSection({
  themes,
  products,
  announcements,
  websiteTheme,
  settings
}: HeroThemeSectionProps) {
  const [activeThemeSlide, setActiveThemeSlide] = useState(0);

  const activeTheme = useMemo(() => {
    const theme = themes[activeThemeSlide];
    if (!theme) return null;
    return theme;
  }, [themes, activeThemeSlide]);

  const themeProducts = useMemo(() => {
    if (!activeTheme) return [];
    return products.filter((p) => p.themeId === activeTheme.id).slice(0, 4);
  }, [activeTheme, products]);

  const themeAnnouncements = useMemo(() => {
    if (!activeTheme) return [];
    return announcements.filter((a) => a.themeId === activeTheme.id).slice(0, 2);
  }, [activeTheme, announcements]);

  const nextTheme = () => {
    setActiveThemeSlide((prev) => (prev + 1) % themes.length);
  };

  const prevTheme = () => {
    setActiveThemeSlide((prev) => (prev - 1 + themes.length) % themes.length);
  };

  if (!themes || themes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Main Hero - Active Theme Showcase */}
      <section
        className="relative overflow-hidden rounded-2xl min-h-[500px] md:min-h-[600px] flex flex-col md:flex-row items-center justify-between p-6 md:p-12 transition-colors duration-500"
        style={{
          backgroundColor: activeTheme?.primaryColor || '#111827',
          fontFamily: activeTheme?.fontFamily || 'inherit',
        }}
      >
        {/* Overlay for better text contrast */}
        <div className="absolute inset-0 opacity-30" style={{ backgroundColor: '#000000' }} />

        {/* Left Content */}
        <div className="relative z-10 flex-1 max-w-2xl space-y-6 text-white">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 border" style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.22)' }}>
            <Sparkles size={16} />
            <span className="text-sm font-bold">{activeTheme?.name} Collection</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight">
            {activeTheme?.name}
          </h1>

          <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-lg">
            {activeTheme?.story || activeTheme?.description || 'Discover our latest collection'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              href={`/themes/${activeTheme?.slug}`}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 font-bold rounded-lg transition-all"
              style={{ backgroundColor: '#ffffff', color: activeTheme?.primaryColor || '#111827' }}
            >
              Explore {activeTheme?.name}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <button
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 text-white font-bold rounded-lg transition-all"
              style={{ borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.08)' }}
            >
              View All
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        {/* Right Image Showcase */}
        <div className="relative z-10 flex-1 mt-8 md:mt-0 md:ml-8">
          {activeTheme?.imageUrl && (
            <div className="relative overflow-hidden rounded-xl aspect-square md:aspect-auto md:h-96 shadow-2xl">
              <img
                src={activeTheme.imageUrl}
                alt={activeTheme.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Navigation arrows */}
        {themes.length > 1 && (
          <div className="absolute bottom-6 md:bottom-8 left-6 md:left-8 z-20 flex gap-2">
            <button
              onClick={prevTheme}
              className="inline-flex items-center justify-center w-12 h-12 rounded-full transition-all"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
              aria-label="Previous theme"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextTheme}
              className="inline-flex items-center justify-center w-12 h-12 rounded-full transition-all"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
              aria-label="Next theme"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </section>

      {/* Theme Carousel/Selector */}
      {themes.length > 1 && (
        <section className="space-y-4">
          <h3 className="text-2xl font-black">All Themes</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {themes.map((theme, idx) => (
              <button
                key={theme.id}
                onClick={() => setActiveThemeSlide(idx)}
                className={`group relative overflow-hidden rounded-lg p-4 transition-all cursor-pointer border-2 ${
                  activeThemeSlide === idx ? 'ring-2 ring-offset-2' : ''
                }`}
                style={{
                  backgroundColor: theme.primaryColor || '#f5f5f5',
                  borderColor: activeThemeSlide === idx ? (theme.primaryColor || '#111827') : 'transparent',
                  color: 'white',
                  outlineColor: theme.primaryColor || '#111827'
                }}
              >
                <div className="space-y-2">
                  <h4 className="font-black text-lg">{theme.name}</h4>
                  <p className="text-sm font-bold opacity-90 line-clamp-2">{theme.description}</p>
                </div>
                {activeThemeSlide === idx && (
                  <div className="absolute top-3 right-3">
                    <Zap size={20} fill="currentColor" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Theme Announcements */}
      {themeAnnouncements.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-2xl font-black">Latest Updates</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {themeAnnouncements.map((announcement) => (
              <Link
                key={announcement.id}
                href={announcement.href || '/products'}
                className="group overflow-hidden rounded-lg border p-6 transition-all hover:shadow-lg hover:-translate-y-1"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
              >
                {announcement.imageUrl && (
                  <div className="mb-4 overflow-hidden rounded-lg aspect-video">
                    <img
                      src={announcement.imageUrl}
                      alt={announcement.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}
                <h4 className="font-black text-lg">{announcement.title}</h4>
                <p className="mt-2 text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                  {announcement.message}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 font-bold" style={{ color: 'var(--color-primary)' }}>
                  {announcement.ctaLabel || 'Learn more'} <ArrowRight size={16} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Quick Products from Active Theme */}
      {themeProducts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black">New in {activeTheme?.name}</h3>
            <Link href={`/themes/${activeTheme?.slug}`} className="inline-flex items-center gap-2 font-bold text-sm" style={{ color: 'var(--color-primary)' }}>
              View all <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {themeProducts.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group relative overflow-hidden rounded-lg border p-3 transition-all"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
              >
                <div className="mb-3 aspect-square overflow-hidden rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0].url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Zap size={32} opacity={0.3} />
                    </div>
                  )}
                </div>
                <h5 className="font-black text-sm line-clamp-2">{product.name}</h5>
                <p className="mt-2 font-black text-lg" style={{ color: 'var(--color-primary)' }}>
                  Rs {Math.round(product.price / 100)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
