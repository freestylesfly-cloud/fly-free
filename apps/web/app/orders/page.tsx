'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Package, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@flyfree/utils';
import { useRouter } from 'next/navigation';
import { getApiBaseUrl, readApiResponse } from '../lib/api';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: Array<{
    productName: string;
    quantity: number;
  }>;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function OrdersPage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }

    async function fetchOrders() {
      try {
        const API_URL = getApiBaseUrl();
        const response = await fetch(`${API_URL}/user/orders`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await readApiResponse(response);
        if (!response.ok) throw new Error(data?.error || 'Failed to fetch orders');
        setOrders(data.data || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [token, router]);

  if (!token) {
    return null; // Will redirect
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-ink flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-coral" />
          <p className="dark:text-white font-bold">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-ink">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-black dark:text-white mb-8">My Orders</h1>

          <div className="text-center py-20 space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-paper dark:bg-ink/50 rounded-full">
                <Package size={48} className="text-ink/30 dark:text-white/30" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black dark:text-white mb-2">No Orders Yet</p>
              <p className="text-ink/60 dark:text-white/60 mb-8">
                You haven't placed any orders. Start shopping!
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-coral text-white px-8 py-3 rounded-lg font-bold hover:bg-coral/90 transition"
            >
              Continue Shopping
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-ink">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-black dark:text-white mb-2">My Orders</h1>
          <p className="text-ink/60 dark:text-white/60">Track and manage your orders</p>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="bg-paper dark:bg-ink/50 rounded-lg p-6 hover:shadow-lg dark:hover:shadow-none transition border border-black/5 dark:border-white/5 hover:border-coral"
            >
              <div className="grid md:grid-cols-2 gap-6 items-center">
                {/* Left */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-ink/60 dark:text-white/60">Order Number</p>
                      <p className="font-black text-lg dark:text-white">{order.orderNumber}</p>
                    </div>
                    <span
                      className={`px-4 py-2 rounded-full text-xs font-bold uppercase ${
                        statusColors[order.status.toLowerCase()] ||
                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-ink/60 dark:text-white/60">Items</p>
                    <p className="font-bold dark:text-white">
                      {order.items.map((item) => `${item.productName} (${item.quantity})`).join(', ')}
                    </p>
                  </div>

                  <p className="text-sm text-ink/60 dark:text-white/60">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Right */}
                <div className="text-right space-y-4">
                  <div>
                    <p className="text-sm text-ink/60 dark:text-white/60 mb-1">Total</p>
                    <p className="text-3xl font-black text-coral">{formatCurrency(order.total)}</p>
                  </div>

                  <div className="flex justify-end">
                    <button className="flex items-center gap-2 text-coral font-bold hover:underline">
                      View Details
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
