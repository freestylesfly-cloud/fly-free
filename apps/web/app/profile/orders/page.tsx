'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, Package } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface Order {
  id: string;
  orderNumber?: string;
  status: string;
  total: number;
  createdAt: string;
  items: Array<{ name: string; quantity: number }>;
}

const statusStyles: Record<string, string> = {
  PLACED: 'bg-amber-50 text-amber-800 border-amber-200',
  CONFIRMED: 'bg-blue-50 text-blue-800 border-blue-200',
  SHIPPED: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  DELIVERED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  CANCELLED: 'bg-red-50 text-red-800 border-red-200'
};

export default function OrdersPage() {
  const token = useAuthStore((state) => state.token);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [token]);

  async function loadOrders() {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/ecommerce/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : data.data || []);
      }
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black md:text-3xl" style={{ color: 'var(--text-primary)' }}>Orders</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Track recent purchases, payment status, and delivery progress.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--color-primary)' }} />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const statusClass = statusStyles[order.status] || 'bg-black/5 text-black/55 border-black/10';
            return (
              <article
                key={order.id}
                className="rounded-lg border p-4 transition"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                }}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>#{order.orderNumber || order.id.slice(-8)}</p>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${statusClass}`}>{order.status}</span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {order.items.length} item{order.items.length === 1 ? '' : 's'} | {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 md:justify-end">
                    <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{formatRupees(order.total)}</p>
                    <Link
                      href={`/orders/${order.id}`}
                      className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-black text-white transition hover:opacity-90"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      View <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-lg border border-dashed px-6 py-14 text-center"
      style={{
        borderColor: 'var(--border-color)',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      <Package className="mx-auto mb-4 h-10 w-10" style={{ color: 'var(--text-tertiary)' }} />
      <h2 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>No orders yet</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm" style={{ color: 'var(--text-secondary)' }}>
        Your confirmed purchases will appear here with tracking and invoice details.
      </p>
      <Link
        href="/products"
        className="mt-5 inline-flex rounded-md px-5 py-3 text-sm font-black text-white transition hover:opacity-90"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        Start Shopping
      </Link>
    </div>
  );
}

function formatRupees(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
}
