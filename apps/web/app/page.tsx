import Link from 'next/link';
import { ArrowRight, Instagram, Mail, Star, Zap } from 'lucide-react';
import { ProductCard } from './components/ProductCard';
import { HorizontalSlider } from './components/HorizontalSlider';
import { InstagramFeedCarousel } from './components/InstagramFeedCarousel';
import { HeroCarousel } from './components/HeroCarousel';
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
  bannerImageUrl?: string;
  imageUrl?: string;
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

interface Hamper {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  images?: Array<{ url: string }>;
  isVisible?: boolean;
}

interface InstagramPost {
  id: string;
  imageUrl?: string;
  videoUrl?: string;
  caption: string;
  instagramLink: string;
}

async function getHomeData() {
  try {
    const [themesRes, productsRes, reviewsRes, hampersRes, instagramRes] = await Promise.all([
      fetch(`${API_BASE}/cms/themes?limit=20`, { cache: 'no-store' }),
      fetch(`${API_BASE}/catalog/products?limit=50`, { cache: 'no-store' }),
      fetch(`${API_BASE}/reviews/latest?limit=12`, { cache: 'no-store' }).catch(() => null),
      fetch(`${API_BASE}/cms/hampers?limit=12`, { cache: 'no-store' }).catch(() => null),
      fetch(`${API_BASE}/instagram-posts?limit=12`, { cache: 'no-store' }).catch(() => null),
    ]);

    const themes = themesRes.ok ? await themesRes.json() : { data: [] };
    const products = productsRes.ok ? await productsRes.json() : { data: [] };
    const reviews = reviewsRes?.ok ? await reviewsRes.json() : { data: [] };
    const hampers = hampersRes?.ok ? await hampersRes.json() : { data: [] };
    const instagram = instagramRes?.ok ? await instagramRes.json() : { data: [] };

    return {
      themes: (Array.isArray(themes) ? themes : themes.data || []).filter(Boolean),
      products: (Array.isArray(products) ? products : products.data || []).filter((p: Product) => p.isVisible !== false),
      reviews: (Array.isArray(reviews) ? reviews : reviews.data || []).filter(Boolean),
      hampers: (Array.isArray(hampers) ? hampers : hampers.data || []).filter((h: Hamper) => h.isVisible !== false),
      instagram: Array.isArray(instagram) ? instagram : instagram.data || [],
    };
  } catch (error) {
    console.error('Failed to load home data:', error);
    return {
      themes: [],
      products: [],
      reviews: [],
      hampers: [],
      instagram: [],
    };
  }
}

export default async function HomePage() {
  const { themes, products, reviews, hampers, instagram } = await getHomeData();

  const heroThemes = themes.filter((t: Theme) => t.bannerImageUrl).slice(0, 5);
  const heroSlides = (heroThemes.length > 0 ? heroThemes : themes.slice(0, 3)).map((theme: Theme) => ({
    id: theme.id,
    image: theme.bannerImageUrl,
    tag: 'New Drop',
    title: theme.name,
    subtitle: theme.description,
    ctaLabel: `Shop ${theme.name}`,
    ctaHref: `/themes/${theme.slug}`,
  }));
  const featuredProducts = products.filter((p: Product) => p.isFeatured || p.isTrending).slice(0, 8);
  const bestSellers = products.slice(0, 8);
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum: number, r: Review) => sum + (r.rating || 5), 0) / reviews.length).toFixed(1)
      : '5.0';

  return (
    <main style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* HERO BANNER - Auto-sliding theme carousel */}
      <HeroCarousel slides={heroSlides} />

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
              <Link href="/products" className="inline-flex items-center gap-2 text-sm font-bold uppercase" style={{ color: 'var(--color-primary)' }}>
                View All <ArrowRight size={16} />
              </Link>
            }
          >
            {featuredProducts.map((product: Product) => (
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
            {bestSellers.slice(0, 8).map((product: Product) => (
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
      {themes.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-16 md:py-20 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="mb-12">
            <h2 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
              Shop by Theme
            </h2>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
              Explore our curated collections
            </p>
          </div>

          <HorizontalSlider
            title=""
            action={
              <Link href="/themes" className="inline-flex items-center gap-2 text-sm font-bold uppercase" style={{ color: 'var(--color-primary)' }}>
                View All <ArrowRight size={16} />
              </Link>
            }
          >
            {themes.map((theme: Theme) => (
              <Link
                key={theme.id}
                href={`/themes/${theme.slug}`}
                className="mo-slide group relative flex-shrink-0 overflow-hidden rounded-xl border-2 transition hover:shadow-lg"
                style={{ width: '320px', borderColor: 'var(--border-color)' }}
              >
                <div
                  className="aspect-video flex items-end justify-start p-6 text-white"
                  style={{
                    backgroundImage: theme.bannerImageUrl ? `url('${theme.bannerImageUrl}')` : undefined,
                    backgroundColor: theme.primaryColor || 'var(--color-primary)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <h3 className="text-2xl font-black leading-tight drop-shadow">{theme.name}</h3>
                </div>

                <div className="p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <p className="text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                    {theme.description}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold uppercase transition group-hover:gap-3" style={{ color: 'var(--color-primary)' }}>
                    Explore <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            ))}
          </HorizontalSlider>
        </section>
      )}

      {/* REVIEWS */}
      {reviews.length > 0 && (
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
                  {reviews.length} reviews
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.slice(0, 6).map((review: Review) => (
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

      {/* HAMPER SHOWCASE - Gift Collections */}
      {hampers.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-16 md:py-20 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 mb-3" style={{ color: 'var(--color-primary)' }}>
              <span className="text-2xl">🎁</span>
              <span className="text-sm font-black uppercase">Gift Collections</span>
            </div>
            <h2 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
              Perfect Hampers for Every Occasion
            </h2>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
              Curated gift sets and bundles for your loved ones
            </p>
          </div>

          <HorizontalSlider
            title=""
            action={
              <Link href="/hampers" className="inline-flex items-center gap-2 text-sm font-bold uppercase" style={{ color: 'var(--color-primary)' }}>
                View All <ArrowRight size={16} />
              </Link>
            }
          >
            {hampers.slice(0, 6).map((hamper: Hamper) => (
              <Link
                key={hamper.id}
                href={`/hampers/${hamper.id}`}
                className="mo-slide flex-shrink-0 group overflow-hidden rounded-xl border-2 transition hover:shadow-lg"
                style={{ width: '280px', borderColor: 'var(--border-color)' }}
              >
                <div
                  className="aspect-square bg-gray-200 overflow-hidden flex items-center justify-center"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  {hamper.images?.[0]?.url ? (
                    <img
                      src={hamper.images[0].url}
                      alt={hamper.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                    />
                  ) : (
                    <span className="text-4xl">🎁</span>
                  )}
                </div>
                <div className="p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <h3 className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>
                    {hamper.name}
                  </h3>
                  <p className="text-sm mt-2 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                    {hamper.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-black text-lg" style={{ color: 'var(--color-primary)' }}>
                      ₹{Math.round((hamper.basePrice || 0) / 100)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold uppercase transition group-hover:gap-2" style={{ color: 'var(--color-primary)' }}>
                      View <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </HorizontalSlider>
        </section>
      )}

      {/* INSTAGRAM FEED - Auto-scrolling single row */}
      <InstagramFeedCarousel posts={instagram} />

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

    </main>
  );
}
