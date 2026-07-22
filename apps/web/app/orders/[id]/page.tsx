'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Package, MapPin, CreditCard } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getApiBaseUrl } from '../../lib/api';

const API_URL = getApiBaseUrl();

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
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

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 font-bold mb-4">{error}</p>
          <Link href="/orders" className="text-primary font-bold hover:underline">
            Back to orders
          </Link>
        </div>
      </main>
    );
  }

  if (!order) {
    return null;
  }

  const statusColors: any = {
    'PLACED': 'bg-yellow-100 text-yellow-700',
    'CONFIRMED': 'bg-blue-100 text-blue-700',
    'PACKED': 'bg-purple-100 text-purple-700',
    'SHIPPED': 'bg-blue-100 text-blue-700',
    'DELIVERED': 'bg-green-100 text-green-700',
    'CANCELLED': 'bg-red-100 text-red-700',
    'REFUNDED': 'bg-gray-100 text-gray-700'
  };

  return (
    <main className="min-h-screen pb-20 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/orders" className="flex items-center gap-2 text-primary font-bold mb-6 hover:opacity-70">
          <ArrowLeft size={20} />
          Back to Orders
        </Link>

        <div className="bg-white border border-black/10 rounded-lg p-8 mb-6">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div>
              <p className="text-black/60 text-sm font-bold mb-2">ORDER NUMBER</p>
              <p className="text-xl font-black break-all">{order.id}</p>
            </div>
            <div>
              <p className="text-black/60 text-sm font-bold mb-2">ORDER DATE</p>
              <p className="text-xl font-black">
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-black/60 text-sm font-bold mb-2">STATUS</p>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-black ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                {order.status}
              </div>
            </div>
          </div>

          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="border-t border-black/10 pt-6 mb-6">
              <h3 className="font-black mb-4">Order Timeline</h3>
              <div className="space-y-4">
                {order.statusHistory.map((history: any, idx: number) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-primary rounded-full mt-1.5"></div>
                      {idx < order.statusHistory.length - 1 && (
                        <div className="w-0.5 h-12 bg-black/10 my-2"></div>
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="font-bold">
                        {history.fromStatus} → {history.toStatus}
                      </p>
                      <p className="text-sm text-black/60">
                        {new Date(history.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {history.note && <p className="text-sm text-black/70 mt-1">{history.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white border border-black/10 rounded-lg p-6">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
              <MapPin size={20} />
              Shipping Address
            </h3>
            {order.shippingAddress ? (
              <div className="text-sm text-black/70 space-y-1">
                <p className="font-bold">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                <p className="font-bold mt-3">{order.shippingAddress.phone}</p>
              </div>
            ) : (
              <p className="text-black/60">Address not available</p>
            )}
          </div>

          <div className="bg-white border border-black/10 rounded-lg p-6">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
              <CreditCard size={20} />
              Payment Information
            </h3>
            {order.payment ? (
              <div className="text-sm text-black/70 space-y-2">
                <div className="flex justify-between">
                  <span>Provider:</span>
                  <span className="font-bold">{order.payment.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`font-bold ${order.payment.status === 'PAID' ? 'text-green-600' : 'text-red-600'}`}>
                    {order.payment.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-bold">₹{order.payment.amount?.toLocaleString()}</span>
                </div>
                {order.payment.paidAt && (
                  <div className="flex justify-between">
                    <span>Paid on:</span>
                    <span className="font-bold">
                      {new Date(order.payment.paidAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-black/60">Payment not processed</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-black/10 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-black mb-4 flex items-center gap-2">
            <Package size={20} />
            Order Items
          </h3>
          <div className="space-y-4">
            {order.items?.map((item: any, idx: number) => (
              <div key={idx} className="border-b border-black/10 pb-4 last:border-0">
                <div className="flex justify-between items-start gap-4 mb-2">
                  <div className="flex-1">
                    <p className="font-bold">{item.name}</p>
                    <p className="text-sm text-black/60">SKU: {item.sku}</p>
                    <p className="text-sm text-black/60">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-bold">₹{item.price?.toLocaleString()}</p>
                </div>
                <div className="text-right text-sm font-bold text-black/60">
                  Subtotal: ₹{(item.price * item.quantity).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-black/10 rounded-lg p-6">
          <h3 className="text-lg font-black mb-4">Price Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-black/60">
              <span>Subtotal</span>
              <span>₹{order.subtotal?.toLocaleString()}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-black/60">
                <span>Discount</span>
                <span className="text-green-600">-₹{order.discount?.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-black/60">
              <span>GST (18%)</span>
              <span>₹{order.tax?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-black/60">
              <span>Shipping</span>
              <span>{order.shippingFee === 0 ? 'FREE' : `₹${order.shippingFee?.toLocaleString()}`}</span>
            </div>
            <div className="flex justify-between text-xl font-black pt-3 border-t border-black/10">
              <span>Total Amount</span>
              <span>₹{order.total?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
