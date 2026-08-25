'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MEDIA } from '../lib/design';

export interface HeroSlide {
  id: string;
  image?: string | null;
  tag?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

/**
 * Full-bleed theme banners.
 *
 * One 16:9 upload drives every screen. The frame is a fixed 16:9 at every
 * width — edge to edge, no max-width gutters, no height cap — so a 16:9 monitor
 * gets a hero that fills the viewport and a phone gets the complete picture
 * with nothing sliced off the sides.
 *
 * Copy is overlaid at the TOP on every breakpoint. That is the only band that
 * stays legible on a phone, where the frame is short.
 */
const HERO_ASPECT = MEDIA.themeBanner.css;

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => setActive(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const timer = setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      const next = Math.round(el.scrollLeft / el.clientWidth) + 1;
      el.scrollTo({ left: next >= slides.length ? 0 : next * el.clientWidth, behavior: 'smooth' });
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length, paused]);

  const goto = (idx: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' });
  };

  const step = (dir: 1 | -1) => goto(Math.min(Math.max(active + dir, 0), slides.length - 1));

  if (slides.length === 0) return null;

  return (
    <section
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div ref={trackRef} className="mo-slider flex w-full overflow-x-auto" style={{ scrollBehavior: 'smooth' }}>
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="mo-slide relative w-full flex-shrink-0 overflow-hidden"
            style={{ aspectRatio: HERO_ASPECT }}
          >
            {slide.image ? (
              <img src={slide.image} alt={slide.title || ''} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
            )}

            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(90deg, rgba(0,0,0,.72), rgba(0,0,0,.28) 46%, rgba(0,0,0,.04)), linear-gradient(0deg, rgba(0,0,0,.72), rgba(0,0,0,0) 56%)' }}
            />

            {(slide.title || slide.subtitle) && (
              <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-start gap-2 px-4 pb-7 sm:gap-4 sm:px-10 sm:pb-12 lg:px-16">
                {slide.tag && (
                  <span
                    className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white sm:px-3 sm:py-1 sm:text-xs"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    {slide.tag}
                  </span>
                )}
                {slide.title && (
                  <h1
                    className="max-w-4xl font-black uppercase leading-[0.92] text-white"
                    style={{ fontSize: 'clamp(24px, 7.5vw, 118px)', letterSpacing: '0' }}
                  >
                    {slide.title}
                  </h1>
                )}
                {/* Hidden on phones — the frame is short and the title carries it. */}
                <span className="fly-line" aria-hidden="true" />
                {slide.subtitle && (
                  <p className="hidden max-w-2xl text-base font-bold leading-relaxed text-white/90 sm:block sm:text-lg lg:text-xl">
                    {slide.subtitle}
                  </p>
                )}
                {slide.ctaLabel && slide.ctaHref && (
                  <Link
                    href={slide.ctaHref}
                    className="mt-2 rounded-lg bg-white px-6 py-2.5 text-xs font-black uppercase tracking-wide text-black transition hover:shadow-xl sm:px-9 sm:py-4 sm:text-sm"
                  >
                    {slide.ctaLabel}
                  </Link>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous slide"
            className="absolute left-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center border-2 border-white text-lg text-white transition hover:bg-white hover:text-black sm:flex lg:left-5"
          >
            &#8592;
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next slide"
            className="absolute right-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center border-2 border-white text-lg text-white transition hover:bg-white hover:text-black sm:flex lg:right-5"
          >
            &#8594;
          </button>

          <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-2 sm:bottom-6">
            {slides.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goto(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className="h-2.5 w-2.5 transition sm:h-3 sm:w-10"
                style={{
                  border: '2px solid #fff',
                  backgroundColor: active === idx ? '#fff' : 'rgba(0,0,0,.3)'
                }}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
