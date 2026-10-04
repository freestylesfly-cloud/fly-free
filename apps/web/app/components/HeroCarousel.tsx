'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Volume2, VolumeX } from 'lucide-react';
import { MEDIA } from '../lib/design';
import { IMAGE_WIDTH, storageImage } from '../lib/image';

export interface HeroSlide {
  id: string;
  image?: string | null;
  tag?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  /** The theme's song, from Admin → Product themes. */
  songUrl?: string | null;
  songTitle?: string | null;
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
  const audioRef = useRef<HTMLAudioElement>(null);
  // Off until the visitor asks: browsers block audio that starts on its own, and
  // an unannounced song is a reason to close the tab.
  const [soundOn, setSoundOn] = useState(false);

  const activeSong = slides[active]?.songUrl || null;
  const hasAnySong = slides.some((slide) => slide.songUrl);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => setActive(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Follow the visible slide: each theme plays its own song, a slide without one
  // is silent, and turning sound off stops playback outright.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!soundOn || !activeSong) {
      audio.pause();
      return;
    }
    if (audio.src !== new URL(activeSong, window.location.href).href) {
      audio.src = activeSong;
    }
    audio.play().catch(() => setSoundOn(false));
  }, [soundOn, activeSong]);

  useEffect(() => {
    // Don't cut a song off mid-play by sliding to the next theme.
    if (slides.length <= 1 || paused || soundOn) return;
    const timer = setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      const next = Math.round(el.scrollLeft / el.clientWidth) + 1;
      el.scrollTo({ left: next >= slides.length ? 0 : next * el.clientWidth, behavior: 'smooth' });
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length, paused, soundOn]);

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
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className="mo-slide relative w-full flex-shrink-0 overflow-hidden"
            style={{ aspectRatio: HERO_ASPECT }}
          >
            {slide.image ? (
              <img
                src={storageImage(slide.image, IMAGE_WIDTH.hero)}
                alt={slide.title || ''}
                decoding="async"
                className={`absolute inset-0 h-full w-full object-cover ${idx === active ? 'hero-kenburns' : ''}`}
              />
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
                    {/* Keyed on visibility so the words replay each time the slide comes round. */}
                    <span key={idx === active ? 'on' : 'off'} className="block">
                      {slide.title.split(/\s+/).map((word, wordIdx) => (
                        <span key={wordIdx} className="hero-word" style={{ animationDelay: `${wordIdx * 90}ms` }}>
                          {word}&nbsp;
                        </span>
                      ))}
                    </span>
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

      {hasAnySong && <audio ref={audioRef} loop preload="none" />}

      {activeSong && (
        <div className="absolute right-3 top-3 z-20 flex items-center gap-2 sm:right-6 sm:top-6">
          {soundOn && slides[active]?.songTitle && (
            <span className="hidden max-w-[220px] truncate rounded bg-black/55 px-2.5 py-1 text-xs font-bold text-white sm:block">
              ♪ {slides[active].songTitle}
            </span>
          )}
          <button
            type="button"
            onClick={() => setSoundOn((on) => !on)}
            aria-pressed={soundOn}
            aria-label={soundOn ? 'Mute theme song' : 'Play theme song'}
            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-black/40 text-white transition hover:bg-white hover:text-black sm:h-11 sm:w-11 ${soundOn ? '' : 'song-pulse'}`}
          >
            {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      )}

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
