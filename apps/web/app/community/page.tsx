import Link from 'next/link';
import { BadgeCheck, ExternalLink, Instagram, Play, TicketPercent, Users, Volume2 } from 'lucide-react';
import { getApiBaseUrl } from '../lib/api';
import { ShoppableCommunityMedia } from '../components/ShoppableCommunityMedia';

const API_BASE = getApiBaseUrl();

type InstagramPost = {
  id: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  caption: string;
  instagramLink: string;
  displayOrder?: number;
  products?: Array<{
    id: string;
    name: string;
    slug: string;
    price?: number | null;
    images?: Array<{ url?: string | null }>;
  }>;
};

type Influencer = {
  id: string;
  name: string;
  code: string;
  imageUrl?: string | null;
  socialHandle?: string | null;
  instagramUrl?: string | null;
  buyerDiscountPercent?: number | null;
  commissionRate?: number | null;
};

type SocialLinks = {
  instagram?: string | null;
  instagramHandle?: string | null;
};

type HomeSettings = {
  homeCommunityTitle?: string;
  homeCommunityText?: string;
};

export const metadata = {
  title: 'Community | Fly Free',
  description: 'Fly Free creator codes, community posts, Instagram videos, and customer style moments.',
};

export const dynamic = 'force-dynamic';

function unwrap<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

async function getJson(path: string) {
  try {
    const response = await fetch(`${API_BASE}${path}`, { cache: 'no-store' });
    return response.ok ? response.json() : null;
  } catch {
    return null;
  }
}

async function getCommunityData() {
  const [instagram, influencers, social, home] = await Promise.all([
    getJson('/instagram-posts'),
    getJson('/influencers'),
    getJson('/cms/settings/social'),
    getJson('/cms/home'),
  ]);

  return {
    posts: unwrap<InstagramPost>(instagram).filter((post) => post.imageUrl || post.videoUrl),
    influencers: unwrap<Influencer>(influencers),
    social: (social || {}) as SocialLinks,
    settings: ((home as any)?.settings || {}) as HomeSettings,
  };
}

export default async function CommunityPage() {
  const { posts, influencers, social, settings } = await getCommunityData();
  const heroPost = posts.find((post) => post.videoUrl) || posts[0];

  return (
    <main style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <section className="border-b bg-white" style={{ borderColor: 'var(--border-color)' }}>
        <div className="grid min-h-[72svh] lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.86fr)]">
          <div className="flex flex-col justify-end px-5 pb-10 pt-16 sm:px-10 lg:px-16">
            <p className="text-sm font-black uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
              Fly Free Community
            </p>
            <h1 className="mt-4 max-w-5xl text-5xl font-black uppercase leading-[0.92] sm:text-7xl lg:text-8xl">
              {settings.homeCommunityTitle || 'Creators, codes, and real fits.'}
            </h1>
            <p className="mt-6 max-w-2xl text-base font-bold leading-8" style={{ color: 'var(--text-secondary)' }}>
              {settings.homeCommunityText || 'Explore creator drops, customer styling, Instagram videos, and active offer codes managed from Admin.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Metric icon={<Users size={15} />} value={influencers.length} label="Creators" />
              <Metric icon={<Instagram size={15} />} value={posts.length} label="Posts" />
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {social.instagram && (
                <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-black uppercase text-white transition hover:shadow-lg" style={{ backgroundColor: 'var(--color-primary)' }}>
                  <Instagram size={18} /> Follow {social.instagramHandle || 'Fly Free'}
                </a>
              )}
              <Link href="/products" className="inline-flex items-center gap-2 rounded-lg border bg-white px-5 py-3 text-sm font-black uppercase transition hover:shadow-lg" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                <TicketPercent size={18} /> Shop creator codes
              </Link>
            </div>
          </div>

          <div className="relative min-h-[420px] overflow-hidden bg-black lg:min-h-[72svh]">
            {heroPost ? <CommunityMedia post={heroPost} priority /> : <EmptyHero />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/12 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
              {heroPost?.videoUrl && (
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1 text-xs font-black uppercase text-black">
                  <Volume2 size={14} /> Tap video controls for sound
                </div>
              )}
              {heroPost?.caption && <p className="line-clamp-3 text-xl font-black uppercase leading-tight">{heroPost.caption}</p>}
            </div>
          </div>
        </div>
      </section>

      {influencers.length > 0 && (
        <section className="border-b px-5 py-10 sm:px-10 lg:px-16 lg:py-14" style={{ borderColor: 'var(--border-color)' }}>
          <SectionHeader kicker="Creator codes" title="Shop with creators" actionHref="/products" actionLabel="Shop all" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {influencers.map((influencer) => (
              <CreatorCard key={influencer.id} influencer={influencer} />
            ))}
          </div>
        </section>
      )}

      {posts.length > 0 ? (
        <ShoppableCommunityMedia
          posts={posts}
          title="Posts and videos"
          intro="Videos play muted in the list. Tap one to open full view with sound, timeline, and tagged products."
          instagramHref={social.instagram}
          splitImages
        />
      ) : (
        <section className="px-5 py-10 sm:px-10 lg:px-16 lg:py-14">
          <div className="border bg-white p-8" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="text-2xl font-black uppercase">No community posts yet</h2>
            <p className="mt-2 font-bold" style={{ color: 'var(--text-secondary)' }}>
              Add image or video posts from Admin &gt; Instagram.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}

function SectionHeader({ kicker, title, actionHref, actionLabel, external }: { kicker: string; title: string; actionHref?: string; actionLabel: string; external?: boolean }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>{kicker}</p>
        <h2 className="mt-2 text-3xl font-black uppercase sm:text-5xl">{title}</h2>
      </div>
      {actionHref && (
        <a href={actionHref} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
          {actionLabel} {external && <ExternalLink size={14} />}
        </a>
      )}
    </div>
  );
}

function CreatorCard({ influencer }: { influencer: Influencer }) {
  const href = influencer.instagramUrl || '#';
  const discount = influencer.buyerDiscountPercent || 10;

  return (
    <a href={href} target={influencer.instagramUrl ? '_blank' : undefined} rel={influencer.instagramUrl ? 'noopener noreferrer' : undefined} className="group overflow-hidden rounded-lg border bg-white shadow-sm transition hover:shadow-xl" style={{ borderColor: 'var(--border-color)' }}>
      <div className="relative aspect-[4/5] overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        {influencer.imageUrl ? (
          <img src={influencer.imageUrl} alt={influencer.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-6xl font-black" style={{ color: 'var(--color-primary)' }}>
            {influencer.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/0 to-transparent" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-[10px] font-black uppercase text-black shadow-lg">
          <BadgeCheck size={12} style={{ color: 'var(--color-secondary)' }} /> Creator
        </span>
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <h3 className="text-xl font-black uppercase leading-tight">{influencer.name}</h3>
          {influencer.socialHandle && <p className="mt-1 text-sm font-bold text-white/75">{influencer.socialHandle}</p>}
        </div>
      </div>
      <div className="grid grid-cols-[1fr_auto] items-center gap-3 p-4">
        <div>
          <p className="text-[11px] font-black uppercase" style={{ color: 'var(--text-tertiary)' }}>Offer code</p>
          <p className="text-xl font-black tracking-wide">{influencer.code}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-black text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
          <TicketPercent size={13} />
          {discount}% OFF
        </span>
      </div>
    </a>
  );
}

function CommunityPostCard({ post, large, fallbackHref }: { post: InstagramPost; large?: boolean; fallbackHref: string }) {
  return (
    <a
      href={post.instagramLink || fallbackHref}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative min-h-[340px] overflow-hidden rounded-lg border bg-black shadow-sm transition hover:shadow-xl sm:min-h-[380px] ${large ? 'lg:col-span-2 lg:min-h-[560px]' : ''}`}
      style={{ borderColor: 'var(--border-color)' }}
    >
      <CommunityMedia post={post} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/10 to-transparent" />
      {post.videoUrl && (
        <span className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase text-black shadow-lg">
          <Play size={12} fill="currentColor" /> Video
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <p className="line-clamp-4 text-lg font-black uppercase leading-tight">{post.caption}</p>
        <span className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-white/75">
          Open post <ExternalLink size={14} />
        </span>
      </div>
    </a>
  );
}

function CommunityMedia({ post, priority = false }: { post: InstagramPost; priority?: boolean }) {
  if (post.videoUrl) {
    return (
      <video
        src={post.videoUrl}
        poster={post.imageUrl || undefined}
          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
        autoPlay
        muted
        loop
        playsInline
        preload={priority ? 'auto' : 'metadata'}
        controls
      />
    );
  }

  return <img src={post.imageUrl || ''} alt={post.caption} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />;
}

function Metric({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border bg-white/92 px-3 py-1 text-xs font-black uppercase text-black shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
      {icon} {value} {label}
    </span>
  );
}

function EmptyHero() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
      <Instagram size={64} className="text-white/80" />
    </div>
  );
}
