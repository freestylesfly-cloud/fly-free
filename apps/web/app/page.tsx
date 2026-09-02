import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from './components/ProductCard';
import { HeroCarousel } from './components/HeroCarousel';
import { HomeReviewsCarousel } from './components/HomeReviewsCarousel';
import { ShoppableCommunityMedia } from './components/ShoppableCommunityMedia';
import { InfluencerCodeCard } from './components/InfluencerCodeCard';
import { InfluencerPromotionSection } from './components/InfluencerPromotionSection';
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
  featureImageUrl?: string;
  homepageFeatured?: boolean;
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
  facebookUrl?: string;
  xUrl?: string;
  youtubeUrl?: string;
  instagramFollowers?: number;
  facebookFollowers?: number;
  xFollowers?: number;
  youtubeFollowers?: number;
  buyerDiscountPercent?: number;
  isActive?: boolean;
  products?: Product[];
}

interface InstagramPost {
  id: string;
  imageUrl?: string;
  videoUrl?: string;
  caption: string;
  instagramLink: string;
  products?: Product[];
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
  const [themes, products, reviews, hampers, instagram, influencers, featuredInfluencers, social, home] = await Promise.all([
    getJson('/cms/themes'),
    getJson('/catalog/products'),
    getJson('/reviews/latest?limit=12'),
    getJson('/cms/hampers'),
    getJson('/instagram-posts'),
    getJson('/influencers'),
    getJson('/influencers/featured'),
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
    featuredInfluencers: unwrap<Influencer>(featuredInfluencers),
    social: (social || {}) as SocialLinks,
    settings: ((home as any)?.settings || {}) as HomeUiSettings,
  };
}

const rupees = (paise: number) => Math.round((paise || 0) / 100);

/** Card widths are viewport-relative on phones so a peek of the next card
 *  hints that the row scrolls, and fixed from `sm` up. */
const PRODUCT_CARD = 'mo-slide w-[45vw] flex-shrink-0 sm:w-[230px]';

export default async function HomePage() {
  const { themes, products, reviews, hampers, instagram, influencers, featuredInfluencers, social, settings } = await getHomeData();

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
  const shownProductIds = new Set([...newDrops, ...bestSellers].map((product) => product.id));
  const recommended = products
    .filter((product) => !shownProductIds.has(product.id))
    .sort((a, b) => Number(Boolean(b.isTrending || b.isFeatured)) - Number(Boolean(a.isTrending || a.isFeatured)))
    .slice(0, 12);

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

      {bestSellers.length > 0 && (
        <Rail title="Trending now" viewAllHref="/products?sort=trending">
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

      <InfluencerPromotionSection influencers={featuredInfluencers} />

      {themes.length > 0 && (
        <Rail title="Shop by theme" viewAllHref="/products">
          {themes.map((theme) => (
            <Link
              key={theme.id}
              data-rail-item
              href={`/themes/${theme.slug}`}
              className="mo-slide group w-[86vw] flex-shrink-0 transition sm:w-[420px] lg:w-[460px]"
            >
              <div
                className="relative overflow-hidden rounded-lg shadow-sm transition group-hover:shadow-xl"
                style={{ aspectRatio: MEDIA.themeCard.css, backgroundColor: 'var(--bg-tertiary)' }}
              >
                {(theme.imageUrl || theme.bannerImageUrl) && (
                  <img
                    src={theme.imageUrl || theme.bannerImageUrl}
                    alt={theme.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                )}
              </div>
              <div className="flex justify-center pt-3">
                <h3 className="max-w-full text-center text-sm font-black uppercase leading-tight sm:text-base" style={{ color: 'var(--text-primary)' }}>
                  {theme.name}
                </h3>
              </div>
            </Link>
          ))}
        </Rail>
      )}

      <ThemeFeatureSections themes={themes} />

      {recommended.length > 0 && (
        <Rail title="Recommended for you" viewAllHref="/products">
          {recommended.map((product) => (
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
                className="mo-slide group relative w-[46vw] flex-shrink-0 overflow-hidden rounded-lg border shadow-sm transition hover:shadow-xl sm:w-[240px]"
                style={{ aspectRatio: MEDIA.hamper.css, backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}
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

      <CreatorsSection influencers={influencers} />

      <InstagramCommunitySection instagram={instagram} social={social} settings={settings} />

      <AboutStorySection settings={settings} />
    </main>
  );
}

function ThemeFeatureSections({ themes }: { themes: Theme[] }) {
  const featuredThemes = themes
    .filter((theme) => theme.homepageFeatured && (theme.featureImageUrl || theme.bannerImageUrl || theme.imageUrl))
    .slice(0, 2);
  if (featuredThemes.length === 0) return null;

  return (
    <>
      {featuredThemes.map((theme) => {
        const products = (theme.products || []).filter((product) => product.images?.[0]?.url).slice(0, 4);
        const mediaUrl = theme.featureImageUrl || theme.bannerImageUrl || theme.imageUrl;
        return (
          <section
            key={theme.id}
            className="fly-reveal relative min-h-screen overflow-hidden border-b"
            style={{ borderColor: 'var(--border-color)', backgroundColor: theme.primaryColor || 'var(--text-primary)' }}
          >
            <img
              src={mediaUrl}
              alt={theme.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/30 to-black/10 sm:bg-gradient-to-r sm:from-black/82 sm:via-black/32 sm:to-black/5" />
            <div className="relative z-10 flex min-h-screen flex-col justify-end px-4 pb-6 pt-24 text-white sm:px-8 sm:pb-8 lg:px-12 lg:pb-10">
              <div className="max-w-5xl">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-white/72">Featured universe</p>
                <h2 className="mt-3 text-5xl font-black uppercase leading-[0.92] sm:text-7xl lg:text-8xl">{theme.name}</h2>
                <span className="fly-line mt-3" aria-hidden="true" />
                {theme.description && <p className="mt-4 max-w-2xl text-base font-bold leading-relaxed text-white/88 sm:text-xl">{theme.description}</p>}
                <Link href={`/themes/${theme.slug}`} className="mt-6 inline-flex w-fit rounded bg-white px-7 py-3 text-sm font-black uppercase tracking-wide text-black transition hover:shadow-xl sm:px-8 sm:py-4">
                  View {theme.name}
                </Link>
              </div>
              {products.length > 0 && (
                <div className="mt-7 grid w-full grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                  {products.map((product) => (
                    <Link key={product.id} href={`/products/${product.slug}`} className="group overflow-hidden bg-white/95 text-black shadow-lg transition hover:shadow-xl">
                      <div className="aspect-[4/5] overflow-hidden bg-white">
                        <img src={product.images?.[0]?.url} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      </div>
                      <div className="p-2.5 sm:p-3">
                        <p className="line-clamp-2 text-[11px] font-black uppercase leading-tight sm:text-xs">{product.name}</p>
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
  const posts = instagram.filter((post) => post.imageUrl || post.videoUrl).slice(0, 6);
  if (posts.length === 0) return null;

  return (
    <ShoppableCommunityMedia
      posts={posts}
      title={settings.homeCommunityTitle || 'Shop the community live'}
      intro={settings.homeCommunityText || social.instagramHandle || 'Tap any post to watch, view sound controls, and shop tagged products.'}
      instagramHref={social.instagram}
      limit={6}
    />
  );
}

function HomeReviewsSection({ reviews }: { reviews: Review[] }) {
  return <HomeReviewsCarousel reviews={reviews} />;
}

function CreatorsSection({ influencers }: { influencers: Influencer[] }) {
  const activeInfluencers = influencers.filter((influencer) => influencer.isActive !== false);
  if (activeInfluencers.length === 0) return null;

  return (
    <Rail title="Shop with the Fly Free crew" viewAllHref="/community" viewAllLabel="View community">
      {activeInfluencers.map((influencer) => (
        <div key={influencer.id} data-rail-item className="mo-slide w-[72vw] flex-shrink-0 sm:w-[280px]">
          <InfluencerCodeCard influencer={influencer} />
        </div>
      ))}
    </Rail>
  );
}

function AboutStorySection({ settings }: { settings: HomeUiSettings }) {
  if (!settings.homeAboutImageUrl && !settings.homeAboutTitle && !settings.homeAboutText) return null;

  return (
    <section className="overflow-hidden border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--text-primary)' }}>
      <div className="grid lg:min-h-[620px] lg:grid-cols-[1.1fr_0.9fr]">
      {settings.homeAboutImageUrl && (
        <div className="relative aspect-[4/3] min-h-[280px] bg-black/20 sm:aspect-[16/9] lg:aspect-auto lg:min-h-[620px]">
          <img src={settings.homeAboutImageUrl} alt={settings.homeAboutTitle || 'About Fly Free'} className="absolute inset-0 h-full w-full object-contain" />
        </div>
      )}
      <div className="flex flex-col justify-center px-5 py-12 text-white sm:px-10 sm:py-16 lg:px-14 lg:py-20">
        <p className="text-sm font-black uppercase tracking-wide text-white/70">The Fly Free story</p>
        {settings.homeAboutTitle && (
          <h2 className="mt-4 max-w-2xl text-4xl font-black uppercase leading-[0.94] sm:text-6xl lg:text-7xl">
            {settings.homeAboutTitle}
          </h2>
        )}
        <span className="fly-line mt-4" aria-hidden="true" />
        {settings.homeAboutText && (
          <p className="mt-5 max-w-2xl text-base font-bold leading-relaxed text-white/85 sm:text-xl">
            {settings.homeAboutText}
          </p>
        )}
        <Link href={settings.homeCommunityCtaHref || '/about'} className="mt-8 inline-flex w-fit rounded-lg bg-white px-8 py-4 text-sm font-black uppercase tracking-wide text-black transition hover:shadow-xl">
          {settings.homeCommunityCtaLabel || 'Know more'}
        </Link>
      </div>
      </div>
    </section>
  );
}

