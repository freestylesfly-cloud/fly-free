'use client';

import Link from 'next/link';
import { ArrowRight, Instagram, Mail, Star, Zap } from 'lucide-react';
import { ProductCard } from './components/ProductCard';
import { HorizontalSlider } from './components/HorizontalSlider';
import { useEffect, useState } from 'react';
import { getApiBaseUrl } from './lib/api';

const API_BASE = getApiBaseUrl();

interface Product {
  id: string;
  name: string;
  price: number;
  slug: string;
  images?: Array<{ url: string }>;
  theme?: { name: string };
  category?: { name: string };
  isFeatured?: boolean;
  isTrending?: boolean;
  isVisible?: boolean;
}

interface Theme {
  id: string;
  name: string;
  slug: string;
  description: string;
  primaryColor: string;
  heroDesktopImageUrl?: string;
  isActive?: boolean;
}

interface Review {
  id: string;
  rating: number;
  message?: string;
  body?: string;
  user?: { name: string };
  product?: { name: string };
}

export default function HomePage() {
  const [data, setData] = useState<{
    themes: Theme[];
    products: Product[];
    reviews: Review[];
  }>({ themes: [], products: [], reviews: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [themesRes, productsRes, reviewsRes] = await Promise.all([
          fetch(`${API_BASE}/cms/themes?limit=20`, { cache: 'no-store' }),
          fetch(`${API_BASE}/catalog/products?limit=50`, { cache: 'no-store' }),
          fetch(`${API_BASE}/reviews?limit=50`, { cache: 'no-store' }),
        ]);

        const themes = themesRes.ok ? await themesRes.json() : [];
        const products = productsRes.ok ? await productsRes.json() : [];
        const reviews = reviewsRes.ok ? await reviewsRes.json() : [];

        setData({
          themes: Array.isArray(themes) ? themes : themes.data || [],
          products: (Array.isArray(products) ? products : products.data || []).filter((p: Product) => p.isVisible !== false),
          reviews: Array.isArray(reviews) ? reviews : reviews.data || [],
        });
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const activeTheme = data.themes.find((t) => t.isActive) || data.themes[0];
  const featuredProducts = data.products.filter((p) => p.isFeatured || p.isTrending).slice(0, 8);
  const bestSellers = data.products.slice(0, 8);
  const avgRating = data.reviews.length > 0 ? (data.reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / data.reviews.length).toFixed(1) : '5.0';

  return (
    <main style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* HERO BANNER - From Active Theme */}
      <section
        className="relative min-h-screen md:min-h-[600px] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: activeTheme?.heroDesktopImageUrl ? `url('${activeTheme.heroDesktopImageUrl}')` : undefined,
          backgroundColor: activeTheme?.primaryColor || 'var(--color-primary)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-2xl px-5 text-center text-white">
          <span className="mb-4 inline-block px-4 py-2 rounded-full text-xs font-black uppercase" style={{ backgroundColor: 'var(--color-accent)' }}>
            🆕 New Drop
          </span>

          <h1 className="mb-4 text-5xl md:text-6xl font-black leading-tight">{activeTheme?.name || 'Fly Free'}</h1>

          <p className="mb-8 text-lg md:text-xl opacity-90">{activeTheme?.description || 'Explore our latest collection'}</p>

          <Link
            href={`/themes/${activeTheme?.slug || 'all'}`}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg text-white font-black uppercase transition hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Shop Collection <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* FEATURED PRODUCTS - New Drops */}
      {featuredProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-16 md:py-20 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 mb-3" style={{ color: 'var(--color-primary)' }}>
              <Zap size={20} />
              <span className="text-sm font-black uppercase">Latest Arrivals</span>
            </div>
            <h2 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
              New Drops
            </h2>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
              Explore our fresh collection of premium apparel
            </p>
          </div>

          <HorizontalSlider
            title=""
            action={
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-sm font-bold uppercase"
                style={{ color: 'var(--color-primary)' }}
              >
                View All <ArrowRight size={16} />
              </Link>
            }
          >
            {featuredProducts.map((product) => (
              <div key={product.id} className="mo-slide flex-shrink-0" style={{ width: '280px' }}>
                <ProductCard
                  id={product.id}
                  name={product.name}
                  price={Math.round((product.price || 0) / 100)}
                  slug={product.slug}
                  image={product.images?.[0]?.url}
                  hoverImage={product.images?.[1]?.url}
                  tag={product.theme?.name || 'New'}
                />
              </div>
            ))}
          </HorizontalSlider>
        </section>
      )}

      {/* OFFER BANNER - Influencer Code */}
      <section
        className="my-16 mx-auto max-w-7xl px-5 py-12 rounded-xl"
        style={{ backgroundColor: 'var(--color-accent)', backgroundImage: 'linear-gradient(135deg, var(--color-accent) 0%, rgba(255,183,3,0.8) 100%)' }}
      >
        <div className="text-center">
          <p className="text-sm font-bold uppercase text-black/60 mb-2">Exclusive Offer</p>
          <h3 className="text-3xl md:text-4xl font-black text-black mb-4">Use Code: BIHU10</h3>
          <p className="text-black/80 mb-6">Get 10% OFF on Spider-Man Collection</p>
          <Link
            href="/products?theme=spider-man"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-black text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Shop Now <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* BEST SELLERS */}
      {bestSellers.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-16 md:py-20 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 mb-3" style={{ color: 'var(--color-primary)' }}>
              <Star size={20} />
              <span className="text-sm font-black uppercase">Customer Favorites</span>
            </div>
            <h2 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
              Best Sellers
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {bestSellers.slice(0, 8).map((product) => (
              <div key={product.id}>
                <ProductCard
                  id={product.id}
                  name={product.name}
                  price={Math.round((product.price || 0) / 100)}
                  slug={product.slug}
                  image={product.images?.[0]?.url}
                  hoverImage={product.images?.[1]?.url}
                  tag={product.theme?.name || product.category?.name || 'Featured'}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* THEMES GRID */}
      {data.themes.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-16 md:py-20 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="mb-12">
            <h2 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
              Shop by Theme
            </h2>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
              Explore our curated collections
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.themes.map((theme) => (
              <Link
                key={theme.id}
                href={`/themes/${theme.slug}`}
                className="group relative overflow-hidden rounded-xl border-2 transition hover:shadow-lg"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <div
                  className="aspect-video bg-gradient-to-br flex items-end justify-start p-6 text-white"
                  style={{
                    backgroundImage: theme.heroDesktopImageUrl ? `url('${theme.heroDesktopImageUrl}')` : undefined,
                    backgroundColor: theme.primaryColor,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div>
                    <h3 className="text-2xl md:text-3xl font-black leading-tight">{theme.name}</h3>
                  </div>
                </div>

                <div className="p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <p className="text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                    {theme.description}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold uppercase transition group-hover:gap-3" style={{ color: 'var(--color-primary)' }}>
                    Explore <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* REVIEWS */}
      {data.reviews.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-16 md:py-20 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="mb-12 flex items-end justify-between">
            <div>
              <div className="inline-flex items-center gap-2 mb-3" style={{ color: 'var(--color-primary)' }}>
                <Star size={20} />
                <span className="text-sm font-black uppercase">Customer Reviews</span>
              </div>
              <h2 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
                What They Say
              </h2>
            </div>

            <div className="hidden sm:flex items-center gap-4">
              <div>
                <div className="text-4xl font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  {avgRating}
                  <span style={{ color: 'var(--color-accent)' }}>⭐</span>
                </div>
                <p className="text-xs font-bold mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {data.reviews.length} reviews
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.reviews.slice(0, 6).map((review) => (
              <div
                key={review.id}
                className="rounded-lg border-2 p-6"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                }}
              >
                <div className="mb-4 flex gap-1" style={{ color: 'var(--color-accent)' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className={i < (review.rating || 5) ? 'fill-current' : 'opacity-30'} />
                  ))}
                </div>

                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                  "{review.message || review.body}"
                </p>

                <p className="text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>
                  {review.user?.name || 'Customer'} • {review.product?.name || 'Fly Free'}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/reviews"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              See All Reviews <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      )}

      {/* NEWSLETTER */}
      <section
        className="mx-auto max-w-2xl px-5 py-16 md:py-20 rounded-xl"
        style={{
          backgroundColor: 'var(--color-secondary)',
          backgroundImage: 'linear-gradient(135deg, var(--color-secondary) 0%, rgba(0,168,232,0.8) 100%)',
        }}
      >
        <div className="text-center text-white">
          <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20">
            <Mail size={18} />
            <span className="text-sm font-bold">Newsletter</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-black mb-3">Stay Updated</h2>
          <p className="mb-8 opacity-90">Get first access to new drops, themes, and exclusive offers</p>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-black font-bold outline-none focus:ring-2 focus:ring-white/30"
            />
            <button
              className="px-6 py-3 rounded-lg font-black text-white transition hover:opacity-90"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* INSTAGRAM FEED - Placeholder for now */}
      <section className="mx-auto max-w-7xl px-5 py-16 md:py-20 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <div className="mb-12 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 mb-3" style={{ color: 'var(--color-primary)' }}>
              <Instagram size={20} />
              <span className="text-sm font-black uppercase">Follow Us</span>
            </div>
            <h2 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
              @flyfree_styles
            </h2>
          </div>

          <Link
            href="https://instagram.com/flyfree_styles"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Follow <Instagram size={18} />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-gradient-to-br"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                backgroundImage: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
              }}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
