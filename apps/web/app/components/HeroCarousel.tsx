'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export interface HeroSlide {
  id: string;
  image?: string | null;
  tag?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

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
      <div ref={trackRef} className="mo-slider flex w-full overflow-x-auto" style={{ scrollBehavior: 'smooth' }}>
        {slides.map((slide) => (
          <div key={slide.id} className="mo-slide relative flex-shrink-0 w-full" style={{ height: 'min(68vh, 680px)' }}>
            {slide.image ? (
              <div className="absolute inset-0">
                <img src={slide.image} alt={slide.title || ''} className="h-full w-full object-cover" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, rgba(0,0,0,.55), rgba(0,0,0,.1) 60%)' }} />
              </div>
            ) : (
              <div className="absolute inset-0" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
            )}
            {(slide.title || slide.subtitle) && (
              <div className="relative z-10 flex h-full max-w-2xl flex-col justify-center gap-5 px-6 py-16 sm:px-8">
                {slide.tag && (
                  <span
                    className="w-max text-xs font-black uppercase tracking-wide px-3 py-1"
                    style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
                  >
                    {slide.tag}
                  </span>
                )}
                {slide.title && (
                  <h1
                    className="font-black uppercase leading-[0.9] text-white"
                    style={{ fontSize: 'clamp(40px, 6vw, 88px)', letterSpacing: '-0.02em' }}
                  >
                    {slide.title}
                  </h1>
                )}
                {slide.subtitle && (
                  <p className="max-w-md text-base sm:text-lg leading-relaxed text-white/85">{slide.subtitle}</p>
                )}
                {slide.ctaLabel && slide.ctaHref && (
                  <Link
                    href={slide.ctaHref}
                    className="w-max px-7 py-4 text-sm font-bold uppercase tracking-wide text-white transition hover:opacity-90"
                    style={{ backgroundColor: 'var(--color-primary)' }}
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
          <div className="absolute bottom-6 right-6 z-10 hidden gap-3 sm:flex">
            <button type="button" className="mo-arrow" style={{ borderColor: '#fff', color: '#fff' }} onClick={() => step(-1)} aria-label="Previous slide">
              &#8592;
            </button>
            <button type="button" className="mo-arrow" style={{ borderColor: '#fff', color: '#fff' }} onClick={() => step(1)} aria-label="Next slide">
              &#8594;
            </button>
          </div>
          <div className="absolute bottom-7 left-6 z-10 flex gap-2">
            {slides.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goto(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className="h-3 w-3 rounded-full transition"
                style={{
                  border: '2px solid #fff',
                  backgroundColor: active === idx ? '#fff' : 'transparent'
                }}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
