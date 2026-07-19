import { Gift, Shirt, Sparkles, ArrowRight, Star } from "lucide-react";
import { formatCurrency } from "@flyfree/utils";
import { getApiBaseUrl } from "./lib/api";
import Link from "next/link";

const API_BASE = getApiBaseUrl();

export const dynamic = "force-dynamic";

async function getHomeData() {
  try {
    const [home, products] = await Promise.all([
      fetch(`${API_BASE}/cms/home`, { cache: "no-store" }).then((response) => response.ok ? response.json() : null),
      fetch(`${API_BASE}/catalog/products`, { cache: "no-store" }).then((response) => response.ok ? response.json() : [])
    ]);

    return {
      home: home || { themes: [], websiteTheme: null, categories: [], announcements: [], giftOptions: [], influencers: [], settings: null },
      products: Array.isArray(products) ? products : []
    };
  } catch (error) {
    console.error("Error fetching home data:", error);
    return {
      home: { themes: [], websiteTheme: null, categories: [], announcements: [], giftOptions: [], influencers: [], settings: null },
      products: []
    };
  }
}

export default async function HomePage() {
  const { home, products } = await getHomeData();
  const settings = home.settings || {};
  const themes = home.themes || [];
  const websiteTheme = home.websiteTheme;
  const categories = home.categories || [];
  const giftOptions = home.giftOptions || [];
  const featuredProducts = products.slice(0, 8);

  return (
    <main style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Hero Section - Large Poster */}
      <section
        className="hero-section"
        style={{
          background: websiteTheme?.heroDesktopImageUrl
            ? `linear-gradient(135deg, ${websiteTheme.primaryColor}dd, ${websiteTheme.secondaryColor}cc), url(${websiteTheme.heroDesktopImageUrl}) center/cover`
            : undefined,
          fontFamily: websiteTheme?.fontFamily || undefined
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} className="w-full h-full"></div>
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-5 py-12">
          <div className="grid items-center gap-12 md:grid-cols-2 md:gap-20">
            {/* Left Content */}
            <div className="space-y-6 z-10">
              {/* Badge */}
              <div className="hero-title inline-flex items-center gap-3 rounded-full bg-white/10 backdrop-blur px-4 py-3 border border-white/20 w-fit">
                <Sparkles size={18} className="text-white animate-spin" style={{ animationDuration: '3s' }} />
                <span className="text-sm font-bold text-white">{websiteTheme?.name ? `${websiteTheme.name} Live` : 'New Collection Now Live'}</span>
              </div>

              {/* Main Title */}
              <div>
                <h1 className="hero-title text-5xl sm:text-6xl lg:text-7xl font-black leading-none tracking-tight text-white">
                  {websiteTheme?.heroTitle || settings.appName || "Fly Free"}
                </h1>
              </div>

              {/* Subtitle */}
              <p className="hero-subtitle text-lg sm:text-xl text-white/85 leading-relaxed max-w-lg">
                {websiteTheme?.heroSubtitle || settings.appDescription || "Express your individuality through premium streetwear. Northeast India's boldest fashion statement."}
              </p>

              {/* CTA Buttons */}
              <div className="hero-buttons flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  href="/products"
                  className="gradient-button group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 font-bold rounded-lg hover:shadow-2xl transition-all"
                >
                  Explore Now
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href={websiteTheme?.heroHref || "/products"}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-bold rounded-lg hover:bg-white/10 hover:border-white/50 transition-all backdrop-blur"
                >
                  {websiteTheme?.heroCtaLabel || "View Collection"}
                  <ArrowRight size={20} />
                </Link>
              </div>
            </div>

            {/* Right Side - Featured Themes Grid */}
            <div className="hero-image hidden md:grid gap-4 grid-cols-2">
              {themes.slice(0, 4).map((theme: any, idx: number) => (
                <Link
                  key={theme.id}
                  href={`/themes/${theme.slug}`}
                  className="group relative h-32 rounded-xl overflow-hidden cursor-pointer"
                  style={{
                    animation: `flyfree-slide-in-right 0.8s ease forwards`,
                    animationDelay: `${0.4 + idx * 0.1}s`
                  }}
                >
                  <div
                    className="w-full h-full flex items-end p-4 text-white font-bold transition-transform group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${theme.primaryColor}dd, ${theme.secondaryColor}dd)`,
                      fontFamily: theme.fontFamily
                    }}
                  >
                    <span className="text-sm sm:text-base line-clamp-2">{theme.name}</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

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
              <div className="absolute inset-0 bg-gradient-to-br from-var(--color-primary) to-transparent opacity-0 group-hover:opacity-5 transition-opacity" />
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
              className="theme-card group rounded-2xl overflow-hidden cursor-pointer"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div
                className="relative h-48 flex items-end p-6 text-white transition-transform group-hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                  fontFamily: theme.fontFamily
                }}
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
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
          {featuredProducts.map((product: any, idx: number) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="card-item group rounded-2xl overflow-hidden cursor-pointer"
              style={{ animationDelay: `${idx * 0.08}s` }}
            >
              <div className="relative overflow-hidden rounded-xl mb-5">
                <div
                  className="flex aspect-[4/5] items-center justify-center overflow-hidden bg-gradient-to-br transition-transform group-hover:scale-110 duration-500"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  {product.images?.[0]?.url ? (
                    <img src={product.images[0].url} alt={product.images[0].alt || product.name} className="h-full w-full object-cover" />
                  ) : (
                    <Shirt size={54} strokeWidth={1.5} style={{ color: 'var(--text-tertiary)' }} />
                  )}
                </div>
                <div className="absolute top-3 right-3 rounded-full p-2 bg-white/90 backdrop-blur opacity-0 group-hover:opacity-100 transition-all" style={{ color: 'var(--color-primary)' }}>
                  <Heart size={18} fill="currentColor" />
                </div>
              </div>
              <div className="px-2">
                <span className="text-xs font-black uppercase" style={{ color: 'var(--color-primary)' }}>
                  {product.theme?.name || product.category?.name || "Fly Free"}
                </span>
                <h3 className="mt-3 text-lg font-black line-clamp-2">{product.name}</h3>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-black text-lg">{formatCurrency(Math.round((product.price || 0) / 100))}</span>
                  <div className="inline-flex items-center gap-1 rounded-lg px-3 py-2 transition-all group-hover:gap-2" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                    Add <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

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
        <div className="rounded-3xl overflow-hidden text-white text-center p-12 md:p-20" style={{ background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))` }}>
          <h2 className="text-4xl md:text-5xl font-black leading-tight">Ready to Express Yourself?</h2>
          <p className="mt-4 text-lg text-white/85 max-w-2xl mx-auto">Join thousands of fashion enthusiasts wearing Fly Free</p>
          <Link
            href="/products"
            className="gradient-button inline-flex items-center gap-2 mt-8 px-8 py-4 bg-white text-gray-900 font-bold rounded-lg hover:shadow-2xl transition-all"
          >
            Start Shopping Now
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </main>
  );
}

// Add missing Heart icon import component
function Heart({ size = 24, ...props }: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
