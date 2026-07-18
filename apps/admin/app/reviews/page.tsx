'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { DataTable, Column } from '../components/DataTable';
import { Search, Check, X, Eye, Star } from 'lucide-react';

interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string;
  content: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  product: { name: string };
  user: { name: string; email: string };
  createdAt: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRating, setFilterRating] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<keyof Review>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${baseUrl}/api/admin/reviews?page=1&limit=100`);
      if (!res.ok) throw new Error('Failed to fetch reviews');

      const result = await res.json();
      setReviews(result.data || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewStatus = async (reviewId: string, status: Review['status']) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${baseUrl}/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setReviews(reviews.map(r => r.id === reviewId ? { ...r, status } : r));
        if (selectedReview?.id === reviewId) {
          setSelectedReview({ ...selectedReview, status });
        }
      }
    } catch (error) {
      console.error('Failed to update review status:', error);
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch =
      review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || review.status === filterStatus;
    const matchesRating = filterRating === 'all' || review.rating.toString() === filterRating;
    return matchesSearch && matchesStatus && matchesRating;
  });

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    const aVal = a[sortBy] ?? '';
    const bVal = b[sortBy] ?? '';
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const paginatedReviews = sortedReviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(sortedReviews.length / itemsPerPage);

  const renderStars = (rating: number) => (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={16}
          className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-black/20'}
        />
      ))}
    </div>
  );

  const columns: Column<Review>[] = [
    {
      key: 'title',
      label: 'Review',
      render: (value, row) => (
        <div>
          <p className="font-bold text-ink">{value}</p>
          <div className="flex gap-2 items-center mt-1">
            {renderStars(row.rating)}
          </div>
          <p className="text-xs text-black/60 mt-1">{row.product.name}</p>
        </div>
      ),
    },
    {
      key: 'user' as any,
      label: 'By',
      render: (value, row) => (
        <div>
          <p className="font-bold text-ink">{row.user.name}</p>
          <p className="text-xs text-black/60">{row.user.email}</p>
        </div>
      ),
    },
    {
      key: 'rating',
      label: 'Rating',
      sortable: true,
      render: (value) => renderStars(value),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: Review['status']) => (
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
          value === 'APPROVED' ? 'bg-green-100 text-green-700' :
          value === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {value}
        </span>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout title="Reviews" subtitle="Moderation">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 sm:flex-initial w-full sm:w-auto">
              <Search className="absolute left-3 top-3 w-5 h-5 text-black/40" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-96 pl-10 pr-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral focus:ring-2 focus:ring-coral/30"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral bg-white"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <select
                value={filterRating}
                onChange={(e) => {
                  setFilterRating(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral bg-white"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-white border border-black/10 p-4">
              <p className="text-black/60 text-sm">Total Reviews</p>
              <p className="text-3xl font-black text-ink">{reviews.length}</p>
            </div>
            <div className="rounded-lg bg-white border border-black/10 p-4">
              <p className="text-black/60 text-sm">Pending</p>
              <p className="text-3xl font-black text-yellow-600">{reviews.filter(r => r.status === 'PENDING').length}</p>
            </div>
            <div className="rounded-lg bg-white border border-black/10 p-4">
              <p className="text-black/60 text-sm">Approved</p>
              <p className="text-3xl font-black text-green-600">{reviews.filter(r => r.status === 'APPROVED').length}</p>
            </div>
            <div className="rounded-lg bg-white border border-black/10 p-4">
              <p className="text-black/60 text-sm">Rejected</p>
              <p className="text-3xl font-black text-red-600">{reviews.filter(r => r.status === 'REJECTED').length}</p>
            </div>
          </div>

          {/* Table */}
          <DataTable<Review>
            columns={columns}
            data={paginatedReviews}
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
                    setSelectedReview(row);
                    setShowDetails(true);
                  }}
                  className="p-2 hover:bg-blue-100 rounded-lg transition text-blue-500"
                  title="View Details"
                >
                  <Eye size={18} />
                </button>
              </div>
            )}
          />
        </div>

        {/* Review Details Modal */}
        {showDetails && selectedReview && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-black/10 p-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-ink">Review Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-black/60 hover:text-ink transition"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Review Info */}
                <div className="space-y-3">
                  <div>
                    <p className="text-black/60 text-sm">Product</p>
                    <p className="font-bold text-ink">{selectedReview.product.name}</p>
                  </div>
                  <div>
                    <p className="text-black/60 text-sm">Rating</p>
                    <div className="mt-1">{renderStars(selectedReview.rating)}</div>
                  </div>
                  <div>
                    <p className="text-black/60 text-sm">Title</p>
                    <p className="font-bold text-ink text-lg">{selectedReview.title}</p>
                  </div>
                </div>

                {/* Review Content */}
                <div className="border-t pt-6">
                  <p className="text-black/60 text-sm mb-2">Review</p>
                  <p className="text-ink leading-relaxed">{selectedReview.content}</p>
                </div>

                {/* Customer Info */}
                <div className="border-t pt-6">
                  <p className="text-black/60 text-sm mb-2">By</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-ink">{selectedReview.user.name}</p>
                      <p className="text-sm text-black/60">{selectedReview.user.email}</p>
                    </div>
                    <p className="text-sm text-black/60">{new Date(selectedReview.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="border-t pt-6">
                  <p className="text-black/60 text-sm mb-3">Review Status</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReviewStatus(selectedReview.id, 'APPROVED')}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition ${
                        selectedReview.status === 'APPROVED'
                          ? 'bg-green-100 text-green-700 border-2 border-green-700'
                          : 'bg-green-50 text-green-600 border-2 border-green-200 hover:bg-green-100'
                      }`}
                    >
                      <Check size={18} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReviewStatus(selectedReview.id, 'REJECTED')}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition ${
                        selectedReview.status === 'REJECTED'
                          ? 'bg-red-100 text-red-700 border-2 border-red-700'
                          : 'bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      <X size={18} />
                      Reject
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t pt-6">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="w-full px-4 py-3 border border-black/10 text-ink font-bold rounded-lg hover:bg-black/5 transition"
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
