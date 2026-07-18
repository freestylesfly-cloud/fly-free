'use client';

export const dynamic = 'force-dynamic';

import { DashboardLayout } from './components/DashboardLayout';
import { StatsCard } from './components/StatsCard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useFetch } from './hooks/useFetch';
import { apiService } from './services/api';
import {
  TrendingUp,
  Package,
  Users,
  ShoppingCart,
  Star,
  AlertCircle,
  Clock,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface DashboardData {
  revenue: number;
  orders: number;
  products: number;
  users: number;
  pendingOrders: number;
  lowStockProducts: number;
  totalReviews: number;
  averageRating: number;
}

export default function DashboardPage() {
  // Mock data for development
  const mockData: DashboardData = {
    revenue: 124850,
    orders: 328,
    products: 146,
    users: 2418,
    pendingOrders: 12,
    lowStockProducts: 5,
    totalReviews: 47,
    averageRating: 4.6
  };

  // Fetch dashboard data using centralized API service
  const { data, loading, error, refetch } = useFetch<any>(
    () => apiService.getDashboardStats(),
    { skip: false }
  );

  const dashboardData = (data?.data || mockData) as DashboardData;

  return (
    <ProtectedRoute>
      <DashboardLayout title="Dashboard" subtitle="Welcome back">
        <div className="space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-red-700">Failed to load dashboard</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
              >
                <RefreshCw size={16} />
                Retry
              </button>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Revenue"
              value={`₹${(dashboardData?.revenue || 0).toLocaleString()}`}
              icon={<TrendingUp size={24} />}
              trend={12}
              backgroundColor="from-coral"
            />
            <StatsCard
              title="Total Orders"
              value={dashboardData?.orders || 0}
              icon={<ShoppingCart size={24} />}
              trend={8}
              backgroundColor="from-mint"
            />
            <StatsCard
              title="Total Products"
              value={dashboardData?.products || 0}
              icon={<Package size={24} />}
              trend={5}
              backgroundColor="from-purple-500"
            />
            <StatsCard
              title="Total Users"
              value={dashboardData?.users || 0}
              icon={<Users size={24} />}
              trend={15}
              backgroundColor="from-blue-500"
            />
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-white border border-black/10 p-4 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Clock className="text-yellow-600" size={20} />
                </div>
                <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded">Pending</span>
              </div>
              <p className="text-black/60 text-sm font-medium">Pending Orders</p>
              <p className="text-2xl font-black text-ink mt-1">{dashboardData?.pendingOrders || 0}</p>
              <p className="text-xs text-black/40 mt-2">Awaiting confirmation</p>
            </div>

            <div className="rounded-lg bg-white border border-black/10 p-4 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertCircle className="text-red-600" size={20} />
                </div>
                <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">Alert</span>
              </div>
              <p className="text-black/60 text-sm font-medium">Low Stock Items</p>
              <p className="text-2xl font-black text-ink mt-1">{dashboardData?.lowStockProducts || 0}</p>
              <p className="text-xs text-black/40 mt-2">Below threshold</p>
            </div>

            <div className="rounded-lg bg-white border border-black/10 p-4 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={20} />
                </div>
                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">Active</span>
              </div>
              <p className="text-black/60 text-sm font-medium">Total Reviews</p>
              <p className="text-2xl font-black text-ink mt-1">{dashboardData?.totalReviews || 0}</p>
              <p className="text-xs text-black/40 mt-2">From customers</p>
            </div>

            <div className="rounded-lg bg-white border border-black/10 p-4 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Star className="text-blue-600" size={20} />
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">Rating</span>
              </div>
              <p className="text-black/60 text-sm font-medium">Avg Rating</p>
              <p className="text-2xl font-black text-ink mt-1">{dashboardData?.averageRating || 0}</p>
              <p className="text-xs text-black/40 mt-2">Out of 5.0</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg bg-white border border-black/10 p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-ink">Recent Orders</h3>
                <a href="/orders" className="text-sm font-bold text-coral hover:text-coral/80">View All →</a>
              </div>
              <div className="space-y-3">
                {[
                  { id: 'ORD-001', customer: 'Rajesh Kumar', amount: '₹2,499', status: 'Shipped' },
                  { id: 'ORD-002', customer: 'Priya Singh', amount: '₹1,999', status: 'Processing' },
                  { id: 'ORD-003', customer: 'Amit Patel', amount: '₹3,299', status: 'Delivered' },
                  { id: 'ORD-004', customer: 'Neha Gupta', amount: '₹4,299', status: 'Pending' },
                ].map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-black/2 hover:bg-black/5 transition">
                    <div className="flex-1">
                      <p className="font-bold text-ink">{order.id}</p>
                      <p className="text-sm text-black/60">{order.customer}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-ink">{order.amount}</p>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'Processing' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-white border border-black/10 p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-ink">Quick Actions</h3>
              </div>
              <div className="grid gap-3">
                <a
                  href="/products/new"
                  className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-coral to-coral/80 text-white hover:shadow-lg transition font-bold"
                >
                  <Package size={20} />
                  Create New Product
                </a>
                <a
                  href="/orders"
                  className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-mint to-mint/80 text-ink hover:shadow-lg transition font-bold"
                >
                  <ShoppingCart size={20} />
                  View All Orders
                </a>
                <a
                  href="/users"
                  className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-lg transition font-bold"
                >
                  <Users size={20} />
                  Manage Users
                </a>
                <a
                  href="/settings"
                  className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg transition font-bold"
                >
                  <AlertCircle size={20} />
                  Settings & Config
                </a>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
