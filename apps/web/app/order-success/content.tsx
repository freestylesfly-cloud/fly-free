'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Loader2, Download, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { getApiBaseUrl } from '../lib/api';

const API_URL = getApiBaseUrl();

export default function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const token = useAuthStore((state) => state.token);

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId || !token) {
      setError('Missing order information');
      setLoading(false);
      return;
    }

    async function loadOrder() {
      try {
        const res = await fetch(`${API_URL}/ecommerce/orders/${orderId}/track`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setOrder(data.data || data);
        } else {
          setError('Order not found');
        }
      } catch (err) {
        setError('Failed to load order');
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId, token]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 pb-28 md:pb-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading order details...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 pb-28 md:pb-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-10">
          <CheckCircle size={72} className="mx-auto mb-5" style={{ color: 'var(--color-secondary)' }} />
          <h1 className="text-4xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Order Confirmed!</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-lg">Thank you for your purchase</p>
        </div>

        {order && (
          <>
            {/* Invoice Card */}
            <div className="rounded-xl shadow-lg overflow-hidden mb-8" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderWidth: '1px' }}>

              {/* Invoice Header */}
              <div className="px-6 md:px-8 py-8" style={{ backgroundColor: 'var(--color-primary)' }}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-white">Fly Free</h2>
                    <p className="text-white/80 text-sm mt-1">Premium T-Shirts & Streetwear</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/80 text-xs font-bold mb-1">INVOICE</p>
                    <p className="text-white text-lg font-black">#{order.id?.substring(0, 8).toUpperCase()}</p>
                  </div>
                </div>
              </div>

              {/* Invoice Body */}
              <div className="px-6 md:px-8 py-8">

                {/* Order Info Grid */}
                <div className="grid md:grid-cols-3 gap-8 mb-10 pb-10" style={{ borderBottomColor: 'var(--border-color)', borderBottomWidth: '1px' }}>
                  <div>
                    <p className="text-xs font-black uppercase mb-2" style={{ color: 'var(--text-secondary)' }}>Order Date</p>
                    <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase mb-2" style={{ color: 'var(--text-secondary)' }}>Order Status</p>
                    <p className="text-lg font-black px-3 py-1 rounded inline-block text-white" style={{ backgroundColor: 'var(--color-secondary)' }}>
                      {order.status || 'PLACED'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase mb-2" style={{ color: 'var(--text-secondary)' }}>Items</p>
                    <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{order.items?.length || 0} item(s)</p>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="grid md:grid-cols-2 gap-8 mb-10 pb-10" style={{ borderBottomColor: 'var(--border-color)', borderBottomWidth: '1px' }}>
                  <div>
                    <p className="text-xs font-black uppercase mb-3" style={{ color: 'var(--text-secondary)' }}>Shipping Address</p>
                    {order.shippingAddress && (
                      <div className="space-y-1">
                        <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{order.shippingAddress.fullName}</p>
                        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">{order.shippingAddress.line1}</p>
                        {order.shippingAddress.line2 && <p style={{ color: 'var(--text-secondary)' }} className="text-sm">{order.shippingAddress.line2}</p>}
                        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                        <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-2">📞 {order.shippingAddress.phone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-10 pb-10" style={{ borderBottomColor: 'var(--border-color)', borderBottomWidth: '1px' }}>
                  <p className="text-xs font-black uppercase mb-4" style={{ color: 'var(--text-secondary)' }}>Order Items</p>
                  <div className="space-y-4">
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>SKU: {item.sku} • Qty: {item.quantity}</p>
                          {item.hamperName && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>+ {item.hamperName}</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-black" style={{ color: 'var(--text-primary)' }}>₹{(item.price * item.quantity).toLocaleString()}</p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>₹{item.price.toLocaleString()} × {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Summary */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }} className="font-semibold">Subtotal</span>
                    <span style={{ color: 'var(--text-primary)' }} className="font-bold">₹{order.subtotal?.toLocaleString()}</span>
                  </div>
                  {((order.tax || 0) + (order.shippingFee || 0)) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--text-secondary)' }} className="font-semibold">Tax & Shipping</span>
                      <span style={{ color: 'var(--text-primary)' }} className="font-bold">₹{((order.tax || 0) + (order.shippingFee || 0)).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl border-t pt-3" style={{ borderTopColor: 'var(--border-color)', borderTopWidth: '2px' }}>
                    <span style={{ color: 'var(--text-primary)' }} className="font-black">Total Amount</span>
                    <span style={{ color: 'var(--color-primary)' }} className="font-black">₹{order.total?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <Link
                href="/profile/orders"
                className="flex items-center justify-center gap-2 px-6 py-4 font-black rounded-lg text-white transition hover:opacity-90"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <ArrowRight size={18} />
                View All Orders
              </Link>

              <Link
                href="/products"
                className="flex items-center justify-center gap-2 px-6 py-4 font-black rounded-lg transition hover:opacity-80"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderWidth: '2px', color: 'var(--text-primary)' }}
              >
                Continue Shopping
              </Link>
            </div>

            {/* Info Box */}
            <div className="rounded-lg p-4" style={{ backgroundColor: 'color-mix(in srgb, var(--color-secondary) 10%, transparent)' }}>
              <p className="text-sm text-center" style={{ color: 'var(--text-primary)' }}>
                A confirmation email has been sent to your email address. You can track your order from your account dashboard.
              </p>
            </div>
          </>
        )}

        {!order && !loading && (
          <div className="text-center py-16">
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Order not found</p>
            <Link href="/" className="font-bold hover:opacity-80 transition" style={{ color: 'var(--color-primary)' }}>
              Go to Home
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
