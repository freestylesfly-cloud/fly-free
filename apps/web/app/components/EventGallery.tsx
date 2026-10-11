'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { IMAGE_WIDTH, storageImage } from '../lib/image';

/**
 * Event photos: a grid that opens into a full-screen viewer.
 *
 * The grid loads card-sized images lazily; the viewer asks for the large size
 * only for the photo actually being looked at. Arrow keys, Escape and a swipe
 * on phones all work, and the page behind stops scrolling while it is open.
 */
export function EventGallery({ photos, title }: { photos: string[]; title: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const touchStart = useRef<number | null>(null);
  const open = index !== null;

  const close = useCallback(() => setIndex(null), []);
  const step = useCallback(
    (by: 1 | -1) => setIndex((current) => (current === null ? current : (current + by + photos.length) % photos.length)),
    [photos.length]
  );

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close, step]);

  if (photos.length === 0) return null;

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
        {photos.map((url, i) => (
          <li
            key={url}
            // The first photo leads the grid at double size on wider screens.
            className={i === 0 && photos.length > 4 ? 'sm:col-span-2 sm:row-span-2' : ''}
          >
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="group relative block aspect-square w-full overflow-hidden rounded-xl"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
              aria-label={`Open photo ${i + 1} of ${photos.length}`}
            >
              <img
                src={storageImage(url, i === 0 && photos.length > 4 ? IMAGE_WIDTH.detail : IMAGE_WIDTH.card)}
                alt={`${title} — photo ${i + 1}`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>

      {open && (
        <div
          className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/90 p-3 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} photos`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
          onTouchStart={(event) => {
            touchStart.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            const start = touchStart.current;
            const end = event.changedTouches[0]?.clientX;
            touchStart.current = null;
            if (start === null || end === undefined || Math.abs(end - start) < 40) return;
            step(end < start ? 1 : -1);
          }}
        >
          <img
            key={photos[index]}
            src={storageImage(photos[index], IMAGE_WIDTH.hero)}
            alt={`${title} — photo ${index + 1}`}
            className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
          />

          <button type="button" onClick={close} aria-label="Close" className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25">
            <X size={20} />
          </button>
          {photos.length > 1 && (
            <>
              <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 sm:left-5">
                <ChevronLeft size={22} />
              </button>
              <button type="button" onClick={() => step(1)} aria-label="Next photo" className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 sm:right-5">
                <ChevronRight size={22} />
              </button>
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">
                {index + 1} / {photos.length}
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
}
