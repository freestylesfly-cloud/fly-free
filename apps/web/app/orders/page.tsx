'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Loader2, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { getApiBaseUrl } from '../lib/api';

const API_URL = getApiBaseUrl();

export default function OrdersPage() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !token) {
      window.location.href = '/auth/login?next=/orders';
      return;
    }

    async function loadOrders() {
      try {
        setLoading(true);
        const url = typeof window !== 'undefined'
          ? `/api/proxy/ecommerce/orders`
          : `${API_URL}/ecommerce/orders`;

        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const ordersList = data.data || data;
          setOrders(Array.isArray(ordersList) ? ordersList.sort((a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ) : []);
        } else {
          setError('Failed to load orders');
        }
      } catch (err) {
        setError('Failed to load orders');
        console.error('Order loading error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [user, token]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" />
          <p className="text-black/60">Loading your orders...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 font-bold mb-4">{error}</p>
          <Link href="/" className="text-primary font-bold hover:underline">
            Go home
          </Link>
        </div>
      </main>
    );
  }

  if (orders.length === 0) {
    return (
      <main className="min-h-screen pb-20 px-4 py-8">
        <div className="max-w-2xl mx-auto text-center py-20">
          <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
          <h1 className="text-2xl font-black mb-4">No orders yet</h1>
          <p className="text-black/60 mb-6">Start shopping to place your first order</p>
          <Link href="/products" className="inline-block px-6 py-3 bg-primary text-white font-black rounded-lg hover:opacity-90">
            Browse Products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black mb-8">Your Orders</h1>

        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block bg-white border border-black/10 rounded-lg p-6 hover:border-primary transition"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <p className="text-sm text-black/60 mb-1">Order ID</p>
                  <p className="font-black break-all">{order.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-black/60 mb-1">Status</p>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-black ${
                    order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                    order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.status}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-4 border-y border-black/10">
                <div>
                  <p className="text-xs text-black/60 font-bold mb-1">DATE</p>
                  <p className="font-bold text-sm">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-black/60 font-bold mb-1">ITEMS</p>
                  <p className="font-bold text-sm">{order.items?.length || 0} item(s)</p>
                </div>
                <div>
                  <p className="text-xs text-black/60 font-bold mb-1">TOTAL</p>
                  <p className="font-black text-lg">₹{order.total?.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div>
                  {order.items && order.items.length > 0 && (
                    <p className="text-sm text-black/60">
                      {order.items.map((item: any) => item.name).join(', ')}
                    </p>
                  )}
                </div>
                <ChevronRight size={20} className="text-black/30" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
