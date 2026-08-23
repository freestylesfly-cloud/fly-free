'use client';

import { ArrowRight, CheckCircle2, Heart, Minus, Plus, Ruler, Share2, Shirt, ShoppingCart, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { formatCurrency } from '../lib/utils';
import { getApiBaseUrl, readApiResponse } from '../lib/api';
import { trackEvent } from '../lib/analytics';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image?: string | null;
  hoverImage?: string | null;
  images?: Array<{ url?: string | null; alt?: string | null }>;
  variants?: Array<{
    id?: string;
    size?: string | null;
    color?: string | null;
    price?: number | null;
    inventory?: { stock?: number | null } | null;
  }>;
  tag?: string;
  slug: string;
  originalPrice?: number;
}

export function ProductCard({ id, name, price, image, hoverImage, images = [], variants = [], tag, slug, originalPrice }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [quickSize, setQuickSize] = useState('');
  const [quickColor, setQuickColor] = useState('');
  const [quantity, setQuantity] = useState(1);
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
  const imageList = (images.length ? images : [{ url: image }, { url: hoverImage }])
    .map((item) => item?.url)
    .filter(Boolean) as string[];
  const selectedImage = imageList[selectedImageIndex] || image || undefined;
  const selectedHoverImage = hoverImage && hoverImage !== selectedImage ? hoverImage : imageList.find((url) => url !== selectedImage);
  const availableVariants = useMemo(
    () => variants.filter((variant) => Number(variant.inventory?.stock ?? 0) > 0),
    [variants]
  );
  const sizeOptions = useMemo(
    () => uniqueValues(variants.map((variant) => variant.size || '').filter(Boolean)),
    [variants]
  );
  const colorOptions = useMemo(
    () => uniqueValues(variants.map((variant) => variant.color || '').filter((color) => color && color.toLowerCase() !== 'default')),
    [variants]
  );
  const selectedVariant =
    variants.find((variant) => variant.size === quickSize && (!quickColor || variant.color === quickColor) && Number(variant.inventory?.stock ?? 0) > 0) ||
    variants.find((variant) => variant.size === quickSize && (!quickColor || variant.color === quickColor));
  const selectedStock = Number(selectedVariant?.inventory?.stock ?? 0);
  const selectedPrice = Math.round(Number(selectedVariant?.price || price * 100) / 100);
  const soldOut = variants.length > 0 && availableVariants.length === 0;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setPortalReady(true);
    imageList.slice(0, 5).forEach((url) => {
      if (!url) return;
      const preload = new window.Image();
      preload.src = url;
    });
  }, [imageList.join('|')]);

  useEffect(() => {
    if (!quickAddOpen) return;
    const firstAvailable = availableVariants[0] || variants[0];
    setQuickSize(firstAvailable?.size || sizeOptions[0] || '');
    const firstVisibleColor = firstAvailable?.color?.toLowerCase() === 'default' ? '' : firstAvailable?.color;
    setQuickColor(firstVisibleColor || colorOptions[0] || '');
    setQuantity(1);
  }, [quickAddOpen, availableVariants, variants, sizeOptions, colorOptions]);

  useEffect(() => {
    if (!quickAddOpen || !quickColor || sizeOptions.length === 0) return;
    const currentIsAvailable = variants.some(
      (variant) =>
        variant.size === quickSize &&
        variant.color === quickColor &&
        Number(variant.inventory?.stock ?? 0) > 0
    );
    if (currentIsAvailable) return;
    const nextSize = variants.find(
      (variant) => variant.color === quickColor && Number(variant.inventory?.stock ?? 0) > 0
    )?.size;
    if (nextSize) setQuickSize(nextSize);
  }, [quickAddOpen, quickColor, quickSize, sizeOptions.length, variants]);

  useEffect(() => {
    if (selectedStock > 0 && quantity > selectedStock) setQuantity(selectedStock);
  }, [quantity, selectedStock]);

  const handleOpenQuickAdd = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (soldOut) {
      toast.error('Sold out', { description: name });
      return;
    }
    setQuickAddOpen(true);
  };

  const handleAddToCart = (event?: React.MouseEvent) => {
    event?.preventDefault();
    event?.stopPropagation();
    if (sizeOptions.length > 0 && !quickSize) {
      toast.error('Choose a size first', { description: name });
      return;
    }
    const savedColor = quickColor || selectedVariant?.color || 'Default';
    if (colorOptions.length > 0 && !quickColor) {
      toast.error('Choose a color first', { description: name });
      return;
    }
    if (variants.length > 0 && (!selectedVariant || selectedStock <= 0)) {
      toast.error('Selected option is out of stock', { description: name });
      return;
    }

    setIsAdding(true);
    addItem({
      productId: id,
      productName: name,
      price: selectedPrice,
      quantity,
      size: quickSize || 'One size',
      color: savedColor,
      image: selectedImage || undefined,
      productSlug: slug,
      variantId: selectedVariant?.id || '',
      maxStock: selectedStock > 0 ? selectedStock : undefined,
    });
    trackEvent('add_to_cart', {
      productId: id,
      productSlug: slug,
      metadata: { source: 'product_card_quick_add', price: selectedPrice, quantity, size: quickSize, color: savedColor }
    });
    toast.success('Added to cart', { description: name });
    setQuickAddOpen(false);
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
      toast(isWishlisted ? 'Removed from wishlist' : 'Saved to wishlist', { description: name });
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
        toast('Product link copied', { description: name });
        window.setTimeout(() => setShareText('Share'), 1200);
      }
    } catch {
      setShareText('Share');
    }
  };

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded border bg-white shadow-[0_6px_18px_rgba(0,0,0,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_38px_rgba(0,0,0,0.13)]"
      style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-secondary)' }}
    >
      <Link href={`/products/${slug}`} className="block">
        <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          {selectedImage ? (
            <>
              <img src={selectedImage} alt={name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105 group-hover:opacity-0" />
              {selectedHoverImage && (
                <img src={selectedHoverImage} alt={`${name} alternate view`} className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-700 group-hover:scale-105 group-hover:opacity-100" />
              )}
            </>
          ) : (
            <Shirt size={52} strokeWidth={1.5} style={{ color: 'var(--text-tertiary)' }} />
          )}
          <div className="absolute left-2 top-2 flex max-w-[calc(100%-4rem)] flex-wrap gap-1">
            {tag && (
              <span
                className="px-2 py-1 text-[9px] font-black uppercase tracking-wide shadow-sm"
                style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              >
                {tag}
              </span>
            )}
            {discountPercent > 0 && (
              <span
                className="px-2 py-1 text-[9px] font-black uppercase tracking-wide text-white shadow-sm"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {discountPercent}% off
              </span>
            )}
          </div>
        </div>
      </Link>
      <div className="absolute right-2 top-2 z-10 flex flex-col gap-1.5 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={handleWishlist}
          disabled={wishlistLoading}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:scale-105 disabled:opacity-50"
          style={{ color: isWishlisted ? 'var(--color-primary)' : 'var(--text-primary)' }}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="hidden h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:scale-105 sm:flex"
          style={{ color: 'var(--text-primary)' }}
          aria-label="Share product"
          title={shareText}
        >
          <Share2 size={16} />
        </button>
      </div>

      <div className="flex min-h-[132px] flex-1 flex-col p-2.5 sm:min-h-[158px] sm:p-3">
        {imageList.length > 1 && (
          <div className="mb-2 hidden h-7 gap-1.5 overflow-x-auto scrollbar-clean sm:flex" aria-label="Product image choices">
            {imageList.slice(0, 5).map((url, index) => (
              <button
                key={`${url}-${index}`}
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setSelectedImageIndex(index);
                }}
                onMouseEnter={() => setSelectedImageIndex(index)}
                className="h-7 w-7 shrink-0 overflow-hidden rounded-sm border transition hover:-translate-y-0.5"
                style={{ borderColor: selectedImageIndex === index ? 'var(--color-primary)' : 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}
                aria-label={`Show image ${index + 1}`}
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <Link href={`/products/${slug}`}>
          <h3 className="min-h-9 text-[13px] font-black uppercase leading-tight line-clamp-2 sm:min-h-10 sm:text-sm" style={{ color: 'var(--text-primary)' }}>{name}</h3>
        </Link>

        <div className="mt-2 flex items-start justify-between gap-2">
          <div>
            <p className="text-base font-black sm:text-lg" style={{ color: 'var(--text-primary)' }}>{formatCurrency(price)}</p>
            {hasDiscount && <p className="text-[11px] font-bold line-through" style={{ color: 'var(--text-tertiary)' }}>{formatCurrency(originalPrice!)}</p>}
          </div>
          {sizeOptions.length > 0 && (
            <p className="max-w-20 truncate border px-1.5 py-1 text-right text-[9px] font-black uppercase sm:max-w-24" style={{ borderColor: 'var(--border-light)', color: 'var(--text-tertiary)' }}>
              {sizeOptions.slice(0, 3).join(' / ')}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleOpenQuickAdd}
          disabled={isAdding || soldOut}
          className="mt-auto flex w-full items-center justify-center gap-2 rounded-sm px-3 py-2 text-[11px] font-black uppercase tracking-wide text-white transition hover:opacity-90 disabled:opacity-80 sm:py-2.5 sm:text-xs"
          style={{ backgroundColor: soldOut ? 'var(--text-tertiary)' : 'var(--color-primary)' }}
        >
          {isAdding ? <CheckCircle2 size={15} /> : <ShoppingCart size={15} />}
          {soldOut ? 'Sold out' : isAdding ? 'Added' : 'Add'}
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

      {portalReady && createPortal(
        <AnimatePresence>
          {quickAddOpen && (
            <QuickAddPanel
              name={name}
              price={selectedPrice}
              originalPrice={originalPrice}
              imageList={imageList}
              selectedImageIndex={selectedImageIndex}
              setSelectedImageIndex={setSelectedImageIndex}
              slug={slug}
              sizeOptions={sizeOptions}
              colorOptions={colorOptions}
              variants={variants}
              selectedSize={quickSize}
              setSelectedSize={setQuickSize}
              selectedColor={quickColor}
              setSelectedColor={setQuickColor}
              quantity={quantity}
              setQuantity={setQuantity}
              stock={selectedStock}
              canAdd={variants.length === 0 || Boolean(selectedVariant && selectedStock > 0)}
              isAdding={isAdding}
              onAdd={handleAddToCart}
              onClose={() => setQuickAddOpen(false)}
              onWishlist={handleWishlist}
              wishlistLoading={wishlistLoading}
              isWishlisted={isWishlisted}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </article>
  );
}

function QuickAddPanel({
  name,
  price,
  originalPrice,
  imageList,
  selectedImageIndex,
  setSelectedImageIndex,
  slug,
  sizeOptions,
  colorOptions,
  variants,
  selectedSize,
  setSelectedSize,
  selectedColor,
  setSelectedColor,
  quantity,
  setQuantity,
  stock,
  canAdd,
  isAdding,
  onAdd,
  onClose,
  onWishlist,
  wishlistLoading,
  isWishlisted,
}: {
  name: string;
  price: number;
  originalPrice?: number;
  imageList: string[];
  selectedImageIndex: number;
  setSelectedImageIndex: (index: number) => void;
  slug: string;
  sizeOptions: string[];
  colorOptions: string[];
  variants: ProductCardProps['variants'];
  selectedSize: string;
  setSelectedSize: (value: string) => void;
  selectedColor: string;
  setSelectedColor: (value: string) => void;
  quantity: number;
  setQuantity: (value: number) => void;
  stock: number;
  canAdd: boolean;
  isAdding: boolean;
  onAdd: (event?: React.MouseEvent) => void;
  onClose: () => void;
  onWishlist: (event: React.MouseEvent) => void;
  wishlistLoading: boolean;
  isWishlisted: boolean;
}) {
  const activeImage = imageList[selectedImageIndex] || imageList[0];
  const hasDiscount = Boolean(originalPrice) && Number(originalPrice) > price;

  return (
    <motion.div
      className="fixed inset-0 z-[75] flex items-end bg-black/30 backdrop-blur-[2px] sm:items-center sm:justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="scrollbar-clean relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:mr-3 sm:max-w-md sm:rounded-2xl"
        style={{ color: 'var(--text-primary)' }}
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-4" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="text-xl font-black">Select options</h3>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border hover:bg-black/5" style={{ borderColor: 'var(--border-color)' }} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-4">
          <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-4">
            <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
              {activeImage ? <img src={activeImage} alt={name} className="aspect-[4/5] h-full w-full object-cover" /> : <div className="flex aspect-[4/5] items-center justify-center"><Shirt size={36} /></div>}
            </div>
            <div className="min-w-0">
              <p className="line-clamp-2 text-base font-black">{name}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xl font-black">{formatCurrency(price)}</span>
                {hasDiscount && <span className="text-sm line-through" style={{ color: 'var(--text-tertiary)' }}>{formatCurrency(originalPrice!)}</span>}
              </div>
              <p className="mt-2 text-xs font-bold" style={{ color: stock > 0 ? 'var(--color-primary)' : 'var(--text-secondary)' }}>
                {variants?.length ? (stock > 0 ? `${stock} in stock` : 'Choose an available option') : 'Ready to add'}
              </p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={onWishlist} disabled={wishlistLoading} className="flex h-10 w-10 items-center justify-center rounded-full border disabled:opacity-50" style={{ borderColor: 'var(--border-color)', color: isWishlisted ? 'var(--color-primary)' : 'var(--text-primary)' }} aria-label="Save">
                  <Heart size={17} fill={isWishlisted ? 'currentColor' : 'none'} />
                </button>
                <Link href={`/products/${slug}`} className="inline-flex h-10 items-center gap-2 rounded-full border px-4 text-xs font-black" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                  More details <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {imageList.length > 1 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-clean">
              {imageList.slice(0, 6).map((url, index) => (
                <button key={`${url}-${index}`} type="button" onClick={() => setSelectedImageIndex(index)} className="h-16 w-14 shrink-0 overflow-hidden rounded-xl border p-0.5 transition hover:-translate-y-0.5" style={{ borderColor: selectedImageIndex === index ? 'var(--color-primary)' : 'var(--border-color)' }} aria-label={`View image ${index + 1}`}>
                  <img src={url} alt="" className="h-full w-full rounded-lg object-cover" />
                </button>
              ))}
            </div>
          )}

          {colorOptions.length > 0 && (
            <OptionGroup title="Color" value={selectedColor || 'Select'}>
              {colorOptions.map((color) => (
                <button key={color} type="button" onClick={() => setSelectedColor(color)} className="rounded-full border px-4 py-2 text-sm font-black transition hover:-translate-y-0.5" style={{ borderColor: selectedColor === color ? 'var(--color-primary)' : 'var(--border-color)', backgroundColor: selectedColor === color ? 'color-mix(in srgb, var(--color-primary) 10%, white)' : 'white' }}>
                  {color}
                </button>
              ))}
            </OptionGroup>
          )}

          {sizeOptions.length > 0 && (
            <OptionGroup title="Size" value={selectedSize || 'Select'}>
              <Link href={`/products/${slug}`} className="ml-auto inline-flex items-center gap-1 text-xs font-black" style={{ color: 'var(--color-primary)' }}>
                <Ruler size={14} /> Size chart
              </Link>
              {sizeOptions.map((size) => {
                const variant = variants?.find((item) => item.size === size && (!selectedColor || item.color === selectedColor));
                const available = Number(variant?.inventory?.stock ?? 0) > 0;
                return (
                  <button key={size} type="button" onClick={() => available && setSelectedSize(size)} disabled={!available} className="min-w-12 rounded-xl border px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35" style={{ borderColor: selectedSize === size ? 'var(--color-primary)' : 'var(--border-color)', backgroundColor: selectedSize === size ? 'var(--color-primary)' : 'white', color: selectedSize === size ? 'white' : 'var(--text-primary)' }}>
                    {size}
                  </button>
                );
              })}
            </OptionGroup>
          )}

          <div className="mt-5 flex items-center justify-between rounded-2xl border p-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
            <span className="text-sm font-black">Quantity</span>
            <div className="flex items-center rounded-full border bg-white p-1" style={{ borderColor: 'var(--border-color)' }}>
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5" aria-label="Decrease"><Minus size={16} /></button>
              <span className="min-w-10 text-center text-sm font-black">{quantity}</span>
              <button type="button" onClick={() => setQuantity(stock > 0 ? Math.min(stock, quantity + 1) : quantity + 1)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5 disabled:opacity-40" aria-label="Increase" disabled={stock > 0 && quantity >= stock}><Plus size={16} /></button>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 grid grid-cols-[1fr_1.25fr] gap-3 border-t bg-white px-4 py-3" style={{ borderColor: 'var(--border-color)', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <Link href={`/products/${slug}`} className="flex min-h-12 items-center justify-center rounded-full border text-sm font-black" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
            More details
          </Link>
          <button type="button" onClick={onAdd} disabled={!canAdd || isAdding} className="flex min-h-12 items-center justify-center gap-2 rounded-full text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-50" style={{ backgroundColor: canAdd ? 'var(--color-primary)' : 'var(--border-color)' }}>
            {isAdding ? <CheckCircle2 size={17} /> : <Plus size={17} />} Add to cart
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function OptionGroup({ title, value, children }: { title: string; value: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center gap-2">
        <p className="text-sm font-black">{title}</p>
        <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>{value}</span>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
