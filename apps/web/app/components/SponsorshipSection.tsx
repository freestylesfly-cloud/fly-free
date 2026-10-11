import Link from 'next/link';
import { ArrowRight, CalendarDays, Gift, Handshake, Instagram, MapPin, Trophy } from 'lucide-react';
import { formatEventDates } from '../lib/eventDates';
import { IMAGE_WIDTH, storageImage } from '../lib/image';
import { Reveal } from './Reveal';

export interface SponsorshipWinner {
  id: string;
  name: string;
  /** The competition they won. Winners are equals, never ranked. */
  award?: string | null;
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
  eventEndDate?: string | null;
  location?: string | null;
  headline?: string | null;
  blurb?: string | null;
  bannerImageUrl?: string | null;
  partnerLogoUrl?: string | null;
  winners?: SponsorshipWinner[];
  prizeTotal?: number;
}

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

/**
 * Partner events Fly Free sponsors, each as a full-width feature block.
 *
 * Runs from the moment a sponsorship is published, long before there are any
 * winners — it promotes the collaboration while the event is still ahead. Once
 * an admin publishes the winners the block becomes a celebration: every winner
 * as an equal, in a ringed photo circle, never a 1st or 2nd. Voucher codes and
 * contact details stay in the admin portal.
 *
 * Everything here comes from Admin → Sponsorships and Admin → Settings → Home,
 * so there is no copy to edit in this file.
 */
export function SponsorshipSection({
  sponsorships,
  copy = {}
}: {
  sponsorships: Sponsorship[];
  copy?: SponsorshipCopy;
}) {
  if (!sponsorships || sponsorships.length === 0) return null;

  return (
    <>
      {sponsorships.map((sponsorship) => (
        <SponsorshipFeature key={sponsorship.id} sponsorship={sponsorship} copy={copy} />
      ))}
    </>
  );
}

function SponsorshipFeature({ sponsorship, copy }: { sponsorship: Sponsorship; copy: SponsorshipCopy }) {
  const winners = sponsorship.winners || [];
  const hasWinners = winners.length > 0;
  const eventDates = formatEventDates(sponsorship.eventDate, sponsorship.eventEndDate);
  const prizeValues = winners.map((w) => w.prizeValue || 0);
  const equalPrize = prizeValues.length > 0 && prizeValues.every((v) => v === prizeValues[0]) ? prizeValues[0] : 0;
  const prize = equalPrize || sponsorship.prizeTotal || 0;

  return (
    <section
      className="relative isolate overflow-hidden border-b"
      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--text-primary)' }}
    >
      {sponsorship.bannerImageUrl && (
        <img
          src={storageImage(sponsorship.bannerImageUrl, IMAGE_WIDTH.hero)}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="hero-kenburns absolute inset-0 -z-10 h-full w-full object-cover"
        />
      )}
      {/* Dark at the bottom on phones, at the left on desktop — where the copy sits. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/95 via-black/80 to-black/45 lg:bg-gradient-to-r lg:from-black/90 lg:via-black/60 lg:to-black/15" />

      <Reveal className="flex min-h-[640px] flex-col justify-end px-4 pb-10 pt-28 text-white sm:px-8 sm:pb-14 lg:min-h-[88vh] lg:px-12 lg:pb-16">
        <div className="max-w-5xl">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-white/75">
            {hasWinners ? <Trophy size={14} /> : <Handshake size={14} />}
            {hasWinners ? copy.sponsorWinnersTitle || 'Congratulations' : copy.sponsorKicker || 'Proudly sponsoring'}
          </p>

          <div className="mt-4 flex items-center gap-4">
            {sponsorship.partnerLogoUrl && (
              <span className="h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-white/80 bg-white sm:h-16 sm:w-16">
                <img
                  src={storageImage(sponsorship.partnerLogoUrl, IMAGE_WIDTH.small)}
                  alt={sponsorship.partnerName}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </span>
            )}
            <h2 className="text-4xl font-black uppercase leading-[0.92] sm:text-6xl lg:text-7xl">
              {sponsorship.headline || `${sponsorship.partnerName} × Fly Free`}
            </h2>
          </div>
          <span className="fly-line mt-4" aria-hidden="true" />

          <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-black uppercase sm:text-xs">
            <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">{sponsorship.eventName}</span>
            {sponsorship.location && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">
                <MapPin size={12} /> {sponsorship.location}
              </span>
            )}
            {eventDates && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">
                <CalendarDays size={12} /> {eventDates}
              </span>
            )}
          </div>

          {sponsorship.blurb && (
            <p className="mt-5 line-clamp-3 max-w-2xl text-base font-bold leading-relaxed text-white/88 sm:text-lg">
              {sponsorship.blurb}
            </p>
          )}
        </div>

        {hasWinners && (
          <div className="mt-8">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/75">
                {copy.sponsorWinnersLabel || 'Prize winners'}
              </p>
              {prize > 0 && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <Gift size={12} /> ₹{prize.toLocaleString('en-IN')}
                  {equalPrize ? ' each' : ''}
                </span>
              )}
            </div>

            <ul className="mt-5 flex flex-wrap gap-x-3 gap-y-6 sm:gap-x-8">
              {winners.map((winner, index) => (
                <li
                  key={winner.id}
                  className="winner-pop flex w-[72px] flex-col items-center text-center sm:w-[112px]"
                  style={{ ['--pop-delay' as string]: `${200 + index * 140}ms` }}
                >
                  <span className="winner-ring h-[68px] w-[68px] sm:h-[112px] sm:w-[112px]">
                    {winner.imageUrl ? (
                      <img
                        src={storageImage(winner.imageUrl, IMAGE_WIDTH.small)}
                        alt={winner.name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <span
                        className="grid h-full w-full place-items-center rounded-full text-2xl font-black text-white sm:text-4xl"
                        style={{ backgroundColor: 'var(--color-primary)' }}
                      >
                        {winner.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="winner-badge" aria-hidden="true">
                      <Trophy size={12} />
                    </span>
                  </span>
                  <span className="mt-3 text-xs font-black leading-tight sm:text-sm">{winner.name}</span>
                  {winner.award && (
                    <span className="mt-1 text-[11px] font-bold leading-tight text-white/70">{winner.award}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={`/sponsorships/${sponsorship.id}`}
            className="inline-flex items-center gap-2 rounded bg-white px-7 py-3.5 text-sm font-black uppercase tracking-wide text-black transition hover:shadow-xl sm:px-8 sm:py-4"
          >
            {copy.sponsorCtaLabel || 'See details'} <ArrowRight size={16} />
          </Link>
          {sponsorship.partnerUrl && (
            <a
              href={sponsorship.partnerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded border-2 border-white/70 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-white hover:text-black"
            >
              <Instagram size={16} /> {sponsorship.partnerHandle || sponsorship.partnerName}
            </a>
          )}
        </div>
      </Reveal>
    </section>
  );
}
