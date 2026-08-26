'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  Info,
  Maximize2,
  Minus,
  PackageCheck,
  Plus,
  Ruler,
  Share2,
  Star,
  ShoppingCart,
  Truck,
  X,
  Copy,
  MessageCircle,
  Mail
} from 'lucide-react';
import SizeGuideDrawer from '../../components/SizeGuideDrawer';
import { formatCurrency } from '../../lib/utils';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { getApiBaseUrl } from '../../lib/api';
import { MEDIA } from '../../lib/design';
import { SITE_URL } from '../../lib/site';
import { ProductCard } from '../../components/ProductCard';
import { trackEvent } from '../../lib/analytics';

interface ProductDetailProps {
  params: Promise<{ slug: string }>;
}

type ProductImage = {
  id?: string;
  url: string;
  alt?: string | null;
  color?: string | null;
  priority?: number | null;
};

type Variant = {
  id: string;
  sku: string;
  size?: string | null;
  color?: string | null;
  price?: number | null;
  inventory?: {
    stock?: number | null;
  } | null;
};


const API_URL = getApiBaseUrl();
const DEFAULT_PRODUCT_WHATSAPP_MESSAGE = 'Check out {productName} at Fly Free! {url}';
const RECENT_PRODUCTS_KEY = 'flyfree_recent_products';

export default function ProductDetailPage({ params }: ProductDetailProps) {
  const { slug } = use(params);
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const addItem = useCartStore((state) => state.addItem);
  const [product, setProduct] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [hampers, setHampers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);
  const [selectedHamperId, setSelectedHamperId] = useState<string | null>(null);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [whatsappShareMessage, setWhatsappShareMessage] = useState(DEFAULT_PRODUCT_WHATSAPP_MESSAGE);

  const variants: Variant[] = useMemo(() => {
    if (!product?.variants) return [];
    return product.variants.map((variant: any) => ({
      ...variant,
      color: variant.color || product.variants[0]?.color,
      size: variant.size || product.variants[0]?.size
    }));
  }, [product]);

  const sizes = useMemo(() => uniqueValues(variants.map((v) => v.size)), [variants]);
  const images = useMemo(() => product ? normalizeImages(product.images, product.name) : [], [product]);
  const selectedHamper = useMemo(() => hampers.find((hamper: any) => hamper.id === selectedHamperId), [hampers, selectedHamperId]);
  const hamperImages = useMemo(() => normalizeHamperImages(selectedHamper), [selectedHamper]);
  const galleryImages = useMemo(() => (hamperImages.length ? [...hamperImages, ...images] : images), [hamperImages, images]);
  const activeImage = selectedImage || galleryImages[0];
  const activeImageIndex = Math.max(0, galleryImages.findIndex((image) => image.url === activeImage?.url));

  const selectedVariant = useMemo(
    () =>
      variants.find((v) => v.size === selectedSize && Number(v.inventory?.stock ?? 0) > 0) ||
      variants.find((v) => v.size === selectedSize),
    [variants, selectedSize]
  );

  const stock = selectedVariant?.inventory?.stock ?? 0;
  const canAdd = Boolean(selectedSize && selectedVariant && stock > 0);
  const visibleColor = displayColor(selectedVariant?.color || selectedColor);
  const productPrice = selectedVariant?.price || product?.price || product?.basePrice || 0;
  const productMrp = product?.mrp || product?.basePrice || productPrice;
  const hamperPrice = selectedHamper?.price || 0;
  const totalPrice = productPrice + hamperPrice;
  const discountPercent = product?.discountPercent || (productMrp > productPrice ? Math.round(((productMrp - productPrice) / productMrp) * 100) : 0);
  const reviewCount = product?.reviews?.length || 0;
  // The catalogue endpoint returns the approved reviews but not an aggregate,
  // so derive the average here rather than trusting an absent field.
  const averageRating =
    reviewCount > 0
      ? product.reviews.reduce((sum: number, review: any) => sum + Number(review.rating || 0), 0) / reviewCount
      : 0;
  const productUrl = `${SITE_URL}/products/${slug}`;

  useEffect(() => {
    async function fetchProductFlow() {
      try {
        setLoading(true);
        setError('');
        setProduct(null);
        setRecommendations([]);
        setRecommendationsLoading(false);

        const productResponse = await fetch(`${API_URL}/catalog/products/${slug}`, { cache: 'no-store' });

        if (!productResponse.ok) {
          throw new Error('This product could not be loaded right now.');
        }

        const productResponseData = await productResponse.json();
        const productData = productResponseData?.data || productResponseData;
        setProduct(productData);
        if (productData?.slug && productData.slug !== slug) {
          router.replace(`/products/${productData.slug}`);
        }

        if (productData.images?.length > 0) {
          setSelectedImage(normalizeImages(productData.images, productData.name)[0]);
        }

        if (productData?.variants?.length > 0) {
          const firstAvailable = productData.variants.find((variant: any) => Number(variant.inventory?.stock ?? 0) > 0) || productData.variants[0];
          if (firstAvailable?.size) setSelectedSize(firstAvailable.size);
          if (firstAvailable?.color) setSelectedColor(firstAvailable.color);
        }

        if (productData?.hampers?.length > 0) {
          setHampers(productData.hampers);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    }

    fetchProductFlow();
  }, [slug]);

  useEffect(() => {
    let cancelled = false;

    async function fetchShareSettings() {
      const homeResponse = await fetch(`${API_URL}/cms/home`, { cache: 'force-cache' }).catch(() => null);
      if (!homeResponse?.ok || cancelled) return;

      const homeData = await homeResponse.json().catch(() => null);
      const message = String(homeData?.settings?.whatsappMessage || '').trim();
      if (!cancelled) setWhatsappShareMessage(message || DEFAULT_PRODUCT_WHATSAPP_MESSAGE);
    }

    fetchShareSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!product?.id) return;
    let cancelled = false;

    async function fetchRecommendations() {
      setRecommendationsLoading(true);
      const similarProducts = await fetchSimilarProducts(product);
      if (!cancelled) {
        setRecommendations(similarProducts);
        setRecommendationsLoading(false);
      }
    }

    fetchRecommendations();
    return () => {
      cancelled = true;
    };
  }, [product?.id]);

  useEffect(() => {
    if (!product?.id || !token) return;
    checkWishlistStatus();
  }, [product?.id, token]);

  useEffect(() => {
    if (!product?.id) return;
    trackEvent('product_view', {
      productId: product.id,
      productSlug: product.slug || slug,
      metadata: {
        name: product.name,
        price: Math.round((product.price || product.basePrice || 0) / 100)
      }
    });
    rememberViewedProduct(product);
  }, [product?.id, product?.slug, product?.name, product?.price, product?.basePrice, slug]);

  useEffect(() => {
    setSelectedImage(galleryImages[0] || null);
  }, [galleryImages]);

  useEffect(() => {
    if (stock > 0 && quantity > stock) setQuantity(stock);
  }, [quantity, stock]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    galleryImages.slice(0, 6).forEach((image) => {
      if (!image?.url || image.url === activeImage?.url) return;
      const preload = new window.Image();
      preload.src = image.url;
    });
  }, [galleryImages, activeImage?.url]);

  async function checkWishlistStatus() {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/ecommerce/wishlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const wishlist = await response.json();
        const items = Array.isArray(wishlist) ? wishlist : wishlist?.data || [];
        setIsWishlisted(items.some((item: any) => item.productId === product.id || item.product?.id === product.id));
      }
    } catch (err) {
      console.error('Failed to check wishlist status:', err);
    }
  }

  function handleAddToCart() {
    if (!canAdd) return;
    addItem({
      productId: product.id,
      productName: product.name,
      variantId: selectedVariant?.id || '',
      quantity,
      price: Math.round(totalPrice / 100),
      color: selectedVariant?.color || selectedColor || 'Default',
      size: selectedSize,
      image: activeImage?.url || '',
      productSlug: product.slug || slug,
      maxStock: stock > 0 ? stock : undefined,
      hamperId: selectedHamperId || undefined,
      hamperName: selectedHamper?.name,
      offerCode: undefined
    });
    trackEvent('add_to_cart', {
      productId: product.id,
      productSlug: product.slug || slug,
      metadata: {
        source: 'product_detail',
        size: selectedSize,
        color: selectedVariant?.color || selectedColor || 'Default',
        quantity,
        hamperId: selectedHamperId || undefined,
        price: Math.round(totalPrice / 100)
      }
    });
    toast.success('Added to cart', { description: product.name });
  }

  function handleBuyNow() {
    if (!canAdd) return;
    handleAddToCart();
    router.push('/checkout');
  }

  async function handleWishlist() {
    if (!token) {
      toast('Login required', { description: 'Please login to save this product.' });
      return;
    }

    setWishlistLoading(true);
    try {
      const method = isWishlisted ? 'DELETE' : 'POST';
      const response = await fetch(`${API_URL}/ecommerce/wishlist/${product.id}`, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 401 || response.status === 403) {
        toast.error('Session expired', { description: 'Please login again to save this product.' });
        return;
      }

      // A failed request must say so rather than looking like nothing happened.
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || body?.error || 'Could not update wishlist');
      }

      setIsWishlisted(!isWishlisted);
      toast(isWishlisted ? 'Removed from wishlist' : 'Saved to wishlist', { description: product.name });
    } catch (err) {
      toast.error('Wishlist update failed', { description: err instanceof Error ? err.message : 'Could not update wishlist' });
    } finally {
      setWishlistLoading(false);
    }
  }

  function handleCopyLink() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    toast('Product link copied', { description: product.name });
    setTimeout(() => setCopySuccess(false), 2000);
  }

  function handleShareWhatsApp() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = whatsappShareMessage
      .replace(/\{productName\}/g, product.name)
      .replace(/\{url\}/g, url);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  function handleShareEmail() {
    const subject = `Check out: ${product.name}`;
    const body = `I found this product at Fly Free: ${product.name}\n\n${typeof window !== 'undefined' ? window.location.href : ''}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  async function openSizeChart() {
    setShowSizeChart(true);
  }

  function shiftImage(direction: -1 | 1) {
    if (galleryImages.length < 2) return;
    const currentIndex = galleryImages.findIndex((image) => image.url === activeImage?.url);
    const nextIndex = (currentIndex + direction + galleryImages.length) % galleryImages.length;
    setSelectedImage(galleryImages[nextIndex]);
  }

  if (loading) return <ProductSkeleton />;

  if (error || !product) {
    return (
      <main className="min-h-screen px-4 py-10" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-black">Product Not Found</h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>{error || 'This product could not be loaded.'}</p>
          <Link href="/products" className="mt-6 inline-block rounded px-6 py-2 text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>
            Back to Products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 pb-36 md:pb-10" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product, activeImage?.url, productUrl, totalPrice, averageRating, reviewCount, stock)) }}
      />
      {/* Product Hero */}
      <section className="mx-auto mb-10 grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_440px]">
        {/* Image Gallery */}
        <div className="h-fit lg:sticky lg:top-24">
          <div className="grid gap-3 lg:grid-cols-[88px_minmax(0,1fr)]">
            {galleryImages.length > 1 && (
              <div className="order-2 flex gap-3 overflow-x-auto pb-2 lg:order-1 lg:max-h-[calc(100vh-140px)] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0 lg:pr-1">
                {galleryImages.map((img, idx) => (
                  <button
                    key={`${img.url}-${idx}`}
                    onClick={() => setSelectedImage(img)}
                    className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border transition hover:shadow-sm lg:h-24 lg:w-20"
                    style={{
                      borderColor: activeImage?.url === img.url ? 'var(--color-primary)' : 'var(--border-color)',
                      backgroundColor: 'var(--bg-secondary)'
                    }}
                    aria-label={`View product image ${idx + 1}`}
                  >
                    <img src={img.url} alt={img.alt || `${product.name} ${idx + 1}`} className="h-full w-full object-cover" />
                    <span className="absolute bottom-1 right-1 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-black shadow-sm" style={{ color: 'var(--text-primary)' }}>
                      {idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            )}

          <div
            className="order-1 relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-lg border shadow-sm sm:min-h-[560px] lg:order-2 lg:min-h-[calc(100vh-160px)]"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
          >
            {activeImage?.url && (
              <>
                <div
                  className="relative flex h-full w-full cursor-zoom-in items-center justify-center"
                  onClick={() => setShowZoom(true)}
                >
                  <img
                    src={activeImage.url}
                    alt={activeImage.alt || product.name}
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                </div>
                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => shiftImage(-1)}
                      className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border bg-white/95 shadow transition hover:scale-105"
                      style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      aria-label="Previous product image"
                    >
                      <ChevronLeft size={22} />
                    </button>
                    <button
                      type="button"
                      onClick={() => shiftImage(1)}
                      className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border bg-white/95 shadow transition hover:scale-105"
                      style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      aria-label="Next product image"
                    >
                      <ChevronRight size={22} />
                    </button>
                  </>
                )}
                <div
                  className="absolute left-3 top-3 z-20 rounded-full border bg-white/95 px-3 py-1 text-xs font-black shadow-sm"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  {activeImageIndex + 1} / {galleryImages.length}
                </div>
                <button
                  onClick={() => setShowZoom(true)}
                  className="absolute right-3 top-3 z-20 inline-flex items-center gap-2 rounded-full border bg-white/95 px-3 py-2 text-xs font-black shadow-sm transition hover:opacity-70"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
                  aria-label="Zoom image"
                >
                  <Maximize2 size={16} /> View
                </button>
              </>
            )}
          </div>
          </div>
        </div>

        {/* Product Info Sidebar */}
        <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
          {/* Header */}
          <div>
            <div className="mb-2 flex items-start justify-between gap-4">
              <div className="text-xs font-black uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                {product.theme?.name || 'Fly Free'} • {product.category?.name || 'Apparel'}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={handleWishlist}
                  disabled={wishlistLoading}
                  className="flex h-10 w-10 items-center justify-center rounded-full border transition hover:-translate-y-0.5 hover:shadow-sm disabled:opacity-50"
                  style={{
                    borderColor: isWishlisted ? 'var(--color-primary)' : 'var(--border-color)',
                    backgroundColor: isWishlisted ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)' : 'var(--bg-secondary)',
                    color: isWishlisted ? 'var(--color-primary)' : 'var(--text-primary)'
                  }}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  title={isWishlisted ? 'Saved' : 'Save'}
                >
                  <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border transition hover:-translate-y-0.5 hover:shadow-sm"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  aria-label="Share product"
                  title="Share"
                >
                  <Share2 size={18} />
                </button>
              </div>
            </div>
            <h1 className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{product.name}</h1>
            {product.tagline && <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>{product.tagline}</p>}
          </div>

          {/* Price & Rating */}
          <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-2xl font-black">
                {formatCurrency(Math.round(totalPrice / 100))}
              </p>
              {productMrp > productPrice && (
                <div className="mt-1 flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                  <span className="line-through">{formatCurrency(Math.round(productMrp / 100))}</span>
                  {discountPercent > 0 && <span className="rounded bg-green-50 px-2 py-0.5 text-green-700">{discountPercent}% off</span>}
                </div>
              )}
              {selectedHamper && (
                <p className="mt-1 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                  {formatCurrency(Math.round(productPrice / 100))} tee
                  {' + '}
                  {formatCurrency(Math.round(hamperPrice / 100))} {selectedHamper.name}
                </p>
              )}
            </div>
            <div className="text-right">
              {averageRating > 0 ? (
                <>
                <div className="flex items-center justify-end gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} fill={i < Math.round(averageRating) ? 'currentColor' : 'none'} style={{ color: 'var(--accent-tertiary)' }} />
                  ))}
                </div>
                <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{averageRating.toFixed(1)} ({reviewCount})</p>
                </>
              ) : (
                <div>
                  <div className="flex items-center justify-end gap-1 opacity-45">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={15} fill="none" style={{ color: 'var(--text-tertiary)' }} />
                    ))}
                  </div>
                  <p className="mt-1 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>No reviews yet</p>
                </div>
              )}
            </div>
            </div>
            <a href="#reviews" className="mt-3 inline-flex items-center gap-1 text-xs font-black" style={{ color: 'var(--color-primary)' }}>
              Reviews <ArrowRight size={13} />
            </a>
          </div>

          {/* Action Buttons */}
          <div className="relative hidden gap-2">
            <button
              onClick={handleWishlist}
              disabled={wishlistLoading}
              className="flex min-h-11 items-center justify-center gap-2 rounded border px-4 font-black transition hover:opacity-70 disabled:opacity-50"
              style={{
                borderColor: isWishlisted ? 'var(--color-primary)' : 'var(--border-color)',
                backgroundColor: isWishlisted ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)' : 'transparent',
                color: isWishlisted ? 'var(--color-primary)' : 'var(--text-primary)'
              }}
              aria-label="Add to wishlist"
            >
              <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
              {isWishlisted ? 'Saved' : 'Save'}
            </button>

            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="flex min-h-11 items-center justify-center gap-2 rounded border px-4 font-black transition hover:opacity-70"
              style={{ borderColor: 'var(--border-color)' }}
              aria-label="Share product"
            >
              <Share2 size={18} />
              Share
            </button>
          </div>

          {/* Share Menu */}
          {showShareMenu && (
            <div
              className="grid gap-2 rounded-lg border p-3"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-3 rounded px-3 py-2 text-sm font-bold transition hover:opacity-70"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <Copy size={16} /> {copySuccess ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="flex items-center gap-3 rounded px-3 py-2 text-sm font-bold transition hover:opacity-70"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <MessageCircle size={16} /> WhatsApp
              </button>
              <button
                onClick={handleShareEmail}
                className="flex items-center gap-3 rounded px-3 py-2 text-sm font-bold transition hover:opacity-70"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <Mail size={16} /> Email
              </button>
            </div>
          )}

          {/* Choices */}
          <ChoiceBlock
            title="Size"
            subtitle={selectedVariant ? `${stock} in stock` : 'Choose an available size.'}
            action={<button type="button" onClick={openSizeChart} className="inline-flex items-center gap-1 rounded border px-3 py-2 text-xs font-black" style={{ borderColor: 'var(--border-color)', color: 'var(--color-primary)' }}><Ruler size={14} /> Size chart</button>}
          >
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => {
                const variant = variants.find((item) => item.size === size && Number(item.inventory?.stock ?? 0) > 0) || variants.find((item) => item.size === size);
                const available = Number(variant?.inventory?.stock ?? 0) > 0;
                return (
                  <button
                    key={size}
                    onClick={() => available && setSelectedSize(size)}
                    disabled={!available}
                    className="min-h-11 min-w-12 rounded px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-35"
                    style={{
                      backgroundColor: selectedSize === size ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                      color: selectedSize === size ? 'white' : 'var(--text-primary)',
                      border: `1px solid ${selectedSize === size ? 'var(--color-primary)' : 'var(--border-color)'}`
                    }}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </ChoiceBlock>

          {hampers.length > 0 && (
            <ChoiceBlock title="Hamper Options" subtitle="Tap a hamper to preview its image and add it to the total.">
              <div className="grid gap-3">
                <OptionButton active={!selectedHamperId} onClick={() => setSelectedHamperId(null)} title="Just the Tee" text="Ship as a regular order." />
                {hampers.map((hamper: any) => (
                  <HamperOption
                    key={hamper.id}
                    hamper={hamper}
                    active={selectedHamperId === hamper.id}
                    onClick={() => setSelectedHamperId(hamper.id)}
                  />
                ))}
              </div>
            </ChoiceBlock>
          )}

          <div className="hidden overflow-hidden rounded-lg border shadow-sm lg:block" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <div className="border-b p-4" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Ready to checkout</p>
                  <p className="mt-1 text-lg font-black" style={{ color: 'var(--text-primary)' }}>{formatCurrency(Math.round(totalPrice / 100))}</p>
                </div>
                <div className="flex items-center rounded-full border p-1" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black/5" aria-label="Decrease quantity"><Minus size={17} /></button>
                  <span className="min-w-10 text-center text-sm font-black">{quantity}</span>
                  <button onClick={() => setQuantity(stock > 0 ? Math.min(stock, quantity + 1) : quantity + 1)} disabled={stock > 0 && quantity >= stock} className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black/5 disabled:opacity-40" aria-label="Increase quantity"><Plus size={17} /></button>
                </div>
              </div>
              <p className="mt-2 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                {selectedSize ? `Size ${selectedSize}` : 'Choose size'} {visibleColor ? ` / ${visibleColor}` : ''} {stock > 0 ? ` / ${stock} in stock` : ''}
              </p>
            </div>
            <div className="grid gap-3 p-4">
              <button onClick={handleBuyNow} disabled={!canAdd} className="flex min-h-14 items-center justify-center gap-2 rounded px-5 py-4 text-base font-black text-white transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: canAdd ? 'var(--color-primary)' : 'var(--border-color)' }}>
                Buy now <ArrowRight size={19} />
              </button>
              <button onClick={handleAddToCart} disabled={!canAdd} className="flex min-h-12 items-center justify-center gap-2 rounded border px-5 font-black transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50" style={{ borderColor: canAdd ? 'var(--color-primary)' : 'var(--border-color)', color: canAdd ? 'var(--color-primary)' : 'var(--text-secondary)', backgroundColor: 'var(--bg-primary)' }}>
                <ShoppingCart size={19} /> Add to cart
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
            <TrustPill icon={<Truck size={15} />} text="Delivery calculated at checkout" />
            <TrustPill icon={<PackageCheck size={15} />} text="7-day exchange" />
            <TrustPill icon={<Heart size={15} />} text="Wishlist after login" />
            <TrustPill icon={<Share2 size={15} />} text="Shareable product link" />
          </div>
        </aside>
      </section>

      <div
        className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-40 border-t bg-white px-3 py-2 shadow-[0_-8px_24px_rgba(26,26,26,0.08)] lg:hidden"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] gap-2">
          <div className="flex h-12 items-center rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex h-12 w-10 items-center justify-center" aria-label="Decrease quantity"><Minus size={17} /></button>
            <span className="min-w-8 text-center text-sm font-black">{quantity}</span>
            <button onClick={() => setQuantity(stock > 0 ? Math.min(stock, quantity + 1) : quantity + 1)} disabled={stock > 0 && quantity >= stock} className="flex h-12 w-10 items-center justify-center disabled:opacity-40" aria-label="Increase quantity"><Plus size={17} /></button>
          </div>
          <button onClick={handleBuyNow} disabled={!canAdd} className="flex h-12 min-w-0 items-center justify-center gap-1 rounded-lg px-2 text-sm font-black text-white disabled:opacity-50" style={{ backgroundColor: canAdd ? 'var(--color-primary)' : 'var(--border-color)' }}>
            Buy now
          </button>
          <button onClick={handleAddToCart} disabled={!canAdd} className="flex h-12 min-w-0 items-center justify-center gap-1 rounded-lg px-2 text-sm font-black disabled:opacity-50" style={{ backgroundColor: canAdd ? 'var(--bg-tertiary)' : 'var(--border-color)', color: canAdd ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            <ShoppingCart size={17} /> Add
          </button>
        </div>
      </div>

      {/* Product Details & Reviews */}
      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-10 lg:grid-cols-[1fr_0.9fr]">
        <article className="rounded-lg border p-5 shadow-sm" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Specifications</p>
              <h2 className="mt-1 text-2xl font-black">Product Details</h2>
            </div>
            <span className="rounded-full border px-3 py-1 text-xs font-black" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
              {product.category?.name || 'Regular'}
            </span>
          </div>
          {product.description && <p className="mt-5 leading-7" style={{ color: 'var(--text-secondary)' }}>{product.description}</p>}
          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <SpecTile label="Brand" value={product.brand || 'Fly Free'} />
            <SpecTile label="Material" value={product.material || 'Premium cotton blend'} />
            <SpecTile label="Fit / Type" value={product.category?.name || 'Regular'} />
            <SpecTile label="Wearer" value="Unisex" />
            <SpecTile label="Theme" value={product.theme?.name || 'Fly Free'} />
            <SpecTile label="Wash care" value={product.washCare || 'Gentle machine wash. Do not bleach.'} />
          </div>
        </article>

        <article id="reviews" className="scroll-mt-24 rounded-lg border p-5 shadow-sm" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Reviews</p>
              <h2 className="mt-1 text-2xl font-black">Customer Reviews</h2>
            </div>
            <RatingBadge rating={averageRating} count={reviewCount} />
          </div>
          <div className="mt-5 grid gap-4">
            {(product.reviews || []).length > 0 ? (
              product.reviews.map((review: any) => (
                <div key={review.id} className="rounded border p-4" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black">{review.user?.name || 'Fly Free customer'}</p>
                      {review.title && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{review.title}</p>}
                    </div>
                    <span className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm font-black" style={{ backgroundColor: 'var(--accent-primary)/10', color: 'var(--accent-primary)' }}>
                      <Star size={14} fill="currentColor" /> {review.rating}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{review.body}</p>
                  {review.mediaUrls?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {review.mediaUrls.map((url: string, index: number) => (
                        <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={url}
                            alt={`Review photo ${index + 1}`}
                            className="h-20 w-20 rounded object-cover transition hover:opacity-80"
                            style={{ border: '1px solid var(--border-color)' }}
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <EmptyReviews />
            )}
          </div>
        </article>
      </section>

      {/* Recommendations */}
      {(recommendationsLoading || recommendations.length > 0) && (
        <section className="mx-auto max-w-7xl px-4 pb-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                Similar products
              </p>
              <h2 className="mt-1 text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                More {product.category?.name || 'styles'} like this
              </h2>
            </div>
            <Link
              href={`/products${product.category?.slug ? `?category=${encodeURIComponent(product.category.slug)}` : ''}`}
              className="hidden items-center gap-2 rounded border px-4 py-2 text-sm font-black transition hover:shadow-sm sm:inline-flex"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              View all <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recommendationsLoading && recommendations.length === 0
              ? Array.from({ length: 4 }).map((_, index) => <SimilarProductSkeleton key={index} />)
              : recommendations.map((rec) => (
                <ProductCard
                  key={rec.id}
                  id={rec.id}
                  name={rec.name}
                  price={Math.round((rec.price || 0) / 100)}
                  originalPrice={rec.mrp ? Math.round((rec.mrp || 0) / 100) : undefined}
                  slug={rec.slug}
                  image={rec.images?.[0]?.url}
                  hoverImage={rec.images?.[1]?.url}
                  images={rec.images}
                  variants={rec.variants}
                  tag={rec.theme?.name || rec.category?.name}
                />
              ))}
          </div>
        </section>
      )}

      {/* Modals */}
      <SizeGuideDrawer open={showSizeChart} onClose={() => setShowSizeChart(false)} defaultFit={sizeGuideFit(product)} />

      {showZoom && activeImage?.url && (
        <Modal
          title={product.name}
          onClose={() => {
            setShowZoom(false);
            setZoomScale(1);
            setZoomOrigin({ x: 50, y: 50 });
          }}
          wide
        >
          <div className="grid min-h-0 gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="rounded-full border px-3 py-1 text-xs font-black" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                {activeImageIndex + 1} / {galleryImages.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomScale((value) => Math.max(1, Number((value - 0.25).toFixed(2))))}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white"
                  style={{ borderColor: 'var(--border-color)' }}
                  aria-label="Zoom out"
                >
                  <Minus size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomScale(1)}
                  className="rounded-full border bg-white px-3 py-2 text-xs font-black"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  {Math.round(zoomScale * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => setZoomScale((value) => Math.min(3, Number((value + 0.25).toFixed(2))))}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white"
                  style={{ borderColor: 'var(--border-color)' }}
                  aria-label="Zoom in"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
            <div
              className="relative flex h-[62vh] min-h-[420px] items-center justify-center overflow-hidden rounded-2xl border"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', cursor: zoomScale > 1 ? 'move' : 'default' }}
              onMouseMove={(event) => {
                if (zoomScale <= 1) return;
                const box = event.currentTarget.getBoundingClientRect();
                setZoomOrigin({
                  x: ((event.clientX - box.left) / box.width) * 100,
                  y: ((event.clientY - box.top) / box.height) * 100
                });
              }}
            >
              {galleryImages.length > 1 && (
                <>
                  <button onClick={(event) => { event.stopPropagation(); shiftImage(-1); setZoomScale(1); }} className="absolute left-3 top-1/2 z-10 rounded-full border bg-white/90 p-3 shadow" style={{ borderColor: 'var(--border-color)' }} aria-label="Previous image">
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={(event) => { event.stopPropagation(); shiftImage(1); setZoomScale(1); }} className="absolute right-3 top-1/2 z-10 rounded-full border bg-white/90 p-3 shadow" style={{ borderColor: 'var(--border-color)' }} aria-label="Next image">
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
              <img
                src={activeImage.url}
                alt={activeImage.alt || product.name}
                className="h-full w-full rounded object-contain p-3 transition-transform duration-200 sm:p-6"
                style={{
                  transform: `scale(${zoomScale})`,
                  transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`
                }}
              />
            </div>
            {galleryImages.length > 1 && (
              <div className="flex justify-center gap-2 overflow-x-auto pb-1">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image.url}-${index}`}
                    onClick={() => { setSelectedImage(image); setZoomScale(1); }}
                    className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 p-1"
                    style={{
                      borderColor: activeImage?.url === image.url ? 'var(--color-primary)' : 'var(--border-color)',
                      backgroundColor: 'var(--bg-secondary)'
                    }}
                    aria-label={`View image ${index + 1}`}
                  >
                    <img src={image.url} alt={image.alt || product.name} className="h-full w-full rounded-lg object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </main>
  );
}

function SpecTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
      <p className="text-[11px] font-black uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
      <p className="mt-1 text-sm font-black leading-5" style={{ color: 'var(--text-primary)' }}>{value}</p>
    </div>
  );
}

function RatingBadge({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="rounded-lg border px-4 py-3 text-right" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
      <div className="flex items-center justify-end gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} size={16} fill={rating > 0 && index < Math.round(rating) ? 'currentColor' : 'none'} style={{ color: 'var(--accent-tertiary)' }} />
        ))}
      </div>
      <p className="mt-1 text-sm font-black" style={{ color: 'var(--text-primary)' }}>{rating > 0 ? rating.toFixed(1) : 'New'}</p>
      <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{count} review{count === 1 ? '' : 's'}</p>
    </div>
  );
}

function EmptyReviews() {
  return (
    <div className="rounded-lg border p-5 text-center" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, white)', color: 'var(--color-primary)' }}>
        <Star size={28} />
      </div>
      <div className="mt-4 flex justify-center gap-1 opacity-60">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} size={18} fill="none" style={{ color: 'var(--accent-tertiary)' }} />
        ))}
      </div>
      <h3 className="mt-3 text-lg font-black" style={{ color: 'var(--text-primary)' }}>No reviews yet</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
        Verified buyers can add ratings and photos after delivery. The first review will appear here after approval.
      </p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b pb-2" style={{ borderColor: 'var(--border-color)' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className="text-right font-bold" style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function ChoiceBlock({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide">{title}</h2>
          {subtitle && <p className="mt-1 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function OptionButton({ active, onClick, title, text, icon }: { active: boolean; onClick: () => void; title: string; text: string; icon?: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex items-start gap-3 rounded border p-3 text-left transition" style={{ borderColor: active ? 'var(--color-primary)' : 'var(--border-color)', backgroundColor: active ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)' : 'transparent' }}>
      <span className="mt-0.5" style={{ color: 'var(--color-primary)' }}>{icon || <Info size={16} />}</span>
      <span>
        <span className="block text-sm font-black" style={{ color: 'var(--text-primary)' }}>{title}</span>
        <span className="mt-1 block text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{text}</span>
      </span>
    </button>
  );
}

function HamperOption({ active, onClick, hamper }: { active: boolean; onClick: () => void; hamper: any }) {
  const image = hamper.imageUrl || hamper.images?.[0];
  const contents = Array.isArray(hamper.contents) ? hamper.contents : [];

  return (
    <button
      onClick={onClick}
      className="grid gap-3 rounded border p-3 text-left transition sm:grid-cols-[84px_1fr]"
      style={{
        borderColor: active ? 'var(--color-primary)' : 'var(--border-color)',
        backgroundColor: active ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)' : 'transparent'
      }}
    >
      <span className="overflow-hidden rounded border" style={{ aspectRatio: MEDIA.hamper.css, borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
        {image ? (
          <img src={image} alt={hamper.name} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center" style={{ color: 'var(--color-primary)' }}>
            <PackageCheck size={24} />
          </span>
        )}
      </span>

      <span className="min-w-0">
        <span className="flex items-start justify-between gap-3">
          <span className="font-black" style={{ color: 'var(--text-primary)' }}>{hamper.name}</span>
          <span className="shrink-0 text-sm font-black" style={{ color: 'var(--color-primary)' }}>
            +{formatCurrency(Math.round(Number(hamper.price || 0) / 100))}
          </span>
        </span>
        {hamper.description && (
          <span className="mt-1 block text-xs font-bold leading-5" style={{ color: 'var(--text-secondary)' }}>
            {hamper.description}
          </span>
        )}
        <span className="mt-2 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
          {contents.length ? <span>Gift wrapped</span> : null}
          {contents.length ? <span>{contents.length} items</span> : null}
          {hamper.sizeNote ? <span>{hamper.sizeNote}</span> : null}
        </span>
        {contents.length > 0 && (
          <span className="mt-2 flex flex-wrap gap-1.5">
            {contents.slice(0, 4).map((item: string) => (
              <span key={item} className="rounded border px-2 py-1 text-[11px] font-bold" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                {item}
              </span>
            ))}
          </span>
        )}
      </span>
    </button>
  );
}

function InfoRow({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
      <span>
        <span className="block font-black" style={{ color: 'var(--text-primary)' }}>{title}</span>
        <span style={{ color: 'var(--text-secondary)' }}>{text}</span>
      </span>
    </div>
  );
}

function TrustPill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
      <span className="shrink-0" style={{ color: 'var(--color-primary)' }}>{icon}</span>
      <span className="leading-4">{text}</span>
    </div>
  );
}

function Modal({ title, children, onClose, wide }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-5">
      <div className={`relative max-h-[94vh] overflow-auto rounded-2xl shadow-2xl ${wide ? 'w-full max-w-6xl' : 'w-full max-w-lg'}`} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
        <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b px-4 py-3 backdrop-blur sm:px-5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'color-mix(in srgb, var(--bg-secondary) 94%, transparent)' }}>
          <h2 className="min-w-0 truncate text-base font-black sm:text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border bg-white shadow-sm"
            style={{ borderColor: 'var(--border-color)' }}
            aria-label="Close viewer"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 sm:p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <main className="min-h-screen px-4 py-10" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_440px]">
        <div className="animate-pulse rounded-lg" style={{ aspectRatio: MEDIA.product.css, backgroundColor: 'var(--bg-tertiary)' }} />
        <div className="space-y-4">
          <div className="h-5 w-24 animate-pulse rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
          <div className="h-10 w-3/4 animate-pulse rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
          <div className="h-24 animate-pulse rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
          <div className="h-40 animate-pulse rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
        </div>
      </div>
    </main>
  );
}

function SimilarProductSkeleton() {
  return (
    <div className="overflow-hidden border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
      <div className="animate-pulse" style={{ aspectRatio: MEDIA.product.css, backgroundColor: 'var(--bg-tertiary)' }} />
      <div className="space-y-3 p-3 md:p-4">
        <div className="h-4 w-2/3 animate-pulse rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
        <div className="h-4 w-full animate-pulse rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
        <div className="h-5 w-20 animate-pulse rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
        <div className="h-10 w-full animate-pulse rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
      </div>
    </div>
  );
}

function normalizeImages(rawImages: ProductImage[] = [], productName: string): ProductImage[] {
  const images = [...rawImages].sort((a, b) => Number(a.priority || 0) - Number(b.priority || 0));
  if (images.length > 0) return images;

  return [{
    url: `https://via.placeholder.com/900?text=${encodeURIComponent(productName)}`,
    alt: productName,
    color: null
  }];
}

function normalizeHamperImages(hamper: any): ProductImage[] {
  if (!hamper) return [];
  const urls = [hamper.imageUrl, ...(Array.isArray(hamper.images) ? hamper.images : [])]
    .filter(Boolean)
    .map((url) => String(url));

  return Array.from(new Set(urls)).map((url, index) => ({
    url,
    alt: `${hamper.name || 'Hamper'} image ${index + 1}`,
    color: null,
    priority: -100 + index
  }));
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean).map((value) => String(value))));
}

function displayColor(color?: string | null) {
  const value = String(color || '').trim();
  return value && value.toLowerCase() !== 'default' ? value : '';
}

async function fetchSimilarProducts(product: any) {
  const cacheKey = [
    'similar-products',
    product.id,
    product.category?.slug || 'no-category',
    product.theme?.slug || 'no-theme'
  ].join(':');
  const cached = readCachedProducts(cacheKey);
  if (cached) return cached;

  const seen = new Set<string>([product.id]);
  const results: any[] = [];

  const params = new URLSearchParams();
  if (product.category?.slug) params.set('category', product.category.slug);
  else if (product.theme?.slug) params.set('theme', product.theme.slug);
  else return [];

  const response = await fetch(`${API_URL}/catalog/products?${params.toString()}`, { cache: 'force-cache' }).catch(() => null);
  if (!response?.ok) return [];

  const data = await response.json().catch(() => null);
  const items = Array.isArray(data) ? data : data?.data || [];
  items
    .sort((a: any, b: any) => {
      const aSameTheme = Number(Boolean(product.theme?.slug && a.theme?.slug === product.theme.slug));
      const bSameTheme = Number(Boolean(product.theme?.slug && b.theme?.slug === product.theme.slug));
      return bSameTheme - aSameTheme;
    })
    .forEach((item: any) => {
      if (!item?.id || seen.has(item.id)) return;
      seen.add(item.id);
      results.push(item);
    });

  const sliced = results.slice(0, 12);
  writeCachedProducts(cacheKey, sliced);
  return sliced;
}

function readCachedProducts(key: string) {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;

    const cached = JSON.parse(raw);
    if (!cached?.expiresAt || cached.expiresAt < Date.now()) {
      window.sessionStorage.removeItem(key);
      return null;
    }

    return Array.isArray(cached.products) ? cached.products : null;
  } catch {
    return null;
  }
}

function writeCachedProducts(key: string, products: any[]) {
  if (typeof window === 'undefined' || products.length === 0) return;

  try {
    window.sessionStorage.setItem(
      key,
      JSON.stringify({
        products,
        expiresAt: Date.now() + 10 * 60 * 1000
      })
    );
  } catch {
    // Ignore storage quota/private-mode failures; recommendations are optional.
  }
}

function rememberViewedProduct(product: any) {
  if (typeof window === 'undefined' || !product?.id || !product?.slug) return;

  try {
    const raw = window.localStorage.getItem(RECENT_PRODUCTS_KEY);
    const current = raw ? JSON.parse(raw) : [];
    const next = [
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        image: product.images?.[0]?.url || '',
        theme: product.theme?.name || '',
        category: product.category?.name || ''
      },
      ...(Array.isArray(current) ? current : []).filter((item: any) => item?.id !== product.id)
    ].slice(0, 8);

    window.localStorage.setItem(RECENT_PRODUCTS_KEY, JSON.stringify(next));
  } catch {
    // Browsing memory is optional; private-mode storage failures should not
    // affect the product page.
  }
}

function productJsonLd(product: any, image: string | undefined, url: string, totalPrice: number, rating: number, reviewCount: number, stock: number) {
  const price = Math.round(Number(totalPrice || product?.price || 0) / 100);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product?.name,
    description: product?.seoDescription || product?.description,
    image: image ? [image] : undefined,
    brand: {
      '@type': 'Brand',
      name: product?.brand || 'Fly Free',
    },
    sku: product?.sku,
    category: product?.category?.name,
    url,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'INR',
      price,
      availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    aggregateRating: reviewCount > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: Number(rating.toFixed(1)),
      reviewCount,
    } : undefined,
  };
}

function sizeGuideFit(product: any) {
  const value = `${product?.category?.slug || ''} ${product?.category?.name || ''} ${product?.fitType || ''}`.toLowerCase();
  if (value.includes('polo')) return 'polo';
  if (value.includes('oversized') || value.includes('over-size')) return 'oversized';
  return 'regular';
}
