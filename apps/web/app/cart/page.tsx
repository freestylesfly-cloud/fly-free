'use client';

import Link from 'next/link';
import { ArrowRight, Minus, Plus, ShoppingCart as CartIcon, Trash2 } from 'lucide-react';
import { formatCurrency } from '@flyfree/utils';
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
      <main className="flex min-h-screen flex-col items-center justify-center bg-white px-5 dark:bg-ink">
        <div className="max-w-sm space-y-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-paper dark:bg-white/5">
            <CartIcon size={42} className="text-ink/30 dark:text-white/30" />
          </div>
          <div>
            <h1 className="mb-2 text-3xl font-black text-ink dark:text-white">Your cart is empty</h1>
            <p className="text-ink/60 dark:text-white/60">Add products, choose size/color, and come back here.</p>
          </div>
          <Link href="/products" className="inline-flex items-center gap-2 rounded bg-coral px-8 py-3 font-bold text-white transition hover:bg-coral/90">
            Continue shopping
            <ArrowRight size={18} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-ink">
      <div className="mx-auto max-w-7xl px-4 py-10 md:py-12">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-black text-ink dark:text-white">Shopping Cart</h1>
          <p className="text-ink/60 dark:text-white/60">
            {items.length} selected item{items.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-4">
            {items.map((item) => {
              const giftPrice = item.giftOption?.price || 0;
              const linePrice = (item.price + giftPrice) * item.quantity;

              return (
                <article
                  key={`${item.productId}-${item.variantId || 'variant'}-${item.size}-${item.color}-${item.giftOption?.id || 'no-gift'}-${item.offerCode || 'no-offer'}`}
                  className="grid gap-4 rounded-lg bg-paper p-4 dark:bg-white/5 sm:grid-cols-[112px_minmax(0,1fr)_130px]"
                >
                  <div className="aspect-square overflow-hidden rounded-lg bg-white dark:bg-ink">
                    {item.image ? (
                      <img src={item.image} alt={item.productName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-ink/30 dark:text-white/30">
                        <CartIcon size={32} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-black text-ink dark:text-white">{item.productName}</h2>
                    <p className="mt-1 text-sm font-bold text-ink/55 dark:text-white/55">
                      {item.size} / {item.color}
                    </p>

                    {(item.giftOption || item.offerLabel) && (
                      <div className="mt-3 space-y-1 rounded border border-black/10 bg-white p-3 text-xs font-bold text-ink/60 dark:border-white/10 dark:bg-ink dark:text-white/60">
                        {item.giftOption && (
                          <p>
                            Gift pack: {item.giftOption.name}
                            {item.giftOption.price ? ` (+${formatCurrency(item.giftOption.price)})` : ''}
                          </p>
                        )}
                        {item.offerLabel && <p>Offer: {item.offerLabel}</p>}
                      </div>
                    )}

                    <div className="mt-4 flex w-fit items-center rounded border border-black/10 dark:border-white/10">
                      <button onClick={() => updateQuantity(item.productId, item.size, item.color, Math.max(1, item.quantity - 1))} className="p-2 transition hover:bg-black/5 dark:hover:bg-white/5">
                        <Minus size={16} />
                      </button>
                      <span className="min-w-10 text-center font-black text-ink dark:text-white">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity + 1)} className="p-2 transition hover:bg-black/5 dark:hover:bg-white/5">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-4 sm:flex-col sm:items-end">
                    <div className="text-left sm:text-right">
                      <p className="text-xl font-black text-coral">{formatCurrency(linePrice)}</p>
                      <p className="text-xs text-ink/60 dark:text-white/60">{formatCurrency(item.price)} product</p>
                      {giftPrice > 0 && <p className="text-xs text-ink/45 dark:text-white/45">+ {formatCurrency(giftPrice)} gift</p>}
                    </div>
                    <button onClick={() => removeItem(item.productId, item.size, item.color)} className="rounded p-2 text-red-500 transition hover:bg-red-500/10" title="Remove from cart">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </article>
              );
            })}

            <Link href="/products" className="inline-flex items-center gap-2 font-bold text-coral hover:underline">
              Back to shopping
            </Link>
          </section>

          <aside className="lg:col-span-1">
            <div className="sticky top-20 space-y-6 rounded-lg bg-paper p-6 dark:bg-white/5">
              <h2 className="text-2xl font-black text-ink dark:text-white">Order Summary</h2>

              <div className="space-y-3 border-b border-black/10 pb-6 dark:border-white/10">
                <SummaryRow label="Subtotal" value={formatCurrency(getSubtotal())} />
                <SummaryRow label="GST (18%)" value={formatCurrency(getTax())} />
                <SummaryRow label="Shipping" value="FREE" highlight />
              </div>

              <div className="flex justify-between text-2xl font-black text-ink dark:text-white">
                <span>Total</span>
                <span className="text-coral">{formatCurrency(getTotal())}</span>
              </div>

              <Link href="/checkout" className="flex w-full items-center justify-center gap-2 rounded bg-coral py-3 text-center font-bold text-white transition hover:bg-coral/90">
                Proceed to checkout
                <ArrowRight size={18} />
              </Link>

              <button onClick={clearCart} className="w-full py-2 font-bold text-coral transition hover:underline">
                Clear cart
              </button>

              <div className="space-y-2 border-t border-black/10 pt-5 text-xs font-bold text-ink/55 dark:border-white/10 dark:text-white/55">
                <p>Free shipping on all orders</p>
                <p>Gift packs and product offers are included in subtotal</p>
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
    <div className="flex justify-between text-ink/70 dark:text-white/70">
      <span>{label}</span>
      <span className={highlight ? 'font-black text-coral' : ''}>{value}</span>
    </div>
  );
}
