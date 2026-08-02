import Link from 'next/link';
import { ProductCard } from './components/ProductCard';
import { HeroCarousel } from './components/HeroCarousel';
import { Rail } from './components/Rail';
import { getApiBaseUrl } from './lib/api';
import { HERO_FALLBACK, MEDIA } from './lib/design';

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

/** Card widths are viewport-relative on phones so a peek of the next card
 *  hints that the row scrolls, and fixed from `sm` up. */
const PRODUCT_CARD = 'mo-slide w-[46vw] flex-shrink-0 sm:w-[240px]';

export default async function HomePage() {
  const { themes, products, reviews, hampers, instagram, influencers } = await getHomeData();

  // The hero is simply the active product themes — each theme's banner is one
  // slide. There is no separate site-wide hero to configure.
  const heroSlides = themes
    .filter((theme) => theme.bannerImageUrl || theme.imageUrl)
    .slice(0, 5)
    .map((theme) => ({
      id: theme.id,
      image: theme.bannerImageUrl || theme.imageUrl,
      tag: HERO_FALLBACK.tag,
      title: theme.name,
      subtitle: theme.description,
      ctaLabel: `Shop ${theme.name}`,
      ctaHref: `/themes/${theme.slug}`,
    }));

  const newDrops = products.filter((p) => p.isNewArrival || p.isFeatured).slice(0, 12);
  const bestSellers = products.filter((p) => p.isTrending || p.isFeatured).slice(0, 12);

  return (
    <main style={{ backgroundColor: 'var(--bg-primary)' }}>
      <HeroCarousel slides={heroSlides} />

      {newDrops.length > 0 && (
        <Rail title="New drops" viewAllHref="/products">
          {newDrops.map((product) => (
            <div key={product.id} data-rail-item className={PRODUCT_CARD}>
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
        </Rail>
      )}

      {themes.length > 0 && (
        <Rail title="Shop by theme" viewAllHref="/products">
          {themes.map((theme) => (
            <Link
              key={theme.id}
              data-rail-item
              href={`/themes/${theme.slug}`}
              className="mo-slide group relative w-[78vw] flex-shrink-0 overflow-hidden sm:w-[340px]"
              style={{
                aspectRatio: MEDIA.themeCard.css,
                backgroundColor: theme.primaryColor || 'var(--color-primary)',
              }}
            >
              {(theme.imageUrl || theme.bannerImageUrl) && (
                <img
                  src={theme.imageUrl || theme.bannerImageUrl}
                  alt={theme.name}
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              )}
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(0deg, rgba(0,0,0,.75), rgba(0,0,0,0) 55%)' }}
              />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                <h3 className="text-xl font-black uppercase leading-tight text-white sm:text-2xl">{theme.name}</h3>
                <span className="shrink-0 text-xs font-black uppercase tracking-wide text-white/85">Explore &rarr;</span>
              </div>
            </Link>
          ))}
        </Rail>
      )}

      {bestSellers.length > 0 && (
        <Rail title="Best sellers" viewAllHref="/products">
          {bestSellers.map((product) => (
            <div key={product.id} data-rail-item className={PRODUCT_CARD}>
              <ProductCard
                id={product.id}
                name={product.name}
                price={rupees(product.price)}
                originalPrice={product.mrp ? rupees(product.mrp) : undefined}
                slug={product.slug}
                image={product.images?.[0]?.url}
                hoverImage={product.images?.[1]?.url}
                tag={product.theme?.name || product.category?.name}
              />
            </div>
          ))}
        </Rail>
      )}

      {hampers.length > 0 && (
        <Rail title="Hampers" viewAllHref="/products">
          {hampers.map((hamper) => {
            const cover = hamper.imageUrl || hamper.images?.[0];
            return (
              <Link
                key={hamper.id}
                data-rail-item
                href={hamper.theme ? `/themes/${hamper.theme.slug}` : '/products'}
                className="mo-slide group relative w-[46vw] flex-shrink-0 overflow-hidden sm:w-[240px]"
                style={{ aspectRatio: MEDIA.hamper.css, backgroundColor: 'var(--bg-tertiary)' }}
              >
                {cover && (
                  <img
                    src={cover}
                    alt={hamper.name}
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                )}
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(0deg, rgba(0,0,0,.8), rgba(0,0,0,0) 50%)' }}
                />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <h3 className="text-sm font-black uppercase leading-tight text-white sm:text-base">{hamper.name}</h3>
                  <p className="mt-0.5 text-xs font-bold text-white/85">+₹{rupees(hamper.price)}</p>
                </div>
              </Link>
            );
          })}
        </Rail>
      )}

      {reviews.length > 0 && (
        <Rail title="Reviews" viewAllHref="/products" intervalMs={5000}>
          {reviews.map((review) => (
            <Link
              key={review.id}
              data-rail-item
              href={review.product?.slug ? `/products/${review.product.slug}#reviews` : '/products'}
              className="mo-slide flex w-[80vw] flex-shrink-0 flex-col border p-4 transition hover:shadow-lg sm:w-[320px] sm:p-5"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <Stars rating={review.rating || 5} />

              {review.title && (
                <h3 className="mt-2 text-sm font-black" style={{ color: 'var(--text-primary)' }}>
                  {review.title}
                </h3>
              )}

              <p className="mt-2 line-clamp-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {review.body}
              </p>

              {review.mediaUrls && review.mediaUrls.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {review.mediaUrls.slice(0, 3).map((url) => (
                    <img key={url} src={url} alt="" className="h-14 w-14 object-cover" />
                  ))}
                </div>
              )}

              <p className="mt-3 text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>
                {review.user?.name || 'Verified customer'}
              </p>
            </Link>
          ))}
        </Rail>
      )}

      {influencers.length > 0 && (
        <Rail title="Creators" viewAllHref="/products" intervalMs={5000}>
          {influencers.map((influencer) => (
            <article
              key={influencer.id}
              data-rail-item
              className="mo-slide w-[46vw] flex-shrink-0 overflow-hidden border sm:w-[220px]"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="aspect-square overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                {influencer.imageUrl && (
                  <img src={influencer.imageUrl} alt={influencer.name} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex items-center justify-between gap-2 p-3">
                <h3 className="truncate text-sm font-black" style={{ color: 'var(--text-primary)' }}>
                  {influencer.name}
                </h3>
                <span
                  className="shrink-0 px-2 py-1 text-[10px] font-black text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {influencer.code}
                </span>
              </div>
            </article>
          ))}
        </Rail>
      )}

      {instagram.length > 0 && (
        <Rail
          title="@flyfree_styles"
          viewAllHref="https://instagram.com/flyfree"
          viewAllLabel="Follow"
          external
          intervalMs={5000}
        >
          {instagram.map((post) => (
            <a
              key={post.id}
              data-rail-item
              href={post.instagramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mo-slide group relative w-[60vw] flex-shrink-0 overflow-hidden sm:w-[260px]"
              style={{ aspectRatio: '3 / 4', backgroundColor: 'var(--bg-tertiary)' }}
            >
              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt={post.caption}
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
                <p className="line-clamp-2 text-xs font-bold text-white">{post.caption}</p>
              </div>
            </a>
          ))}
        </Rail>
      )}
    </main>
  );
}

/** Plain glyphs rather than icon components — the row is data, not decoration. */
function Stars({ rating }: { rating: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <p className="text-sm font-black tracking-wide" style={{ color: 'var(--color-accent)' }}>
      {'★'.repeat(filled)}
      <span style={{ color: 'var(--text-tertiary)' }}>{'★'.repeat(5 - filled)}</span>
    </p>
  );
}
