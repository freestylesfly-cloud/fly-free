'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Package, ReceiptText, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

type OrderDetail = {
  id: string;
  orderNumber?: string;
  status: string;
  paymentStatus?: string;
  subtotal?: number;
  discount?: number;
  shipping?: number;
  total: number;
  createdAt: string;
  shippingAddress?: {
    fullName?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    phone?: string;
  };
  items: Array<{
    id?: string;
    name: string;
    sku?: string;
    quantity: number;
    price: number;
    total?: number;
  }>;
  statusHistory?: Array<{ id?: string; status: string; note?: string; createdAt: string }>;
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const token = useAuthStore((state) => state.token);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  /** Reopen Razorpay for an order that was never successfully paid. */
  async function handleRetryPayment() {
    if (!order || !token) return;

    setPaying(true);
    setPayError('');

    try {
      const res = await fetch('/api/commerce/payment/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId: order.id })
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message || body?.error || 'Could not start the payment');

      const data = body.data || body;
      const key = data.razorpayKeyId;

      if (typeof window === 'undefined' || !(window as any).Razorpay) {
        throw new Error('Payment library failed to load. Please refresh and try again.');
      }
      if (!key || !data.razorpayOrderId) {
        throw new Error('Payments are not configured. Please contact support.');
      }

      const razorpay = new (window as any).Razorpay({
        key,
        amount: Math.round(Number(data.amount) * 100),
        currency: 'INR',
        name: 'Fly Free',
        description: `Order ${order.orderNumber || order.id}`,
        order_id: data.razorpayOrderId,
        handler: async (response: any) => {
          const verify = await fetch('/api/commerce/checkout/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              orderId: order.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            })
          });

          if (verify.ok) {
            window.location.href = `/order-success?orderId=${order.id}`;
          } else {
            setPaying(false);
            setPayError('We could not confirm that payment. Please contact support before retrying.');
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            document.body.style.overflow = '';
          }
        }
      });

      razorpay.on('payment.failed', (event: any) => {
        setPaying(false);
        setPayError(event?.error?.description || 'Payment failed. Please try again.');
      });

      razorpay.open();
    } catch (err) {
      setPaying(false);
      setPayError(err instanceof Error ? err.message : 'Could not start the payment');
    }
  }

  useEffect(() => {
    async function loadOrder() {
      if (!params?.id || !token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const res = await fetch(`/api/ecommerce/orders/${params.id}/track`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          throw new Error('Order not found');
        }

        const data = await res.json();
        setOrder(data?.data || data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setLoading(false);
      }
    }

    void loadOrder();
  }, [params?.id, token]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
      </main>
    );
  }

  if (!token || error || !order) {
    return (
      <main className="min-h-screen px-4 py-12" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <section className="mx-auto max-w-xl rounded-lg border p-8 text-center" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <Package className="mx-auto mb-4 h-12 w-12" style={{ color: 'var(--text-tertiary)' }} />
          <h1 className="text-2xl font-black">Order not found</h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>{error || 'Please sign in to view this order.'}</p>
          <Link href="/profile/orders" className="mt-6 inline-flex rounded px-5 py-3 text-sm font-black text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
            Back to orders
          </Link>
        </section>
      </main>
    );
  }

  const subtotal = order.subtotal ?? order.items.reduce((sum, item) => sum + (item.total ?? item.price * item.quantity), 0);

  return (
    <main className="min-h-screen px-4 py-8 pb-24 md:pb-10" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <section className="mx-auto max-w-5xl">
        <Link href="/profile/orders" className="mb-6 inline-flex items-center gap-2 text-sm font-black" style={{ color: 'var(--color-primary)' }}>
          <ArrowLeft size={16} /> Back to orders
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <article className="rounded-lg border p-5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <p className="text-xs font-black uppercase" style={{ color: 'var(--text-secondary)' }}>Order number</p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-black">#{order.orderNumber || order.id.slice(-8)}</h1>
                <span className="w-fit rounded-full px-3 py-1 text-xs font-black text-white" style={{ backgroundColor: 'var(--color-primary)' }}>{order.status}</span>
              </div>
              <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Placed {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </article>

            <article className="rounded-lg border p-5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <h2 className="mb-4 text-lg font-black">Items</h2>
              <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {order.items.map((item, index) => (
                  <div key={item.id || `${item.sku}-${index}`} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                    <div>
                      <h3 className="font-black">{item.name}</h3>
                      {item.sku && <p className="mt-1 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>SKU: {item.sku}</p>}
                      <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Qty: {item.quantity}</p>
                    </div>
                    <p className="font-black" style={{ color: 'var(--color-primary)' }}>{formatRupees(item.total ?? item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-lg border p-5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <h2 className="mb-4 text-lg font-black">Timeline</h2>
              <div className="space-y-3">
                {(order.statusHistory?.length ? order.statusHistory : [{ status: order.status, createdAt: order.createdAt, note: 'Order created.' }]).map((event, index) => (
                  <div key={event.id || `${event.status}-${index}`} className="rounded border p-3" style={{ borderColor: 'var(--border-color)' }}>
                    <p className="text-sm font-black">{event.status}</p>
                    <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>{new Date(event.createdAt).toLocaleString('en-IN')}</p>
                    {event.note && <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{event.note}</p>}
                  </div>
                ))}
              </div>
            </article>
          </div>

          <aside className="space-y-6">
            <article className="rounded-lg border p-5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <div className="mb-4 flex items-center gap-2 text-lg font-black">
                <ReceiptText size={20} /> Payment summary
              </div>
              <SummaryRow label="Subtotal" value={formatRupees(subtotal)} />
              {(order.discount || 0) > 0 && <SummaryRow label="Discount" value={`-${formatRupees(order.discount || 0)}`} />}
              <SummaryRow label="Shipping" value={(order.shipping || 0) > 0 ? formatRupees(order.shipping || 0) : 'FREE'} />
              <SummaryRow label="Payment" value={order.paymentStatus || 'Pending'} />
              <div className="mt-4 flex justify-between border-t pt-4 text-lg font-black" style={{ borderColor: 'var(--border-color)' }}>
                <span>Total</span>
                <span style={{ color: 'var(--color-primary)' }}>{formatRupees(order.total)}</span>
              </div>

              {/* An unpaid order is not a dead end — let the customer pay for it. */}
              {order.paymentStatus !== 'PAID' && (
                <div className="mt-5 border-t pt-5" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="mb-3 text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                    {order.paymentStatus === 'FAILED'
                      ? 'The last payment attempt did not go through.'
                      : 'This order has not been paid yet.'}
                  </p>
                  {payError && (
                    <p className="mb-3 rounded border p-3 text-sm font-bold" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
                      {payError}
                    </p>
                  )}
                  <button
                    onClick={handleRetryPayment}
                    disabled={paying}
                    className="w-full rounded-lg px-4 py-3 font-black text-white transition hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    {paying ? 'Opening payment…' : 'Pay now'}
                  </button>
                </div>
              )}
            </article>

            {order.shippingAddress && (
              <article className="rounded-lg border p-5 text-sm" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <h2 className="mb-3 text-lg font-black">Shipping address</h2>
                <p className="font-black">{order.shippingAddress.fullName}</p>
                <p className="mt-2 leading-6" style={{ color: 'var(--text-secondary)' }}>
                  {[order.shippingAddress.line1, order.shippingAddress.line2, order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.postalCode].filter(Boolean).join(', ')}
                </p>
                {order.shippingAddress.phone && <p className="mt-2 font-bold" style={{ color: 'var(--text-secondary)' }}>{order.shippingAddress.phone}</p>}
              </article>
            )}

            <article className="rounded-lg border p-5 text-center" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <div className="mb-3 flex justify-center">
                <MessageSquare size={24} style={{ color: 'var(--color-primary)' }} />
              </div>
              <h2 className="mb-2 text-lg font-black">Share Your Review</h2>
              <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>Help other customers discover great products</p>
              <Link
                href={`/orders/${order.id}/review`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-bold text-white transition hover:opacity-90"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <MessageSquare size={18} />
                Write a Review
              </Link>
            </article>
          </aside>
        </div>
      </section>
    </main>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 text-sm">
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function formatRupees(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
}
