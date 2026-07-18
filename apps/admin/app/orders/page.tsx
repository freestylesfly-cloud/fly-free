'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { DataTable, Column } from '../components/DataTable';
import { useFetch } from '../hooks/useFetch';
import { apiService } from '../services/api';
import { Search, Plus, Eye, Printer, Download, AlertCircle } from 'lucide-react';

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: { name: string; sku: string };
  variant: { color: string; size: string } | null;
}

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: 'PLACED' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  subtotal: number;
  tax: number;
  shippingCost: number;
  totalAmount: number;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  user: { name: string; email: string; phone: string };
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  PLACED: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-700' },
  SHIPPED: { bg: 'bg-purple-100', text: 'text-purple-700' },
  DELIVERED: { bg: 'bg-green-100', text: 'text-green-700' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-700' },
};

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<keyof Order>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const itemsPerPage = 10;

  // Fetch orders using centralized API service
  const { data: ordersData, loading, error, refetch } = useFetch<any>(
    () => apiService.getOrders({ page: 1, limit: 100 }),
    { skip: false }
  );

  const orders = (ordersData?.data || []) as Order[];

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      await apiService.updateOrderStatus(orderId, newStatus);
      refetch();
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const aVal = a[sortBy] ?? '';
    const bVal = b[sortBy] ?? '';
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);

  const columns: Column<Order>[] = [
    {
      key: 'orderNumber',
      label: 'Order ID',
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="font-bold text-ink">{value}</p>
          <p className="text-xs text-black/60">{new Date(row.createdAt).toLocaleDateString()}</p>
        </div>
      ),
    },
    {
      key: 'user' as any,
      label: 'Customer',
      render: (value, row) => (
        <div>
          <p className="font-bold text-ink">{row.user.name}</p>
          <p className="text-xs text-black/60">{row.user.email}</p>
        </div>
      ),
    },
    {
      key: 'totalAmount',
      label: 'Amount',
      sortable: true,
      render: (value) => <p className="font-bold">₹{value.toLocaleString()}</p>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: Order['status']) => (
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${statusColors[value].bg} ${statusColors[value].text}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'paymentStatus',
      label: 'Payment',
      render: (value: Order['paymentStatus']) => (
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
          value === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {value}
        </span>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout title="Orders" subtitle="Manage">
        <div className="space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-red-600" size={20} />
                <div>
                  <p className="font-bold text-red-700">Failed to load orders</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
              <button
                onClick={() => refetch()}
                className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition font-bold text-sm"
              >
                Retry
              </button>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 sm:flex-initial w-full sm:w-auto">
              <Search className="absolute left-3 top-3 w-5 h-5 text-black/40" />
              <input
                type="text"
                placeholder="Search by order ID, customer name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-96 pl-10 pr-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral focus:ring-2 focus:ring-coral/30"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral bg-white"
            >
              <option value="all">All Status</option>
              <option value="PLACED">Placed</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Table */}
          <DataTable<Order>
            columns={columns}
            data={paginatedOrders}
            keyExtractor={(row) => row.id}
            loading={loading}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={(key) => {
              if (sortBy === key) {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy(key);
                setSortOrder('desc');
              }
            }}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            rowActions={(row) => (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedOrder(row);
                    setShowDetails(true);
                  }}
                  className="p-2 hover:bg-blue-100 rounded-lg transition text-blue-500"
                  title="View Details"
                >
                  <Eye size={18} />
                </button>
                <button
                  className="p-2 hover:bg-black/5 rounded-lg transition text-ink"
                  title="Print Invoice"
                >
                  <Printer size={18} />
                </button>
              </div>
            )}
          />
        </div>

        {/* Order Details Modal */}
        {showDetails && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-black/10 p-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-ink">Order Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-black/60 hover:text-ink transition"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-black/60 text-sm">Order Number</p>
                    <p className="font-bold text-ink">{selectedOrder.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-black/60 text-sm">Order Date</p>
                    <p className="font-bold text-ink">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-black/60 text-sm">Status</p>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => {
                        handleStatusChange(selectedOrder.id, e.target.value as Order['status']);
                        setSelectedOrder({ ...selectedOrder, status: e.target.value as Order['status'] });
                      }}
                      className="mt-1 px-3 py-1 rounded-lg border border-black/10 focus:outline-none focus:border-coral bg-white font-bold"
                    >
                      <option value="PLACED">Placed</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-black/60 text-sm">Payment Status</p>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-bold ${
                      selectedOrder.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {selectedOrder.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="border-t pt-6">
                  <h4 className="font-bold text-ink mb-3">Customer Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-black/60 text-sm">Name</p>
                      <p className="font-bold text-ink">{selectedOrder.user.name}</p>
                    </div>
                    <div>
                      <p className="text-black/60 text-sm">Email</p>
                      <p className="font-bold text-ink">{selectedOrder.user.email}</p>
                    </div>
                    <div>
                      <p className="text-black/60 text-sm">Phone</p>
                      <p className="font-bold text-ink">{selectedOrder.user.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="border-t pt-6">
                  <h4 className="font-bold text-ink mb-3">Order Items</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-start justify-between p-3 rounded-lg bg-black/2">
                        <div className="flex-1">
                          <p className="font-bold text-ink">{item.product.name}</p>
                          {item.variant && (
                            <p className="text-sm text-black/60">
                              Color: {item.variant.color} | Size: {item.variant.size}
                            </p>
                          )}
                          <p className="text-sm text-black/60">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-bold text-ink">₹{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t pt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-black/60">Subtotal</p>
                    <p className="font-bold">₹{selectedOrder.subtotal.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-black/60">Tax</p>
                    <p className="font-bold">₹{selectedOrder.tax.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-black/60">Shipping</p>
                    <p className="font-bold">₹{selectedOrder.shippingCost.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2 mt-2">
                    <p className="font-bold text-ink">Total Amount</p>
                    <p className="text-2xl font-black text-coral">₹{selectedOrder.totalAmount.toLocaleString()}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t pt-6 flex gap-4">
                  <button
                    onClick={() => {
                      // Generate invoice PDF
                      console.log('Generating invoice for order:', selectedOrder.orderNumber);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-coral text-white font-bold rounded-lg hover:bg-coral/90 transition"
                  >
                    <Download size={18} />
                    Download Invoice
                  </button>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="flex-1 px-4 py-3 border border-black/10 text-ink font-bold rounded-lg hover:bg-black/5 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
