import { Gift, Shirt, Sparkles, ArrowRight, Star, Instagram, Share2 } from "lucide-react";
import { getApiBaseUrl } from "./lib/api";
import Link from "next/link";
import { ProductCard } from "./components/ProductCard";

const API_BASE = getApiBaseUrl();

export const dynamic = "force-dynamic";

async function getHomeData() {
  try {
    const [home, products] = await Promise.all([
      fetch(`${API_BASE}/cms/home`, { cache: "no-store" }).then((response) => response.ok ? response.json() : null),
      fetch(`${API_BASE}/catalog/products`, { cache: "no-store" }).then((response) => response.ok ? response.json() : [])
    ]);

    return {
      home: home?.data || home || { banners: [], themes: [], websiteTheme: null, categories: [], announcements: [], giftOptions: [], influencers: [], reviews: [], settings: null },
      products: Array.isArray(products) ? products : products?.data || []
    };
  } catch (error) {
    console.error("Error fetching home data:", error);
    return {
      home: { banners: [], themes: [], websiteTheme: null, categories: [], announcements: [], giftOptions: [], influencers: [], reviews: [], settings: null },
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
  const categories = home.categories || [];
  const giftOptions = home.giftOptions || [];
  const influencers = home.influencers || [];
  const reviews = home.reviews || [];
  const featuredProducts = products.slice(0, 8);

  return (
    <main style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Website skin hero - admin controlled */}
      <section
        className="hero-section"
        style={{
          backgroundColor: websiteTheme?.backgroundColor || 'var(--bg-primary)',
          backgroundImage: websiteTheme?.heroDesktopImageUrl ? `url(${websiteTheme.heroDesktopImageUrl})` : undefined,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          fontFamily: websiteTheme?.fontFamily || undefined
        }}
      >
        {websiteTheme?.heroDesktopImageUrl && <div className="absolute inset-0" style={{ backgroundColor: `${websiteTheme.primaryColor || '#111827'}cc` }} />}

        <div className="relative mx-auto w-full max-w-7xl px-5 py-12">
          <div className="max-w-3xl space-y-6 z-10">
            {/* Left Content */}
            <div className="hero-title inline-flex items-center gap-3 rounded-full px-4 py-3 border w-fit" style={{ backgroundColor: 'rgb(255 255 255 / 0.12)', borderColor: 'rgb(255 255 255 / 0.22)' }}>
              <Sparkles size={18} className="text-white" />
              <span className="text-sm font-bold text-white">{websiteTheme?.name ? `${websiteTheme.name} Live` : 'New Collection Now Live'}</span>
            </div>

            <h1 className="hero-title text-5xl sm:text-6xl lg:text-7xl font-black leading-none tracking-tight text-white">
              {websiteTheme?.heroTitle || settings.appName || "Fly Free"}
            </h1>

            <p className="hero-subtitle text-lg sm:text-xl text-white/85 leading-relaxed max-w-2xl">
              {websiteTheme?.heroSubtitle || settings.appDescription || "Express your individuality through premium streetwear. Northeast India's boldest fashion statement."}
            </p>

            <div className="hero-buttons flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/products"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 font-bold rounded-lg transition-all"
                style={{ backgroundColor: '#ffffff', color: websiteTheme?.primaryColor || '#111827' }}
              >
                Explore Now
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href={websiteTheme?.heroHref || "/products"}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 text-white font-bold rounded-lg transition-all"
                style={{ borderColor: 'rgb(255 255 255 / 0.4)', backgroundColor: 'rgb(255 255 255 / 0.08)' }}
              >
                {websiteTheme?.heroCtaLabel || "View Collection"}
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {banners.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-10">
          <div className="grid gap-4 md:grid-cols-3">
            {banners.slice(0, 3).map((banner: any) => (
              <Link key={banner.id} href={banner.href || '/products'} className="group overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="aspect-[16/9] overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <img src={banner.desktopImageUrl || banner.mobileImageUrl} alt={banner.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                </div>
                <div className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <h2 className="font-black" style={{ color: 'var(--text-primary)' }}>{banner.title}</h2>
                    <p className="mt-1 text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>{banner.subtitle || banner.buttonLabel || 'Shop now'}</p>
                  </div>
                  <ArrowRight size={18} style={{ color: 'var(--color-primary)' }} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Categories Section */}
      <section className="mx-auto max-w-7xl px-5 py-16 md:py-24">
        <div className="mb-12">
          <h2 className="section-title text-4xl sm:text-5xl font-black leading-tight">Shop by Category</h2>
          <p className="mt-4 text-lg text-gray-500">Find exactly what you're looking for</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {categories.map((category: any, idx: number) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="card-item group relative overflow-hidden rounded-xl p-8 transition-all cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                borderWidth: '1px',
                animationDelay: `${idx * 0.1}s`
              }}
            >
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <Shirt size={24} style={{ color: 'var(--color-primary)' }} />
                </div>
                <h3 className="text-2xl font-black">{category.name}</h3>
                <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Browse {category.name.toLowerCase()}</p>
                <div className="mt-4 flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                  Explore <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Shop by Theme Section */}
      <section id="themes" className="mx-auto max-w-7xl px-5 py-16 md:py-24">
        <div className="mb-12">
          <h2 className="section-title text-4xl sm:text-5xl font-black leading-tight">Shop by Theme</h2>
          <p className="mt-4 text-lg text-gray-500">Limited drops, seasonal collections & exclusive campaigns</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {themes.map((theme: any, idx: number) => (
            <Link
              key={theme.id}
              href={`/themes/${theme.slug}`}
                className="theme-card group rounded-lg overflow-hidden cursor-pointer border"
                style={{ animationDelay: `${idx * 0.1}s`, borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
              >
              <div
                className="relative h-48 flex items-end p-6 text-white transition-transform group-hover:scale-105"
                style={{
                  backgroundColor: theme.primaryColor || 'var(--color-primary)',
                  fontFamily: theme.fontFamily
                }}
              >
                <div className="relative z-10">
                  <h3 className="text-3xl font-black leading-tight">{theme.name}</h3>
                </div>
              </div>
              <div className="p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderWidth: '1px' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Star size={16} style={{ color: 'var(--color-primary)' }} fill="currentColor" />
                  <span className="text-xs font-bold uppercase" style={{ color: 'var(--color-primary)' }}>{theme.animationStyle}</span>
                </div>
                <p className="line-clamp-3 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                  {theme.story || theme.description}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 font-bold group-hover:gap-3 transition-all" style={{ color: 'var(--color-primary)' }}>
                  View <ArrowRight size={16} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section id="shop" className="mx-auto max-w-7xl px-5 py-16 md:py-24">
        <div className="mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="section-title text-4xl sm:text-5xl font-black leading-tight">Trending Now</h2>
            <p className="mt-4 text-lg text-gray-500">Discover what's hot in Fly Free</p>
          </div>
          <Link href="/products" className="inline-flex items-center gap-2 font-bold text-lg" style={{ color: 'var(--color-primary)' }}>
            View All <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <div className="product-grid">
          {featuredProducts.map((product: any) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={Math.round((product.price || 0) / 100)}
              slug={product.slug}
              image={product.images?.[0]?.url}
              tag={product.theme?.name || product.category?.name || 'New'}
            />
          ))}
        </div>
      </section>

      {/* Influencers */}
      {influencers.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-16 md:py-24">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-black" style={{ color: 'var(--color-primary)' }}>
                <Share2 size={16} /> Creator circle
              </div>
              <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Influencers</h2>
              <p className="mt-4 text-lg" style={{ color: 'var(--text-secondary)' }}>Creators styling Fly Free drops and sharing referral offers.</p>
            </div>
            <Link href="/influencers" className="inline-flex items-center gap-2 font-bold" style={{ color: 'var(--color-primary)' }}>
              View all <ArrowRight size={18} />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {influencers.slice(0, 3).map((item: any) => (
              <article key={item.id} className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="h-56 w-full object-cover" />}
                <div className="space-y-3 p-5">
                  <h3 className="text-xl font-black">{item.name}</h3>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>{item.socialHandle || item.email}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.code && <span className="rounded px-3 py-1 text-xs font-black text-white" style={{ backgroundColor: 'var(--color-primary)' }}>{item.code}</span>}
                    {item.buyerDiscountPercent ? <span className="rounded px-3 py-1 text-xs font-black" style={{ backgroundColor: 'var(--bg-tertiary)' }}>{item.buyerDiscountPercent}% off</span> : null}
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

      {/* Reviews */}
      {reviews.length > 0 && (
        <section id="reviews" className="mx-auto max-w-7xl px-5 py-16 md:py-24">
          <div className="mb-10">
            <h2 className="text-4xl font-black leading-tight sm:text-5xl">Customer Reviews</h2>
            <p className="mt-4 text-lg" style={{ color: 'var(--text-secondary)' }}>Approved customer feedback from product pages.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {reviews.slice(0, 6).map((review: any) => (
              <article key={review.id} className="rounded-xl border p-5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="flex gap-1" style={{ color: 'var(--color-primary)' }}>
                  {Array.from({ length: Math.max(1, Math.min(5, review.rating || 5)) }).map((_, index) => <Star key={index} size={16} fill="currentColor" />)}
                </div>
                <h3 className="mt-4 font-black">{review.title || review.product?.name || 'Fly Free review'}</h3>
                <p className="mt-2 line-clamp-4 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{review.body}</p>
                <div className="mt-4 text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>
                  {review.user?.name || 'Customer'} on {review.product?.name || 'Fly Free'}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Gifting Section */}
      <section className="mx-auto max-w-7xl px-5 py-16 md:py-24">
        <div className="rounded-3xl p-8 md:p-16" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderWidth: '1px' }}>
          <div className="grid gap-12 md:grid-cols-[1fr_2fr] items-start">
            <div>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-6" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <Gift size={28} style={{ color: 'var(--color-primary)' }} />
              </div>
              <h2 className="text-4xl font-black leading-tight">Perfect for Gifting</h2>
              <p className="mt-4 text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Premium packaging, custom messages, and bulk options for corporate gifting
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              {giftOptions.map((item: any, idx: number) => (
                <div
                  key={item.id}
                  className="card-item rounded-xl overflow-hidden"
                  style={{ animationDelay: `${idx * 0.1}s`, backgroundColor: 'var(--bg-primary)' }}
                >
                  {item.imageUrl && (
                    <div className="overflow-hidden h-32 mb-4 rounded-lg">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    </div>
                  )}
                  <h3 className="font-black text-lg">{item.name}</h3>
                  <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-5 py-16 md:py-24">
        <div className="rounded-lg overflow-hidden text-white text-center p-12 md:p-20" style={{ backgroundColor: 'var(--color-primary)' }}>
          <h2 className="text-4xl md:text-5xl font-black leading-tight">Ready to Express Yourself?</h2>
          <p className="mt-4 text-lg text-white/85 max-w-2xl mx-auto">Join thousands of fashion enthusiasts wearing Fly Free</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 mt-8 px-8 py-4 bg-white text-gray-900 font-bold rounded-lg hover:shadow-2xl transition-all"
          >
            Start Shopping Now
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </main>
  );
}
