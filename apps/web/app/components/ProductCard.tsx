'use client';

import { Heart, Share2, Shirt, ShoppingCart, X, Star, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '../lib/utils';
import { useCartStore } from '../stores/cartStore';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { getApiBaseUrl, readApiResponse } from '../lib/api';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image?: string;
  hoverImage?: string;
  tag?: string;
  slug: string;
  rating?: number;
  reviewCount?: number;
  isTrending?: boolean;
  originalPrice?: number;
}

export function ProductCard({
  id,
  name,
  price,
  image,
  hoverImage,
  tag,
  slug,
  rating = 4.8,
  reviewCount = 0,
  isTrending = false,
  originalPrice
}: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [shareText, setShareText] = useState('Share');
  const [showAddedAnimation, setShowAddedAnimation] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const token = useAuthStore((state) => state.token);

  const discountPercent = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setShowAddedAnimation(true);
    addItem({
      productId: id,
      productName: name,
      price,
      quantity: 1,
      size: 'M',
      color: 'Black',
      image,
    });
    setTimeout(() => {
      setIsAdding(false);
      setShowAddedAnimation(false);
    }, 1500);
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
        setShareText('Copied!');
        setTimeout(() => setShareText('Share'), 1200);
      }
    } catch {
      setShareText('Share');
    }
  };

  return (
    <article
      className="group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)'
      }}
    >
      {/* Tag Badges */}
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
        {tag && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wide shadow-md backdrop-blur-sm"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-primary) 90%, transparent)',
              color: '#fff'
            }}
          >
            {tag}
          </span>
        )}
        {isTrending && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wide shadow-md"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-primary) 85%, transparent)',
              color: '#fff'
            }}
          >
            <TrendingUp size={12} />
            Trending
          </span>
        )}
        {discountPercent > 0 && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wide shadow-md"
            style={{
              backgroundColor: '#dc2626',
              color: '#fff'
            }}
          >
            -{discountPercent}%
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleWishlist}
          disabled={wishlistLoading}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition hover:scale-110 disabled:opacity-50 backdrop-blur-sm"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '2px solid var(--border-color)',
            color: isWishlisted ? 'var(--color-primary)' : 'var(--text-primary)'
          }}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition hover:scale-110 backdrop-blur-sm"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '2px solid var(--border-color)',
            color: 'var(--text-primary)'
          }}
          aria-label="Share product"
          title={shareText}
        >
          <Share2 size={18} />
        </button>
      </div>

      {/* Product Image */}
      <Link href={`/products/${slug}`}>
        <div className="relative flex aspect-[3/4] cursor-pointer items-center justify-center overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          {image ? (
            <>
              <img
                src={image}
                alt={name}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
              />
              {hoverImage && hoverImage !== image && (
                <img
                  src={hoverImage}
                  alt={`${name} alternate view`}
                  className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100 group-hover:scale-110"
                />
              )}
            </>
          ) : (
            <Shirt size={64} strokeWidth={1.5} style={{ color: 'var(--text-tertiary)' }} />
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
        </div>
      </Link>

      {/* Product Details */}
      <div className="flex flex-col gap-3 p-4 md:p-5">
        {/* Rating */}
        {reviewCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  fill={i < Math.floor(rating) ? 'var(--color-primary)' : 'var(--border-color)'}
                  style={{ color: 'var(--color-primary)' }}
                />
              ))}
            </div>
            <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
              {rating} ({reviewCount})
            </span>
          </div>
        )}

        {/* Product Name */}
        <Link href={`/products/${slug}`}>
          <h3
            className="min-h-10 cursor-pointer text-sm md:text-base font-bold leading-tight transition line-clamp-2 hover:opacity-80"
            style={{ color: 'var(--text-primary)' }}
          >
            {name}
          </h3>
        </Link>

        {/* Pricing */}
        <div className="flex items-baseline gap-2">
          <span className="text-xl md:text-2xl font-black" style={{ color: 'var(--color-primary)' }}>
            {formatCurrency(price)}
          </span>
          {originalPrice && originalPrice > price && (
            <span className="text-xs md:text-sm font-bold line-through" style={{ color: 'var(--text-secondary)' }}>
              {formatCurrency(originalPrice)}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={isAdding}
          className="relative w-full py-3 md:py-3.5 text-xs md:text-sm font-black uppercase tracking-wide transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden group/btn"
          style={{
            backgroundColor: isAdding ? 'var(--color-primary)' : 'var(--color-primary)',
            color: 'white',
            opacity: isAdding ? 0.8 : 1,
            transform: showAddedAnimation ? 'scale(0.95)' : 'scale(1)'
          }}
        >
          <ShoppingCart size={16} className={isAdding ? 'animate-spin' : ''} />
          <span className="relative">
            {isAdding ? 'Adding to cart...' : 'Add to Cart'}
            {showAddedAnimation && (
              <span className="absolute inset-0 flex items-center justify-center text-xs">
                ✓ Added!
              </span>
            )}
          </span>
        </button>
      </div>

      {/* Login Prompt */}
      {showLoginPrompt && (
        <div className="absolute inset-x-4 bottom-20 rounded-xl p-4 shadow-xl backdrop-blur-sm z-20" style={{ backgroundColor: 'var(--bg-secondary)', border: '2px solid var(--border-color)' }}>
          <button type="button" onClick={() => setShowLoginPrompt(false)} className="absolute -right-2 -top-2" aria-label="Close login prompt">
            <X size={18} className="p-1 rounded-full" style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }} />
          </button>
          <p className="pr-5 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>💚 Save to Wishlist</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>Login to keep track of your favorite items</p>
          <Link href={`/auth/login?redirect=/products/${slug}`} className="mt-3 inline-flex px-4 py-2 text-xs font-black text-white hover:opacity-90 transition" style={{ backgroundColor: 'var(--color-primary)' }}>
            Login Now
          </Link>
        </div>
      )}
    </article>
  );
}
