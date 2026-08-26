'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Image as ImageIcon, Play, Volume2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatCurrency } from '../lib/utils';

export type CommunityProduct = {
  id: string;
  name: string;
  slug: string;
  price?: number | null;
  images?: Array<{ url?: string | null }>;
};

export type CommunityPost = {
  id: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  caption: string;
  instagramLink?: string | null;
  products?: CommunityProduct[];
};

export function ShoppableCommunityMedia({
  posts,
  title = 'Shop the community live',
  intro,
  instagramHref,
  limit,
  splitImages = false,
}: {
  posts: CommunityPost[];
  title?: string;
  intro?: string;
  instagramHref?: string | null;
  limit?: number;
  splitImages?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const shownPosts = useMemo(() => posts.filter((post) => post.videoUrl || post.imageUrl).slice(0, limit || posts.length), [posts, limit]);
  const videoPosts = shownPosts.filter((post) => post.videoUrl);
  const imagePosts = shownPosts.filter((post) => !post.videoUrl && post.imageUrl);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activePost = activeIndex == null ? null : shownPosts[activeIndex];

  useEffect(() => {
    if (activeIndex == null) return;
    document.body.style.overflow = 'hidden';
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setActiveIndex(null);
      if (event.key === 'ArrowLeft') move(-1);
      if (event.key === 'ArrowRight') move(1);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeIndex]);

  if (shownPosts.length === 0) return null;

  function openPost(post: CommunityPost) {
    setActiveIndex(shownPosts.findIndex((item) => item.id === post.id));
  }

  function move(direction: -1 | 1) {
    if (activeIndex == null) return;
    setActiveIndex((activeIndex + direction + shownPosts.length) % shownPosts.length);
  }

  function scrollTrack(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    const item = track.querySelector<HTMLElement>('[data-community-item]');
    const step = item ? item.offsetWidth + 24 : 320;
    track.scrollBy({ left: direction * step, behavior: 'smooth' });
  }

  return (
    <section className="border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'color-mix(in srgb, var(--color-primary) 5%, var(--bg-primary))' }}>
      <div className="px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-black tracking-tight sm:text-5xl" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          {intro && <p className="mt-3 text-sm font-bold sm:text-base" style={{ color: 'var(--text-secondary)' }}>{intro}</p>}
        </div>

        <div className="relative mx-auto mt-8 max-w-[1540px]">
          <div ref={trackRef} className="scrollbar-clean flex snap-x snap-mandatory gap-4 overflow-x-auto px-2 pb-4 sm:gap-6 sm:px-8">
            {(splitImages ? videoPosts : shownPosts).map((post) => (
              <button
                key={post.id}
                type="button"
                data-community-item
                onClick={() => openPost(post)}
                className="group relative h-[420px] w-[72vw] max-w-[300px] shrink-0 snap-center overflow-hidden rounded-lg bg-black text-left shadow-lg transition hover:-translate-y-1 hover:shadow-2xl sm:h-[500px] sm:w-[280px]"
              >
                <PostMedia post={post} preview />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/10" />
                <span className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-black/45 text-white backdrop-blur">
                  {post.videoUrl ? <Play size={18} fill="currentColor" /> : <ImageIcon size={18} />}
                </span>
                {post.products?.[0] && (
                  <span className="absolute inset-x-3 bottom-3 rounded bg-white/95 p-3 text-black shadow-lg">
                    <span className="line-clamp-1 text-sm font-black">{post.products[0].name}</span>
                    <span className="mt-1 block text-xs font-bold text-black/60">
                      {post.products.length > 1 ? `${post.products.length} products tagged` : 'Tap to shop'}
                    </span>
                  </span>
                )}
              </button>
            ))}
          </div>

          <button type="button" onClick={() => scrollTrack(-1)} className="community-float-arrow left-2" aria-label="Scroll media left">
            <ArrowLeft size={22} />
          </button>
          <button type="button" onClick={() => scrollTrack(1)} className="community-float-arrow right-2" aria-label="Scroll media right">
            <ArrowRight size={22} />
          </button>
        </div>

        {splitImages && imagePosts.length > 0 && (
          <div className="mx-auto mt-10 max-w-7xl">
            <h3 className="text-lg font-black uppercase" style={{ color: 'var(--text-primary)' }}>Photo posts</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {imagePosts.map((post) => (
                <button key={post.id} type="button" onClick={() => openPost(post)} className="group relative aspect-[4/5] overflow-hidden rounded-lg bg-black shadow-sm">
                  <PostMedia post={post} preview />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/64 via-transparent to-transparent opacity-80" />
                  <p className="absolute inset-x-0 bottom-0 line-clamp-2 p-3 text-left text-sm font-black text-white">{post.caption}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {activePost && (
        <div className="fixed inset-0 z-[1000] isolate overflow-y-auto bg-black/90 text-white" role="dialog" aria-modal="true" aria-label="Community post viewer" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setActiveIndex(null);
        }}>
          <button type="button" onClick={() => setActiveIndex(null)} className="absolute right-4 top-4 z-30 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/70 text-white shadow-lg backdrop-blur transition hover:bg-white hover:text-black" aria-label="Close media viewer" title="Close viewer">
            <X size={24} />
          </button>
          <button type="button" onClick={() => move(-1)} className="absolute left-3 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white text-black" aria-label="Previous media">
            <ArrowLeft size={22} />
          </button>
          <button type="button" onClick={() => move(1)} className="absolute right-3 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white text-black" aria-label="Next media">
            <ArrowRight size={22} />
          </button>

          <div className="grid min-h-full place-items-center px-4 py-12 sm:px-10">
            <div className="relative flex w-full max-w-6xl items-center justify-center">
              {shownPosts.length > 1 && (
                <>
                  <div className="pointer-events-none absolute left-[5%] hidden aspect-[9/16] w-[24%] max-w-[300px] -rotate-6 overflow-hidden rounded-lg bg-black opacity-40 blur-[1px] lg:block">
                    <PostMedia post={shownPosts[(activeIndex! - 1 + shownPosts.length) % shownPosts.length]} preview />
                  </div>
                  <div className="pointer-events-none absolute right-[5%] hidden aspect-[9/16] w-[24%] max-w-[300px] rotate-6 overflow-hidden rounded-lg bg-black opacity-40 blur-[1px] lg:block">
                    <PostMedia post={shownPosts[(activeIndex! + 1) % shownPosts.length]} preview />
                  </div>
                </>
              )}
              <div className="relative z-10 aspect-[9/16] max-h-[82svh] w-full max-w-[430px] overflow-hidden rounded-lg bg-black shadow-2xl ring-1 ring-white/15">
                <PostMedia post={activePost} active />
                {activePost.videoUrl && (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-black uppercase text-black">
                    <Volume2 size={14} /> Sound on
                  </span>
                )}
              </div>

              {activePost.products && activePost.products.length > 0 && (
                <div className="absolute bottom-0 left-1/2 z-20 w-[min(92vw,620px)] -translate-x-1/2 translate-y-[calc(100%+16px)] rounded-xl border border-white/15 bg-black/75 p-3 shadow-2xl backdrop-blur sm:p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xs font-black uppercase tracking-wide text-white">Tagged products</h3>
                    <span className="text-[10px] font-bold text-white/55">Tap to view details</span>
                  </div>
                  <div className="scrollbar-clean mt-2 flex gap-2 overflow-x-auto pb-1">
                    {activePost.products.map((product) => (
                      <Link key={product.id} href={`/products/${product.slug}`} className="flex w-52 shrink-0 items-center gap-2 rounded-lg bg-white p-2 text-left text-black transition hover:-translate-y-0.5 hover:shadow-lg">
                        <span className="h-14 w-11 shrink-0 overflow-hidden rounded bg-black/5">
                          {product.images?.[0]?.url && <img src={product.images[0].url} alt={product.name} className="h-full w-full object-cover" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block line-clamp-2 text-xs font-black leading-tight">{product.name}</span>
                          {product.price != null && <span className="mt-1 block text-xs font-bold text-black/55">{formatCurrency(Math.round(Number(product.price) / 100))}</span>}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function PostMedia({ post, preview = false, active = false }: { post: CommunityPost; preview?: boolean; active?: boolean }) {
  if (post.videoUrl) {
    return (
      <video
        key={`${post.id}-${active ? 'active' : 'preview'}`}
        src={post.videoUrl}
        poster={post.imageUrl || undefined}
        className="h-full w-full object-cover"
        autoPlay
        muted={preview}
        loop={preview}
        controls={active}
        playsInline
        preload={active ? 'auto' : 'metadata'}
      />
    );
  }

  return <img src={post.imageUrl || ''} alt={post.caption} className="h-full w-full object-cover" />;
}
