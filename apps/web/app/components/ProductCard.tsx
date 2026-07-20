'use client';

import { Heart, Share2, Shirt, ShoppingCart, X } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@flyfree/utils';
import { useCartStore } from '../stores/cartStore';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { getApiBaseUrl, readApiResponse } from '../lib/api';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image?: string;
  tag?: string;
  slug: string;
}

export function ProductCard({ id, name, price, image, tag, slug }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [shareText, setShareText] = useState('Share');
  const addItem = useCartStore((state) => state.addItem);
  const token = useAuthStore((state) => state.token);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAdding(true);
    addItem({
      productId: id,
      productName: name,
      price,
      quantity: 1,
      size: 'M',
      color: 'Black',
      image,
    });
    setTimeout(() => setIsAdding(false), 500);
  };

  const handleWishlist = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!token) {
      setShowLoginPrompt(true);
      return;
    }

    try {
      setWishlistLoading(true);
      const response = await fetch(`${getApiBaseUrl()}/ecommerce/wishlist/${id}`, {
        method: isWishlisted ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(data?.error || 'Wishlist update failed');
      }

      setIsWishlisted(!isWishlisted);
    } catch {
      setShowLoginPrompt(true);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleShare = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const url = `${window.location.origin}/products/${slug}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: name, text: `Check out ${name} on Fly Free`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareText('Copied');
        setTimeout(() => setShareText('Share'), 1200);
      }
    } catch {
      setShareText('Share');
    }
  };

  return (
    <article
      className="relative rounded-lg p-4 hover:shadow-lg transition-all hover:-translate-y-1"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
        borderWidth: '1px'
      }}
    >
      {/* Image */}
      <Link href={`/products/${slug}`}>
        <div
          className="mb-4 flex aspect-[4/5] items-center justify-center rounded-lg transition cursor-pointer"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover rounded-lg" />
          ) : (
            <Shirt size={54} strokeWidth={1.5} style={{ color: 'var(--text-tertiary)' }} />
          )}
        </div>
      </Link>
      <div className="absolute right-6 top-6 flex gap-2">
        <button
          type="button"
          onClick={handleWishlist}
          disabled={wishlistLoading}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition disabled:opacity-50"
          style={{ backgroundColor: 'var(--bg-secondary)', color: isWishlisted ? 'var(--color-primary)' : 'var(--text-primary)' }}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition"
          style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          aria-label="Share product"
          title={shareText}
        >
          <Share2 size={18} />
        </button>
      </div>

      {/* Tag */}
      {tag && <span className="text-xs font-black uppercase" style={{ color: 'var(--accent-primary)' }}>{tag}</span>}

      {/* Name */}
      <Link href={`/products/${slug}`}>
        <h3
          className="mt-2 min-h-12 text-lg font-black transition cursor-pointer line-clamp-2 hover:opacity-80"
          style={{ color: 'var(--text-primary)' }}
        >
          {name}
        </h3>
      </Link>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>{formatCurrency(price)}</span>
        <button
          onClick={handleAddToCart}
          disabled={isAdding}
          className="flex-1 rounded-lg px-3 py-2 text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'white'
          }}
        >
          <ShoppingCart size={16} />
          <span>{isAdding ? 'Adding...' : 'Add'}</span>
        </button>
      </div>
      {showLoginPrompt && (
        <div className="absolute inset-x-3 bottom-3 rounded-lg border p-3 shadow-xl" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <button type="button" onClick={() => setShowLoginPrompt(false)} className="absolute right-2 top-2" aria-label="Close login prompt">
            <X size={14} />
          </button>
          <p className="pr-5 text-sm font-black" style={{ color: 'var(--text-primary)' }}>Login to save wishlist</p>
          <p className="mt-1 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>You can browse and add to cart without login.</p>
          <Link href={`/auth/login?redirect=/products/${slug}`} className="mt-3 inline-flex rounded px-3 py-2 text-xs font-black text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
            Login
          </Link>
        </div>
      )}
    </article>
  );
}
