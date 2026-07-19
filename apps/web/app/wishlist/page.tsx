'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { getApiBaseUrl, readApiResponse } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

const API_BASE = getApiBaseUrl();

type WishlistItem = {
  id: string;
  productId: string;
  product?: {
    id: string;
    slug: string;
    name: string;
    price: number;
    mrp: number;
    images?: Array<{ url: string; alt?: string | null }>;
    theme?: { name: string } | null;
    category?: { name: string } | null;
  };
};

export default function WishlistPage() {
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      setLoading(false);
      return;
    }

    void loadWishlist();
  }, [hydrated, token]);

  async function loadWishlist() {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE}/ecommerce/wishlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data?.error || 'Failed to load wishlist');
      setItems(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(productId: string) {
    try {
      const response = await fetch(`${API_BASE}/ecommerce/wishlist/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data?.error || 'Failed to remove item');
      setItems((current) => current.filter((item) => item.productId !== productId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item');
    }
  }

  if (!hydrated || loading) {
    return (
      <main className="min-h-screen px-5 py-10">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="h-10 w-52 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => <div key={item} className="h-80 animate-pulse rounded bg-black/10 dark:bg-white/10" />)}
          </div>
        </div>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="min-h-screen px-5 py-16">
        <section className="mx-auto max-w-md rounded border p-6 text-center" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <Heart className="mx-auto text-coral" size={36} />
          <h1 className="mt-4 text-2xl font-black">Login to save favorites</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>You can browse freely, but wishlist is saved with your account.</p>
          <Link href="/auth/login" className="mt-5 inline-flex rounded px-5 py-3 font-black text-white" style={{ backgroundColor: 'var(--color-primary)' }}>Login / Register</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-coral">Saved styles</p>
            <h1 className="text-3xl font-black">My Wishlist</h1>
          </div>
          <Link href="/products" className="inline-flex items-center gap-2 rounded border px-4 py-2 font-bold" style={{ borderColor: 'var(--border-color)' }}>
            <ShoppingBag size={17} /> Continue shopping
          </Link>
        </div>

        {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-4 font-bold text-red-700">{error}</div>}

        {items.length === 0 ? (
          <div className="rounded border p-8 text-center" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <p className="font-black">No saved products yet.</p>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Add products to wishlist from product details.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const product = item.product;
              if (!product) return null;
              return (
                <article key={item.id} className="overflow-hidden rounded border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                  <Link href={`/products/${product.slug}`} className="block aspect-[4/5] bg-black/[0.04]">
                    {product.images?.[0]?.url ? <img src={product.images[0].url} alt={product.images[0].alt || product.name} className="h-full w-full object-cover" /> : null}
                  </Link>
                  <div className="space-y-3 p-4">
                    <div>
                      <p className="text-xs font-black uppercase text-coral">{product.theme?.name || product.category?.name || 'Fly Free'}</p>
                      <Link href={`/products/${product.slug}`} className="font-black hover:text-coral">{product.name}</Link>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-black">Rs {Math.round(product.price / 100)}</p>
                      <button onClick={() => removeItem(product.id)} className="rounded border border-red-200 p-2 text-red-600" aria-label="Remove from wishlist">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
