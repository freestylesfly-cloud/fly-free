'use client';

import { MessageCircle, Sparkles, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getApiBaseUrl } from '../lib/api';
import { formatCurrency } from '../lib/utils';

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  mrp?: number | null;
  isTrending?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  category?: { name?: string | null };
  theme?: { name?: string | null };
  images?: Array<{ url?: string | null }>;
};

type RecentProduct = {
  id: string;
  name: string;
  slug: string;
  image?: string;
  theme?: string;
  category?: string;
};

const API_BASE = getApiBaseUrl();
const RECENT_KEY = 'flyfree_recent_products';

export function StyleAssistant() {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [recent, setRecent] = useState<RecentProduct[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      setRecent(raw ? JSON.parse(raw) : []);
    } catch {
      setRecent([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open || products.length > 0) return;
    let cancelled = false;

    async function loadProducts() {
      const response = await fetch(`${API_BASE}/catalog/products`, { cache: 'no-store' }).catch(() => null);
      if (!response?.ok || cancelled) return;
      const payload = await response.json().catch(() => null);
      const items = Array.isArray(payload) ? payload : payload?.data || [];
      if (!cancelled) setProducts(items.filter((item: Product) => item?.slug).slice(0, 18));
    }

    void loadProducts();
    return () => {
      cancelled = true;
    };
  }, [open, products.length]);

  const recommended = useMemo(() => {
    const recentThemes = new Set(recent.map((item) => item.theme).filter(Boolean));
    const recentCategories = new Set(recent.map((item) => item.category).filter(Boolean));
    const recentIds = new Set(recent.map((item) => item.id));

    return products
      .filter((product) => !recentIds.has(product.id))
      .sort((a, b) => {
        const aMatch = Number(recentThemes.has(a.theme?.name || '') || recentCategories.has(a.category?.name || ''));
        const bMatch = Number(recentThemes.has(b.theme?.name || '') || recentCategories.has(b.category?.name || ''));
        const aRank = aMatch * 3 + Number(Boolean(a.isTrending)) * 2 + Number(Boolean(a.isFeatured || a.isNewArrival));
        const bRank = bMatch * 3 + Number(Boolean(b.isTrending)) * 2 + Number(Boolean(b.isFeatured || b.isNewArrival));
        return bRank - aRank;
      })
      .slice(0, 4);
  }, [products, recent]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_18px_40px_rgba(37,99,235,0.34)] transition hover:shadow-[0_22px_54px_rgba(37,99,235,0.42)] md:bottom-6 md:right-6"
        style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-tertiary))' }}
        aria-label="Open style assistant"
      >
        <MessageCircle size={24} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] bg-black/35 backdrop-blur-[2px]" onClick={() => setOpen(false)}>
          <aside
            className="absolute bottom-0 right-0 flex max-h-[92svh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl md:bottom-4 md:right-4 md:rounded-2xl"
            style={{ color: 'var(--text-primary)' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b p-4" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <p className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
                  <Sparkles size={14} /> Fly Free assist
                </p>
                <h2 className="mt-1 text-xl font-black">Find your next fit</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full border" style={{ borderColor: 'var(--border-color)' }} aria-label="Close assistant">
                <X size={18} />
              </button>
            </div>

            <div className="scrollbar-clean space-y-5 overflow-y-auto p-4">
              {recent.length > 0 && (
                <section>
                  <h3 className="text-xs font-black uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Recently viewed</h3>
                  <div className="mt-3 grid gap-2">
                    {recent.slice(0, 3).map((item) => (
                      <Link key={item.id} href={`/products/${item.slug}`} onClick={() => setOpen(false)} className="grid grid-cols-[56px_1fr] gap-3 rounded-lg border p-2 transition hover:bg-black/[0.02]" style={{ borderColor: 'var(--border-color)' }}>
                        <MediaThumb src={item.image} name={item.name} />
                        <span className="min-w-0">
                          <span className="line-clamp-1 text-sm font-black">{item.name}</span>
                          <span className="mt-1 block text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{item.theme || item.category || 'Fly Free'}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h3 className="text-xs font-black uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                  {recent.length ? 'Based on your browsing' : 'Trending picks'}
                </h3>
                <div className="mt-3 grid gap-2">
                  {recommended.length ? recommended.map((product) => (
                    <Link key={product.id} href={`/products/${product.slug}`} onClick={() => setOpen(false)} className="grid grid-cols-[64px_1fr_auto] items-center gap-3 rounded-lg border p-2 transition hover:bg-black/[0.02]" style={{ borderColor: 'var(--border-color)' }}>
                      <MediaThumb src={product.images?.[0]?.url || undefined} name={product.name} />
                      <span className="min-w-0">
                        <span className="line-clamp-1 text-sm font-black">{product.name}</span>
                        <span className="mt-1 block text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{product.theme?.name || product.category?.name || 'Recommended'}</span>
                      </span>
                      <span className="text-sm font-black" style={{ color: 'var(--color-primary)' }}>{formatCurrency(Math.round(Number(product.price || 0) / 100))}</span>
                    </Link>
                  )) : (
                    <div className="rounded-lg border p-4 text-sm font-bold" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                      Open a few products and I will start building better picks.
                    </div>
                  )}
                </div>
              </section>

              <div className="grid grid-cols-2 gap-2">
                <Link href="/products?sort=trending" onClick={() => setOpen(false)} className="rounded-lg border px-4 py-3 text-center text-xs font-black uppercase" style={{ borderColor: 'var(--border-color)', color: 'var(--color-primary)' }}>
                  Trending
                </Link>
                <Link href="/help-faq" onClick={() => setOpen(false)} className="rounded-lg border px-4 py-3 text-center text-xs font-black uppercase" style={{ borderColor: 'var(--border-color)', color: 'var(--color-primary)' }}>
                  Need help
                </Link>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function MediaThumb({ src, name }: { src?: string; name: string }) {
  return (
    <span className="block aspect-[4/5] overflow-hidden rounded-md" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-lg font-black" style={{ color: 'var(--color-primary)' }}>
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}
