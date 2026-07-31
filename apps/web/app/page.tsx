import Link from 'next/link';
import { ArrowRight, Star, Zap } from 'lucide-react';
import { ProductCard } from './components/ProductCard';
import { HorizontalSlider } from './components/HorizontalSlider';
import { InstagramFeedCarousel } from './components/InstagramFeedCarousel';
import { HeroCarousel } from './components/HeroCarousel';
import { AutoSlider } from './components/AutoSlider';
import { getApiBaseUrl } from './lib/api';

const API_BASE = getApiBaseUrl();

interface Product {
  id: string;
  name: string;
  price: number;
  mrp?: number;
  slug: string;
  images?: Array<{ url: string }>;
  theme?: { name: string };
  category?: { name: string };
  isFeatured?: boolean;
  isTrending?: boolean;
  isNewArrival?: boolean;
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
}

interface Review {
  id: string;
  rating: number;
  title?: string;
  body?: string;
  mediaUrls?: string[];
  user?: { name: string };
  product?: { name: string; slug: string };
}

/** A hamper hangs off a theme, so it links through to that theme's products. */
interface Hamper {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  images?: string[];
  theme?: { id: string; name: string; slug: string } | null;
}

interface Influencer {
  id: string;
  name: string;
  code: string;
  imageUrl?: string;
  socialHandle?: string;
  followers?: number;
  instagramUrl?: string;
  buyerDiscountPercent?: number;
}

interface InstagramPost {
  id: string;
  imageUrl?: string;
  caption: string;
  instagramLink: string;
}

function unwrap<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

async function getJson(path: string) {
  try {
    const response = await fetch(`${API_BASE}${path}`, { cache: 'no-store' });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

async function getHomeData() {
  const [themes, products, reviews, hampers, instagram, influencers] = await Promise.all([
    getJson('/cms/themes'),
    getJson('/catalog/products'),
    getJson('/reviews/latest?limit=12'),
    getJson('/cms/hampers'),
    getJson('/instagram-posts'),
    getJson('/influencers'),
  ]);

  return {
    themes: unwrap<Theme>(themes),
    products: unwrap<Product>(products).filter((p) => p.isVisible !== false),
    reviews: unwrap<Review>(reviews),
    hampers: unwrap<Hamper>(hampers),
    instagram: unwrap<InstagramPost>(instagram),
    influencers: unwrap<Influencer>(influencers),
  };
}

const rupees = (paise: number) => Math.round((paise || 0) / 100);

export default async function HomePage() {
  const { themes, products, reviews, hampers, instagram, influencers } = await getHomeData();

  const heroSlides = themes
    .filter((theme) => theme.bannerImageUrl || theme.imageUrl)
    .slice(0, 5)
    .map((theme) => ({
      id: theme.id,
      image: theme.bannerImageUrl || theme.imageUrl,
      tag: 'New drop',
      title: theme.name,
      subtitle: theme.description,
      ctaLabel: `Shop ${theme.name}`,
      ctaHref: `/themes/${theme.slug}`,
    }));

  const newDrops = products.filter((p) => p.isNewArrival || p.isFeatured).slice(0, 10);
  const bestSellers = products.filter((p) => p.isTrending || p.isFeatured).slice(0, 8);
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length).toFixed(1)
      : null;

  return (
    <main style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* HERO — auto-sliding theme banners */}
      <HeroCarousel slides={heroSlides} />

      {/* NEW DROPS */}
      {newDrops.length > 0 && (
        <Section>
          <SectionHeading
            eyebrow="Latest arrivals"
            eyebrowIcon={<Zap size={20} />}
            title="New drops"
            subtitle="Fresh prints across every fit"
          />
          <HorizontalSlider title="" action={<ViewAll href="/products" />}>
            {newDrops.map((product) => (
              <div key={product.id} className="mo-slide flex-shrink-0" style={{ width: '260px' }}>
                <ProductCard
                  id={product.id}
                  name={product.name}
                  price={rupees(product.price)}
                  originalPrice={product.mrp ? rupees(product.mrp) : undefined}
                  slug={product.slug}
                  image={product.images?.[0]?.url}
                  hoverImage={product.images?.[1]?.url}
                  tag={product.theme?.name}
                />
              </div>
            ))}
          </HorizontalSlider>
        </Section>
      )}

      {/* SHOP BY THEME — single sliding row */}
      {themes.length > 0 && (
        <Section>
          <SectionHeading title="Shop by theme" subtitle="Every design drop, one row" />
          <HorizontalSlider title="" action={<ViewAll href="/products" />}>
            {themes.map((theme) => (
              <Link
                key={theme.id}
                href={`/themes/${theme.slug}`}
                className="mo-slide group flex-shrink-0 overflow-hidden rounded-xl border-2 transition hover:shadow-lg"
                style={{ width: '300px', borderColor: 'var(--border-color)' }}
              >
                <div
                  className="flex aspect-video items-end p-5 text-white"
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
                  <p className="line-clamp-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {theme.description}
                  </p>
                  <span
                    className="mt-4 inline-flex items-center gap-2 text-sm font-bold uppercase transition group-hover:gap-3"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    Explore <ArrowRight size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </HorizontalSlider>
        </Section>
      )}

      {/* BEST SELLERS */}
      {bestSellers.length > 0 && (
        <Section>
          <SectionHeading
            eyebrow="Customer favourites"
            eyebrowIcon={<Star size={20} />}
            title="Best sellers"
          />
          <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
            {bestSellers.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={rupees(product.price)}
                originalPrice={product.mrp ? rupees(product.mrp) : undefined}
                slug={product.slug}
                image={product.images?.[0]?.url}
                hoverImage={product.images?.[1]?.url}
                tag={product.theme?.name || product.category?.name}
              />
            ))}
          </div>
        </Section>
      )}

      {/* HAMPERS — every box, no "view all" */}
      {hampers.length > 0 && (
        <Section>
          <SectionHeading
            eyebrow="Gift boxes"
            eyebrowIcon={<span className="text-xl">🎁</span>}
            title="Hampers"
            subtitle="Pick any tee from the theme and ship it gift-ready"
          />
          <div className="grid gap-5 grid-cols-2 lg:grid-cols-3">
            {hampers.map((hamper) => {
              const cover = hamper.imageUrl || hamper.images?.[0];
              const href = hamper.theme ? `/themes/${hamper.theme.slug}` : '/products';
              return (
                <Link
                  key={hamper.id}
                  href={href}
                  className="group overflow-hidden rounded-xl border-2 transition hover:shadow-lg"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <div
                    className="flex aspect-square items-center justify-center overflow-hidden"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    {cover ? (
                      <img
                        src={cover}
                        alt={hamper.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <span className="text-4xl">🎁</span>
                    )}
                  </div>
                  <div className="p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
                    {hamper.theme && (
                      <span className="text-xs font-black uppercase" style={{ color: 'var(--color-primary)' }}>
                        {hamper.theme.name}
                      </span>
                    )}
                    <h3 className="mt-1 font-black" style={{ color: 'var(--text-primary)' }}>
                      {hamper.name}
                    </h3>
                    <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Adds ₹{rupees(hamper.price)} to any {hamper.theme?.name ?? ''} tee
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </Section>
      )}

      {/* REVIEWS — auto sliding, with customer photos */}
      {reviews.length > 0 && (
        <Section>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Customer reviews"
              eyebrowIcon={<Star size={20} />}
              title="What they say"
              bare
            />
            {avgRating && (
              <div>
                <div className="flex items-center gap-2 text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
                  {avgRating}
                  <Star size={26} className="fill-current" style={{ color: 'var(--color-accent)' }} />
                </div>
                <p className="mt-1 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                  {reviews.length} verified review{reviews.length === 1 ? '' : 's'}
                </p>
              </div>
            )}
          </div>

          <AutoSlider ariaLabel="Customer reviews">
            {reviews.map((review) => (
              <article
                key={review.id}
                data-slide
                className="flex-shrink-0 rounded-lg border-2 p-6"
                style={{
                  width: '340px',
                  scrollSnapAlign: 'start',
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                }}
              >
                <div className="mb-4 flex gap-1" style={{ color: 'var(--color-accent)' }}>
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={index}
                      size={16}
                      className={index < (review.rating || 5) ? 'fill-current' : 'opacity-30'}
                    />
                  ))}
                </div>

                {review.title && (
                  <h3 className="mb-2 font-black" style={{ color: 'var(--text-primary)' }}>
                    {review.title}
                  </h3>
                )}

                <p className="mb-4 line-clamp-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {review.body}
                </p>

                {review.mediaUrls && review.mediaUrls.length > 0 && (
                  <div className="mb-4 flex gap-2">
                    {review.mediaUrls.slice(0, 3).map((url) => (
                      <img
                        key={url}
                        src={url}
                        alt=""
                        className="h-16 w-16 rounded object-cover"
                        style={{ border: '1px solid var(--border-color)' }}
                      />
                    ))}
                  </div>
                )}

                <p className="text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>
                  {review.user?.name || 'Verified customer'}
                  {review.product?.name ? ` · ${review.product.name}` : ''}
                </p>
              </article>
            ))}
          </AutoSlider>
        </Section>
      )}

      {/* INFLUENCERS — inline list, no separate page */}
      {influencers.length > 0 && (
        <Section>
          <SectionHeading
            eyebrow="Creators"
            title="Fly Free collective"
            subtitle="Use a creator code for a discount on their picks"
          />
          <AutoSlider ariaLabel="Influencers" intervalMs={5000}>
            {influencers.map((influencer) => (
              <article
                key={influencer.id}
                data-slide
                className="flex-shrink-0 overflow-hidden rounded-xl border-2"
                style={{
                  width: '260px',
                  scrollSnapAlign: 'start',
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                }}
              >
                <div className="aspect-square overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  {influencer.imageUrl && (
                    <img src={influencer.imageUrl} alt={influencer.name} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-black" style={{ color: 'var(--text-primary)' }}>
                    {influencer.name}
                  </h3>
                  {influencer.socialHandle && (
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {influencer.socialHandle}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className="rounded px-2 py-1 text-xs font-black text-white"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      {influencer.code}
                    </span>
                    {influencer.buyerDiscountPercent ? (
                      <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                        {influencer.buyerDiscountPercent}% off
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </AutoSlider>
        </Section>
      )}

      {/* INSTAGRAM — single auto-scrolling row */}
      <InstagramFeedCarousel posts={instagram} />
    </main>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="mx-auto max-w-7xl border-b px-4 py-14 sm:px-5 md:py-20"
      style={{ borderColor: 'var(--border-color)' }}
    >
      {children}
    </section>
  );
}

function SectionHeading({
  eyebrow,
  eyebrowIcon,
  title,
  subtitle,
  bare,
}: {
  eyebrow?: string;
  eyebrowIcon?: React.ReactNode;
  title: string;
  subtitle?: string;
  bare?: boolean;
}) {
  return (
    <div className={bare ? '' : 'mb-10'}>
      {eyebrow && (
        <div className="mb-3 inline-flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
          {eyebrowIcon}
          <span className="text-sm font-black uppercase">{eyebrow}</span>
        </div>
      )}
      <h2 className="text-3xl font-black sm:text-4xl" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function ViewAll({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm font-bold uppercase"
      style={{ color: 'var(--color-primary)' }}
    >
      View all <ArrowRight size={16} />
    </Link>
  );
}
