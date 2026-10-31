'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

/**
 * Every horizontal row on the homepage — products, themes, hampers, reviews,
 * creators, Instagram — is this component. One header line (title, arrows,
 * View all) and one auto-scrolling track. Auto-advance pauses on hover, while
 * the row is off screen, and entirely for people who ask for reduced motion.
 *
 * Children must each carry `data-rail-item` so the auto-advance can measure a
 * single step.
 */
export function Rail({
  title,
  viewAllHref,
  viewAllLabel = 'View all',
  external = false,
  embedded = false,
  intervalMs = 4000,
  children
}: {
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  external?: boolean;
  embedded?: boolean;
  intervalMs?: number;
  children: ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [canScroll, setCanScroll] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [calm, setCalm] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setCalm(query.matches);
    const update = () => setCalm(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.4 });
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => setCanScroll(track.scrollWidth > track.clientWidth + 8);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [children]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || paused || !canScroll || !onScreen || calm) return;

    const timer = setInterval(() => {
      const step = stepWidth(track);
      if (!step) return;
      const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 8;
      track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + step, behavior: 'smooth' });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [paused, canScroll, onScreen, calm, intervalMs]);

  const nudge = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * (stepWidth(track) || 320), behavior: 'smooth' });
  };

  return (
    <section className={embedded ? '' : 'border-b'} style={{ borderColor: 'var(--border-color)' }}>
      <div className={embedded ? '' : 'px-4 py-10 sm:px-6 md:py-14'}>
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2
            className="text-xl font-black uppercase tracking-tight sm:text-3xl"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </h2>
          <div className="flex shrink-0 items-center gap-2">
          {canScroll && (
            <div className="hidden gap-2 sm:flex">
              <button type="button" className="mo-arrow" onClick={() => nudge(-1)} aria-label={`Scroll ${title} left`}>
                <ArrowLeft size={18} />
              </button>
              <button type="button" className="mo-arrow" onClick={() => nudge(1)} aria-label={`Scroll ${title} right`}>
                <ArrowRight size={18} />
              </button>
            </div>
          )}
          {viewAllHref &&
            (external ? (
              <a
                href={viewAllHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-2 text-xs font-black uppercase tracking-wide transition hover:bg-white sm:text-sm"
                style={{ borderColor: 'var(--border-color)', color: 'var(--color-primary)' }}
              >
                {viewAllLabel} <ArrowRight size={14} />
              </a>
            ) : (
              <Link
                href={viewAllHref}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-2 text-xs font-black uppercase tracking-wide transition hover:bg-white sm:text-sm"
                style={{ borderColor: 'var(--border-color)', color: 'var(--color-primary)' }}
              >
                {viewAllLabel} <ArrowRight size={14} />
              </Link>
            ))}
          </div>
        </div>

        <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div ref={trackRef} className="mo-slider flex gap-3 overflow-x-auto px-0.5 py-2 sm:gap-5">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

/** One card plus the gap between cards. */
function stepWidth(track: HTMLElement) {
  const item = track.querySelector<HTMLElement>('[data-rail-item]');
  if (!item) return 0;
  const gap = parseFloat(getComputedStyle(track).columnGap || '0') || 0;
  return item.offsetWidth + gap;
}
