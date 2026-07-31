'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Instagram } from 'lucide-react';

interface InstagramPost {
  id: string;
  imageUrl?: string;
  caption: string;
  instagramLink: string;
}

export function InstagramFeedCarousel({ posts }: { posts: InstagramPost[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        setCanScrollLeft(scrollRef.current.scrollLeft > 0);
        setCanScrollRight(
          scrollRef.current.scrollLeft < scrollRef.current.scrollWidth - scrollRef.current.clientWidth - 10
        );
      }
    };

    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      checkScroll();

      // Auto-scroll every 5 seconds
      const autoScroll = setInterval(() => {
        if (container.scrollLeft >= container.scrollWidth - container.clientWidth - 10) {
          // Reset to start with smooth scroll
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          // Scroll by one item width
          const itemWidth = container.querySelector('[data-carousel-item]')?.clientWidth || 0;
          if (itemWidth > 0) {
            container.scrollBy({ left: itemWidth + 16, behavior: 'smooth' });
          }
        }
      }, 5000);

      return () => {
        container.removeEventListener('scroll', checkScroll);
        clearInterval(autoScroll);
      };
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const itemWidth = scrollRef.current.querySelector('[data-carousel-item]')?.clientWidth || 0;
      const scrollAmount = itemWidth + 16;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:py-20" style={{ borderBottom: '2px solid var(--border-color)' }}>
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
            <Instagram size={16} /> Follow us
          </div>
          <h2 className="mt-3 text-4xl font-black uppercase leading-tight sm:text-5xl">@flyfree_styles</h2>
        </div>
        <a
          href="https://instagram.com/flyfree"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide"
          style={{ color: 'var(--color-primary)' }}
        >
          View all <ChevronRight size={18} />
        </a>
      </div>

      <div className="relative">
        {/* Carousel Container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth"
          style={{ scrollBehavior: 'smooth', scrollSnapType: 'x mandatory' }}
        >
          {posts.map((post) => (
            <a
              key={post.id}
              href={post.instagramLink}
              target="_blank"
              rel="noopener noreferrer"
              data-carousel-item
              className="group relative flex-shrink-0 overflow-hidden rounded-lg border transition hover:shadow-lg"
              style={{
                width: '300px',
                height: '400px',
                borderColor: 'var(--border-color)',
                scrollSnapAlign: 'start'
              }}
            >
              {/* Image */}
              {post.imageUrl ? (
                <img
                  src={post.imageUrl}
                  alt={post.caption}
                  className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                />
              ) : (
                <div
                  className="h-full w-full flex items-center justify-center text-4xl"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  📸
                </div>
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-4">
                <p className="text-white text-sm font-bold line-clamp-2">{post.caption}</p>
                <p className="mt-2 text-xs text-white/80">View on Instagram →</p>
              </div>
            </a>
          ))}
        </div>

        {/* Left Scroll Button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 md:-translate-x-16 flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:scale-110"
            style={{ backgroundColor: 'var(--color-primary)' }}
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {/* Right Scroll Button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 md:translate-x-16 flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:scale-110"
            style={{ backgroundColor: 'var(--color-primary)' }}
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

    </section>
  );
}
