'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFetch } from '../hooks/useFetch';
import { apiService } from '../services/api';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { DataTable, Column } from '../components/DataTable';
import { Search, Eye, Mail, MessageSquare, Ban } from 'lucide-react';

interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
  createdAt: string;
  emailVerified: boolean;
  addresses: Address[];
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVerified, setFilterVerified] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<keyof User>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const itemsPerPage = 10;

  // Debounced so typing does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchTerm.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const verifiedFilter = filterVerified === 'all' ? undefined : filterVerified === 'verified';

  // Search, sort and paging run in the database. Fetching a fixed slice and
  // filtering it here would hide every customer outside that slice.
  const { data: usersData, loading, error, refetch } = useFetch<any>(
    () =>
      apiService.getUsers({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery || undefined,
        sortBy,
        sortOrder,
        verified: verifiedFilter
      }),
    { skip: false, deps: [currentPage, searchQuery, sortBy, sortOrder, verifiedFilter] }
  );

  const users = ((usersData?.data || []) as Partial<User>[]).map((user, index) => ({
    ...user,
    id: user.id ?? `user_${index}`,
    name: user.name ?? user.email?.split('@')[0] ?? 'Customer',
    email: user.email ?? 'customer@example.com',
    phone: user.phone ?? null,
    avatar: user.avatar ?? null,
    totalOrders: user.totalOrders ?? 0,
    totalSpent: user.totalSpent ?? 0,
    lastOrderDate: user.lastOrderDate ?? null,
    createdAt: user.createdAt ?? new Date().toISOString(),
    emailVerified: user.emailVerified ?? false,
    addresses: user.addresses ?? []
  })) as User[];

  // Totals cover the whole filtered set, not just the page on screen.
  const stats = usersData?.stats ?? { total: 0, verified: 0, revenue: 0 };
  const totalPages = usersData?.pagination?.pages ?? 1;

  const columns: Column<User>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-coral to-mint flex items-center justify-center text-white font-bold">
            {value.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-ink">{value}</p>
            <p className="text-xs text-black/60">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'totalOrders',
      label: 'Orders',
      sortable: true,
      render: (value) => (
        <div>
          <p className="font-bold text-ink">{value}</p>
          <p className="text-xs text-black/60">purchases</p>
        </div>
      ),
    },
    {
      key: 'totalSpent',
      label: 'Lifetime Value',
      sortable: true,
      render: (value) => <p className="font-bold text-coral">₹{value.toLocaleString()}</p>,
    },
    {
      key: 'lastOrderDate',
      label: 'Last Order',
      sortable: true,
      render: (value) => (
        <p className="text-sm text-black/60">
          {value ? new Date(value).toLocaleDateString() : 'No orders'}
        </p>
      ),
    },
    {
      key: 'emailVerified',
      label: 'Email',
      render: (value) => (
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
          value ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {value ? 'Verified' : 'Unverified'}
        </span>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout title="Users" subtitle="Manage">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 sm:flex-initial w-full sm:w-auto">
              <Search className="absolute left-3 top-3 w-5 h-5 text-black/40" />
              <input
                type="text"
                placeholder="Search by name, email or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-96 pl-10 pr-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral focus:ring-2 focus:ring-coral/30"
              />
            </div>

            <select
              value={filterVerified}
              onChange={(e) => {
                setFilterVerified(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral bg-white"
            >
              <option value="all">All Users</option>
              <option value="verified">Email verified</option>
              <option value="unverified">Not verified</option>
            </select>
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-white border border-black/10 p-4">
              <p className="text-black/60 text-sm">{searchQuery || verifiedFilter !== undefined ? 'Matching Users' : 'Total Users'}</p>
              <p className="text-3xl font-black text-ink">{stats.total.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-white border border-black/10 p-4">
              <p className="text-black/60 text-sm">Email Verified</p>
              <p className="text-3xl font-black text-coral">{stats.verified.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-white border border-black/10 p-4">
              <p className="text-black/60 text-sm">Total Revenue</p>
              <p className="text-3xl font-black text-mint">
                ₹{stats.revenue.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Table */}
          <DataTable<User>
            columns={columns}
            data={users}
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
              setCurrentPage(1);
            }}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            rowActions={(row) => (
              <div className="flex gap-2">
                <Link
                  href={`/users/${row.id}`}
                  className="p-2 hover:bg-blue-100 rounded-lg transition text-blue-500"
                  title="View Details"
                >
                  <Eye size={18} />
                </Link>
                <button
                  className="p-2 hover:bg-black/5 rounded-lg transition text-ink"
                  title="Send Message"
                >
                  <Mail size={18} />
                </button>
              </div>
            )}
          />
        </div>

        {/* User Details Modal */}
        {showDetails && selectedUser && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-black/10 p-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-ink">User Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-black/60 hover:text-ink transition"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* User Info */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-coral to-mint flex items-center justify-center text-white font-bold text-2xl">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-ink">{selectedUser.name}</h4>
                    <p className="text-black/60">{selectedUser.email}</p>
                    {selectedUser.phone && <p className="text-black/60">{selectedUser.phone}</p>}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-black/2 p-4">
                    <p className="text-black/60 text-sm">Total Orders</p>
                    <p className="text-2xl font-black text-ink">{selectedUser.totalOrders}</p>
                  </div>
                  <div className="rounded-lg bg-black/2 p-4">
                    <p className="text-black/60 text-sm">Total Spent</p>
                    <p className="text-2xl font-black text-coral">₹{selectedUser.totalSpent.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg bg-black/2 p-4">
                    <p className="text-black/60 text-sm">Member Since</p>
                    <p className="text-lg font-bold text-ink">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Addresses */}
                {selectedUser.addresses.length > 0 && (
                  <div className="border-t pt-6">
                    <h4 className="font-bold text-ink mb-3">Saved Addresses</h4>
                    <div className="space-y-3">
                      {selectedUser.addresses.map((address) => (
                        <div key={address.id} className="p-3 rounded-lg bg-black/2">
                          <p className="font-bold text-ink">{address.label}</p>
                          <p className="text-sm text-black/60">{address.street}</p>
                          <p className="text-sm text-black/60">{address.city}, {address.state} {address.pincode}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="border-t pt-6 flex gap-4">
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-coral text-white font-bold rounded-lg hover:bg-coral/90 transition">
                    <Mail size={18} />
                    Send Email
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-mint text-ink font-bold rounded-lg hover:bg-mint/90 transition">
                    <MessageSquare size={18} />
                    Send SMS
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
