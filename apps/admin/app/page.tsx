'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { AlertCircle, CheckCircle, Clock, Package, RefreshCw, ShoppingCart, Star, TrendingUp, Users } from 'lucide-react';
import { DashboardLayout } from './components/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { StatsCard } from './components/StatsCard';
import { useFetch } from './hooks/useFetch';
import { apiService } from './services/api';
import { useAuthStore } from './stores/authStore';

type DashboardData = {
  revenue: number;
  orders: number;
  products: number;
  users: number;
  pendingOrders: number;
  lowStockProducts: number;
  totalReviews: number;
  averageRating: number;
};

type RecentOrder = {
  id: string;
  orderNumber: string;
  customer: string;
  amount: number;
  status: string;
};

const emptyData: DashboardData = {
  revenue: 0,
  orders: 0,
  products: 0,
  users: 0,
  pendingOrders: 0,
  lowStockProducts: 0,
  totalReviews: 0,
  averageRating: 0
};

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.loading);
  const hydrated = useAuthStore((state) => state.hydrated);
  const canLoadDashboard = hydrated && !authLoading && Boolean(user);
  const { data, loading, error, refetch } = useFetch<any>(() => apiService.getDashboardStats(), { skip: !canLoadDashboard });
  const dashboardData = (data?.data || emptyData) as DashboardData;
  const recentOrders = (data?.recentOrders || []) as RecentOrder[];
  const orderStatusChart = (data?.charts?.orderStatus || []) as Array<{ label: string; value: number }>;

  return (
    <ProtectedRoute>
      <DashboardLayout title="Dashboard" subtitle="Live overview">
        <div className="space-y-6">
          {error && (
            <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
              <div>
                <p className="font-bold text-red-700">Failed to load dashboard from API</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
              <button onClick={() => refetch()} className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-white">
                <RefreshCw size={16} /> Retry
              </button>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard title="Total Revenue" value={`Rs ${(dashboardData.revenue || 0).toLocaleString()}`} icon={<TrendingUp size={24} />} trend={0} backgroundColor="from-coral" />
            <StatsCard title="Total Orders" value={dashboardData.orders || 0} icon={<ShoppingCart size={24} />} trend={0} backgroundColor="from-mint" />
            <StatsCard title="Total Products" value={dashboardData.products || 0} icon={<Package size={24} />} trend={0} backgroundColor="from-purple-500" />
            <StatsCard title="Total Users" value={dashboardData.users || 0} icon={<Users size={24} />} trend={0} backgroundColor="from-blue-500" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MiniStat label="Pending Orders" value={dashboardData.pendingOrders} note="Awaiting action" icon={<Clock className="text-yellow-600" size={20} />} tone="yellow" />
            <MiniStat label="Low Stock Items" value={dashboardData.lowStockProducts} note="Below threshold" icon={<AlertCircle className="text-red-600" size={20} />} tone="red" />
            <MiniStat label="Total Reviews" value={dashboardData.totalReviews} note="From customers" icon={<CheckCircle className="text-green-600" size={20} />} tone="green" />
            <MiniStat label="Avg Rating" value={dashboardData.averageRating} note="Out of 5.0" icon={<Star className="text-blue-600" size={20} />} tone="blue" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-lg border border-black/10 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-ink">Recent Orders</h3>
                <Link href="/orders" className="text-sm font-bold text-coral">View All -&gt;</Link>
              </div>
              <div className="space-y-3">
                {loading ? (
                  <p className="rounded bg-black/5 p-4 text-sm font-medium text-black/60">Loading orders...</p>
                ) : recentOrders.length === 0 ? (
                  <p className="rounded bg-black/5 p-4 text-sm font-medium text-black/60">No orders in database yet.</p>
                ) : recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between rounded-lg bg-black/2 p-3">
                    <div>
                      <p className="font-bold text-ink">{order.orderNumber}</p>
                      <p className="text-sm text-black/60">{order.customer}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-ink">Rs {order.amount.toLocaleString()}</p>
                      <span className="rounded-full bg-black/5 px-2 py-1 text-xs font-bold">{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-black/10 bg-white p-6">
              <h3 className="mb-4 text-lg font-bold text-ink">Order Status Chart</h3>
              <div className="space-y-3">
                {orderStatusChart.length === 0 ? (
                  <p className="rounded bg-black/5 p-4 text-sm font-medium text-black/60">No chart data yet.</p>
                ) : orderStatusChart.map((item) => {
                  const max = Math.max(...orderStatusChart.map((row) => row.value), 1);
                  return (
                    <div key={item.label}>
                      <div className="mb-1 flex justify-between text-sm font-bold">
                        <span>{item.label}</span>
                        <span>{item.value}</span>
                      </div>
                      <div className="h-2 rounded bg-black/10">
                        <div className="h-2 rounded bg-coral" style={{ width: `${(item.value / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <section className="rounded-lg border border-black/10 bg-white p-6">
            <h3 className="mb-4 text-lg font-bold text-ink">Quick Actions</h3>
            <div className="grid gap-3 md:grid-cols-4">
              <QuickLink href="/products/new" icon={<Package size={20} />} label="Create Product" />
              <QuickLink href="/orders" icon={<ShoppingCart size={20} />} label="View Orders" />
              <QuickLink href="/users" icon={<Users size={20} />} label="Manage Users" />
              <QuickLink href="/settings" icon={<AlertCircle size={20} />} label="Settings" />
            </div>
          </section>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function MiniStat({ label, value, note, icon, tone }: { label: string; value: number; note: string; icon: React.ReactNode; tone: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/5">{icon}</div>
        <span className="rounded bg-black/5 px-2 py-1 text-xs font-bold capitalize">{tone}</span>
      </div>
      <p className="text-sm font-medium text-black/60">{label}</p>
      <p className="mt-1 text-2xl font-black text-ink">{value || 0}</p>
      <p className="mt-2 text-xs text-black/40">{note}</p>
    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-lg bg-ink p-4 font-bold text-white">
      {icon}
      {label}
    </Link>
  );
}
