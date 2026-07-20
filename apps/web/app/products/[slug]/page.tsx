'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Gift,
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
  Sparkles,
  Truck,
  X,
  Copy,
  MessageCircle,
  Mail,
  Instagram
} from 'lucide-react';
import { formatCurrency } from '@flyfree/utils';
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

type GiftOption = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
};

type Offer = {
  code: string;
  label: string;
  description: string;
};

const API_URL = getApiBaseUrl();

export default function ProductDetailPage({ params }: ProductDetailProps) {
  const { slug } = use(params);
  const token = useAuthStore((state) => state.token);
  const addItem = useCartStore((state) => state.addItem);
  const [product, setProduct] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [giftOptions, setGiftOptions] = useState<GiftOption[]>([]);
  const [sizeChart, setSizeChart] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);
  const [selectedGiftId, setSelectedGiftId] = useState('');
  const [selectedOfferCode, setSelectedOfferCode] = useState('');
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

  const colors = useMemo(() => uniqueValues(variants.map((v) => v.color)), [variants]);
  const sizes = useMemo(() => uniqueValues(variants.map((v) => v.size)), [variants]);
  const offers = useMemo(() => buildOffers(product), [product]);
  const activeImage = selectedImage || (product?.images?.[0] && normalizeImages(product.images, product.name)[0]);
  const images = product ? normalizeImages(product.images, product.name) : [];

  const selectedVariant = useMemo(
    () => variants.find((v) => v.color === selectedColor && v.size === selectedSize),
    [variants, selectedColor, selectedSize]
  );

  const stock = selectedVariant?.inventory?.stock ?? 0;
  const canAdd = Boolean(selectedColor && selectedSize && selectedVariant && stock > 0);

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
          const firstColor = uniqueValues(productData.variants.map((v: any) => v.color))[0];
          if (firstColor) setSelectedColor(firstColor);
        }

        if (homeResponse?.ok) {
          const homeData = await homeResponse.json();
          const homePayload = homeData?.data || homeData;
          setGiftOptions(homePayload?.giftOptions || []);
          const homeSectionData = homePayload?.sections?.find?.((s: any) => s.type === 'product-recommendation');
          if (homeSectionData?.productIds) {
            const recResponse = await fetch(
              `${API_URL}/catalog/products?ids=${homeSectionData.productIds.slice(0, 6).join(',')}`
            );
            if (recResponse.ok) {
              const recData = await recResponse.json();
              setRecommendations((Array.isArray(recData) ? recData : recData.data || []).filter((p: any) => p.slug !== slug).slice(0, 6));
            }
          }
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
      price: Math.round((selectedVariant?.price || product.price || product.basePrice || 0) / 100),
      color: selectedColor,
      size: selectedSize,
      image: activeImage?.url || '',
      giftOption: selectedGiftId ? {
        id: selectedGiftId,
        name: giftOptions.find((gift) => gift.id === selectedGiftId)?.name || 'Gift option',
        price: Math.round((giftOptions.find((gift) => gift.id === selectedGiftId)?.price || 0) / 100)
      } : null,
      offerCode: selectedOfferCode || undefined
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

          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
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
              <p className="text-2xl font-black">{formatCurrency(Math.round((selectedVariant?.price || product.basePrice) / 100))}</p>
              {product.basePrice && selectedVariant?.price && selectedVariant.price < product.basePrice && (
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span className="line-through">{formatCurrency(Math.round(product.basePrice / 100))}</span>
                </p>
              )}
            </div>
            {product.reviews?.length > 0 && (
              <div className="text-right">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} fill={i < Math.round(product.averageRating || 4) ? 'currentColor' : 'none'} style={{ color: 'var(--accent-tertiary)' }} />
                  ))}
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>({product.reviews.length})</p>
              </div>
            )}
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
            title="Color"
            subtitle={selectedColor ? `${selectedColor} selected` : 'Choose a color'}
          >
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className="min-h-11 rounded px-4 text-sm font-black transition"
                  style={{
                    backgroundColor: selectedColor === color ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                    color: selectedColor === color ? 'white' : 'var(--text-primary)',
                    border: `1px solid ${selectedColor === color ? 'var(--color-primary)' : 'var(--border-color)'}`
                  }}
                >
                  {color}
                </button>
              ))}
            </div>
          </ChoiceBlock>

          <ChoiceBlock
            title="Size"
            subtitle={selectedVariant ? `${stock} in stock for selected option` : 'Choose a color to see available sizes.'}
            action={<button onClick={() => setShowSizeChart(true)} className="inline-flex items-center gap-1 text-xs font-black" style={{ color: 'var(--color-primary)' }}><Ruler size={14} /> Size chart</button>}
          >
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => {
                const variant = variants.find((item) => item.color === selectedColor && item.size === size);
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

          <ChoiceBlock title="Choose offer" subtitle="Offers are calculated from the product and admin-seeded pricing rules.">
            <div className="grid gap-2">
              <OptionButton active={!selectedOfferCode} onClick={() => setSelectedOfferCode('')} title="No extra offer" text="Use normal product price." />
              {offers.map((offer) => (
                <OptionButton key={offer.code} active={selectedOfferCode === offer.code} onClick={() => setSelectedOfferCode(offer.code)} title={offer.label} text={offer.description} icon={<Sparkles size={16} />} />
              ))}
            </div>
          </ChoiceBlock>

          {giftOptions.length > 0 && (
            <ChoiceBlock title="Gift pack option" subtitle="Gift services are loaded from admin-managed database content.">
              <div className="grid gap-2">
                <OptionButton active={!selectedGiftId} onClick={() => setSelectedGiftId('')} title="No gift pack" text="Ship as regular order." />
                {giftOptions.map((gift) => (
                  <OptionButton
                    key={gift.id}
                    active={selectedGiftId === gift.id}
                    onClick={() => setSelectedGiftId(gift.id)}
                    title={`${gift.name}${gift.price ? ` + ${formatCurrency(Math.round(gift.price / 100))}` : ''}`}
                    text={gift.description || 'Gift option'}
                    icon={<Gift size={16} />}
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
            <InfoRow icon={<Truck size={18} />} title="Delivery and GST" text="Cart shows subtotal, GST, shipping, gift pack, and final total before checkout." />
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
      {showSizeChart && (
        <Modal title="Size chart" onClose={() => setShowSizeChart(false)}>
          <div className="max-w-none whitespace-pre-wrap text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
            {sizeChart ? (
              <p>{sizeChart}</p>
            ) : (
              <p>Size chart is not configured yet. Add the size-chart page content from admin pages.</p>
            )}
          </div>
        </Modal>
      )}

      {showZoom && activeImage?.url && (
        <Modal title={product.name} onClose={() => setShowZoom(false)} wide>
          <img src={activeImage.url} alt={activeImage.alt || product.name} className="max-h-[75vh] w-full rounded object-contain" />
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

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean).map((value) => String(value))));
}

function buildOffers(product: any): Offer[] {
  const offers: Offer[] = [];
  if (product?.discountPercent > 0) {
    offers.push({
      code: `PRODUCT-${product.discountPercent}`,
      label: `${product.discountPercent}% product offer`,
      description: 'Applied from the product discount configured in admin.'
    });
  }

  if (product?.collection?.name) {
    offers.push({
      code: `COLLECTION-${product.collection.slug || product.collection.id}`,
      label: `${product.collection.name} combo`,
      description: 'Choose more items from this collection in cart to use combo pricing.'
    });
  }

  return offers;
}
