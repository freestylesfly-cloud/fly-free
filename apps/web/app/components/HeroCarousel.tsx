'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { HERO_MAX_WIDTH, MEDIA } from '../lib/design';

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
 * Banners are authored as a single 16:9 crop in the admin, so the frame stays
 * 16:9 at every width — phone and desktop show exactly the same picture area.
 * The stage is width-capped rather than height-capped, because capping height
 * on a fixed ratio is what re-introduces cropping.
 */
const HERO_ASPECT = MEDIA.themeBanner.css;

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      setActive(idx);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      const next = Math.round(el.scrollLeft / el.clientWidth) + 1;
      el.scrollTo({ left: next >= slides.length ? 0 : next * el.clientWidth, behavior: 'smooth' });
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goto = (idx: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' });
  };

  const step = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const next = Math.min(Math.max(active + dir, 0), slides.length - 1);
    goto(next);
  };

  if (slides.length === 0) return null;

  return (
    <section className="relative overflow-hidden" style={{ borderBottom: '2px solid var(--border-color)' }}>
      <div className="relative mx-auto w-full" style={{ maxWidth: `${HERO_MAX_WIDTH}px` }}>
        <div ref={trackRef} className="mo-slider flex w-full overflow-x-auto" style={{ scrollBehavior: 'smooth' }}>
          {slides.map((slide) => (
            <div key={slide.id} className="mo-slide relative w-full flex-shrink-0">
              <div className="relative w-full overflow-hidden" style={{ aspectRatio: HERO_ASPECT }}>
                {slide.image ? (
                  <>
                    <img src={slide.image} alt={slide.title || ''} className="absolute inset-0 h-full w-full object-cover" />
                    {/* The overlay only exists where the copy sits on top of the art. */}
                    <div
                      className="absolute inset-0 hidden sm:block"
                      style={{ background: 'linear-gradient(0deg, rgba(0,0,0,.6), rgba(0,0,0,.05) 60%)' }}
                    />
                  </>
                ) : (
                  <div className="absolute inset-0" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
                )}

                {(slide.title || slide.subtitle) && (
                  <div className="absolute inset-0 z-10 hidden max-w-2xl flex-col justify-center gap-4 px-8 sm:flex">
                    <SlideCopy slide={slide} onDark />
                  </div>
                )}
              </div>

              {/* Below the frame on phones, so the banner itself is never covered. */}
              {(slide.title || slide.subtitle) && (
                <div
                  className="flex flex-col gap-3 px-5 py-6 sm:hidden"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <SlideCopy slide={slide} />
                </div>
              )}
            </div>
          ))}
        </div>

        {slides.length > 1 && (
          // Pinned to the media frame, not the slide, so the controls stay on
          // the banner once the copy moves below it on phones.
          <div className="pointer-events-none absolute inset-x-0 top-0" style={{ aspectRatio: HERO_ASPECT }}>
            <div className="pointer-events-auto absolute bottom-6 right-6 z-10 hidden gap-3 sm:flex">
              <button type="button" className="mo-arrow" style={{ borderColor: '#fff', color: '#fff' }} onClick={() => step(-1)} aria-label="Previous slide">
                &#8592;
              </button>
              <button type="button" className="mo-arrow" style={{ borderColor: '#fff', color: '#fff' }} onClick={() => step(1)} aria-label="Next slide">
                &#8594;
              </button>
            </div>
            <div className="pointer-events-auto absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2 sm:bottom-7 sm:left-6 sm:translate-x-0">
              {slides.map((slide, idx) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goto(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className="h-3 w-3 rounded-full transition"
                  style={{
                    border: '2px solid #fff',
                    backgroundColor: active === idx ? '#fff' : 'rgba(0,0,0,.25)'
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function SlideCopy({ slide, onDark = false }: { slide: HeroSlide; onDark?: boolean }) {
  return (
    <>
      {slide.tag && (
        <span
          className="w-max px-3 py-1 text-xs font-black uppercase tracking-wide"
          style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
        >
          {slide.tag}
        </span>
      )}
      {slide.title && (
        <h1
          className="font-black uppercase leading-[0.9]"
          style={{
            fontSize: onDark ? 'clamp(36px, 5vw, 72px)' : 'clamp(28px, 8vw, 40px)',
            letterSpacing: '-0.02em',
            color: onDark ? '#fff' : 'var(--text-primary)'
          }}
        >
          {slide.title}
        </h1>
      )}
      {slide.subtitle && (
        <p
          className="max-w-md text-sm leading-relaxed sm:text-lg"
          style={{ color: onDark ? 'rgba(255,255,255,.85)' : 'var(--text-secondary)' }}
        >
          {slide.subtitle}
        </p>
      )}
      {slide.ctaLabel && slide.ctaHref && (
        <Link
          href={slide.ctaHref}
          className="w-max px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:opacity-90 sm:px-7 sm:py-4"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          {slide.ctaLabel}
        </Link>
      )}
    </>
  );
}
