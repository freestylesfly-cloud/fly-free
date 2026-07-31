'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
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

export default function ProductDetailPage({ params }: ProductDetailProps) {
  const { slug } = use(params);
  const token = useAuthStore((state) => state.token);
  const addItem = useCartStore((state) => state.addItem);
  const [product, setProduct] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [hampers, setHampers] = useState<any[]>([]);
  const [sizeChart, setSizeChart] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);
  const [selectedHamperId, setSelectedHamperId] = useState<string | null>(null);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [notice, setNotice] = useState('');
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

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

  const selectedVariant = useMemo(
    () =>
      variants.find((v) => v.size === selectedSize && Number(v.inventory?.stock ?? 0) > 0) ||
      variants.find((v) => v.size === selectedSize),
    [variants, selectedSize]
  );

  const stock = selectedVariant?.inventory?.stock ?? 0;
  const canAdd = Boolean(selectedSize && selectedVariant && stock > 0);
  const productPrice = selectedVariant?.price || product?.price || product?.basePrice || 0;
  const productMrp = product?.mrp || product?.basePrice || productPrice;
  const hamperPrice = selectedHamper?.price || 0;
  const totalPrice = productPrice + hamperPrice;
  const discountPercent = product?.discountPercent || (productMrp > productPrice ? Math.round(((productMrp - productPrice) / productMrp) * 100) : 0);
  const reviewCount = product?.reviews?.length || 0;
  const averageRating = Number(product?.averageRating || 0);

  useEffect(() => {
    async function fetchProductFlow() {
      try {
        setLoading(true);
        setError('');

        const [productResponse, homeResponse, sizeChartResponse] = await Promise.all([
          fetch(`${API_URL}/catalog/products/${slug}`, { cache: 'no-store' }),
          fetch(`${API_URL}/cms/home`, { cache: 'no-store' }).catch(() => null),
          fetch(`${API_URL}/cms/pages/size-chart`, { cache: 'no-store' }).catch(() => null)
        ]);

        if (!productResponse.ok) {
          throw new Error('This product could not be loaded right now.');
        }

        const productResponseData = await productResponse.json();
        const productData = productResponseData?.data || productResponseData;
        setProduct(productData);

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


        if (sizeChartResponse?.ok) {
          const sizeChartData = await sizeChartResponse.json();
          setSizeChart(sizeChartData?.content || '');
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
    if (!product?.id || !token) return;
    checkWishlistStatus();
  }, [product?.id, token]);

  useEffect(() => {
    setSelectedImage(galleryImages[0] || null);
  }, [galleryImages]);

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
      hamperId: selectedHamperId || undefined,
      hamperName: selectedHamper?.name,
      offerCode: undefined
    });
    setNotice('Added to cart successfully!');
    setTimeout(() => setNotice(''), 3000);
  }

  async function handleWishlist() {
    if (!token) {
      setNotice('Please login to add to wishlist');
      return;
    }

    setWishlistLoading(true);
    try {
      const method = isWishlisted ? 'DELETE' : 'POST';
      const response = await fetch(`${API_URL}/ecommerce/wishlist/${product.id}`, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setIsWishlisted(!isWishlisted);
        setNotice(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
        setTimeout(() => setNotice(''), 2000);
      }
    } catch (err) {
      setNotice('Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  }

  function handleCopyLink() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  }

  function handleShareWhatsApp() {
    const text = `Check out ${product.name} at Fly Free! ${typeof window !== 'undefined' ? window.location.href : ''}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  function handleShareEmail() {
    const subject = `Check out: ${product.name}`;
    const body = `I found this product at Fly Free: ${product.name}\n\n${typeof window !== 'undefined' ? window.location.href : ''}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
    <main className="min-h-screen px-4 py-6 pb-20 md:pb-10" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Product Hero */}
      <section className="mx-auto mb-10 grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_440px]">
        {/* Image Gallery */}
        <div className="flex flex-col gap-4">
          <div
            className="relative flex min-h-96 items-center justify-center rounded-lg border"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
          >
            {activeImage?.url && (
              <>
                <img src={activeImage.url} alt={activeImage.alt || product.name} className="max-h-full max-w-full object-contain" />
                <button
                  onClick={() => setShowZoom(true)}
                  className="absolute right-3 top-3 rounded-lg border p-2 transition hover:opacity-70"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
                  aria-label="Zoom image"
                >
                  <Maximize2 size={18} />
                </button>
              </>
            )}
          </div>

          {galleryImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className="flex-shrink-0 rounded-lg border-2 transition"
                  style={{
                    borderColor: activeImage?.url === img.url ? 'var(--color-primary)' : 'var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)'
                  }}
                >
                  <img src={img.url} alt={img.alt || `${product.name} ${idx}`} className="h-20 w-20 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info Sidebar */}
        <aside className="flex flex-col gap-5">
          {/* Header */}
          <div>
            <div className="mb-2 text-xs font-black uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              {product.theme?.name || 'Fly Free'} • {product.category?.name || 'Apparel'}
            </div>
            <h1 className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{product.name}</h1>
            {product.tagline && <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>{product.tagline}</p>}
          </div>

          {/* Price & Rating */}
          <div className="flex items-center justify-between gap-4 border-t border-b py-3" style={{ borderColor: 'var(--border-color)' }}>
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
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Includes {selectedHamper.name} hamper
                </p>
              )}
            </div>
            <div className="text-right">
              {averageRating > 0 ? (
                <>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} fill={i < Math.round(averageRating) ? 'currentColor' : 'none'} style={{ color: 'var(--accent-tertiary)' }} />
                  ))}
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>({reviewCount})</p>
                </>
              ) : (
                <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>No reviews yet</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
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
            action={<button onClick={() => setShowSizeChart(true)} className="inline-flex items-center gap-1 text-xs font-black" style={{ color: 'var(--color-primary)' }}><Ruler size={14} /> Size chart</button>}
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

          <ChoiceBlock title="Delivery Details" subtitle="Delivery and serviceability are calculated at checkout from admin settings.">
            <div className="rounded border p-4 text-sm font-bold" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
              Add or choose your shipping address during checkout. Paid orders keep the address used at order time, so later profile address changes do not rewrite old invoices.
            </div>
          </ChoiceBlock>

          <div className="flex items-center gap-3">
            <div className="flex min-h-12 items-center rounded border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3"><Minus size={18} /></button>
              <span className="min-w-10 text-center font-black">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="p-3"><Plus size={18} /></button>
            </div>
            <button onClick={handleAddToCart} disabled={!canAdd} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded px-5 font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: canAdd ? 'var(--color-primary)' : 'var(--border-color)' }}>
              <ShoppingCart size={20} /> Add to cart
            </button>
          </div>

          {notice && (
            <p className="rounded border p-3 text-sm font-bold" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
              {notice}
            </p>
          )}

          <div className="grid gap-3 border-t pt-5 text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
            <InfoRow icon={<Truck size={18} />} title="Delivery and GST" text="Cart shows subtotal, GST, shipping, hamper, and final total before checkout." />
            <InfoRow icon={<PackageCheck size={18} />} title="Return Policy" text="Eligible items can be returned or exchanged under the configured return policy." />
            <InfoRow icon={<Heart size={18} />} title="Wishlist" text="Save products after login. Guest cart still works before login." />
            <InfoRow icon={<Share2 size={18} />} title="Share or influencer link" text="Referral and influencer links can be tracked when opened with a valid code." />
          </div>
        </aside>
      </section>

      {/* Product Details & Reviews */}
      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-10 lg:grid-cols-[1fr_0.9fr]">
        <article className="rounded border p-5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <h2 className="text-2xl font-black">Product Details</h2>
          <div className="mt-5 grid gap-3 text-sm">
            <DetailRow label="Brand" value={product.brand || 'Fly Free'} />
            <DetailRow label="Material" value={product.material || 'Premium cotton blend'} />
            <DetailRow label="Fit" value={product.gender || 'UNISEX'} />
            <DetailRow label="Wash care" value={product.washCare || 'Gentle machine wash. Do not bleach.'} />
            <DetailRow label="Category" value={product.category?.name || 'Apparel'} />
            <DetailRow label="Theme" value={product.theme?.name || 'Fly Free'} />
          </div>
          {product.description && <p className="mt-5 leading-7" style={{ color: 'var(--text-secondary)' }}>{product.description}</p>}
        </article>

        <article className="rounded border p-5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <h2 className="text-2xl font-black">Customer Reviews</h2>
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
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>No approved reviews yet. Verified customers can review after purchase.</p>
            )}
          </div>
        </article>
      </section>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-10">
          <h2 className="mb-6 text-2xl font-black">You Might Like</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((rec) => (
              <Link
                key={rec.id}
                href={`/products/${rec.slug}`}
                className="group rounded-lg border p-4 transition hover:shadow-lg"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
              >
                <div className="relative mb-4 aspect-square overflow-hidden rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <img
                    src={rec.images?.[0]?.url || `https://via.placeholder.com/300?text=${encodeURIComponent(rec.name)}`}
                    alt={rec.name}
                    className="h-full w-full object-cover transition group-hover:scale-110"
                  />
                </div>
                <h3 className="font-black" style={{ color: 'var(--text-primary)' }}>{rec.name}</h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {rec.theme?.name || 'Fly Free'}
                </p>
                <p className="mt-3 font-black" style={{ color: 'var(--color-primary)' }}>
                  {formatCurrency(Math.round((rec.basePrice || 0) / 100))}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Modals */}
      <SizeGuideDrawer open={showSizeChart} onClose={() => setShowSizeChart(false)} content={sizeChart} />

      {showZoom && activeImage?.url && (
        <Modal title={product.name} onClose={() => setShowZoom(false)} wide>
          <div className="space-y-4">
            <div className="relative flex min-h-[60vh] items-center justify-center rounded border p-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
              {galleryImages.length > 1 && (
                <>
                  <button onClick={() => shiftImage(-1)} className="absolute left-3 top-1/2 rounded-full border bg-white/90 p-3 shadow" style={{ borderColor: 'var(--border-color)' }} aria-label="Previous image">
                    <Minus size={18} />
                  </button>
                  <button onClick={() => shiftImage(1)} className="absolute right-3 top-1/2 rounded-full border bg-white/90 p-3 shadow" style={{ borderColor: 'var(--border-color)' }} aria-label="Next image">
                    <Plus size={18} />
                  </button>
                </>
              )}
              <img src={activeImage.url} alt={activeImage.alt || product.name} className="max-h-[75vh] w-full rounded object-contain" />
            </div>
            {galleryImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image.url}-${index}`}
                    onClick={() => setSelectedImage(image)}
                    className="h-16 w-16 flex-shrink-0 overflow-hidden rounded border-2"
                    style={{ borderColor: activeImage?.url === image.url ? 'var(--color-primary)' : 'var(--border-color)' }}
                    aria-label={`View image ${index + 1}`}
                  >
                    <img src={image.url} alt={image.alt || product.name} className="h-full w-full object-cover" />
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
      <span className="aspect-square overflow-hidden rounded border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
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
          {hamper.gstPercent ? <span>GST {hamper.gstPercent}%</span> : null}
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

function Modal({ title, children, onClose, wide }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className={`max-h-[90vh] overflow-auto rounded-lg shadow-2xl p-5 ${wide ? 'w-full max-w-4xl' : 'w-full max-w-lg'}`} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-black">{title}</h2>
          <button onClick={onClose} className="rounded border p-2" style={{ borderColor: 'var(--border-color)' }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <main className="min-h-screen px-4 py-10" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_440px]">
        <div className="aspect-square animate-pulse rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
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
