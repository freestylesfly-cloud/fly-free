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
  variants?: Array<{
    id?: string;
    size?: string | null;
    color?: string | null;
    price?: number | null;
    inventory?: { stock?: number | null } | null;
  }>;
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
  products?: Product[];
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

/** Admin → Settings → Social links. Null for anything left unset. */
interface SocialLinks {
  instagram?: string | null;
  instagramHandle?: string | null;
}

interface HomeUiSettings {
  homeHeroTitle?: string;
  homeHeroSubtitle?: string;
  homeHeroKicker?: string;
  homeHeroCtaLabel?: string;
  homeHeroCtaHref?: string;
  homeHeroImageUrl?: string;
  homeAboutTitle?: string;
  homeAboutText?: string;
  homeAboutImageUrl?: string;
  homeCommunityTitle?: string;
  homeCommunityText?: string;
  homeCommunityCtaLabel?: string;
  homeCommunityCtaHref?: string;
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
  const [themes, products, reviews, hampers, instagram, influencers, social, home] = await Promise.all([
    getJson('/cms/themes'),
    getJson('/catalog/products'),
    getJson('/reviews/latest?limit=12'),
    getJson('/cms/hampers'),
    getJson('/instagram-posts'),
    getJson('/influencers'),
    getJson('/cms/settings/social'),
    getJson('/cms/home'),
  ]);

  return {
    themes: unwrap<Theme>(themes),
    products: unwrap<Product>(products).filter((p) => p.isVisible !== false),
    reviews: unwrap<Review>(reviews),
    hampers: unwrap<Hamper>(hampers),
    instagram: unwrap<InstagramPost>(instagram),
    influencers: unwrap<Influencer>(influencers),
    social: (social || {}) as SocialLinks,
    settings: ((home as any)?.settings || {}) as HomeUiSettings,
  };
}

const rupees = (paise: number) => Math.round((paise || 0) / 100);

/** Card widths are viewport-relative on phones so a peek of the next card
 *  hints that the row scrolls, and fixed from `sm` up. */
const PRODUCT_CARD = 'mo-slide w-[45vw] flex-shrink-0 sm:w-[230px]';

export default async function HomePage() {
  const { themes, products, reviews, hampers, instagram, influencers, social, settings } = await getHomeData();

  // The hero is simply the active product themes — each theme's banner is one
  // slide. There is no separate site-wide hero to configure.
  const adminHeroSlide = settings.homeHeroImageUrl
    ? [{
        id: 'home-ui-hero',
        image: settings.homeHeroImageUrl,
        tag: settings.homeHeroKicker || HERO_FALLBACK.tag,
        title: settings.homeHeroTitle || '',
        subtitle: settings.homeHeroSubtitle || '',
        ctaLabel: settings.homeHeroCtaLabel || '',
        ctaHref: settings.homeHeroCtaHref || '/products',
      }]
    : [];
  const themeHeroSlides = themes
    .filter((theme) => theme.bannerImageUrl || theme.imageUrl)
    .map((theme) => ({
      id: theme.id,
      image: theme.bannerImageUrl || theme.imageUrl,
      tag: 'Theme drop',
      title: theme.name,
      subtitle: theme.description,
      ctaLabel: `Shop ${theme.name}`,
      ctaHref: `/themes/${theme.slug}`,
    }));
  const heroSlides = [...adminHeroSlide, ...themeHeroSlides];

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
                images={product.images}
                variants={product.variants}
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
                style={{ background: 'linear-gradient(0deg, rgba(0,0,0,.62), rgba(0,0,0,0) 58%)' }}
              />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <h3 className="text-xl font-black uppercase leading-tight text-white sm:text-2xl">{theme.name}</h3>
              </div>
            </Link>
          ))}
        </Rail>
      )}

      <ThemeFeatureSections themes={themes} />

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
                images={product.images}
                variants={product.variants}
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
                  <p className="mt-0.5 text-xs font-bold text-white/85">+Rs {rupees(hamper.price)}</p>
                </div>
              </Link>
            );
          })}
        </Rail>
      )}

      <HomeReviewsSection reviews={reviews} />

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

      <InstagramCommunitySection instagram={instagram} social={social} settings={settings} />

      <AboutStorySection settings={settings} />
    </main>
  );
}

function ThemeFeatureSections({ themes }: { themes: Theme[] }) {
  const featuredThemes = themes.filter((theme) => theme.bannerImageUrl || theme.imageUrl).slice(0, 2);
  if (featuredThemes.length === 0) return null;

  return (
    <>
      {featuredThemes.map((theme) => {
        const products = (theme.products || []).filter((product) => product.images?.[0]?.url).slice(0, 4);
        return (
          <section key={theme.id} className="fly-reveal relative min-h-[82svh] overflow-hidden border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: theme.primaryColor || 'var(--text-primary)' }}>
            <img
              src={theme.bannerImageUrl || theme.imageUrl}
              alt={theme.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/78 via-black/30 to-black/5" />
            <div className="relative z-10 flex min-h-[82svh] flex-col justify-end px-5 pb-8 pt-20 text-white sm:px-10 lg:px-16">
              <h2 className="max-w-5xl text-5xl font-black uppercase leading-[0.92] sm:text-7xl lg:text-8xl">{theme.name}</h2>
              <span className="fly-line mt-3" aria-hidden="true" />
              {theme.description && <p className="mt-4 max-w-2xl text-base font-bold leading-relaxed text-white/88 sm:text-xl">{theme.description}</p>}
              <Link href={`/themes/${theme.slug}`} className="mt-7 inline-flex w-fit bg-white px-8 py-4 text-sm font-black uppercase tracking-wide text-black transition hover:-translate-y-0.5 hover:shadow-xl">
                Shop theme
              </Link>
              {products.length > 0 && (
                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {products.map((product) => (
                    <Link key={product.id} href={`/products/${product.slug}`} className="group overflow-hidden bg-white/95 text-black shadow-lg">
                      <div className="aspect-[4/5] overflow-hidden bg-white">
                        <img src={product.images?.[0]?.url} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      </div>
                      <div className="p-3">
                        <p className="line-clamp-2 text-xs font-black uppercase leading-tight">{product.name}</p>
                        <p className="mt-1 text-xs font-bold text-black/60">Rs {rupees(product.price)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}

function InstagramCommunitySection({
  instagram,
  social,
  settings,
}: {
  instagram: InstagramPost[];
  social: SocialLinks;
  settings: HomeUiSettings;
}) {
  const posts = instagram.filter((post) => post.imageUrl).slice(0, 6);
  if (posts.length === 0) return null;

  const featureCaption = settings.homeCommunityText || posts[0]?.caption || '';

  return (
    <section className="border-b bg-white" style={{ borderColor: 'var(--border-color)' }}>
      <div className="grid lg:grid-cols-[minmax(300px,0.82fr)_minmax(0,1.6fr)]">
        <div className="flex min-h-[420px] flex-col justify-between px-5 py-8 text-white sm:px-10 lg:px-16 lg:py-12" style={{ backgroundColor: 'var(--color-secondary)' }}>
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-white/70">Instagram</p>
            <h2 className="mt-3 text-4xl font-black uppercase leading-none sm:text-6xl">
              {settings.homeCommunityTitle || 'Our Community'}
            </h2>
          </div>
          <div className="mt-16">
            <p className="text-2xl font-black uppercase leading-none sm:text-4xl">{social.instagramHandle || '@flyfree.ne'}</p>
            <span className="fly-line mt-4" aria-hidden="true" />
            <p className="mt-5 max-w-md text-base font-bold leading-relaxed text-white/85">{featureCaption}</p>
            {social.instagram && (
              <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex w-fit bg-white px-7 py-3 text-sm font-black uppercase tracking-wide text-black transition hover:-translate-y-0.5">
                Follow
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3">
          {posts.map((post, index) => (
            <a
              key={post.id}
              href={post.instagramLink || social.instagram || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative overflow-hidden ${index === 0 ? 'col-span-2 min-h-[440px] sm:col-span-1 sm:row-span-2' : 'min-h-[220px]'}`}
            >
              <img src={post.imageUrl} alt={post.caption} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent opacity-90 transition group-hover:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
                <p className="line-clamp-3 text-sm font-black leading-tight sm:text-base">{post.caption}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomeReviewsSection({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;

  const visibleReviews = reviews.slice(0, 8);
  const average = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;

  return (
    <section className="border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
      <div className="px-4 py-10 sm:px-6 md:py-14">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
              Customer reviews
            </p>
            <h2 className="mt-2 text-xl font-black uppercase tracking-tight sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
              Ratings & reviews
            </h2>
          </div>
          <div className="flex items-end gap-4">
            <div className="text-right">
              <p className="text-xs font-black uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                Ratings
              </p>
              <p className="text-3xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>
                {average.toFixed(1)}
              </p>
              <p className="mt-1 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                by {reviews.length} verified buyer{reviews.length === 1 ? '' : 's'}
              </p>
            </div>
            <Link
              href="/reviews"
              className="hidden shrink-0 text-xs font-black uppercase tracking-wide sm:inline-flex"
              style={{ color: 'var(--color-primary)' }}
            >
              View all -&gt;
            </Link>
          </div>
        </div>

        <div className="mo-slider mt-6 flex gap-3 overflow-x-auto pb-2 sm:gap-5">
          {visibleReviews.map((review) => (
            <Link
              key={review.id}
              data-rail-item
              href={review.product?.slug ? `/products/${review.product.slug}#reviews` : '/reviews'}
              className="mo-slide group flex min-h-[270px] w-[82vw] flex-shrink-0 flex-col border bg-white p-4 transition hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.12)] sm:w-[330px] sm:p-5"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <RatingStars rating={review.rating || 5} />
                  <p className="mt-1 text-[10px] font-black uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                    Verified buyer
                  </p>
                </div>
                {review.mediaUrls?.[0] && (
                  <img src={review.mediaUrls[0]} alt="" className="h-14 w-14 shrink-0 rounded-sm object-cover" />
                )}
              </div>
              <h3 className="mt-5 line-clamp-2 text-base font-black uppercase leading-tight" style={{ color: 'var(--text-primary)' }}>
                {review.title || review.product?.name || 'Customer review'}
              </h3>
              {review.body && (
                <p className="mt-3 line-clamp-4 text-sm font-bold leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  &quot;{review.body}&quot;
                </p>
              )}
              <div className="mt-auto flex items-end justify-between gap-3 border-t pt-4" style={{ borderColor: 'var(--border-light)' }}>
                <div className="min-w-0">
                <p className="text-[11px] font-black uppercase" style={{ color: 'var(--text-tertiary)' }}>
                  {review.user?.name || 'Verified customer'}
                </p>
                {review.product?.name && (
                  <p className="mt-1 line-clamp-1 text-xs font-black uppercase" style={{ color: 'var(--color-primary)' }}>
                    {review.product.name}
                  </p>
                )}
                </div>
                <span className="shrink-0 text-[11px] font-black uppercase opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" style={{ color: 'var(--color-primary)' }}>
                  Open
                </span>
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/reviews"
          className="mt-6 inline-flex text-xs font-black uppercase tracking-wide sm:hidden"
          style={{ color: 'var(--color-primary)' }}
        >
          View all -&gt;
        </Link>
      </div>
    </section>
  );
}

function AboutStorySection({ settings }: { settings: HomeUiSettings }) {
  if (!settings.homeAboutImageUrl && !settings.homeAboutTitle && !settings.homeAboutText) return null;

  return (
    <section className="relative min-h-[72svh] overflow-hidden border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--text-primary)' }}>
      {settings.homeAboutImageUrl && (
        <img src={settings.homeAboutImageUrl} alt={settings.homeAboutTitle || 'About Fly Free'} className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/78 via-black/35 to-black/5" />
      <div className="relative z-10 flex min-h-[72svh] flex-col justify-end px-5 pb-10 pt-24 text-white sm:px-10 lg:px-16">
        <p className="text-sm font-black uppercase tracking-wide text-white/70">About Fly Free</p>
        {settings.homeAboutTitle && (
          <h2 className="mt-5 max-w-5xl text-5xl font-black uppercase leading-[0.92] sm:text-7xl lg:text-8xl">
            {settings.homeAboutTitle}
          </h2>
        )}
        <span className="fly-line mt-4" aria-hidden="true" />
        {settings.homeAboutText && (
          <p className="mt-5 max-w-2xl text-base font-bold leading-relaxed text-white/85 sm:text-xl">
            {settings.homeAboutText}
          </p>
        )}
        <Link href={settings.homeCommunityCtaHref || '/about'} className="mt-8 inline-flex w-fit bg-white px-8 py-4 text-sm font-black uppercase tracking-wide text-black transition hover:-translate-y-0.5 hover:shadow-xl">
          {settings.homeCommunityCtaLabel || 'Know more'}
        </Link>
      </div>
    </section>
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

function RatingStars({ rating }: { rating: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div className="flex gap-1 text-sm font-black" aria-label={`${filled} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          style={{ color: index < filled ? 'var(--color-accent)' : 'var(--text-tertiary)' }}
        >
          {index < filled ? '\u2605' : '\u2606'}
        </span>
      ))}
    </div>
  );
}

