'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Edit3, Plus, Search, Trash2, X, ChevronDown, Image as ImageIcon, Package } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ImageUploadField } from '../components/ImageUploadField';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { apiService } from '../services/api';

type Hamper = {
  id: string;
  productId: string;
  themeId?: string;
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
  theme?: { name: string };
};

type HamperForm = {
  productId: string;
  themeId: string;
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
  themeId: '',
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
  const [themes, setThemes] = useState<any[]>([]);
  const [form, setForm] = useState<HamperForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    void loadData();
  }, []);

  const filtered = hampers.filter((hamper) =>
    `${hamper.name} ${hamper.product?.name || ''} ${hamper.theme?.name || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  async function loadData() {
    try {
      setLoading(true);
      setError('');
      const [hampersRes, productsRes, themesRes] = await Promise.all([
        apiService.getHampers(),
        apiService.getProducts({ limit: 100 }),
        apiService.getProductThemes()
      ]);
      const h = hampersRes as any;
      const p = productsRes as any;
      const t = themesRes as any;
      setHampers(Array.isArray(h) ? h : h.data || []);
      setProducts(Array.isArray(p) ? p : p.data || []);
      setThemes(Array.isArray(t) ? t : t.data || []);
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
        productId: form.productId || null,
        themeId: form.themeId || null,
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

      if (!payload.productId && !payload.themeId) {
        setError('Please select either a product or a theme.');
        setSaving(false);
        return;
      }

      if (payload.productId && payload.themeId) {
        setError('Please assign the hamper to either a product or a theme, not both.');
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
      productId: hamper.productId || '',
      themeId: hamper.themeId || '',
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
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <section className="space-y-4">
            <div className="rounded border border-black/10 bg-white p-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 h-5 w-5 text-black/35" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search hampers..."
                  className="w-full rounded border border-black/10 py-2 pl-10 pr-3"
                />
              </div>
            </div>

            {error && <div className="rounded border border-red-200 bg-red-50 p-4 font-bold text-red-700">{error}</div>}
            {notice && <div className="rounded border border-green-200 bg-green-50 p-4 font-bold text-green-800">{notice}</div>}

            <div className="overflow-hidden rounded border border-black/10 bg-white">
              <div className="border-b border-black/10 p-4 font-black">Hamper inventory</div>
              {loading ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-16 animate-pulse rounded bg-black/5" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <p className="p-6 text-sm font-bold text-black/50">
                  {hampers.length === 0 ? 'No hampers found.' : 'No matching hampers.'}
                </p>
              ) : (
                <div className="divide-y divide-black/5">
                  {filtered.map((hamper) => (
                    <article
                      key={hamper.id}
                      className={`flex flex-col gap-4 p-4 transition sm:flex-row sm:items-center sm:justify-between ${
                        editingId === hamper.id ? 'border-l-4 border-ink bg-ink/5' : 'border-b border-black/5'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => editHamper(hamper)}
                        className="text-left flex-1"
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded border border-black/10 bg-black/[0.03]">
                              {hamper.imageUrl ? (
                                <img src={hamper.imageUrl} alt={hamper.name} className="h-full w-full object-cover" />
                              ) : (
                                <Package size={22} className="text-black/35" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h2 className="font-black text-ink truncate">{hamper.name}</h2>
                              <p className="text-sm font-bold text-black/45 truncate">
                                {hamper.product?.name || (hamper as any).theme?.name || 'Unassigned'}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-black/60">
                            <span className="font-bold text-ink">₹{hamper.price.toLocaleString()}</span>
                            <span className="rounded-full border border-black/10 bg-black/5 px-2 py-1">Priority {hamper.priority}</span>
                            <span className={`rounded-full px-2 py-1 text-xs font-black ${hamper.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                              {hamper.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </button>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => editHamper(hamper)}
                          className="inline-flex items-center gap-2 rounded border border-black/10 px-3 py-2 text-sm font-bold"
                        >
                          <Edit3 size={15} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteHamper(hamper.id)}
                          className="inline-flex items-center gap-2 rounded border border-red-200 px-3 py-2 text-sm font-bold text-red-600"
                        >
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded border border-black/10 bg-white p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-black text-lg">{editingId ? 'Edit Hamper' : 'Create Hamper'}</h2>
                  <p className="text-sm text-black/55">Manage the add-on product experience for the storefront.</p>
                </div>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setForm(emptyForm);
                      setShowForm(false);
                    }}
                    className="rounded p-2 hover:bg-black/5"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <form onSubmit={saveHamper} className="space-y-4">
                  <div className="grid gap-3">
                    <div className="grid gap-3">
                      <label className="grid gap-2 text-sm font-bold">
                        Assign to product
                        <select
                          value={form.productId}
                          onChange={(e) => setForm({ ...form, productId: e.target.value })}
                          className="rounded border border-black/10 px-3 py-2.5"
                        >
                          <option value="">Select a product...</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="grid gap-2 text-sm font-bold">
                        Assign to theme
                        <select
                          value={form.themeId}
                          onChange={(e) => setForm({ ...form, themeId: e.target.value })}
                          className="rounded border border-black/10 px-3 py-2.5"
                        >
                          <option value="">Select a theme...</option>
                          {themes.map((theme) => (
                            <option key={theme.id} value={theme.id}>
                              {theme.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <p className="text-xs text-black/50">
                        Choose either a product or a theme. Theme-level hampers apply to all products within that theme.
                      </p>
                    </div>

                    <label className="grid gap-2 text-sm font-bold">
                      Hamper name *
                      <input
                        type="text"
                        placeholder="Deluxe Gift Box"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="rounded border border-black/10 px-3 py-2.5"
                        required
                      />
                    </label>

                    <label className="grid gap-2 text-sm font-bold">
                      Description
                      <textarea
                        placeholder="Describe the hamper contents"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="rounded border border-black/10 px-3 py-2.5 h-24 resize-none"
                      />
                    </label>

                    <ImageUploadField
                      label="Cover image"
                      value={form.imageUrl}
                      onChange={(value) => setForm({ ...form, imageUrl: value })}
                      bucket="product-hampers"
                      folder={form.name ? `hampers/${form.name.replace(/\s+/g, '-').toLowerCase()}` : 'hampers'}
                      aspect={1}
                      alt={form.name || 'Hamper cover image'}
                    />

                    <label className="grid gap-2 text-sm font-bold">
                      Contents (one per line)
                      <textarea
                        placeholder="Gift wrap\nCustom card\nPremium packaging"
                        value={form.contents}
                        onChange={(e) => setForm({ ...form, contents: e.target.value })}
                        className="rounded border border-black/10 px-3 py-2.5 h-24 resize-none"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="grid gap-2 text-sm font-bold">
                        Price (₹)
                        <input
                          type="number"
                          value={form.price}
                          onChange={(e) => setForm({ ...form, price: e.target.value })}
                          className="rounded border border-black/10 px-3 py-2.5"
                        />
                      </label>

                      <label className="grid gap-2 text-sm font-bold">
                        GST (%)
                        <input
                          type="number"
                          value={form.gstPercent}
                          onChange={(e) => setForm({ ...form, gstPercent: e.target.value })}
                          className="rounded border border-black/10 px-3 py-2.5"
                        />
                      </label>
                    </div>

                    <label className="grid gap-2 text-sm font-bold">
                      Image URLs (one per line)
                      <textarea
                        placeholder="https://example.com/image1.jpg"
                        value={form.images}
                        onChange={(e) => setForm({ ...form, images: e.target.value })}
                        className="rounded border border-black/10 px-3 py-2.5 h-20 resize-none font-mono text-xs"
                      />
                    </label>

                    <label className="grid gap-2 text-sm font-bold">
                      Size note
                      <input
                        type="text"
                        placeholder="Fits all sizes, dimensions: 30x20x10 cm"
                        value={form.sizeNote}
                        onChange={(e) => setForm({ ...form, sizeNote: e.target.value })}
                        className="rounded border border-black/10 px-3 py-2.5"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="grid gap-2 text-sm font-bold">
                        Priority order
                        <input
                          type="number"
                          value={form.priority}
                          onChange={(e) => setForm({ ...form, priority: e.target.value })}
                          className="rounded border border-black/10 px-3 py-2.5"
                        />
                      </label>

                      <label className="flex items-center gap-2 text-sm font-bold">
                        <input
                          type="checkbox"
                          checked={form.isActive}
                          onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                        />
                        Active
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 rounded bg-ink px-4 py-3 text-sm font-black text-white hover:bg-ink/90 disabled:opacity-50 transition"
                    >
                      {saving ? 'Saving...' : editingId ? 'Update hamper' : 'Create hamper'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(null);
                        setForm(emptyForm);
                      }}
                      className="flex-1 rounded border border-black/10 px-4 py-3 text-sm font-bold hover:bg-black/5 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
            </div>
          </section>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
