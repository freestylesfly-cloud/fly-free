'use client';

import { use, useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { ArrowLeft, Download, Loader2, CheckCircle2, Clock, Truck, Package as PackageIcon } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@flyfree/utils';
import { useRouter } from 'next/navigation';
import { getApiBaseUrl, readApiResponse } from '../../lib/api';

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  createdAt: string;
  shippingAddress: {
    name: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: Array<{
    productName: string;
    price: number;
    quantity: number;
    size: string;
    color: string;
  }>;
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: PackageIcon },
];

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }

    async function fetchOrder() {
      try {
        const API_URL = getApiBaseUrl();
        const response = await fetch(`${API_URL}/user/orders/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await readApiResponse(response);
        if (!response.ok) throw new Error(data?.error || 'Failed to fetch order');
        setOrder(data.data);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [token, id, router]);

  const downloadInvoice = async () => {
    if (!order) return;
    try {
      const API_URL = getApiBaseUrl();
      const response = await fetch(`${API_URL}/user/orders/${order.id}/invoice`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to download invoice');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${order.orderNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice');
    }
  };

  if (!token) {
    return null; // Will redirect
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-ink flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-coral" />
          <p className="dark:text-white font-bold">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white dark:bg-ink">
        <div className="container mx-auto px-4 py-12">
          <p className="text-2xl font-black dark:text-white">Order not found</p>
          <Link href="/orders" className="text-coral hover:underline mt-4 block">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const currentStatusIndex = statusSteps.findIndex((s) => s.key === order.status.toLowerCase());

  return (
    <div className="min-h-screen bg-white dark:bg-ink">
      <div className="container mx-auto px-4 py-12">
        {/* Back Button */}
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-coral hover:underline font-bold mb-8"
        >
          <ArrowLeft size={18} />
          Back to Orders
        </Link>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-black dark:text-white mb-2">Order #{order.orderNumber}</h1>
          <p className="text-ink/60 dark:text-white/60">
            Placed on {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Status Timeline */}
            <section className="bg-paper dark:bg-ink/50 rounded-lg p-6">
              <h2 className="text-xl font-black dark:text-white mb-8">Order Status</h2>
              <div className="space-y-6">
                {statusSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = index <= currentStatusIndex;
                  const isCurrent = index === currentStatusIndex;

                  return (
                    <div key={step.key} className="flex gap-4">
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={`p-3 rounded-full transition ${
                            isCompleted
                              ? 'bg-coral text-white'
                              : 'bg-white/10 dark:bg-ink/30 text-ink/60 dark:text-white/60'
                          }`}
                        >
                          <Icon size={20} />
                        </div>
                        {index < statusSteps.length - 1 && (
                          <div
                            className={`w-0.5 h-12 ${
                              isCompleted ? 'bg-coral' : 'bg-white/10 dark:bg-ink/30'
                            }`}
                          ></div>
                        )}
                      </div>
                      <div className="pt-1">
                        <p
                          className={`font-bold ${
                            isCurrent ? 'text-coral' : isCompleted ? 'dark:text-white' : 'text-ink/60 dark:text-white/60'
                          }`}
                        >
                          {step.label}
                        </p>
                        {isCurrent && <p className="text-sm text-coral">In Progress</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Order Items */}
            <section className="bg-paper dark:bg-ink/50 rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-black dark:text-white">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-4 border-b border-black/10 dark:border-white/10 last:border-b-0"
                  >
                    <div>
                      <p className="font-bold dark:text-white">{item.productName}</p>
                      <p className="text-sm text-ink/60 dark:text-white/60">
                        {item.size} • {item.color} • Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-coral font-bold">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Shipping Address */}
            <section className="bg-paper dark:bg-ink/50 rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-black dark:text-white">Shipping Address</h2>
              <div className="text-ink/70 dark:text-white/70 space-y-1">
                <p className="font-bold dark:text-white">{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.street}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                </p>
                <p className="pt-2">Phone: {order.shippingAddress.phone}</p>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Order Summary */}
            <div className="bg-paper dark:bg-ink/50 rounded-lg p-6 sticky top-20 space-y-6">
              <h2 className="text-xl font-black dark:text-white">Order Summary</h2>

              <div className="space-y-3 pb-6 border-b border-black/10 dark:border-white/10">
                <div className="flex justify-between text-ink/70 dark:text-white/70">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-ink/70 dark:text-white/70">
                  <span>GST (18%)</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
                <div className="flex justify-between text-ink/70 dark:text-white/70">
                  <span>Shipping</span>
                  <span className="text-coral font-bold">{order.shipping === 0 ? 'FREE' : formatCurrency(order.shipping)}</span>
                </div>
              </div>

              <div className="flex justify-between text-2xl font-black dark:text-white">
                <span>Total</span>
                <span className="text-coral">{formatCurrency(order.total)}</span>
              </div>

              <button
                onClick={downloadInvoice}
                className="w-full bg-coral text-white py-3 rounded-lg font-bold hover:bg-coral/90 transition flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Download Invoice
              </button>

              <div className="pt-6 border-t border-black/10 dark:border-white/10 space-y-3 text-xs text-ink/60 dark:text-white/60">
                <p>✓ 30-day returns available</p>
                <p>✓ Secure transaction</p>
                <p>✓ Customer support available</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
