'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CalendarDays, Gift, Instagram, MapPin, Sparkles, Trophy, X } from 'lucide-react';
import { IMAGE_WIDTH, storageImage } from '../lib/image';
import type { Sponsorship, SponsorshipCopy } from './SponsorshipSection';

/**
 * A one-time announcement for the sponsorship currently running.
 *
 * Shown once per sponsorship per browser: dismissing it records that id, so a
 * returning visitor is left alone but a NEW collaboration still gets its moment.
 * The flag lives in localStorage, which can throw or come back empty in private
 * windows — every access is guarded and failure simply means the modal shows.
 */
export function SponsorshipAnnouncement({
  sponsorship,
  copy = {}
}: {
  sponsorship?: Sponsorship | null;
  copy?: SponsorshipCopy;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!sponsorship) return;

    const key = `flyfree_sponsorship_seen_${sponsorship.id}`;
    try {
      if (localStorage.getItem(key)) return;
    } catch {
      // Storage blocked. Showing the modal is the friendlier failure.
    }

    // Long enough that the homepage has painted and it reads as a welcome
    // rather than an interruption.
    const timer = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(timer);
  }, [sponsorship]);

  function dismiss() {
    setOpen(false);
    if (!sponsorship) return;
    try {
      localStorage.setItem(`flyfree_sponsorship_seen_${sponsorship.id}`, String(Date.now()));
    } catch {
      // Not remembering is acceptable; showing it twice is not worth an error.
    }
  }

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') dismiss();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!sponsorship) return null;

  const winners = sponsorship.winners || [];
  const countdown = describeCountdown(sponsorship.eventDate);
  const prizeTotal = sponsorship.prizeTotal || 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1300] grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${sponsorship.partnerName} sponsorship`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) dismiss();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="my-auto w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <div className="relative">
              {sponsorship.bannerImageUrl ? (
                <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16 / 9', backgroundColor: 'var(--bg-tertiary)' }}>
                  <img
                    src={storageImage(sponsorship.bannerImageUrl, IMAGE_WIDTH.card)}
                    alt={`${sponsorship.partnerName} — ${sponsorship.eventName}`}
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, rgba(0,0,0,.75), rgba(0,0,0,0) 65%)' }} />
                </div>
              ) : (
                <div className="h-24 w-full" style={{ backgroundColor: 'var(--color-primary)' }} />
              )}

              <button
                type="button"
                onClick={dismiss}
                aria-label="Close"
                className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/75"
              >
                <X size={18} />
              </button>

              {countdown && (
                <motion.span
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="absolute bottom-3 left-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-white shadow-lg"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <Sparkles size={13} /> {countdown}
                </motion.span>
              )}
            </div>

            <div className="p-5 sm:p-6">
              <p className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--color-primary)' }}>
                {copy.sponsorKicker || 'Proudly sponsoring'}
              </p>
              <h2 className="mt-2 text-2xl font-black uppercase leading-tight sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
                {sponsorship.headline || `${sponsorship.partnerName} × Fly Free`}
              </h2>

              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black uppercase" style={{ color: 'var(--text-secondary)' }}>
                <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1" style={{ borderColor: 'var(--border-color)' }}>
                  {sponsorship.eventName}
                </span>
                {sponsorship.location && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1" style={{ borderColor: 'var(--border-color)' }}>
                    <MapPin size={12} /> {sponsorship.location}
                  </span>
                )}
                {sponsorship.eventDate && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1" style={{ borderColor: 'var(--border-color)' }}>
                    <CalendarDays size={12} />
                    {new Date(sponsorship.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>

              {sponsorship.blurb && (
                <p className="mt-4 text-sm font-bold leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {sponsorship.blurb}
                </p>
              )}

              {/* Before the event this is the prize pool; after it, the roll of honour. */}
              {(prizeTotal > 0 || winners.length > 0) && (
                <div
                  className="mt-5 rounded-xl border p-4"
                  style={{
                    borderColor: 'var(--color-primary)',
                    background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 10%, white), white)',
                  }}
                >
                  <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
                    {winners.length > 0 ? <Trophy size={13} /> : <Gift size={13} />}
                    {winners.length > 0 ? copy.sponsorWinnersLabel || 'Prize winners' : copy.sponsorPrizeTitle || 'What we are giving'}
                  </p>
                  {prizeTotal > 0 && (
                    <p className="mt-2 text-2xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>
                      ₹{prizeTotal.toLocaleString('en-IN')}
                    </p>
                  )}
                  {winners.length > 0 && (
                    <p className="mt-2 line-clamp-2 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                      {winners.map((w) => w.name).join(' · ')}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Link
                  href={`/sponsorships/${sponsorship.id}`}
                  onClick={dismiss}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-5 py-3 text-xs font-black uppercase text-white transition hover:opacity-90"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {copy.sponsorCtaLabel || 'See details'} <ArrowRight size={15} />
                </Link>

                {sponsorship.partnerUrl && (
                  <a
                    href={sponsorship.partnerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border px-5 py-3 text-xs font-black uppercase transition hover:bg-black/5"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    <Instagram size={15} /> {sponsorship.partnerHandle || 'Instagram'}
                  </a>
                )}
              </div>

              <button
                type="button"
                onClick={dismiss}
                className="mt-3 w-full text-center text-[11px] font-bold uppercase tracking-wide transition hover:opacity-70"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Turns the event date into the line that creates the urgency.
 *
 * Compared at day granularity rather than by elapsed milliseconds, so an event
 * later today reads "Happening today" instead of "in 0 days".
 */
function describeCountdown(eventDate?: string | null) {
  if (!eventDate) return '';

  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.round((startOfDay(new Date(eventDate)) - startOfDay(new Date())) / 86_400_000);

  if (days > 30) return 'Coming soon';
  if (days > 1) return `${days} days to go`;
  if (days === 1) return 'Tomorrow';
  if (days === 0) return 'Happening today';
  if (days === -1) return 'Wrapped up yesterday';
  return 'Event wrapped';
}
