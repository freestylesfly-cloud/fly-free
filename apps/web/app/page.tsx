import { Shirt, ArrowRight, Star, Instagram, Share2 } from "lucide-react";
import { getApiBaseUrl } from "./lib/api";
import Link from "next/link";
import { ProductCard } from "./components/ProductCard";
import { HorizontalSlider } from "./components/HorizontalSlider";
import { HeroCarousel, type HeroSlide } from "./components/HeroCarousel";

const API_BASE = getApiBaseUrl();

export const dynamic = "force-dynamic";

async function getHomeData() {
  try {
    const defaultHome = { banners: [], themes: [], websiteTheme: null, categories: [], announcements: [], influencers: [], reviews: [], settings: null };

    const [home, productsRes] = await Promise.all([
      fetch(`${API_BASE}/cms/home`, { cache: "no-store" })
        .then((response) => response.ok ? response.json() : null)
        .catch(() => {
          return null;
        }),
      fetch(`${API_BASE}/catalog/products?limit=50`, { cache: "no-store" })
        .then((response) => response.ok ? response.json() : null)
        .catch(() => {
          return null;
        })
    ]);

    let products = Array.isArray(productsRes) ? productsRes : productsRes?.data || [];
    products = products.filter((p: any) => p.isVisible !== false);

    return {
      home: home?.data || home || defaultHome,
      products
    };
  } catch {
    return {
      home: { banners: [], themes: [], websiteTheme: null, categories: [], announcements: [], influencers: [], reviews: [], settings: null },
      products: []
    };
  }
}

export default async function HomePage() {
  const { home, products } = await getHomeData();
  const settings = home.settings || {};
  const banners = home.banners || [];
  const themes = home.themes || [];
  const websiteTheme = home.websiteTheme;
  let categories = home.categories || [];
  const influencers = home.influencers || [];
  const reviews = home.reviews || [];

  // Fallback categories if none exist
  if (categories.length === 0) {
    categories = [
      { id: '1', name: 'Men', slug: 'men' },
      { id: '2', name: 'Women', slug: 'women' },
      { id: '3', name: 'Unisex', slug: 'unisex' }
    ];
  }

  // Fallback themes if none exist
  let displayThemes = themes;
  if (displayThemes.length === 0) {
    displayThemes = [
      { id: '1', name: 'Anime', slug: 'anime', story: 'A merch theme focused on energetic art and fandom confidence', animationStyle: 'snap-slide', primaryColor: '#ff6b5b' },
      { id: '2', name: 'Spider-Man', slug: 'spider-man', story: 'High-motion campaign for web-slinger fans with bold graphics', animationStyle: 'web-swing', primaryColor: '#ff3333' },
      { id: '3', name: 'Minimal', slug: 'minimal', story: 'Comfort-first theme for simple, premium basics', animationStyle: 'fade', primaryColor: '#111827' },
      { id: '4', name: 'Graphic', slug: 'graphic', story: 'Creative playground for expressive artwork', animationStyle: 'pop', primaryColor: '#4ecdc4' }
    ];
  }

  // Get trending products - prioritize isTrending, then isFeatured, then all visible
  const trendingProducts = products
    .filter((p: any) => p.isTrending || p.isFeatured)
    .slice(0, 8);

  const featuredProducts = trendingProducts.length >= 8 ? trendingProducts : products.slice(0, 8);

  // Hero slides — real CMS banners when present, else a single slide from the
  // admin-configured website theme/settings (same fallback source as before).
  let heroSlides: HeroSlide[] = banners.map((banner: any) => ({
    id: banner.id,
    image: banner.desktopImageUrl || banner.mobileImageUrl || null,
    title: banner.title,
    subtitle: banner.subtitle,
    ctaLabel: banner.buttonLabel || 'Shop now',
    ctaHref: banner.href || '/products'
  }));
  if (heroSlides.length === 0) {
    heroSlides = [{
      id: 'hero-fallback',
      image: websiteTheme?.heroDesktopImageUrl || null,
      tag: websiteTheme?.name,
      title: websiteTheme?.heroTitle || settings.appName || 'Fly Free',
      subtitle: websiteTheme?.heroSubtitle || settings.appDescription || "Express your individuality through premium streetwear. Northeast India's boldest fashion statement.",
      ctaLabel: websiteTheme?.heroCtaLabel || 'Explore Now',
      ctaHref: websiteTheme?.heroHref || '/products'
    }];
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum: number, r: any) => sum + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : null;

  return (
    <main style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <HeroCarousel slides={heroSlides} />

      {/* Marquee strip */}
      <div className="overflow-hidden whitespace-nowrap" style={{ borderBottom: '2px solid var(--border-color)', padding: '12px 0' }}>
        <div className="mo-marquee-track">
          {[0, 1].map((rep) => (
            <span key={rep} className="inline-flex items-center text-xl font-bold uppercase tracking-wide" style={{ fontFamily: 'var(--font-heading)' }}>
              <span className="px-6">New Arrivals</span>
              <span className="px-6" style={{ color: 'var(--color-primary)' }}>&#9670;</span>
              {displayThemes.map((theme: any, idx: number) => (
                <span key={`${rep}-${theme.id ?? idx}`} className="inline-flex items-center">
                  <span className="px-6">{theme.name}</span>
                  <span className="px-6" style={{ color: 'var(--color-primary)' }}>&#9670;</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* Shop by theme */}
      <section className="mx-auto max-w-7xl px-5 py-16 md:py-20" style={{ borderBottom: '2px solid var(--border-color)' }}>
        <HorizontalSlider title="Shop by theme">
          {displayThemes.map((theme: any) => (
            <Link
              key={theme.id}
              href={`/themes/${theme.slug}`}
              className="mo-slide group flex-shrink-0"
              style={{ width: '320px', border: '2px solid var(--border-color)' }}
            >
              <div
                className="relative flex h-56 items-end p-6 text-white"
                style={{ backgroundColor: theme.primaryColor || 'var(--color-primary)', fontFamily: theme.fontFamily }}
              >
                <h3 className="text-3xl font-black uppercase leading-tight">{theme.name}</h3>
              </div>
              <div className="p-5" style={{ borderTop: '2px solid var(--border-color)' }}>
                <p className="line-clamp-2 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                  {theme.story || theme.description}
                </p>
                <div className="mt-3 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide group-hover:gap-3 transition-all" style={{ color: 'var(--color-primary)' }}>
                  View <ArrowRight size={16} />
                </div>
              </div>
            </Link>
          ))}
        </HorizontalSlider>
      </section>

      {/* Browse by fit / category */}
      <section className="px-5 py-16 md:py-20" style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '2px solid var(--border-color)' }}>
        <div className="mx-auto max-w-7xl">
          <h3 className="mb-8 text-2xl font-black uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>Browse by category</h3>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category: any) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group flex flex-col gap-4 p-8 transition-colors"
                style={{ border: '2px solid var(--text-primary)', backgroundColor: 'var(--bg-secondary)', color: 'inherit' }}
              >
                <div className="text-2xl font-black uppercase" style={{ fontFamily: 'var(--font-heading)' }}>{category.name}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Browse {category.name.toLowerCase()}</div>
                <div className="mt-auto inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide group-hover:gap-3 transition-all" style={{ color: 'var(--color-primary)' }}>
                  Browse <ArrowRight size={16} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Best sellers */}
      <section className="mx-auto max-w-7xl px-5 py-16 md:py-20" style={{ borderBottom: '2px solid var(--border-color)' }}>
        {featuredProducts && featuredProducts.length > 0 ? (
          <HorizontalSlider
            title="Best sellers"
            action={
              <Link href="/products" className="hidden sm:inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
                View all <ArrowRight size={16} />
              </Link>
            }
          >
            {featuredProducts.map((product: any) => (
              <div key={product.id} className="mo-slide flex-shrink-0" style={{ width: '300px' }}>
                <ProductCard
                  id={product.id}
                  name={product.name}
                  price={Math.round((product.price || 0) / 100)}
                  slug={product.slug}
                  image={product.images?.[0]?.url || null}
                  tag={product.theme?.name || product.category?.name || 'New'}
                />
              </div>
            ))}
          </HorizontalSlider>
        ) : (
          <div className="py-16 text-center">
            <Shirt size={48} className="mx-auto mb-4 opacity-30" />
            <p className="mb-4 text-lg" style={{ color: 'var(--text-secondary)' }}>Products coming soon!</p>
            <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
              Browse All Products <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </section>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section id="reviews" className="mx-auto max-w-7xl px-5 py-16 md:py-20" style={{ borderBottom: '2px solid var(--border-color)' }}>
          {avgRating && (
            <div className="mb-10 flex" style={{ border: '2px solid var(--border-color)' }}>
              <div className="flex-1 border-r p-6" style={{ borderColor: 'var(--border-color)' }}>
                <div className="text-5xl font-black" style={{ fontFamily: 'var(--font-heading)' }}>
                  {avgRating}<span style={{ color: 'var(--color-primary)' }}>&#9733;</span>
                </div>
                <div className="mt-1 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Average rating</div>
              </div>
              <div className="flex-1 p-6">
                <div className="text-5xl font-black" style={{ fontFamily: 'var(--font-heading)' }}>{reviews.length}</div>
                <div className="mt-1 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Verified reviews</div>
              </div>
            </div>
          )}
          <HorizontalSlider title="What the fandom says">
            {reviews.slice(0, 8).map((review: any) => (
              <div
                key={review.id}
                className="mo-slide flex-shrink-0 p-6"
                style={{ width: '380px', border: '2px solid var(--border-color)' }}
              >
                <div className="mb-4 flex gap-1" style={{ color: 'var(--color-primary)' }}>
                  {Array.from({ length: Math.max(1, Math.min(5, review.rating || 5)) }).map((_, index) => <Star key={index} size={16} fill="currentColor" />)}
                </div>
                <h3 className="font-black" style={{ color: 'var(--text-primary)' }}>{review.title || review.product?.name || 'Fly Free review'}</h3>
                <p className="mt-2 line-clamp-4 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{review.body}</p>
                <div className="mt-4 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                  {review.user?.name || 'Customer'} &mdash; {review.product?.name || 'Fly Free'}
                </div>
              </div>
            ))}
          </HorizontalSlider>
        </section>
      )}

      {/* Influencers */}
      {influencers.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-16 md:py-20" style={{ borderBottom: '2px solid var(--border-color)' }}>
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
                <Share2 size={16} /> Creator circle
              </div>
              <h2 className="mt-3 text-4xl font-black uppercase leading-tight sm:text-5xl">Influencers</h2>
            </div>
            <Link href="/influencers" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
              View all <ArrowRight size={18} />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {influencers.slice(0, 3).map((item: any) => (
              <article key={item.id} style={{ border: '2px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                {item.imageUrl && (
                  <div className="grayscale-hover aspect-[4/3] overflow-hidden">
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="space-y-3 p-5">
                  <h3 className="text-xl font-black">{item.name}</h3>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>{item.socialHandle || item.email}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.code && <span className="px-3 py-1 text-xs font-black uppercase text-white" style={{ backgroundColor: 'var(--color-primary)' }}>{item.code}</span>}
                    {item.buyerDiscountPercent ? <span className="px-3 py-1 text-xs font-black" style={{ backgroundColor: 'var(--bg-tertiary)' }}>{item.buyerDiscountPercent}% off</span> : null}
                  </div>
                  {item.instagramUrl && (
                    <a href={item.instagramUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-black" style={{ color: 'var(--color-primary)' }}>
                      <Instagram size={16} /> Instagram
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* About */}
      <section className="px-5 py-16 md:py-20" style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
        <div className="mx-auto max-w-7xl">
          <h2 className="text-5xl font-black uppercase leading-none sm:text-6xl">About<br />flyfree</h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed" style={{ color: 'color-mix(in srgb, var(--bg-primary) 85%, transparent)' }}>
            We started flyfree because fandom deserves better than mass-produced mall prints. Each design is hand-picked, hand-printed, and made for people who aren&apos;t afraid to wear what they love.
          </p>
          <div className="mt-8 grid max-w-md grid-cols-2 gap-4">
            <div className="p-5" style={{ border: '2px solid var(--bg-primary)' }}>
              <div className="text-4xl font-black">{displayThemes.length}</div>
              <div className="text-xs uppercase tracking-wide opacity-80">Themes live</div>
            </div>
            <div className="p-5" style={{ border: '2px solid var(--bg-primary)' }}>
              <div className="text-4xl font-black">{featuredProducts.length || products.length}</div>
              <div className="text-xs uppercase tracking-wide opacity-80">Styles live</div>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap items-baseline gap-3 pt-8" style={{ borderTop: '4px solid var(--bg-primary)' }}>
            <div className="text-2xl font-black uppercase">We are</div>
            <div className="text-4xl font-black uppercase" style={{ color: 'var(--color-primary)' }}>Bold</div>
            <div className="text-lg font-bold">But never copy</div>
          </div>
        </div>
      </section>
    </main>
  );
}
