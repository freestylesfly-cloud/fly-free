'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { getApiBaseUrl } from '../lib/api';

const API_URL = getApiBaseUrl();

export default function OrderFailedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const token = useAuthStore((state) => state.token);

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!orderId || !token) {
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
        }
      } catch (err) {
        console.error('Failed to load order');
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId, token]);

  async function handleRetry() {
    if (!order || !token) return;

    setRetrying(true);
    try {
      const verifyRes = await fetch(`${API_URL}/ecommerce/payment/retry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: order.id
        })
      });

      if (verifyRes.ok) {
        const data = await verifyRes.json();
        const newOrderData = data.data || data;

        if (typeof window !== 'undefined' && (window as any).Razorpay) {
          const razorpay = new (window as any).Razorpay({
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: newOrderData.amount,
            currency: 'INR',
            name: 'Fly Free',
            order_id: newOrderData.razorpayOrderId,
            prefill: {
              email: order.user?.email || '',
              contact: order.user?.phone || ''
            },
            handler: async (response: any) => {
              window.location.href = `/order-success?orderId=${order.id}`;
            }
          });
          razorpay.open();
        }
      }
    } catch (err) {
      console.error('Retry failed');
    } finally {
      setRetrying(false);
    }
  }

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
    <main className="min-h-screen pb-20 px-4 py-8 bg-gradient-to-b from-red-50 to-transparent">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-600" />
          <h1 className="text-4xl font-black mb-2">Payment Failed</h1>
          <p className="text-black/60 text-lg">We couldn't process your payment</p>
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
                  <p className="text-black/60 text-sm font-bold mb-2">ORDER AMOUNT</p>
                  <p className="text-2xl font-black">₹{order.total?.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                <p className="font-bold text-red-900 mb-2">Why this happened:</p>
                <ul className="text-sm text-red-800 space-y-2 list-disc list-inside">
                  <li>Payment gateway rejected the transaction</li>
                  <li>Card details may be incorrect</li>
                  <li>Insufficient funds or card limit exceeded</li>
                  <li>Payment gateway timeout or connection issue</li>
                </ul>
              </div>

              <div className="border-t border-black/10 pt-6">
                <h3 className="font-black mb-4">Items in this order:</h3>
                <div className="space-y-3">
                  {order.items?.map((item: any, idx: number) => (
                    <div key={idx} className="text-sm flex justify-between">
                      <span>{item.name} (Qty: {item.quantity})</span>
                      <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="w-full px-6 py-4 bg-primary text-white font-black rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {retrying ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Retrying...
                  </>
                ) : (
                  'Try Payment Again'
                )}
              </button>

              <Link
                href="/cart"
                className="block w-full px-6 py-4 bg-black/10 text-black font-black rounded-lg hover:opacity-90 text-center"
              >
                Back to Cart
              </Link>

              <Link
                href="/"
                className="block w-full px-6 py-4 bg-black/5 text-black font-black rounded-lg hover:opacity-90 text-center"
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
