'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Loader2, Package } from 'lucide-react';
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
        const res = await fetch(`${API_URL}/ecommerce/orders/${orderId}`, {
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
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" />
          <p className="text-black/60">Loading order details...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20 px-4 py-8 bg-gradient-to-b from-green-50 to-transparent">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <CheckCircle size={64} className="mx-auto mb-4 text-green-600" />
          <h1 className="text-4xl font-black mb-2">Order Confirmed!</h1>
          <p className="text-black/60 text-lg">Thank you for your purchase</p>
        </div>

        {order && (
          <>
            <div className="bg-white border border-black/10 rounded-lg p-8 mb-6">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-black/60 text-sm font-bold mb-2">ORDER NUMBER</p>
                  <p className="text-2xl font-black break-all">{order.id}</p>
                </div>
                <div>
                  <p className="text-black/60 text-sm font-bold mb-2">ORDER DATE</p>
                  <p className="text-2xl font-black">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-8 p-6 bg-green-50 rounded-lg">
                <div>
                  <p className="text-black/60 text-sm font-bold">SUBTOTAL</p>
                  <p className="text-xl font-black">₹{order.subtotal?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-black/60 text-sm font-bold">TAX & SHIPPING</p>
                  <p className="text-xl font-black">₹{((order.tax || 0) + (order.shippingFee || 0)).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-black/60 text-sm font-bold">TOTAL</p>
                  <p className="text-2xl font-black text-green-600">₹{order.total?.toLocaleString()}</p>
                </div>
              </div>

              <div className="border-t border-black/10 pt-6 mb-6">
                <h3 className="font-black mb-4">Shipping Address</h3>
                {order.shippingAddress && (
                  <div className="text-sm">
                    <p className="font-bold">{order.shippingAddress.fullName}</p>
                    <p>{order.shippingAddress.line1}</p>
                    {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                    <p className="mt-2">📞 {order.shippingAddress.phone}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-black/10 pt-6">
                <h3 className="font-black mb-4">Order Items</h3>
                <div className="space-y-4">
                  {order.items?.map((item: any, idx: number) => (
                    <div key={idx} className="border-b border-black/10 pb-4 last:border-0">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="font-bold">{item.name}</p>
                          <p className="text-sm text-black/60">SKU: {item.sku}</p>
                          {item.hamperName && <p className="text-sm text-black/60">+ {item.hamperName}</p>}
                          <p className="text-sm">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right font-bold">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href="/orders"
                className="block w-full px-6 py-4 bg-primary text-white font-black rounded-lg hover:opacity-90 text-center"
              >
                View All Orders
              </Link>

              <Link
                href="/products"
                className="block w-full px-6 py-4 bg-black/10 text-black font-black rounded-lg hover:opacity-90 text-center"
              >
                Continue Shopping
              </Link>
            </div>
          </>
        )}

        {!order && !loading && (
          <div className="text-center">
            <p className="text-black/60 mb-4">Order not found</p>
            <Link href="/" className="text-primary font-bold hover:underline">
              Go home
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
