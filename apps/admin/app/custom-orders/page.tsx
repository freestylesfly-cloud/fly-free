'use client';

import { useState, useEffect } from 'react';
import { Trash2, Check, AlertCircle, Loader2, Edit } from 'lucide-react';
import { getApiBaseUrl } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';

const API_BASE = getApiBaseUrl();

interface CustomDesign {
  id: string;
  userId: string;
  title: string;
  description?: string;
  images: string[];
  size: string;
  color: string;
  placement: string;
  notes?: string;
  status: string;
  price?: number;
  user?: {
    name: string;
    email: string;
    phone: string;
  };
  createdAt: string;
}

export default function CustomOrdersPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const [designs, setDesigns] = useState<CustomDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<CustomDesign | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  useEffect(() => {
    fetchCustomDesigns();
  }, []);

  const fetchCustomDesigns = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/ecommerce/custom-designs/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setDesigns(Array.isArray(data) ? data : (data?.data || []));
      } else {
        const errorData = await res.json().catch(() => ({}));
        setMessage({ type: 'error', text: errorData.message || 'Failed to load custom designs' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error fetching designs - API connection failed' });
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/ecommerce/custom-designs/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        setDesigns(designs.map(d => d.id === id ? { ...d, status } : d));
        setMessage({ type: 'success', text: 'Status updated successfully' });
        setShowStatusModal(false);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setMessage({ type: 'error', text: errorData.message || 'Failed to update status' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating status' });
    }
  };

  const handleSetPrice = async (id: string, price: number) => {
    try {
      const res = await fetch(`\${API_BASE}/ecommerce/custom-designs/\${id}/pricing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer \${token}`
        },
        body: JSON.stringify({ price })
      });

      if (res.ok) {
        setDesigns(designs.map(d => d.id === id ? { ...d, price } : d));
        setMessage({ type: 'success', text: 'Price set successfully' });
        setShowPricingModal(false);
        setNewPrice('');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to set price' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom design?')) return;

    try {
      const res = await fetch(`\${API_BASE}/ecommerce/custom-designs/\${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer \${token}` }
      });

      if (res.ok) {
        setDesigns(designs.filter(d => d.id !== id));
        setMessage({ type: 'success', text: 'Design deleted' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete design' });
    }
  };

  const filteredDesigns = designs
    .filter(d => filterStatus === 'ALL' || d.status === filterStatus)
    .filter(d => 
      searchQuery === '' ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.id.includes(searchQuery)
    )
    .sort((a, b) => 
      sortOrder === 'newest' 
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={40} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Custom Orders" subtitle="Manage custom design requests">
        <div className="space-y-6">
        <p style={{ color: 'var(--text-muted)' }} className="mb-8">Manage custom design requests from users</p>

        {/* Message */}
        {message && (
          <div
            className="px-6 py-4 rounded-lg mb-6 flex items-center gap-3"
            style={{
              backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: message.type === 'success' ? '#166534' : '#991b1b'
            }}
          >
            {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            {message.text}
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Search by title, user, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-3 rounded-lg border focus:outline-none"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)'
            }}
          />

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 rounded-lg border focus:outline-none"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* Sort */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-4 py-3 rounded-lg border focus:outline-none"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* Designs List */}
        {filteredDesigns.length > 0 ? (
          <div className="space-y-4">
            {filteredDesigns.map((design) => (
              <div
                key={design.id}
                className="p-6 rounded-lg border grid md:grid-cols-[200px_1fr_150px] gap-6 items-start"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
              >
                {/* Image */}
                {design.images?.[0] && (
                  <img
                    src={design.images[0]}
                    alt="Design"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                )}

                {/* Details */}
                <div>
                  <h3 className="text-xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>
                    {design.title}
                  </h3>
                  <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                    {design.description}
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Size:</span>
                      <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{design.size}</p>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Color:</span>
                      <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{design.color}</p>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Placement:</span>
                      <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{design.placement}</p>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                      <p className="font-bold" style={{
                        color: design.status === 'APPROVED' ? '#10b981' :
                               design.status === 'REJECTED' ? '#ef4444' : 'var(--color-primary)'
                      }}>
                        {design.status}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                    <strong>User:</strong> {design.user?.name} ({design.user?.email}) | {design.user?.phone}
                  </div>

                  {design.price && (
                    <p className="text-lg font-black mb-3" style={{ color: 'var(--color-primary)' }}>
                      Price: ₹{design.price}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedDesign(design);
                      setShowDetailsModal(true);
                    }}
                    className="w-full px-4 py-2 rounded-lg font-bold transition text-sm flex items-center justify-center gap-2"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--color-primary)', border: '1px solid var(--border-color)' }}
                  >
                    <Edit size={16} />
                    Details
                  </button>

                  <button
                    onClick={() => {
                      setSelectedDesign(design);
                      setNewPrice(design.price?.toString() || '');
                      setShowPricingModal(true);
                    }}
                    className="w-full px-4 py-2 rounded-lg font-bold transition text-sm text-white"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    Set Price
                  </button>

                  <button
                    onClick={() => {
                      setSelectedDesign(design);
                      setNewStatus(design.status);
                      setShowStatusModal(true);
                    }}
                    className="w-full px-4 py-2 rounded-lg font-bold transition text-sm"
                    style={{ backgroundColor: '#7c3aed', color: 'white' }}
                  >
                    Status
                  </button>

                  <button
                    onClick={() => handleDelete(design.id)}
                    className="w-full px-4 py-2 rounded-lg font-bold transition text-sm text-white"
                    style={{ backgroundColor: '#ef4444' }}
                  >
                    <Trash2 size={16} className="inline mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <AlertCircle size={48} className="mx-auto mb-4 opacity-50" style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-muted)' }}>No custom designs found</p>
          </div>
        )}

        {/* Modals */}
        {showDetailsModal && selectedDesign && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="rounded-2xl max-w-2xl w-full max-h-96 overflow-y-auto" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="p-6 space-y-4">
                <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{selectedDesign.title}</h2>
                <div>
                  <h4 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Images</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedDesign.images?.map((img, idx) => (
                      <a
                        key={idx}
                        href={img}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img src={img} alt={`Design ${idx}`} className="w-full h-24 object-cover rounded" />
                      </a>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Notes</h4>
                  <p style={{ color: 'var(--text-secondary)' }}>{selectedDesign.notes || 'No notes'}</p>
                </div>

                <div>
                  <h4 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>User Details</h4>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {selectedDesign.user?.name}<br />
                    {selectedDesign.user?.email}<br />
                    {selectedDesign.user?.phone}
                  </p>
                </div>
                <div className="border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="w-full px-4 py-2 rounded-lg font-bold text-white"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showPricingModal && selectedDesign && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="rounded-2xl max-w-sm w-full" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="p-6 space-y-4">
                <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Set Price</h2>
                <div>
                  <label className="block font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Price (₹)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="Enter price"
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
                <button
                  onClick={() => handleSetPrice(selectedDesign.id, parseInt(newPrice) || 0)}
                  className="w-full px-4 py-2 rounded-lg font-bold text-white transition"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  Save Price
                </button>
              </div>
            </div>
          </div>
        )}

        {showStatusModal && selectedDesign && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="rounded-2xl max-w-sm w-full" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="p-6 space-y-3">
                <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Update Status</h2>
                {['PENDING', 'APPROVED', 'REJECTED'].map(status => (
                  <button
                    key={status}
                    onClick={() => handleUpdateStatus(selectedDesign.id, status)}
                    className="w-full px-4 py-2 rounded-lg font-bold transition text-white"
                    style={{
                      backgroundColor: status === 'APPROVED' ? '#10b981' :
                                      status === 'REJECTED' ? '#ef4444' : 'var(--color-primary)'
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
