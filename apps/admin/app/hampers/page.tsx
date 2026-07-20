'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Edit3, Plus, Search, Trash2, X, ChevronDown, Image as ImageIcon, Package } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { apiService } from '../services/api';

type Hamper = {
  id: string;
  productId: string;
  name: string;
  description?: string;
  contents: string[];
  imageUrl?: string;
  images: string[];
  sizeNote?: string;
  price: number;
  gstPercent: number;
  isActive: boolean;
  priority: number;
  product?: { name: string };
};

type HamperForm = {
  productId: string;
  name: string;
  description: string;
  contents: string;
  imageUrl: string;
  images: string;
  sizeNote: string;
  price: string;
  gstPercent: string;
  isActive: boolean;
  priority: string;
};

const emptyForm: HamperForm = {
  productId: '',
  name: '',
  description: '',
  contents: '',
  imageUrl: '',
  images: '',
  sizeNote: '',
  price: '0',
  gstPercent: '5',
  isActive: true,
  priority: '0'
};

export default function HampersPage() {
  const [hampers, setHampers] = useState<Hamper[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState<HamperForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    void loadData();
  }, []);

  const filtered = hampers.filter((hamper) =>
    `${hamper.name} ${hamper.product?.name || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  async function loadData() {
    try {
      setLoading(true);
      setError('');
      const [hampersRes, productsRes] = await Promise.all([
        apiService.getHampers(),
        apiService.getProducts({ limit: 100 })
      ]);
      const h = hampersRes as any;
      const p = productsRes as any;
      setHampers(Array.isArray(h) ? h : h.data || []);
      setProducts(Array.isArray(p) ? p : p.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hampers');
    } finally {
      setLoading(false);
    }
  }

  async function saveHamper(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const payload = {
        productId: form.productId,
        name: form.name,
        description: form.description || null,
        contents: form.contents ? form.contents.split('\n').filter(Boolean) : [],
        imageUrl: form.imageUrl || null,
        images: form.images ? form.images.split('\n').filter(Boolean) : [],
        sizeNote: form.sizeNote || null,
        price: Number(form.price || 0),
        gstPercent: Number(form.gstPercent || 5),
        isActive: form.isActive,
        priority: Number(form.priority || 0)
      };

      if (!payload.productId) {
        setError('Please select a product');
        setSaving(false);
        return;
      }

      if (!payload.name) {
        setError('Hamper name is required');
        setSaving(false);
        return;
      }

      if (editingId) {
        await apiService.updateHamper(editingId, payload);
        setNotice('Hamper updated successfully.');
      } else {
        await apiService.createHamper(payload);
        setNotice('Hamper created. Now available for product selection.');
      }

      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save hamper');
    } finally {
      setSaving(false);
    }
  }

  async function deleteHamper(id: string) {
    if (!confirm('Delete this hamper? It will be removed from all products.')) return;

    try {
      setError('');
      setNotice('');
      await apiService.deleteHamper(id);
      setNotice('Hamper deleted.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete hamper');
    }
  }

  function editHamper(hamper: Hamper) {
    setForm({
      productId: hamper.productId,
      name: hamper.name,
      description: hamper.description || '',
      contents: hamper.contents.join('\n'),
      imageUrl: hamper.imageUrl || '',
      images: hamper.images.join('\n'),
      sizeNote: hamper.sizeNote || '',
      price: String(hamper.price),
      gstPercent: String(hamper.gstPercent),
      isActive: hamper.isActive,
      priority: String(hamper.priority)
    });
    setEditingId(hamper.id);
    setShowForm(true);
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Hampers" subtitle="Create and manage optional add-ons for products">
        <div className="space-y-8">
          {/* Notifications */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex gap-3">
              <span className="text-red-600 font-bold">⚠️</span>
              <div className="flex-1">
                <p className="font-bold text-red-700">Error</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
                <X size={18} />
              </button>
            </div>
          )}

          {notice && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <div className="flex-1">
                <p className="font-bold text-green-700">Success</p>
                <p className="text-sm text-green-600">{notice}</p>
              </div>
              <button onClick={() => setNotice('')} className="text-green-400 hover:text-green-600">
                <X size={18} />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* List Panel */}
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-black mb-3">Hamper List</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-black/40" size={18} />
                  <input
                    type="text"
                    placeholder="Search hampers..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg border border-black/10 pl-10 pr-4 py-2.5 text-sm"
                  />
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8 text-black/60">Loading hampers...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8 text-black/60">
                  {hampers.length === 0 ? 'No hampers yet' : 'No results found'}
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filtered.map((hamper) => (
                    <div
                      key={hamper.id}
                      className={`p-4 rounded-lg border cursor-pointer transition ${
                        editingId === hamper.id
                          ? 'border-ink bg-ink/5'
                          : 'border-black/10 hover:border-black/20 hover:bg-black/2'
                      }`}
                      onClick={() => editHamper(hamper)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{hamper.name}</p>
                          <p className="text-xs text-black/60 truncate">
                            {hamper.product?.name || 'Unknown'}
                          </p>
                          <p className="text-sm font-black text-ink mt-1">₹{hamper.price.toLocaleString()}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteHamper(hamper.id);
                            }}
                            className="p-2 hover:bg-red-100 text-red-600 rounded transition"
                          >
                            <Trash2 size={14} />
                          </button>
                          <span
                            className={`text-xs px-2 py-1 rounded font-bold ${
                              hamper.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {hamper.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Panel */}
            <div className="lg:col-span-2">
              <div className="sticky top-0">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-black text-lg">
                      {editingId ? 'Edit Hamper' : 'Create Hamper'}
                    </h2>
                    <p className="text-xs text-black/55 mt-1">
                      Special gift box add-on for products
                    </p>
                  </div>
                  {editingId && (
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setForm(emptyForm);
                        setShowForm(false);
                      }}
                      className="p-2 hover:bg-black/5 rounded"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                {!showForm && !editingId && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="w-full mb-4 inline-flex items-center justify-center gap-2 rounded-lg bg-ink text-white px-4 py-3 font-bold hover:bg-ink/90 transition"
                  >
                    <Plus size={18} /> Create New Hamper
                  </button>
                )}

                {(showForm || editingId) && (
                  <form onSubmit={saveHamper} className="rounded-lg border border-black/10 bg-white p-6 space-y-4">
                    {/* Product Selection */}
                    <div>
                      <label className="block text-sm font-bold mb-2">
                        Assign to Product *
                      </label>
                      <select
                        value={form.productId}
                        onChange={(e) => setForm({ ...form, productId: e.target.value })}
                        className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm"
                        required
                      >
                        <option value="">Select a product...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-bold mb-2">
                        Hamper Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Deluxe Gift Box"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-bold mb-2">
                        Description
                      </label>
                      <textarea
                        placeholder="Describe the hamper contents and special features"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm h-20 resize-none"
                      />
                    </div>

                    {/* Contents */}
                    <div>
                      <label className="block text-sm font-bold mb-2">
                        Contents (one per line)
                      </label>
                      <textarea
                        placeholder="e.g. Gift wrap, Custom card, Special packaging"
                        value={form.contents}
                        onChange={(e) => setForm({ ...form, contents: e.target.value })}
                        className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm h-20 resize-none"
                      />
                    </div>

                    {/* Pricing */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-bold mb-2">
                          Price (₹)
                        </label>
                        <input
                          type="number"
                          value={form.price}
                          onChange={(e) => setForm({ ...form, price: e.target.value })}
                          className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2">
                          GST (%)
                        </label>
                        <input
                          type="number"
                          value={form.gstPercent}
                          onChange={(e) => setForm({ ...form, gstPercent: e.target.value })}
                          className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm"
                        />
                      </div>
                    </div>

                    {/* Images */}
                    <div>
                      <label className="block text-sm font-bold mb-2">
                        Image URLs (one per line)
                      </label>
                      <textarea
                        placeholder="https://example.com/image1.jpg"
                        value={form.images}
                        onChange={(e) => setForm({ ...form, images: e.target.value })}
                        className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm h-16 resize-none font-mono text-xs"
                      />
                    </div>

                    {/* Size Note */}
                    <div>
                      <label className="block text-sm font-bold mb-2">
                        Size Note
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Fits all sizes, dimensions: 30x20x10 cm"
                        value={form.sizeNote}
                        onChange={(e) => setForm({ ...form, sizeNote: e.target.value })}
                        className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm"
                      />
                    </div>

                    {/* Status & Priority */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-bold mb-2">
                          Priority Order
                        </label>
                        <input
                          type="number"
                          value={form.priority}
                          onChange={(e) => setForm({ ...form, priority: e.target.value })}
                          className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-bold pt-6">
                          <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                          />
                          Active
                        </label>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 rounded-lg bg-ink text-white px-4 py-2.5 font-bold hover:bg-ink/90 disabled:opacity-50 transition"
                      >
                        {saving ? 'Saving...' : editingId ? 'Update Hamper' : 'Create Hamper'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                          setEditingId(null);
                          setForm(emptyForm);
                        }}
                        className="flex-1 rounded-lg border border-black/10 px-4 py-2.5 font-bold hover:bg-black/5 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
