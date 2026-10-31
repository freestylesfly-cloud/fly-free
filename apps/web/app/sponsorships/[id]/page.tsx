import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, CalendarDays, Camera, Gift, Handshake, MapPin, Trophy } from 'lucide-react';
import { Confetti } from '../../components/Confetti';
import { EventGallery } from '../../components/EventGallery';
import { getApiBaseUrl } from '../../lib/api';
import { MEDIA } from '../../lib/design';
import { formatEventDates } from '../../lib/eventDates';
import { IMAGE_WIDTH, storageImage } from '../../lib/image';

const API_BASE = getApiBaseUrl();

/** Matches the API's public cache window, so an admin edit shows within a minute. */
export const revalidate = 60;

type Winner = {
  id: string;
  name: string;
  /** The competition they won. Every winner is an equal winner — never ranked. */
  award?: string | null;
  position?: number | null;
  prizeValue: number;
  imageUrl?: string | null;
};

type Sponsorship = {
  id: string;
  partnerName: string;
  partnerHandle?: string | null;
  partnerUrl?: string | null;
  eventName: string;
  eventDate?: string | null;
  eventEndDate?: string | null;
  location?: string | null;
  headline?: string | null;
  blurb?: string | null;
  /** Long write-up; paragraphs separated by blank lines. */
  story?: string | null;
  galleryUrls?: string[];
  bannerImageUrl?: string | null;
  partnerLogoUrl?: string | null;
  winners: Winner[];
  prizeCount: number;
  prizeTotal: number;
};

async function getSponsorship(id: string): Promise<Sponsorship | null> {
  try {
    const response = await fetch(`${API_BASE}/cms/sponsorships/${id}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/** Page copy lives in Admin → Settings → Home, not in this file. */
async function getCopy(): Promise<Record<string, string>> {
  try {
    const response = await fetch(`${API_BASE}/cms/home`);
    if (!response.ok) return {};
    const payload = await response.json();
    return (payload?.settings || {}) as Record<string, string>;
  } catch {
    return {};
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sponsorship = await getSponsorship(id);
  if (!sponsorship) return { title: 'Sponsorship' };

  return {
    title: `${sponsorship.partnerName} × Fly Free | ${sponsorship.eventName}`,
    description: sponsorship.blurb || `Fly Free is sponsoring ${sponsorship.eventName} with prize tees for the winners.`,
  };
}

const rupees = (value: number) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

export default async function SponsorshipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [sponsorship, copy] = await Promise.all([getSponsorship(id), getCopy()]);
  if (!sponsorship) notFound();

  const eventDates = formatEventDates(sponsorship.eventDate, sponsorship.eventEndDate, 'long');
  const hasWinners = sponsorship.winners.length > 0;
  const story = (sponsorship.story || '')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const gallery = sponsorship.galleryUrls || [];
  const prizeValues = sponsorship.winners.map((w) => w.prizeValue);
  const equalPrize = prizeValues.length > 0 && prizeValues.every((v) => v === prizeValues[0]) ? prizeValues[0] : 0;

  return (
    <main style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* A results page is a celebration — one burst when it opens. */}
      <Confetti fire={hasWinners} />
      {/* HERO — the banner art with the title laid over it, matching the theme pages. */}
      <section className="relative w-full overflow-hidden" style={{ aspectRatio: MEDIA.sponsorBanner.css, backgroundColor: 'var(--color-primary)' }}>
        {sponsorship.bannerImageUrl && (
          <img
            src={storageImage(sponsorship.bannerImageUrl, IMAGE_WIDTH.hero)}
            alt={`${sponsorship.partnerName} — ${sponsorship.eventName}`}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, rgba(0,0,0,.85), rgba(0,0,0,.15) 60%)' }} />

        <div className="absolute inset-x-0 bottom-0 px-4 pb-6 sm:px-10 sm:pb-10 lg:px-16 lg:pb-14">
          <div className="fly-reveal">
            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-white/80 sm:text-xs">
              <Handshake size={14} /> {copy.sponsorKicker || 'Proudly sponsoring'}
            </p>
            <h1
              className="mt-3 max-w-4xl font-black uppercase leading-[0.92] text-white"
              style={{ fontSize: 'clamp(28px, 6vw, 72px)', letterSpacing: '-0.02em' }}
            >
              {sponsorship.headline || `${sponsorship.partnerName} × Fly Free`}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-black uppercase text-white/85 sm:text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">
                {sponsorship.eventName}
              </span>
              {sponsorship.location && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">
                  <MapPin size={13} /> {sponsorship.location}
                </span>
              )}
              {eventDates && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">
                  <CalendarDays size={13} />
                  {eventDates}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="px-4 py-10 sm:px-6 md:py-14 lg:px-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide"
          style={{ color: 'var(--color-primary)' }}
        >
          <ArrowLeft size={14} /> Back to home
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* PARTNER + STORY */}
          <section className="fly-reveal">
            <div className="flex items-start gap-4">
              {sponsorship.partnerLogoUrl ? (
                <span className="h-16 w-16 shrink-0 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <img
                    src={storageImage(sponsorship.partnerLogoUrl, IMAGE_WIDTH.small)}
                    alt={sponsorship.partnerName}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </span>
              ) : (
                <span
                  className="grid h-16 w-16 shrink-0 place-items-center rounded-full text-2xl font-black text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {sponsorship.partnerName.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <h2 className="text-2xl font-black uppercase leading-tight sm:text-3xl">{sponsorship.partnerName}</h2>
                {sponsorship.partnerHandle && (
                  <p className="mt-1 text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                    {sponsorship.partnerHandle}
                  </p>
                )}
              </div>
            </div>

            {sponsorship.blurb && (
              <p className="mt-6 max-w-2xl text-base font-bold leading-8" style={{ color: 'var(--text-secondary)' }}>
                {sponsorship.blurb}
              </p>
            )}

            {story.length > 0 && (
              <div className="mt-6 max-w-2xl space-y-4 border-l-4 pl-5" style={{ borderColor: 'var(--color-primary)' }}>
                {story.map((paragraph, index) => (
                  <p key={index} className="text-[15px] leading-7" style={{ color: 'var(--text-secondary)' }}>
                    {paragraph}
                  </p>
                ))}
              </div>
            )}

            {sponsorship.partnerUrl && (
              <a
                href={sponsorship.partnerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-black uppercase transition hover:bg-black/5"
                style={{ borderColor: 'var(--border-color)', color: 'var(--color-primary)' }}
              >
                Visit {sponsorship.partnerHandle || sponsorship.partnerName} <ArrowUpRight size={14} />
              </a>
            )}
          </section>

          {/* WHAT WE ARE GIVING */}
          {hasWinners && (
            <aside
              className="fly-reveal h-fit rounded-2xl border p-6"
              style={{
                borderColor: 'var(--color-primary)',
                background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 12%, white), white)',
              }}
            >
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
                <Gift size={15} /> {copy.sponsorPrizeTitle || 'What we are giving'}
              </p>
              <p className="mt-4 text-4xl font-black leading-none">{rupees(equalPrize || sponsorship.prizeTotal)}</p>
              <p className="mt-2 text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                {equalPrize
                  ? `in Fly Free credit for each of the ${sponsorship.prizeCount} winners.`
                  : `across ${sponsorship.prizeCount} winner${sponsorship.prizeCount === 1 ? '' : 's'}.`}
              </p>
              {copy.sponsorPrizeNote && (
                <p className="mt-4 text-xs font-bold leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {copy.sponsorPrizeNote}
                </p>
              )}
              <Link
                href={copy.homeHeroCtaHref || '/products'}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-xs font-black uppercase text-white transition hover:opacity-90"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {copy.homeHeroCtaLabel || 'Shop now'}
              </Link>
            </aside>
          )}
        </div>

        {/* WINNERS */}
        {hasWinners && (
          <section className="mt-14">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
                  <Trophy size={15} /> {copy.sponsorWinnersLabel || 'Prize winners'}
                </p>
                <h2 className="mt-2 text-3xl font-black uppercase sm:text-4xl">{copy.sponsorWinnersTitle || 'Congratulations'}</h2>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {sponsorship.winners.map((winner, index) => (
                <WinnerCard key={winner.id} winner={winner} index={index} />
              ))}
            </div>
          </section>
        )}

        {/* GALLERY */}
        {gallery.length > 0 && (
          <section className="mt-14">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
              <Camera size={15} /> {gallery.length} photo{gallery.length === 1 ? '' : 's'}
            </p>
            <h2 className="mb-6 mt-2 text-3xl font-black uppercase sm:text-4xl">From the event</h2>
            <EventGallery photos={gallery} title={sponsorship.eventName} />
          </section>
        )}
      </div>
    </main>
  );
}

/**
 * One winner, as a prize card.
 *
 * The stagger is a CSS animation delay rather than a client-side motion library:
 * this page is a server component and has no other reason to ship JavaScript.
 */
function WinnerCard({ winner, index }: { winner: Winner; index: number }) {
  return (
    <article
      className="fly-reveal group overflow-hidden rounded-2xl border transition hover:-translate-y-1 hover:shadow-xl"
      style={{
        borderColor: 'var(--border-color)',
        backgroundColor: 'var(--bg-secondary)',
        animationDelay: `${index * 90}ms`,
      }}
    >
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '1 / 1', backgroundColor: 'var(--bg-tertiary)' }}>
        {winner.imageUrl ? (
          <img
            src={storageImage(winner.imageUrl, IMAGE_WIDTH.card)}
            alt={winner.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <span
            className="grid h-full w-full place-items-center text-5xl font-black text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {winner.name.charAt(0).toUpperCase()}
          </span>
        )}

        <span
          className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase text-white shadow-lg"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Trophy size={11} /> Winner
        </span>
      </div>

      <div className="p-4">
        <h3 className="truncate text-base font-black">{winner.name}</h3>
        {winner.award && (
          <p className="mt-0.5 truncate text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
            {winner.award}
          </p>
        )}
        <p className="mt-1 text-sm font-black" style={{ color: 'var(--color-primary)' }}>
          {rupees(winner.prizeValue)} prize voucher
        </p>
      </div>
    </article>
  );
}
