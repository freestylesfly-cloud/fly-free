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
  X
} from 'lucide-react';
import { formatCurrency } from '@flyfree/utils';
import { useCartStore } from '../../stores/cartStore';
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
  const addItem = useCartStore((state) => state.addItem);
  const [product, setProduct] = useState<any>(null);
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
  const [pincode, setPincode] = useState('');

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

        const productData = await productResponse.json();
        const loadedProduct = productData.data || productData;
        setProduct(loadedProduct);

        const colors = uniqueValues((loadedProduct.variants || []).map((variant: Variant) => variant.color));
        const sizes = uniqueValues((loadedProduct.variants || []).map((variant: Variant) => variant.size));
        const images = normalizeImages(loadedProduct.images, loadedProduct.name);

        setSelectedColor(colors[0] || images[0]?.color || 'Default');
        setSelectedSize(sizes.includes('M') ? 'M' : sizes[0] || '');
        setSelectedImage(images[0] || null);

        if (homeResponse?.ok) {
          const homeData = await homeResponse.json();
          setGiftOptions(homeData.giftOptions || []);
        }

        if (sizeChartResponse?.ok) {
          const pageData = await sizeChartResponse.json();
          setSizeChart(pageData.content || pageData.data?.content || '');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Product failed to load.');
      } finally {
        setLoading(false);
      }
    }

    fetchProductFlow();
  }, [slug]);

  const variants: Variant[] = product?.variants || [];
  const images = useMemo(() => normalizeImages(product?.images || [], product?.name || 'Product'), [product]);
  const colors = useMemo(() => uniqueValues(variants.map((variant) => variant.color)), [variants]);
  const sizes = useMemo(() => uniqueValues(variants.filter((variant) => !selectedColor || variant.color === selectedColor).map((variant) => variant.size)), [variants, selectedColor]);
  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.color === selectedColor && variant.size === selectedSize) || variants.find((variant) => variant.size === selectedSize) || variants[0],
    [selectedColor, selectedSize, variants]
  );
  const selectedGift = giftOptions.find((gift) => gift.id === selectedGiftId) || null;
  const offers = useMemo(() => buildOffers(product), [product]);
  const selectedOffer = offers.find((offer) => offer.code === selectedOfferCode) || null;
  const activeImage = selectedImage || images[0];
  const itemPrice = selectedVariant?.price || product?.price || 0;
  const stock = Number(selectedVariant?.inventory?.stock ?? 0);
  const canAdd = Boolean(product && selectedSize && selectedColor && selectedVariant && stock > 0);

  function chooseColor(color: string) {
    setSelectedColor(color);
    const nextVariant = variants.find((variant) => variant.color === color && variant.size === selectedSize) || variants.find((variant) => variant.color === color);
    if (nextVariant?.size) setSelectedSize(nextVariant.size);

    const colorImage = images.find((image) => image.color?.toLowerCase() === color.toLowerCase());
    if (colorImage) setSelectedImage(colorImage);
  }

  function handleAddToCart() {
    if (!canAdd || !product) {
      setNotice('Choose an available color and size before adding to cart.');
      return;
    }

    addItem({
      productId: product.id,
      productName: product.name,
      price: itemPrice,
      quantity,
      size: selectedSize,
      color: selectedColor,
      image: activeImage?.url,
      variantId: selectedVariant?.id,
      giftOption: selectedGift ? { id: selectedGift.id, name: selectedGift.name, price: selectedGift.price } : null,
      offerCode: selectedOffer?.code,
      offerLabel: selectedOffer?.label
    });

    setNotice(`${product.name} added to cart with ${selectedColor}, ${selectedSize}${selectedGift ? ` and ${selectedGift.name}` : ''}.`);
  }

  if (loading) {
    return <ProductSkeleton />;
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-white px-5 py-20 text-center dark:bg-ink">
        <p className="text-2xl font-black text-ink dark:text-white">{error || 'Product not found'}</p>
        <Link href="/products" className="mt-5 inline-flex rounded bg-coral px-5 py-3 font-bold text-white">
          Back to products
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="mx-auto max-w-7xl px-4 py-4 text-sm text-black/55 dark:text-white/55">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/" className="hover:text-coral">Home</Link>
          <ChevronRight size={14} />
          <Link href="/products" className="hover:text-coral">Products</Link>
          <ChevronRight size={14} />
          <span className="font-bold text-ink dark:text-white">{product.name}</span>
        </div>
      </div>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-14 pt-4 lg:grid-cols-[minmax(0,1fr)_440px]">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            {activeImage?.url ? (
              <img src={activeImage.url} alt={activeImage.alt || product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-bold text-black/45 dark:text-white/45">No product photo</div>
            )}
            <button onClick={() => setShowZoom(true)} className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow" aria-label="Zoom product image">
              <Maximize2 size={18} />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {images.map((image, index) => (
              <button
                key={`${image.url}-${index}`}
                onClick={() => setSelectedImage(image)}
                className={`aspect-square overflow-hidden rounded border ${activeImage?.url === image.url ? 'border-coral ring-2 ring-coral/25' : 'border-black/10 dark:border-white/10'}`}
              >
                <img src={image.url} alt={image.alt || product.name} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <div>
            {product.theme?.name && <span className="inline-flex rounded bg-coral/10 px-3 py-1 text-xs font-black text-coral">{product.theme.name}</span>}
            <h1 className="mt-3 text-3xl font-black leading-tight md:text-4xl">{product.name}</h1>
            {product.description && <p className="mt-3 leading-7 theme-muted">{product.description}</p>}
          </div>

          <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
            <div className="flex flex-wrap items-end gap-3">
              <p className="text-3xl font-black text-coral">{formatCurrency(Math.round(itemPrice / 100))}</p>
              {product.mrp && product.mrp > itemPrice && <p className="pb-1 text-sm font-bold text-black/45 line-through dark:text-white/45">{formatCurrency(Math.round(product.mrp / 100))}</p>}
              {product.discountPercent > 0 && <span className="mb-1 rounded bg-mint/15 px-2 py-1 text-xs font-black text-ink dark:text-white">{product.discountPercent}% OFF</span>}
            </div>
            <p className="mt-2 text-xs font-bold text-black/45 dark:text-white/45">GST {product.gstPercent || 5}% included. Final total updates in cart.</p>
          </div>

          <ChoiceBlock title="Color" subtitle="Photos switch when a matching color image is available.">
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => chooseColor(color)}
                  className={`min-h-11 rounded px-4 text-sm font-black transition ${selectedColor === color ? 'bg-ink text-white dark:bg-white dark:text-ink' : 'border border-black/10 dark:border-white/10'}`}
                >
                  {color}
                </button>
              ))}
            </div>
          </ChoiceBlock>

          <ChoiceBlock
            title="Size"
            subtitle={selectedVariant ? `${stock} in stock for selected option` : 'Choose a color to see available sizes.'}
            action={<button onClick={() => setShowSizeChart(true)} className="inline-flex items-center gap-1 text-xs font-black text-coral"><Ruler size={14} /> Size chart</button>}
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
                    className={`min-h-11 min-w-12 rounded px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-35 ${selectedSize === size ? 'bg-coral text-white' : 'border border-black/10 dark:border-white/10'}`}
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

          <ChoiceBlock title="Delivery Details" subtitle="Check availability before checkout.">
            <div className="flex gap-2">
              <input
                value={pincode}
                onChange={(event) => setPincode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter Pincode"
                className="min-h-11 flex-1 rounded border px-3 font-bold outline-none"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
              <button
                type="button"
                className="rounded px-4 text-sm font-black text-white"
                style={{ backgroundColor: 'var(--color-primary)' }}
                onClick={() => setNotice(pincode.length === 6 ? 'Delivery available. Estimated dispatch in 2-4 business days.' : 'Enter a valid 6 digit pincode.')}
              >
                CHECK
              </button>
            </div>
          </ChoiceBlock>

          <div className="flex items-center gap-3">
            <div className="flex min-h-12 items-center rounded border border-black/10 dark:border-white/10">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3"><Minus size={18} /></button>
              <span className="min-w-10 text-center font-black">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="p-3"><Plus size={18} /></button>
            </div>
            <button onClick={handleAddToCart} disabled={!canAdd} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded bg-coral px-5 font-black text-white transition hover:bg-coral/90 disabled:cursor-not-allowed disabled:opacity-50">
              <ShoppingCart size={20} /> Add to cart
            </button>
          </div>

          {notice && <p className="rounded border border-mint/30 bg-mint/10 p-3 text-sm font-bold text-ink dark:text-white">{notice}</p>}

          <div className="grid gap-3 border-t border-black/10 pt-5 text-sm text-black/65 dark:border-white/10 dark:text-white/65">
            <InfoRow icon={<Truck size={18} />} title="Delivery and GST" text="Cart shows subtotal, GST, shipping, gift pack, and final total before checkout." />
            <InfoRow icon={<PackageCheck size={18} />} title="Return Policy" text="Eligible items can be returned or exchanged under the configured return policy." />
            <InfoRow icon={<Heart size={18} />} title="Wishlist" text="Save products after login. Guest cart still works before login." />
            <InfoRow icon={<Share2 size={18} />} title="Share or influencer link" text="Referral and influencer links can be tracked when opened with a valid code." />
          </div>
        </aside>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 lg:grid-cols-[1fr_0.9fr]">
        <article className="theme-surface rounded border p-5">
          <h2 className="text-2xl font-black">Product Details</h2>
          <div className="mt-5 grid gap-3 text-sm">
            <DetailRow label="Brand" value={product.brand || 'Fly Free'} />
            <DetailRow label="Material" value={product.material || 'Premium cotton blend'} />
            <DetailRow label="Fit" value={product.gender || 'UNISEX'} />
            <DetailRow label="Wash care" value={product.washCare || 'Gentle machine wash. Do not bleach.'} />
            <DetailRow label="Category" value={product.category?.name || 'Apparel'} />
            <DetailRow label="Theme" value={product.theme?.name || 'Fly Free'} />
          </div>
          {product.description && <p className="mt-5 leading-7 theme-muted">{product.description}</p>}
        </article>

        <article className="theme-surface rounded border p-5">
          <h2 className="text-2xl font-black">Customer Reviews</h2>
          <div className="mt-5 grid gap-4">
            {(product.reviews || []).length > 0 ? (
              product.reviews.map((review: any) => (
                <div key={review.id} className="rounded border p-4" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black">{review.user?.name || 'Fly Free customer'}</p>
                      {review.title && <p className="text-sm theme-muted">{review.title}</p>}
                    </div>
                    <span className="inline-flex items-center gap-1 rounded bg-coral/10 px-2 py-1 text-sm font-black text-coral">
                      <Star size={14} fill="currentColor" /> {review.rating}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 theme-muted">{review.body}</p>
                </div>
              ))
            ) : (
              <p className="theme-muted">No approved reviews yet. Verified customers can review after purchase.</p>
            )}
          </div>
        </article>
      </section>

      {showSizeChart && (
        <Modal title="Size chart" onClose={() => setShowSizeChart(false)}>
          <div className="prose max-w-none text-sm leading-7 text-black/70">
            {sizeChart ? (
              <p className="whitespace-pre-wrap">{sizeChart}</p>
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
      <span className="theme-muted">{label}</span>
      <span className="text-right font-bold">{value}</span>
    </div>
  );
}

function ChoiceBlock({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide">{title}</h2>
          {subtitle && <p className="mt-1 text-xs font-bold text-black/45 dark:text-white/45">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function OptionButton({ active, onClick, title, text, icon }: { active: boolean; onClick: () => void; title: string; text: string; icon?: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`flex items-start gap-3 rounded border p-3 text-left transition ${active ? 'border-coral bg-coral/10' : 'border-black/10 dark:border-white/10'}`}>
      <span className="mt-0.5 text-coral">{icon || <Info size={16} />}</span>
      <span>
        <span className="block text-sm font-black">{title}</span>
        <span className="mt-1 block text-xs font-bold text-black/50 dark:text-white/50">{text}</span>
      </span>
    </button>
  );
}

function InfoRow({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-coral">{icon}</span>
      <span>
        <span className="block font-black text-ink dark:text-white">{title}</span>
        <span>{text}</span>
      </span>
    </div>
  );
}

function Modal({ title, children, onClose, wide }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className={`max-h-[90vh] overflow-auto rounded-lg bg-white p-5 text-ink shadow-2xl ${wide ? 'w-full max-w-4xl' : 'w-full max-w-lg'}`}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-black">{title}</h2>
          <button onClick={onClose} className="rounded border border-black/10 p-2"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <main className="min-h-screen bg-white px-4 py-10 dark:bg-ink">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_440px]">
        <div className="aspect-square animate-pulse rounded-lg bg-black/5 dark:bg-white/10" />
        <div className="space-y-4">
          <div className="h-5 w-24 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="h-10 w-3/4 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="h-24 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="h-40 animate-pulse rounded bg-black/10 dark:bg-white/10" />
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
