import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Handshake, Trophy } from 'lucide-react';
import { MEDIA } from '../lib/design';
import { IMAGE_WIDTH, storageImage } from '../lib/image';

export interface SponsorshipWinner {
  id: string;
  name: string;
  position?: number | null;
  prizeValue?: number;
  imageUrl?: string | null;
}

export interface Sponsorship {
  id: string;
  partnerName: string;
  partnerHandle?: string | null;
  partnerUrl?: string | null;
  eventName: string;
  eventDate?: string | null;
  location?: string | null;
  headline?: string | null;
  blurb?: string | null;
  bannerImageUrl?: string | null;
  partnerLogoUrl?: string | null;
  winners?: SponsorshipWinner[];
  prizeTotal?: number;
}

/**
 * Partner events Fly Free sponsors.
 *
 * Runs from the moment a sponsorship is published, long before there are any
 * winners — that is the point, it promotes the collaboration while the event is
 * still ahead. Winners appear only once an admin turns them on, and only ever as
 * a name and a placing; the prize voucher codes live in the admin portal.
 *
 * Everything here comes from Admin → Sponsorships, so there is no copy to edit
 * in this file.
 */
/** Section copy, all editable in Admin → Settings → Home. */
export interface SponsorshipCopy {
  sponsorKicker?: string;
  sponsorTitle?: string;
  sponsorCtaLabel?: string;
  sponsorPrizeTitle?: string;
  sponsorPrizeNote?: string;
  sponsorWinnersTitle?: string;
  sponsorWinnersLabel?: string;
}

export function SponsorshipSection({
  sponsorships,
  copy = {}
}: {
  sponsorships: Sponsorship[];
  copy?: SponsorshipCopy;
}) {
  if (!sponsorships || sponsorships.length === 0) return null;

  return (
    <section className="border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
      <div className="px-4 py-12 sm:px-6 md:py-16">
        <div className="mb-6">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
            <Handshake size={14} /> {copy.sponsorKicker || 'Proudly sponsoring'}
          </p>
          <h2 className="mt-2 max-w-3xl text-2xl font-black uppercase leading-none sm:text-4xl" style={{ color: 'var(--text-primary)' }}>
            {copy.sponsorTitle || 'Fly Free in the community'}
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {sponsorships.map((sponsorship, index) => (
            <SponsorshipCard key={sponsorship.id} sponsorship={sponsorship} index={index} copy={copy} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SponsorshipCard({
  sponsorship,
  index = 0,
  copy = {}
}: {
  sponsorship: Sponsorship;
  index?: number;
  copy?: SponsorshipCopy;
}) {
  const winners = sponsorship.winners || [];
  const eventDate = sponsorship.eventDate ? new Date(sponsorship.eventDate) : null;

  return (
    <article
      className="fly-reveal overflow-hidden rounded-lg border transition hover:-translate-y-1 hover:shadow-xl"
      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', animationDelay: `${index * 110}ms` }}
    >
      {sponsorship.bannerImageUrl && (
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: MEDIA.sponsorBanner.css, backgroundColor: 'var(--bg-tertiary)' }}>
          <img
            src={storageImage(sponsorship.bannerImageUrl, IMAGE_WIDTH.card)}
            alt={`${sponsorship.partnerName} — ${sponsorship.eventName}`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          {sponsorship.partnerLogoUrl ? (
            <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <img
                src={storageImage(sponsorship.partnerLogoUrl, IMAGE_WIDTH.thumb)}
                alt={sponsorship.partnerName}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </span>
          ) : (
            <span
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-lg font-black text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {sponsorship.partnerName.charAt(0).toUpperCase()}
            </span>
          )}

          <div className="min-w-0">
            <h3 className="text-lg font-black uppercase leading-tight sm:text-xl" style={{ color: 'var(--text-primary)' }}>
              {sponsorship.headline || `${sponsorship.partnerName} × Fly Free`}
            </h3>
            <p className="mt-1 text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
              {sponsorship.eventName}
              {sponsorship.location ? ` · ${sponsorship.location}` : ''}
              {eventDate ? ` · ${eventDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
            </p>
          </div>
        </div>

        {sponsorship.blurb && (
          <p className="mt-4 text-sm font-bold leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {sponsorship.blurb}
          </p>
        )}

        {winners.length > 0 && (
          <div
            className="mt-5 rounded-lg border p-4"
            style={{
              borderColor: 'var(--color-primary)',
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 10%, white), white)'
            }}
          >
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
              <Trophy size={14} /> {copy.sponsorWinnersLabel || 'Prize winners'}
            </p>
            <ul className="mt-3 space-y-2">
              {winners.map((winner) => (
                <li key={winner.id} className="flex items-center gap-3 text-sm font-black" style={{ color: 'var(--text-primary)' }}>
                  {winner.position ? (
                    <span
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] text-white"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      {winner.position}
                    </span>
                  ) : (
                    <span className="h-6 w-6 shrink-0" />
                  )}
                  {winner.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link
            href={`/sponsorships/${sponsorship.id}`}
            className="inline-flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-xs font-black uppercase text-white transition hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {copy.sponsorCtaLabel || 'See details'} <ArrowRight size={14} />
          </Link>
          {sponsorship.partnerUrl && (
            <a
              href={sponsorship.partnerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-black uppercase transition hover:bg-black/5"
              style={{ borderColor: 'var(--border-color)', color: 'var(--color-primary)' }}
            >
              {sponsorship.partnerHandle || sponsorship.partnerName} <ArrowUpRight size={14} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
