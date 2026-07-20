'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getApiBaseUrl } from '../lib/api';

const API_URL = getApiBaseUrl();

interface HeroBanner {
  id: string;
  title: string;
  message: string;
  href?: string;
  ctaLabel?: string;
  imageUrl?: string;
  type?: 'EVENT' | 'OFFER' | 'INFO' | 'ANNOUNCEMENT';
  priority?: number;
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
}

export function HeroBannerCarousel() {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (!autoPlay || banners.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [autoPlay, banners.length]);

  const fetchBanners = async () => {
    try {
      const response = await fetch(`${API_URL}/cms/announcements`);
      if (response.ok) {
        const data = await response.json();
        const activeBanners = (Array.isArray(data) ? data : data?.data || [])
          .filter((b: any) => b.isActive)
          .sort((a: any, b: any) => (b.priority || 0) - (a.priority || 0));
        setBanners(activeBanners);
      }
    } catch (error) {
      console.error('Failed to fetch banners:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || banners.length === 0) return null;

  const currentBanner = banners[currentIndex];
  const bgColor = currentBanner.type === 'OFFER' ? '#10b981' :
                  currentBanner.type === 'EVENT' ? 'var(--color-primary)' :
                  currentBanner.type === 'INFO' ? '#3b82f6' : '#666';

  return (
    <div className="relative w-full overflow-hidden rounded-lg" style={{ backgroundColor: bgColor }}>
      {/* Banner Content */}
      <div className="grid md:grid-cols-2 gap-6 p-6 md:p-8">
        {/* Left: Image */}
        {currentBanner.imageUrl && (
          <div className="hidden md:flex items-center justify-center">
            <img
              src={currentBanner.imageUrl}
              alt={currentBanner.title}
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Right: Content */}
        <div className="flex flex-col justify-center">
          {/* Tag */}
          {currentBanner.type && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/20 text-white w-fit mb-3">
              {currentBanner.type}
            </span>
          )}

          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
            {currentBanner.title}
          </h2>

          {/* Message */}
          <p className="text-base md:text-lg text-white/90 mb-6">
            {currentBanner.message}
          </p>

          {/* CTA Button */}
          {currentBanner.href && currentBanner.ctaLabel && (
            <Link
              href={currentBanner.href}
              className="inline-flex items-center gap-2 w-fit px-6 py-3 rounded-lg bg-white text-black font-bold transition hover:shadow-lg"
            >
              {currentBanner.ctaLabel}
              <ChevronRight size={18} />
            </Link>
          )}
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={() => setBanners(banners.filter((_, i) => i !== currentIndex))}
        className="absolute top-4 right-4 p-2 rounded-lg bg-white/20 text-white transition hover:bg-white/30"
        aria-label="Close banner"
      >
        <X size={20} />
      </button>

      {/* Navigation - Desktop */}
      {banners.length > 1 && (
        <>
          {/* Arrows */}
          <button
            onClick={() => {
              setAutoPlay(false);
              setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
            }}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white/20 text-white transition hover:bg-white/40 hidden md:flex"
            aria-label="Previous banner"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={() => {
              setAutoPlay(false);
              setCurrentIndex((prev) => (prev + 1) % banners.length);
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white/20 text-white transition hover:bg-white/40 hidden md:flex"
            aria-label="Next banner"
          >
            <ChevronRight size={24} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setAutoPlay(false);
                  setCurrentIndex(idx);
                }}
                className={`w-2 h-2 rounded-full transition ${
                  idx === currentIndex ? 'bg-white w-6' : 'bg-white/50'
                }`}
                aria-label={`Go to banner ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
