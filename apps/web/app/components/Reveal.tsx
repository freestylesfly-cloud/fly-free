'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Reveals its children when they scroll into view.
 *
 * The page already had a `.fly-reveal` class, but it is a plain mount-time
 * animation: it fires when the element is parsed, so everything below the fold had
 * finished animating before anyone scrolled to it. This watches the viewport
 * instead, which is the whole point of the effect.
 *
 * Deliberately a thin client wrapper rather than framer-motion's `whileInView`:
 * the homepage sections are Server Components, and children passed through this
 * boundary stay server-rendered. Converting them to client components to get one
 * fade would ship the whole homepage to the browser.
 *
 * Once revealed it stays revealed — re-animating on every scroll past is the thing
 * that makes these effects tiresome by the second visit.
 */
export function Reveal({
  children,
  delay = 0,
  className = '',
  as: Tag = 'div'
}: {
  children: React.ReactNode;
  /** Milliseconds, for staggering a row of cards. */
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'li';
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // No IntersectionObserver (or reduced motion): show it and skip the effect
    // rather than leaving content invisible.
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      // Fires a little before the element is fully on screen, so the motion has
      // finished by the time it is properly in view.
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      data-revealed={shown ? 'true' : 'false'}
      className={`fly-in ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
