import Link from 'next/link';
import { ArrowRight, AtSign, Facebook, Instagram, TicketPercent, Users, Youtube } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { Rail } from './Rail';

interface PromotionProduct {
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
}

export interface PromotionInfluencer {
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
  products?: PromotionProduct[];
}

interface InfluencerPromotionSectionProps {
  influencers: PromotionInfluencer[];
}

const rupees = (paise: number) => Math.round((paise || 0) / 100);

function shortCount(value?: number | null) {
  const count = Number(value || 0);
  if (count >= 1_000_000) return `${trimNumber(count / 1_000_000)}M`;
  if (count >= 1_000) return `${trimNumber(count / 1_000)}K`;
  return count.toLocaleString('en-IN');
}

function trimNumber(value: number) {
  return value >= 10 ? String(Math.round(value)) : value.toFixed(1).replace(/\.0$/, '');
}

export function InfluencerPromotionSection({ influencers }: InfluencerPromotionSectionProps) {
  const promotedInfluencers = influencers
    .filter((influencer) => influencer.isActive !== false && (influencer.products || []).length > 0)
    .slice(0, 4);

  if (promotedInfluencers.length === 0) return null;

  return (
    <section className="creator-promo-section overflow-hidden border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
      <div className="px-4 py-12 sm:px-6 md:py-16">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="mt-2 max-w-3xl text-2xl font-black uppercase leading-none sm:text-4xl" style={{ color: 'var(--text-primary)' }}>
              Creator picks
            </h2>
            <p className="mt-3 max-w-2xl text-sm font-bold leading-relaxed sm:text-base" style={{ color: 'var(--text-secondary)' }}>
              Discover the Fly Free styles selected and shared by your favourite creators.
            </p>
          </div>
          <Link href="/community" className="inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase transition hover:bg-black/5" style={{ borderColor: 'var(--border-color)', color: 'var(--color-primary)' }}>
            View creators <ArrowRight size={14} />
          </Link>
        </div>

        <div>
          {promotedInfluencers.map((influencer, index) => {
            const products = influencer.products || [];
            const discount = influencer.buyerDiscountPercent || 10;
            return (
              <article key={influencer.id} className="creator-promo-card border-b py-10 first:pt-0 last:border-b-0 sm:py-14" style={{ animationDelay: `${index * 90}ms`, borderColor: 'var(--border-color)' }}>
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)] lg:items-center">
                  <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                    <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-md bg-black/10 shadow-lg sm:h-36 sm:w-32">
                      {influencer.imageUrl ? <img src={influencer.imageUrl} alt={influencer.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-4xl font-black text-white" style={{ backgroundColor: 'var(--color-primary)' }}>{influencer.name.charAt(0).toUpperCase()}</div>}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase" style={{ color: 'var(--color-primary)' }}>Featured creator</p>
                      <p className="mt-1 text-2xl font-black uppercase leading-none sm:text-4xl" style={{ color: 'var(--text-primary)' }}>{influencer.name}</p>
                      <p className="mt-2 max-w-xl text-sm font-bold leading-relaxed" style={{ color: 'var(--text-secondary)' }}>These are the Fly Free styles {influencer.name} is sharing with the community.</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        {Number(influencer.followers || 0) > 0 && <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 font-black uppercase" style={{ borderColor: 'var(--border-light)' }}><Users size={13} /> {shortCount(influencer.followers)} followers</span>}
                        <span className="font-bold" style={{ color: 'var(--text-tertiary)' }}>{products.length} selected styles</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4" style={{ borderColor: 'var(--color-primary)', background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 10%, white), white)' }}>
                    <p className="text-[11px] font-black uppercase" style={{ color: 'var(--color-primary)' }}>Save on {influencer.name}'s picks</p>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="shrink-0 text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{discount}% OFF</span>
                      <span className="h-8 w-px bg-black/10" aria-hidden="true" />
                      <span className="min-w-0 truncate text-lg font-black uppercase tracking-wide" title={influencer.code}>{influencer.code}</span>
                    </div>
                    <p className="mt-2 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Use this creator code at checkout.</p>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {[
                      { label: 'IG', href: influencer.instagramUrl, count: influencer.instagramFollowers, icon: <Instagram size={12} /> },
                      { label: 'FB', href: influencer.facebookUrl, count: influencer.facebookFollowers, icon: <Facebook size={12} /> },
                      { label: 'X', href: influencer.xUrl, count: influencer.xFollowers, icon: <AtSign size={12} /> },
                      { label: 'YT', href: influencer.youtubeUrl, count: influencer.youtubeFollowers, icon: <Youtube size={12} /> },
                    ].filter((platform) => platform.href || Number(platform.count || 0) > 0).map((platform) => {
                      const content = <>{platform.icon} {platform.label}{Number(platform.count || 0) > 0 ? ` ${shortCount(platform.count)}` : ''}</>;
                      return platform.href ? (
                        <a key={platform.label} href={platform.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase transition hover:bg-black/5" style={{ borderColor: 'var(--border-light)', color: 'var(--text-secondary)' }}>
                          {content}
                        </a>
                      ) : (
                        <span key={platform.label} className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase" style={{ borderColor: 'var(--border-light)', color: 'var(--text-secondary)' }}>
                          {content}
                        </span>
                      );
                    })}
                  </div>

                  <Rail embedded title={`${influencer.name}'s picks`} viewAllHref="/products" viewAllLabel="Shop all" intervalMs={4500}>
                    {products.map((product) => (
                      <div key={product.id} data-rail-item className="mo-slide w-[45vw] flex-shrink-0 sm:w-[230px]">
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
                        />
                      </div>
                    ))}
                  </Rail>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
