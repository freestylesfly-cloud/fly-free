'use client';

import Link from 'next/link';
import { ArrowRight, Minus, Plus, ShoppingCart as CartIcon, Trash2 } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useCartStore } from '../stores/cartStore';

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const getTax = useCartStore((state) => state.getTax);
  const getTotal = useCartStore((state) => state.getTotal);

  if (items.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-5" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="max-w-sm space-y-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <CartIcon size={42} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <div>
            <h1 className="mb-2 text-3xl font-black" style={{ color: 'var(--text-primary)' }}>Your cart is empty</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Add products, choose size/color, and come back here.</p>
          </div>
          <Link href="/products" className="inline-flex items-center gap-2 rounded px-8 py-3 font-bold text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>
            Continue shopping
            <ArrowRight size={18} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="mx-auto max-w-7xl px-4 py-10 md:py-12">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-black" style={{ color: 'var(--text-primary)' }}>Shopping Cart</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {items.length} selected item{items.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-4">
            {items.map((item) => {
              const linePrice = item.price * item.quantity;

              return (
                <article
                  key={`${item.productId}-${item.variantId || 'variant'}-${item.size}-${item.color}-${item.hamperId || 'no-hamper'}-${item.offerCode || 'no-offer'}`}
                  className="grid gap-4 rounded-lg p-4 sm:grid-cols-[112px_minmax(0,1fr)_130px]"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderWidth: '1px' }}
                >
                  <div className="aspect-square overflow-hidden rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
                    {item.image ? (
                      <img src={item.image} alt={item.productName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
                        <CartIcon size={32} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-black" style={{ color: 'var(--text-primary)' }}>{item.productName}</h2>
                    <p className="mt-1 text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                      {item.size} / {item.color}
                    </p>

                    {(item.hamperName || item.offerLabel) && (
                      <div className="mt-3 space-y-1 rounded p-3 text-xs font-bold" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', borderWidth: '1px', color: 'var(--text-secondary)' }}>
                        {item.hamperName && (
                          <p>Hamper: {item.hamperName}</p>
                        )}
                        {item.offerLabel && <p>Offer: {item.offerLabel}</p>}
                      </div>
                    )}

                    <div className="mt-4 flex w-fit items-center rounded" style={{ borderColor: 'var(--border-color)', borderWidth: '1px' }}>
                      <button onClick={() => updateQuantity(item.productId, item.size, item.color, Math.max(1, item.quantity - 1))} className="p-2 transition hover:opacity-70" style={{ backgroundColor: 'var(--bg-primary)' }}>
                        <Minus size={16} />
                      </button>
                      <span className="min-w-10 text-center font-black" style={{ color: 'var(--text-primary)' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity + 1)} className="p-2 transition hover:opacity-70" style={{ backgroundColor: 'var(--bg-primary)' }}>
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-4 sm:flex-col sm:items-end">
                    <div className="text-left sm:text-right">
                      <p className="text-xl font-black" style={{ color: 'var(--color-primary)' }}>{formatCurrency(linePrice)}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(item.price)} product</p>
                    </div>
                    <button onClick={() => removeItem(item.productId, item.size, item.color)} className="rounded p-2 transition hover:opacity-70" style={{ color: 'var(--color-primary)' }} title="Remove from cart">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </article>
              );
            })}

            <Link href="/products" className="inline-flex items-center gap-2 font-bold hover:underline transition" style={{ color: 'var(--color-primary)' }}>
              Back to shopping
            </Link>
          </section>

          <aside className="lg:col-span-1">
            <div className="sticky top-20 space-y-6 rounded-lg p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderWidth: '1px' }}>
              <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Order Summary</h2>

              <div className="space-y-3 pb-6" style={{ borderBottomColor: 'var(--border-color)', borderBottomWidth: '1px' }}>
                <SummaryRow label="Subtotal" value={formatCurrency(getSubtotal())} />
                <SummaryRow label="GST (18%)" value={formatCurrency(getTax())} />
                <SummaryRow label="Shipping" value="FREE" highlight />
              </div>

              <div className="flex justify-between text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                <span>Total</span>
                <span style={{ color: 'var(--color-primary)' }}>{formatCurrency(getTotal())}</span>
              </div>

              <Link href="/checkout" className="flex w-full items-center justify-center gap-2 rounded py-3 text-center font-bold text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>
                Proceed to checkout
                <ArrowRight size={18} />
              </Link>

              <button onClick={clearCart} className="w-full py-2 font-bold transition hover:underline" style={{ color: 'var(--color-primary)' }}>
                Clear cart
              </button>

              <div className="space-y-2 pt-5 text-xs font-bold" style={{ borderTopColor: 'var(--border-color)', borderTopWidth: '1px', color: 'var(--text-secondary)' }}>
                <p>Free shipping on all orders</p>
                <p>Hampers and product offers are included in subtotal</p>
                <p>Checkout requires login, cart works before login</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
      <span>{label}</span>
      <span className={highlight ? 'font-black' : ''} style={highlight ? { color: 'var(--color-primary)' } : {}}>{value}</span>
    </div>
  );
}
