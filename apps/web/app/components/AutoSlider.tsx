'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Horizontal strip that advances on its own and loops back to the start.
 * Auto-advance pauses while the pointer is over the track so a reader is
 * never yanked away mid-card.
 */
export function AutoSlider({
  children,
  intervalMs = 4000,
  ariaLabel,
}: {
  children: React.ReactNode;
  intervalMs?: number;
  ariaLabel: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [canScroll, setCanScroll] = useState(false);

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
    if (!track || paused || !canScroll) return;

    const timer = setInterval(() => {
      const step = track.querySelector<HTMLElement>('[data-slide]')?.offsetWidth ?? 0;
      if (step === 0) return;

      const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 8;
      track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + step + 24, behavior: 'smooth' });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [paused, canScroll, intervalMs]);

  const nudge = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const step = track.querySelector<HTMLElement>('[data-slide]')?.offsetWidth ?? 320;
    track.scrollBy({ left: direction * (step + 24), behavior: 'smooth' });
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        aria-label={ariaLabel}
        className="flex gap-6 overflow-x-auto pb-2"
        style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}
      >
        {children}
      </div>

      {canScroll && (
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => nudge(-1)}
            aria-label="Previous"
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 transition hover:opacity-70"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => nudge(1)}
            aria-label="Next"
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 transition hover:opacity-70"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
