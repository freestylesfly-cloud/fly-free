'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Minus, Plus, ShieldCheck, ShoppingBag, ShoppingCart as CartIcon, Trash2, Truck } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { CartItem, useCartStore } from '../stores/cartStore';
import { getApiBaseUrl } from '../lib/api';

function cartLineKey(item: CartItem) {
  return `${item.productId}-${item.variantId || 'variant'}-${item.size}-${item.color}-${item.hamperId || 'no-hamper'}-${item.offerCode || 'no-offer'}`;
}

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const getShippingFee = useCartStore((state) => state.getShippingFee);
  const getAmountToFreeDelivery = useCartStore((state) => state.getAmountToFreeDelivery);
  const getTotal = useCartStore((state) => state.getTotal);
  const loadDeliverySettings = useCartStore((state) => state.loadDeliverySettings);
  const updateProductSlug = useCartStore((state) => state.updateProductSlug);
  const freeDeliveryAbove = useCartStore((state) => state.freeDeliveryAbove);
  const subtotal = getSubtotal();
  const shipping = getShippingFee();
  const toFreeDelivery = getAmountToFreeDelivery();
  const total = getTotal();
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    void loadDeliverySettings();
  }, [loadDeliverySettings]);

  useEffect(() => {
    const itemsMissingSlug = items.filter((item) => !item.productSlug);
    if (!hasHydrated || itemsMissingSlug.length === 0) return;

    let cancelled = false;
    async function resolveCartSlugs() {
      await Promise.all(
        itemsMissingSlug.map(async (item) => {
          try {
            const response = await fetch(`${getApiBaseUrl()}/catalog/products/${item.productId}`, { cache: 'force-cache' });
            if (!response.ok || cancelled) return;
            const body = await response.json();
            const product = body?.data || body;
            if (product?.slug) updateProductSlug(item.productId, String(product.slug));
          } catch {
            // Keep the item in cart; the fallback link goes to all products.
          }
        })
      );
    }

    void resolveCartSlugs();
    return () => {
      cancelled = true;
    };
  }, [hasHydrated, items, updateProductSlug]);

  if (!hasHydrated) {
    return <CartSkeleton />;
  }

  if (items.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 py-16 pb-28 lg:pb-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <CartIcon size={42} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <h1 className="mt-6 text-3xl font-black md:text-4xl" style={{ color: 'var(--text-primary)' }}>Your cart is empty</h1>
          <p className="mt-3 leading-7" style={{ color: 'var(--text-secondary)' }}>Pick your tee, choose the right fit, and your cart will keep it ready for checkout.</p>
          <Link href="/products" className="mt-7 inline-flex items-center gap-2 rounded px-8 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg" style={{ backgroundColor: 'var(--color-primary)' }}>
            Start shopping
            <ArrowRight size={18} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-48 lg:pb-0" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <section className="border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-9">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase" style={{ color: 'var(--text-secondary)' }}>Secure cart</p>
              <h1 className="mt-2 text-3xl font-black md:text-5xl">Shopping cart</h1>
              <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>{totalQuantity} item{totalQuantity !== 1 ? 's' : ''} across {items.length} cart line{items.length !== 1 ? 's' : ''}</p>
            </div>
            <Link href="/products" className="inline-flex w-fit items-center gap-2 rounded border px-4 py-3 text-sm font-black transition hover:-translate-y-0.5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
              Continue shopping <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:py-8">
        <section className="space-y-4">
          {items.map((item) => {
            const linePrice = item.price * item.quantity;
            const productHref = item.productSlug ? `/products/${item.productSlug}` : '/products';

            return (
              <article
                key={cartLineKey(item)}
                className="grid gap-4 rounded-lg border p-3 shadow-sm transition hover:shadow-md sm:grid-cols-[116px_minmax(0,1fr)] lg:grid-cols-[128px_minmax(0,1fr)_150px]"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
              >
                <Link href={productHref} className="aspect-square overflow-hidden rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }} aria-label={item.productSlug ? `Open ${item.productName}` : 'Open all products'}>
                  {item.image ? (
                    <img src={item.image} alt={item.productName} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
                      <CartIcon size={32} />
                    </div>
                  )}
                </Link>

                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={productHref} className="line-clamp-2 text-lg font-black transition hover:opacity-70">{item.productName}</Link>
                      {!item.productSlug && <p className="mt-1 text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>Opening product link...</p>}
                      <p className="mt-1 text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>{formatVariant(item)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId, item.size, item.color, item.variantId, item.hamperId, item.offerCode)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded border transition hover:bg-black/5"
                      style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                      title="Remove from cart"
                      aria-label="Remove from cart"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {(item.hamperName || item.offerLabel) && (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                      {item.hamperName && <span className="rounded-full px-3 py-1" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>Hamper: {item.hamperName}</span>}
                      {item.offerLabel && <span className="rounded-full px-3 py-1 text-white" style={{ backgroundColor: 'var(--color-primary)' }}>Offer: {item.offerLabel}</span>}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="inline-flex h-11 items-center overflow-hidden rounded border" style={{ borderColor: 'var(--border-color)' }}>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.size, item.color, Math.max(1, item.quantity - 1), item.variantId, item.hamperId, item.offerCode)}
                        className="flex h-full w-11 items-center justify-center transition hover:bg-black/5"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="min-w-12 text-center font-black">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.size, item.color, item.maxStock && item.maxStock > 0 ? Math.min(item.maxStock, item.quantity + 1) : item.quantity + 1, item.variantId, item.hamperId, item.offerCode)}
                        disabled={Boolean(item.maxStock && item.maxStock > 0 && item.quantity >= item.maxStock)}
                        className="flex h-full w-11 items-center justify-center transition hover:bg-black/5 disabled:opacity-40"
                        aria-label="Increase quantity"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="text-right lg:hidden">
                      <p className="text-lg font-black" style={{ color: 'var(--color-primary)' }}>{formatCurrency(linePrice)}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(item.price)} each</p>
                    </div>
                  </div>
                </div>

                <div className="hidden text-right lg:flex lg:flex-col lg:items-end lg:justify-center">
                  <p className="text-xl font-black" style={{ color: 'var(--color-primary)' }}>{formatCurrency(linePrice)}</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(item.price)} each</p>
                </div>
              </article>
            );
          })}

          <button type="button" onClick={clearCart} className="rounded border px-4 py-3 text-sm font-black transition hover:bg-black/5" style={{ borderColor: 'var(--border-color)' }}>
            Clear cart
          </button>
        </section>

        <aside>
          <div className="sticky top-24 space-y-5 rounded-lg border p-5 shadow-sm" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <div>
              <h2 className="text-2xl font-black">Order summary</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Item total plus delivery. No other charges.
              </p>
            </div>

            <div className="space-y-3 border-y py-5" style={{ borderColor: 'var(--border-color)' }}>
              <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
              <SummaryRow
                label="Delivery"
                value={shipping === 0 ? 'FREE' : formatCurrency(shipping)}
                highlight={shipping === 0}
              />
            </div>

            {toFreeDelivery > 0 && (
              <p
                className="rounded border px-3 py-2 text-sm font-bold"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                Add {formatCurrency(toFreeDelivery)} more to get free delivery.
              </p>
            )}

            <div className="flex justify-between text-2xl font-black">
              <span>Total</span>
              <span style={{ color: 'var(--color-primary)' }}>{formatCurrency(total)}</span>
            </div>

            <Link href="/checkout" className="flex w-full items-center justify-center gap-2 rounded py-3 text-center font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg" style={{ backgroundColor: 'var(--color-primary)' }}>
              Proceed to checkout
              <ArrowRight size={18} />
            </Link>

            <div className="grid gap-3 pt-2 text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
              <TrustRow icon={<Truck size={17} />} text={`Free delivery over ${formatCurrency(freeDeliveryAbove)}`} />
              <TrustRow icon={<ShieldCheck size={17} />} text="Secure Razorpay checkout" />
              <TrustRow icon={<BadgeCheck size={17} />} text="7-day exchange on eligible items" />
            </div>
          </div>
        </aside>
      </div>

      <div
        className="fixed inset-x-3 bottom-[88px] z-30 rounded-2xl border bg-white p-3 shadow-xl lg:hidden"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_1.2fr] gap-3">
          <div>
            <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Total</p>
            <p className="text-lg font-black" style={{ color: 'var(--color-primary)' }}>{formatCurrency(total)}</p>
          </div>
          <Link href="/checkout" className="flex items-center justify-center gap-2 rounded px-4 py-3 text-sm font-black text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
            Checkout <ShoppingBag size={17} />
          </Link>
        </div>
      </div>
    </main>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
      <span>{label}</span>
      <span className={highlight ? 'font-black' : 'font-bold'} style={highlight ? { color: 'var(--color-primary)' } : { color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function formatVariant(item: { size?: string; color?: string }) {
  const color = String(item.color || '').trim();
  return [item.size, color && color.toLowerCase() !== 'default' ? color : ''].filter(Boolean).join(' / ');
}

function CartSkeleton() {
  return (
    <main className="min-h-screen pb-28" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <section className="border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
          <div className="h-5 w-28 animate-pulse rounded bg-black/10" />
          <div className="mt-3 h-10 w-56 animate-pulse rounded bg-black/10" />
        </div>
      </section>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:px-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="grid gap-4 rounded-lg border p-3 sm:grid-cols-[116px_minmax(0,1fr)]" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <div className="aspect-square animate-pulse rounded bg-black/10" />
              <div className="space-y-3 py-2">
                <div className="h-5 w-3/4 animate-pulse rounded bg-black/10" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-black/10" />
                <div className="h-10 w-32 animate-pulse rounded bg-black/10" />
              </div>
            </div>
          ))}
        </section>
        <aside className="hidden rounded-lg border p-5 lg:block" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <div className="h-7 w-40 animate-pulse rounded bg-black/10" />
          <div className="mt-6 space-y-3">
            <div className="h-4 animate-pulse rounded bg-black/10" />
            <div className="h-4 animate-pulse rounded bg-black/10" />
            <div className="h-12 animate-pulse rounded bg-black/10" />
          </div>
        </aside>
      </div>
    </main>
  );
}

function TrustRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
      <span>{text}</span>
    </div>
  );
}
