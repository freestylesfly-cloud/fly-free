'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, BadgeCheck, Star } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Review {
  id: string;
  rating: number;
  title?: string;
  body?: string;
  mediaUrls?: string[];
  user?: { name?: string };
  product?: { name?: string; slug?: string };
}

export function HomeReviewsCarousel({ reviews }: { reviews: Review[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const visibleReviews = reviews.filter((review) => review.rating > 0).slice(0, 10);
  const average = useMemo(
    () => visibleReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / Math.max(visibleReviews.length, 1),
    [visibleReviews]
  );

  useEffect(() => {
    if (paused || visibleReviews.length < 2) return;
    const timer = window.setInterval(() => scrollReviews(1), 3800);
    return () => window.clearInterval(timer);
  }, [paused, visibleReviews.length]);

  if (visibleReviews.length === 0) return null;

  function scrollReviews(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    const item = track.querySelector<HTMLElement>('[data-review-item]');
    const step = item ? item.offsetWidth + 24 : Math.min(track.clientWidth, 420);
    const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 8;
    track.scrollTo({ left: direction > 0 && atEnd ? 0 : track.scrollLeft + direction * step, behavior: 'smooth' });
  }

  return (
    <section className="border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
      <div className="px-4 py-12 sm:px-6 md:py-16">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: 'var(--color-primary)' }}>
            Customer love
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl" style={{ color: 'var(--text-primary)' }}>
            Let customers speak for us
          </h2>
          <div className="mt-4 flex justify-center">
            <RatingStars rating={average} size={24} />
          </div>
          <p className="mt-3 inline-flex items-center justify-center gap-2 text-sm font-bold sm:text-base" style={{ color: 'var(--text-secondary)' }}>
            From {reviews.length} review{reviews.length === 1 ? '' : 's'}
            <BadgeCheck size={18} style={{ color: 'var(--color-secondary)' }} />
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-7xl" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div
            ref={trackRef}
            className="scrollbar-clean flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-[8vw] pb-3 sm:gap-6 sm:px-[18vw] lg:px-[28vw]"
          >
            {visibleReviews.map((review) => {
              const href = review.product?.slug ? `/products/${review.product.slug}#reviews` : '/reviews';
              const image = review.mediaUrls?.[0];

              return (
                <Link
                  key={review.id}
                  href={href}
                  data-review-item
                  className="group flex w-[78vw] shrink-0 snap-center flex-col items-center text-center transition sm:w-[430px]"
                >
                  <RatingStars rating={review.rating || 5} size={22} />
                  <h3 className="mt-4 line-clamp-2 text-xl font-black leading-tight" style={{ color: 'var(--text-primary)' }}>
                    {review.title || review.product?.name || 'Beautiful fit'}
                  </h3>
                  {review.body && (
                    <p className="mt-3 line-clamp-3 min-h-[72px] text-base font-bold leading-6" style={{ color: 'var(--text-secondary)' }}>
                      {review.body}
                    </p>
                  )}
                  <p className="mt-7 text-sm font-bold" style={{ color: 'var(--text-tertiary)' }}>
                    {review.user?.name || 'Verified customer'}
                  </p>
                  <span className="mt-3 block h-16 w-16 overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-black/5">
                    {image ? (
                      <img src={image} alt={review.title || review.product?.name || 'Customer review'} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-lg font-black" style={{ color: 'var(--color-primary)' }}>
                        {(review.user?.name || 'F').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
                  {review.product?.name && (
                    <span className="mt-4 text-xs font-black uppercase tracking-wide opacity-0 transition group-hover:opacity-100" style={{ color: 'var(--color-primary)' }}>
                      Open {review.product.name}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {visibleReviews.length > 1 && (
            <div className="mt-6 flex justify-center gap-4">
              <button type="button" className="review-arrow" onClick={() => scrollReviews(-1)} aria-label="Previous review">
                <ArrowLeft size={24} />
              </button>
              <button type="button" className="review-arrow" onClick={() => scrollReviews(1)} aria-label="Next review">
                <ArrowRight size={24} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function RatingStars({ rating, size = 18 }: { rating: number; size?: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div className="flex justify-center gap-1.5" aria-label={`${filled} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={size}
          strokeWidth={2.4}
          fill={index < filled ? 'currentColor' : 'none'}
          style={{ color: index < filled ? 'var(--color-secondary)' : 'color-mix(in srgb, var(--text-tertiary) 45%, transparent)' }}
        />
      ))}
    </div>
  );
}
