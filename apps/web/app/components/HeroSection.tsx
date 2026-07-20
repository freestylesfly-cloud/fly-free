'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useThemeStore, WebsiteTheme } from '../../src/stores/themeStore';
import { ChevronRight } from 'lucide-react';

export function HeroSection() {
  const { theme, loading, fetchActiveTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchActiveTheme();
  }, [fetchActiveTheme]);

  if (!mounted || loading || !theme) {
    return (
      <section className="w-full h-[400px] md:h-[600px] bg-gray-200 animate-pulse" />
    );
  }

  return (
    <section
      className="relative w-full overflow-hidden"
      data-campaign-motion={theme.animationStyle || 'fade'}
      style={{
        minHeight: '300px',
        background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`
      }}
    >
      {/* Desktop Image */}
      {theme.heroDesktopImageUrl && (
        <img
          src={theme.heroDesktopImageUrl}
          alt={theme.heroTitle}
          className="hidden md:block w-full h-[500px] object-cover"
        />
      )}

      {/* Mobile Image */}
      {theme.heroMobileImageUrl && (
        <img
          src={theme.heroMobileImageUrl}
          alt={theme.heroTitle}
          className="md:hidden w-full h-[300px] object-cover"
        />
      )}

      {/* Overlay Content */}
      <div
        className="absolute inset-0 flex flex-col justify-center items-center text-center px-4"
        style={{
          background: theme.heroDesktopImageUrl || theme.heroMobileImageUrl
            ? 'rgba(0, 0, 0, 0.3)'
            : 'transparent'
        }}
      >
        <div className="campaign-motion">
          {theme.heroTitle && (
            <h1
              className="text-3xl md:text-5xl font-black mb-4 drop-shadow-lg"
              style={{ color: theme.primaryColor, fontFamily: theme.fontFamily }}
            >
              {theme.heroTitle}
            </h1>
          )}

          {theme.heroSubtitle && (
            <p
              className="text-lg md:text-xl mb-6 drop-shadow-md"
              style={{ color: theme.secondaryColor, fontFamily: theme.fontFamily }}
            >
              {theme.heroSubtitle}
            </p>
          )}

          {theme.heroCtaLabel && theme.heroHref && (
            <Link
              href={theme.heroHref}
              className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded-lg text-white font-black transition hover:opacity-90 transform hover:scale-105"
              style={{
                backgroundColor: theme.primaryColor,
                fontFamily: theme.fontFamily
              }}
            >
              {theme.heroCtaLabel}
              <ChevronRight size={20} />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
