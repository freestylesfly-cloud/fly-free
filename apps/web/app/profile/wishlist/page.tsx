'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Loader2, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface WishlistItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    /** False once an admin deactivates the product. The row stays saved. */
    isVisible?: boolean;
    images?: Array<{ url: string }>;
  };
}

export default function WishlistPage() {
  const token = useAuthStore((state) => state.token);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    loadWishlist();
  }, [token]);

  async function loadWishlist() {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/ecommerce/wishlist', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : data.data || []);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function removeFromWishlist(productId: string) {
    try {
      setRemoving(productId);
      const res = await fetch(`/api/ecommerce/wishlist/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setItems(items.filter((item) => item.productId !== productId));
      }
    } catch {
      // Keep the item visible if deletion fails.
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#1f1f1f] md:text-3xl">Saved Items</h1>
        <p className="mt-2 text-sm text-[#666]">Products you liked are kept here for quick checkout later.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-[#f04423]" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/15 bg-[#fafafa] px-6 py-14 text-center">
          <Heart className="mx-auto mb-4 h-10 w-10 text-[#999]" />
          <h2 className="text-lg font-black text-[#1f1f1f]">No saved items</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-[#666]">Tap the heart on a product to keep it in your profile.</p>
          <Link href="/products" className="mt-5 inline-flex rounded-md bg-[#f04423] px-5 py-3 text-sm font-black text-white transition hover:bg-[#d93618]">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            // Deactivated after it was saved: the card stays so the customer can
            // see why, but nothing on it leads to a product page that 404s.
            const unavailable = item.product.isVisible === false;

            return (
              <article key={item.id} className="overflow-hidden rounded-lg border border-black/10 bg-[#fafafa] transition hover:border-[#f04423]/40 hover:bg-white">
                {unavailable ? (
                  <div className="relative block aspect-square bg-[#f0eee9]">
                    {item.product.images?.[0]?.url ? (
                      <img src={item.product.images[0].url} alt={item.product.name} className="h-full w-full object-cover grayscale" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[#888]">No image</div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                      <span className="rounded bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[#1f1f1f]">
                        Unavailable
                      </span>
                    </div>
                  </div>
                ) : (
                  <Link href={`/products/${item.product.slug}`} className="block aspect-square bg-[#f0eee9]">
                    {item.product.images?.[0]?.url ? (
                      <img src={item.product.images[0].url} alt={item.product.name} className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[#888]">No image</div>
                    )}
                  </Link>
                )}

                <div className="p-4">
                  {unavailable ? (
                    <p className="line-clamp-2 text-sm font-black text-[#888]">{item.product.name}</p>
                  ) : (
                    <Link href={`/products/${item.product.slug}`} className="line-clamp-2 text-sm font-black text-[#1f1f1f] hover:text-[#f04423]">
                      {item.product.name}
                    </Link>
                  )}
                  <p className={`mt-2 text-lg font-black ${unavailable ? 'text-[#888]' : 'text-[#1f1f1f]'}`}>
                    {formatRupees(normalizePrice(item.product.price))}
                  </p>
                  {unavailable && <p className="mt-1 text-xs font-bold text-[#888]">No longer sold.</p>}

                  <div className="mt-4 flex gap-2">
                    {unavailable ? (
                      <span className="flex-1 cursor-not-allowed rounded-md bg-black/10 px-3 py-2 text-center text-xs font-black text-[#888]">
                        Unavailable
                      </span>
                    ) : (
                      <Link href={`/products/${item.product.slug}`} className="flex-1 rounded-md bg-[#1f1f1f] px-3 py-2 text-center text-xs font-black text-white transition hover:bg-[#f04423]">
                        View Product
                      </Link>
                    )}
                    <button
                      onClick={() => removeFromWishlist(item.productId)}
                      disabled={removing === item.productId}
                      className="inline-flex w-10 items-center justify-center rounded-md border border-red-200 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      aria-label="Remove saved item"
                    >
                      {removing === item.productId ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function normalizePrice(value: number) {
  return value >= 10000 ? value / 100 : value;
}

function formatRupees(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
}
