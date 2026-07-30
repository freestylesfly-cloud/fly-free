'use client';

import { ArrowRight, Zap, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface ProfessionalHeroProps {
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    heroTitle?: string;
    heroSubtitle?: string;
    heroDesktopImageUrl?: string;
  };
}

export function ProfessionalHero({ theme }: ProfessionalHeroProps) {
  const primaryColor = theme?.primaryColor || '#FF4A4E';
  const secondaryColor = theme?.secondaryColor || '#00A8E8';
  const accentColor = theme?.accentColor || '#FFB703';
  const heroTitle = theme?.heroTitle || 'Express Your Style';
  const heroSubtitle = theme?.heroSubtitle || 'Premium T-shirts for every mood. Designed for comfort, crafted for culture.';
  const heroImage = theme?.heroDesktopImageUrl || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&h=600&fit=crop';

  return (
    <section className="relative overflow-hidden rounded-2xl mb-16">
      {/* Background Image with Gradient Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${heroImage})`,
          opacity: 0.15,
        }}
      />

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}cc 0%, ${secondaryColor}cc 100%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 px-6 md:px-12 py-16 md:py-24">
        {/* Tag */}
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-3 mb-6 backdrop-blur-sm"
          style={{
            backgroundColor: `${accentColor}20`,
            border: `1px solid ${accentColor}40`,
          }}
        >
          <Sparkles size={16} style={{ color: accentColor }} />
          <span className="text-sm font-bold text-white">{heroTitle.split(' ')[0]} Collection Now Live</span>
        </div>

        {/* Main Title */}
        <h1 className="text-5xl md:text-7xl font-black leading-none text-white mb-6 tracking-tight">
          {heroTitle}
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl mb-8">
          {heroSubtitle}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 font-bold rounded-lg transition-all group"
            style={{
              backgroundColor: '#ffffff',
              color: primaryColor,
              boxShadow: `0 8px 20px ${primaryColor}30`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 12px 28px ${primaryColor}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 8px 20px ${primaryColor}30`;
            }}
          >
            Explore Now
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 text-white font-bold rounded-lg transition-all"
            style={{
              borderColor: `${secondaryColor}60`,
              backgroundColor: `${secondaryColor}15`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${secondaryColor}25`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = `${secondaryColor}15`;
            }}
          >
            <Zap size={18} />
            View Collection
          </Link>
        </div>

        {/* Trust Elements */}
        <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-white/20">
          <div>
            <p className="text-2xl font-black text-white">10K+</p>
            <p className="text-sm text-white/80">Happy Customers</p>
          </div>
          <div>
            <p className="text-2xl font-black text-white">2-3 Days</p>
            <p className="text-sm text-white/80">Fast Delivery</p>
          </div>
          <div>
            <p className="text-2xl font-black text-white">100%</p>
            <p className="text-sm text-white/80">Quality Guarantee</p>
          </div>
        </div>
      </div>
    </section>
  );
}
