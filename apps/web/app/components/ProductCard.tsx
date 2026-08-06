'use client';

import { Heart, Share2, Shirt, ShoppingCart, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { formatCurrency } from '../lib/utils';
import { getApiBaseUrl, readApiResponse } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image?: string | null;
  hoverImage?: string | null;
  tag?: string;
  slug: string;
  originalPrice?: number;
}

export function ProductCard({ id, name, price, image, hoverImage, tag, slug, originalPrice }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistError, setWishlistError] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [shareText, setShareText] = useState('Share');
  const addItem = useCartStore((state) => state.addItem);
  const token = useAuthStore((state) => state.token);
  // Kept a boolean on purpose: `originalPrice && ...` yields the number when the
  // MRP is 0, and JSX renders that 0 as a stray character next to the price.
  const hasDiscount = Boolean(originalPrice) && (originalPrice as number) > price;
  const discountPercent = hasDiscount ? Math.round(((originalPrice! - price) / originalPrice!) * 100) : 0;

  const handleAddToCart = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsAdding(true);
    addItem({
      productId: id,
      productName: name,
      price,
      quantity: 1,
      size: 'M',
      color: 'Black',
      image: image || undefined,
    });
    window.setTimeout(() => setIsAdding(false), 700);
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
      setWishlistError('');
      const response = await fetch(`${getApiBaseUrl()}/ecommerce/wishlist/${id}`, {
        method: isWishlisted ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      // Only a rejected session should send the user to login. Any other
      // failure is a real error and must not masquerade as "please log in".
      if (response.status === 401 || response.status === 403) {
        setShowLoginPrompt(true);
        return;
      }

      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data?.error || data?.message || 'Could not update wishlist');

      setIsWishlisted(!isWishlisted);
    } catch (error) {
      setWishlistError(error instanceof Error ? error.message : 'Could not update wishlist');
      window.setTimeout(() => setWishlistError(''), 3000);
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
        window.setTimeout(() => setShareText('Share'), 1200);
      }
    } catch {
      setShareText('Share');
    }
  };

  return (
    <article
      className="group relative h-full overflow-hidden border bg-white transition hover:shadow-lg"
      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
    >
      <Link href={`/products/${slug}`} className="block">
        <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          {image ? (
            <>
              <img src={image} alt={name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105 group-hover:opacity-0" />
              {hoverImage && hoverImage !== image && (
                <img src={hoverImage} alt={`${name} alternate view`} className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:scale-105 group-hover:opacity-100" />
              )}
            </>
          ) : (
            <Shirt size={52} strokeWidth={1.5} style={{ color: 'var(--text-tertiary)' }} />
          )}
          <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
            {tag && (
              <span
                className="px-2 py-1 text-[10px] font-black uppercase tracking-wide shadow-sm"
                style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              >
                {tag}
              </span>
            )}
            {discountPercent > 0 && (
              <span
                className="px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-sm"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {discountPercent}% off
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="space-y-3 p-3 md:p-4">
        <Link href={`/products/${slug}`}>
          <h3 className="min-h-10 text-sm font-black leading-snug line-clamp-2 md:text-base" style={{ color: 'var(--text-primary)' }}>{name}</h3>
        </Link>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{formatCurrency(price)}</p>
            {hasDiscount && <p className="text-xs line-through" style={{ color: 'var(--text-tertiary)' }}>{formatCurrency(originalPrice!)}</p>}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleWishlist}
              disabled={wishlistLoading}
              className="flex h-9 w-9 items-center justify-center border transition hover:bg-black/5 disabled:opacity-50"
              style={{ borderColor: 'var(--border-color)', color: isWishlisted ? 'var(--color-primary)' : 'var(--text-primary)' }}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="hidden h-9 w-9 items-center justify-center border transition hover:bg-black/5 sm:flex"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              aria-label="Share product"
              title={shareText}
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isAdding}
          className="flex w-full items-center justify-center gap-2 px-3 py-2.5 text-xs font-black uppercase tracking-wide text-white transition hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <ShoppingCart size={15} />
          {isAdding ? 'Added' : 'Add to cart'}
        </button>

        {wishlistError && (
          <p className="text-xs font-bold" style={{ color: 'var(--color-primary)' }}>
            {wishlistError}
          </p>
        )}
      </div>

      {showLoginPrompt && (
        <div className="absolute inset-x-3 bottom-3 border bg-white p-3 shadow-xl" style={{ borderColor: 'var(--border-color)' }}>
          <button type="button" onClick={() => setShowLoginPrompt(false)} className="absolute right-2 top-2" aria-label="Close login prompt">
            <X size={14} />
          </button>
          <p className="pr-5 text-sm font-black" style={{ color: 'var(--text-primary)' }}>Login to save wishlist</p>
          <p className="mt-1 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Cart works without login.</p>
          <Link href={`/auth/login?redirect=/products/${slug}`} className="mt-3 inline-flex px-3 py-2 text-xs font-black text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
            Login
          </Link>
        </div>
      )}
    </article>
  );
}
