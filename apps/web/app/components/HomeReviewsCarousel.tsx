'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, BadgeCheck, Quote, Star } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { IMAGE_WIDTH, storageImage } from '../lib/image';

interface Review {
  id: string;
  rating: number;
  title?: string;
  body?: string;
  mediaUrls?: string[];
  verified?: boolean;
  user?: { name?: string; image?: string | null };
  product?: { name?: string; slug?: string; images?: Array<{ url: string }> };
}

/**
 * Homepage reviews: one card per review — quote, stars, words, the reviewer,
 * and the product it is about (photo + name, linking to that product).
 * A photo the customer attached leads the card; nothing is drawn for a missing
 * avatar or photo.
 */
export function HomeReviewsCarousel({ reviews }: { reviews: Review[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const visibleReviews = reviews.filter((review) => review.rating > 0).slice(0, 10);
  const average = useMemo(
    () => visibleReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / Math.max(visibleReviews.length, 1),
    [visibleReviews]
  );

  useEffect(() => {
    if (paused || visibleReviews.length < 3) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => scrollReviews(1), 5000);
    return () => window.clearInterval(timer);
  }, [paused, visibleReviews.length]);

  if (visibleReviews.length === 0) return null;

  function scrollReviews(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    const item = track.querySelector<HTMLElement>('[data-review-item]');
    const step = item ? item.offsetWidth + 16 : Math.min(track.clientWidth, 380);
    const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 8;
    track.scrollTo({ left: direction > 0 && atEnd ? 0 : track.scrollLeft + direction * step, behavior: 'smooth' });
  }

  return (
    <section className="border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
      <div className="px-4 py-10 sm:px-6 md:py-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
              What customers say
            </h2>
            <p className="mt-2 inline-flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
              <RatingStars rating={average} size={16} />
              {average.toFixed(1)} from {reviews.length} review{reviews.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {visibleReviews.length > 1 && (
              <div className="hidden gap-2 sm:flex">
                <button type="button" className="mo-arrow" onClick={() => scrollReviews(-1)} aria-label="Previous review">
                  <ArrowLeft size={18} />
                </button>
                <button type="button" className="mo-arrow" onClick={() => scrollReviews(1)} aria-label="Next review">
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
            <Link
              href="/reviews"
              className="inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-2 text-xs font-black uppercase tracking-wide transition hover:bg-white sm:text-sm"
              style={{ borderColor: 'var(--border-color)', color: 'var(--color-primary)' }}
            >
              All reviews <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div
          ref={trackRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="mo-slider flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
        >
          {visibleReviews.map((review) => {
            const photo = review.mediaUrls?.[0];
            const productImage = review.product?.images?.[0]?.url;
            const productHref = review.product?.slug ? `/products/${encodeURIComponent(review.product.slug)}` : null;

            return (
              <article key={review.id} data-review-item className="review-card snap-start">
                {photo && (
                  <div className="-mx-5 -mt-5 mb-4 aspect-[4/3] overflow-hidden rounded-t-2xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <img src={storageImage(photo, IMAGE_WIDTH.card)} alt="Customer photo" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  </div>
                )}

                <div className="flex items-start justify-between gap-3">
                  <Quote size={30} strokeWidth={0} fill="currentColor" style={{ color: 'var(--color-accent)' }} aria-hidden="true" />
                  <RatingStars rating={review.rating || 5} size={16} />
                </div>

                {review.title && (
                  <h3 className="mt-3 line-clamp-2 text-lg font-black leading-snug" style={{ color: 'var(--text-primary)' }}>
                    {review.title}
                  </h3>
                )}
                {review.body && (
                  <p className="mt-2 line-clamp-4 text-[15px] leading-6" style={{ color: 'var(--text-secondary)' }}>
                    {review.body}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-2 text-sm">
                  {review.user?.image && (
                    <img src={review.user.image} alt="" className="h-7 w-7 rounded-full object-cover" referrerPolicy="no-referrer" />
                  )}
                  <span className="font-black" style={{ color: 'var(--text-primary)' }}>
                    {shortName(review.user?.name)}
                  </span>
                  {review.verified && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>
                      <BadgeCheck size={14} /> Verified buyer
                    </span>
                  )}
                </div>

                {productHref && review.product?.name && (
                  <Link href={productHref} className="review-product group">
                    {productImage && (
                      <span className="h-14 w-11 shrink-0 overflow-hidden rounded-md" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <img src={storageImage(productImage, IMAGE_WIDTH.thumb)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>Reviewed</span>
                      <span className="block truncate text-sm font-black" style={{ color: 'var(--text-primary)' }}>{review.product.name}</span>
                    </span>
                    <ArrowRight size={16} className="shrink-0 transition group-hover:translate-x-0.5" />
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** First two words of a name: "Srishti Dey", never a full legal name. */
function shortName(name?: string) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  return words.length ? words.slice(0, 2).join(' ') : 'Fly Free customer';
}

function RatingStars({ rating, size = 18 }: { rating: number; size?: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className="inline-flex gap-0.5" aria-label={`${filled} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={size}
          strokeWidth={2.2}
          fill={index < filled ? 'currentColor' : 'none'}
          style={{ color: index < filled ? 'var(--color-accent)' : 'color-mix(in srgb, var(--text-tertiary) 45%, transparent)' }}
        />
      ))}
    </span>
  );
}
