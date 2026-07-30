'use client';

import { useRef } from 'react';
import type { ReactNode } from 'react';

interface HorizontalSliderProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export function HorizontalSlider({ title, action, children }: HorizontalSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(700, el.clientWidth * 0.85), behavior: 'smooth' });
  };

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tight leading-none" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h2>
        <div className="flex items-center gap-3">
          {action}
          <button type="button" className="mo-arrow" onClick={() => scroll(-1)} aria-label={`Scroll ${title} left`}>
            &#8592;
          </button>
          <button type="button" className="mo-arrow" onClick={() => scroll(1)} aria-label={`Scroll ${title} right`}>
            &#8594;
          </button>
        </div>
      </div>
      <div ref={trackRef} className="mo-slider flex gap-5 overflow-x-auto pb-3">
        {children}
      </div>
    </div>
  );
}
