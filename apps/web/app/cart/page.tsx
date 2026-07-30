'use client';

import Link from 'next/link';
import { ArrowRight, BadgeCheck, Minus, Plus, ShieldCheck, ShoppingBag, ShoppingCart as CartIcon, Trash2, Truck } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { CartItem, useCartStore } from '../stores/cartStore';

function cartLineKey(item: CartItem) {
  return `${item.productId}-${item.variantId || 'variant'}-${item.size}-${item.color}-${item.hamperId || 'no-hamper'}-${item.offerCode || 'no-offer'}`;
}

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const getTax = useCartStore((state) => state.getTax);
  const getTotal = useCartStore((state) => state.getTotal);
  const subtotal = getSubtotal();
  const tax = getTax();
  const total = getTotal();
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  if (items.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 py-16" style={{ backgroundColor: 'var(--bg-primary)' }}>
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
    <main className="min-h-screen pb-28 lg:pb-0" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
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

            return (
              <article
                key={cartLineKey(item)}
                className="grid gap-4 rounded-lg border p-3 shadow-sm transition hover:shadow-md sm:grid-cols-[116px_minmax(0,1fr)] lg:grid-cols-[128px_minmax(0,1fr)_150px]"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
              >
                <div className="aspect-square overflow-hidden rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  {item.image ? (
                    <img src={item.image} alt={item.productName} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
                      <CartIcon size={32} />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="line-clamp-2 text-lg font-black">{item.productName}</h2>
                      <p className="mt-1 text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>{item.color} / {item.size}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId, item.size, item.color, item.variantId, item.hamperId, item.offerCode)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded border text-red-600 transition hover:bg-red-50"
                      style={{ borderColor: 'var(--border-color)' }}
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
                        onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity + 1, item.variantId, item.hamperId, item.offerCode)}
                        className="flex h-full w-11 items-center justify-center transition hover:bg-black/5"
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
              <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Taxes are calculated before checkout.</p>
            </div>

            <div className="space-y-3 border-y py-5" style={{ borderColor: 'var(--border-color)' }}>
              <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
              <SummaryRow label="GST (18%)" value={formatCurrency(tax)} />
              <SummaryRow label="Shipping" value="FREE" highlight />
            </div>

            <div className="flex justify-between text-2xl font-black">
              <span>Total</span>
              <span style={{ color: 'var(--color-primary)' }}>{formatCurrency(total)}</span>
            </div>

            <Link href="/checkout" className="flex w-full items-center justify-center gap-2 rounded py-3 text-center font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg" style={{ backgroundColor: 'var(--color-primary)' }}>
              Proceed to checkout
              <ArrowRight size={18} />
            </Link>

            <div className="grid gap-3 pt-2 text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
              <TrustRow icon={<Truck size={17} />} text="Free shipping on all orders" />
              <TrustRow icon={<ShieldCheck size={17} />} text="Secure Razorpay checkout" />
              <TrustRow icon={<BadgeCheck size={17} />} text="Offers and hampers stay attached" />
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-white p-3 lg:hidden" style={{ borderColor: 'var(--border-color)' }}>
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

function TrustRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
      <span>{text}</span>
    </div>
  );
}
