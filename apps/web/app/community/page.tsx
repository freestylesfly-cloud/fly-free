import Link from 'next/link';
import { ExternalLink, Instagram, TicketPercent, Users } from 'lucide-react';
import { getApiBaseUrl } from '../lib/api';
import { ShoppableCommunityMedia } from '../components/ShoppableCommunityMedia';
import { InfluencerCodeCard } from '../components/InfluencerCodeCard';

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

  return (
    <main style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <section className="border-b bg-white" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex min-h-[48svh] flex-col justify-end px-5 pb-10 pt-28 sm:px-10 lg:px-16 lg:pb-14">
            <p className="text-sm font-black uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
              Fly Free Community
            </p>
            <h1 className="mt-4 max-w-6xl text-5xl font-black uppercase leading-[0.92] sm:text-7xl lg:text-8xl">
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
      </section>

      {influencers.length > 0 && (
        <section className="border-b px-5 py-10 sm:px-10 lg:px-16 lg:py-14" style={{ borderColor: 'var(--border-color)' }}>
          <SectionHeader kicker="Creator codes" title="Shop with creators" actionHref="/products" actionLabel="Shop all" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {influencers.map((influencer) => <InfluencerCodeCard key={influencer.id} influencer={influencer} />)}
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

function Metric({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border bg-white/92 px-3 py-1 text-xs font-black uppercase text-black shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
      {icon} {value} {label}
    </span>
  );
}

