'use client';

export const dynamic = 'force-dynamic';

import { useMemo, useState } from 'react';
import { Mail, Plus, RefreshCw, Save, Search, Trash2, ChevronDown } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useFetch } from '../hooks/useFetch';
import { apiService } from '../services/api';

type Influencer = {
  id: string;
  name: string;
  email: string;
  code: string;
  linkKey?: string | null;
  imageUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  xUrl?: string | null;
  socialHandle?: string | null;
  followers?: number | null;
  buyerDiscountPercent: number;
  commissionRate: number;
  totalEarnings: number;
  totalReferrals: number;
  isActive: boolean;
  products?: Array<{ id: string; name: string }>;
  referrals?: Array<{ id: string; conversions: number; clicks: number; order?: { total: number; status: string } | null }>;
};

type ProductOption = {
  id: string;
  name: string;
  sku?: string;
  price?: number;
};

const emptyForm = {
  name: '',
  email: '',
  code: '',
  imageUrl: '',
  instagramUrl: '',
  facebookUrl: '',
  xUrl: '',
  socialHandle: '',
  followers: '',
  buyerDiscountPercent: '10',
  commissionRate: '8',
  productIds: [] as string[],
};

export default function InfluencersPage() {
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  // Product management states
  const [expandedInfluencerId, setExpandedInfluencerId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const { data, loading, error, refetch } = useFetch<any>(() => apiService.getInfluencers(), { skip: false });
  const { data: productData } = useFetch<any>(() => apiService.getProducts({ page: 1, limit: 500 }), { skip: false });

  const influencers = (data?.data || []) as Influencer[];
  const allProducts = (productData?.data || []) as ProductOption[];

  const filtered = useMemo(() => {
    const value = query.toLowerCase();
    return influencers.filter((item) =>
      [item.name, item.email, item.code, item.socialHandle || ''].some((field) => field.toLowerCase().includes(value))
    );
  }, [influencers, query]);

  const filteredProducts = useMemo(() => {
    const value = productSearch.trim().toLowerCase();
    if (!value) return allProducts;
    return allProducts.filter((product: ProductOption) =>
      [product.name, product.sku || ''].some((field) => field.toLowerCase().includes(value))
    );
  }, [allProducts, productSearch]);

  const paginatedProducts = useMemo(() => {
    const start = (productPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, productPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    const payload = {
      name: form.name,
      email: form.email,
      code: form.code,
      imageUrl: form.imageUrl || undefined,
      instagramUrl: form.instagramUrl || undefined,
      facebookUrl: form.facebookUrl || undefined,
      xUrl: form.xUrl || undefined,
      socialHandle: form.socialHandle || undefined,
      followers: form.followers ? Number(form.followers) : undefined,
      buyerDiscountPercent: Number(form.buyerDiscountPercent || 10),
      commissionRate: Number(form.commissionRate || 0),
      productIds: form.productIds,
    };

    try {
      if (editingId) {
        await apiService.updateInfluencer(editingId, payload);

        setMessage('✓ Influencer updated.');
      } else {
        await apiService.createInfluencer(payload);
        setMessage('✓ Influencer created.');
      }

      setForm(emptyForm);
      setEditingId(null);
      setExpandedInfluencerId(null);
      setProductSearch('');
      setProductPage(1);
      refetch();
    } catch (err) {
      setMessage('✕ Error saving');
      console.error(err);
    }
  }

  function edit(item: Influencer) {
    setEditingId(item.id);
    setExpandedInfluencerId(item.id);
    setForm({
      name: item.name,
      email: item.email,
      code: item.code,
      imageUrl: item.imageUrl || '',
      instagramUrl: item.instagramUrl || '',
      facebookUrl: item.facebookUrl || '',
      xUrl: item.xUrl || '',
      socialHandle: item.socialHandle || '',
      followers: item.followers ? String(item.followers) : '',
      buyerDiscountPercent: String(item.buyerDiscountPercent),
      commissionRate: String(item.commissionRate),
      productIds: item.products?.map(p => p.id) || [],
    });
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Influencers" subtitle="Manage links, codes, discounts, and referral orders">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-2.5 text-black/40" size={18} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search influencers" className="w-full rounded border border-black/10 py-2 pl-10 pr-3" />
              </div>
              <button onClick={() => refetch()} className="inline-flex items-center justify-center gap-2 rounded bg-ink px-4 py-2 font-bold text-white">
                <RefreshCw size={16} /> Refresh
              </button>
            </div>

            {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

            <div className="overflow-x-auto rounded border border-black/10 bg-white">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-black/5 text-left">
                  <tr>
                    <th className="p-3">Influencer</th>
                    <th className="p-3">Code</th>
                    <th className="p-3">Offer</th>
                    <th className="p-3">Products</th>
                    <th className="p-3">Performance</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td className="p-4" colSpan={6}>Loading influencers...</td></tr>
                  ) : filtered.map((item) => (
                    <tr key={item.id} className="border-t border-black/10 align-top">
                      <td className="p-3">
                        <div className="font-bold text-ink">{item.name}</div>
                        <div className="text-black/60">{item.email}</div>
                        <div className="text-black/50">{item.socialHandle}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-black text-coral">{item.code}</div>
                      </td>
                      <td className="p-3">
                        <div>{item.buyerDiscountPercent}% buyer</div>
                        <div className="text-black/60">{item.commissionRate}% commission</div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {item.products?.length ? (
                            <div>
                              <p className="font-bold">{item.products.length} products</p>
                              <p className="text-black/60 text-xs mt-1">{item.products.slice(0, 2).map(p => p.name).join(', ')}{item.products.length > 2 ? '...' : ''}</p>
                            </div>
                          ) : (
                            <p className="text-black/60">No products</p>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div>Rs {item.totalEarnings.toLocaleString('en-IN')}</div>
                        <div className="text-black/60">{item.totalReferrals} referrals</div>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button onClick={() => edit(item)} className="rounded border border-black/10 px-3 py-2 font-bold text-sm">Edit</button>
                          <button onClick={async () => { await apiService.sendInfluencerCode(item.id); setMessage(`Code sent to ${item.email}`); }} className="rounded bg-coral px-3 py-2 font-bold text-white text-sm"><Mail size={16} /></button>
                          <button onClick={async () => { await apiService.deleteInfluencer(item.id); refetch(); }} className="rounded border border-red-200 px-3 py-2 text-red-700 text-sm"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Edit Form Sidebar */}
          <form onSubmit={submit} className="space-y-4 rounded border border-black/10 bg-white p-5 max-h-[90vh] overflow-y-auto">
            <h2 className="flex items-center gap-2 text-lg font-black"><Plus size={18} /> {editingId ? 'Edit influencer' : 'Add influencer'}</h2>
            {message && <div className={`rounded p-3 text-sm font-bold ${message.includes('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{message}</div>}

            <Field label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
            <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required />
            <Field label="Code" value={form.code} onChange={(value) => setForm({ ...form, code: value.toUpperCase() })} placeholder="Auto if blank" />
            <Field label="Image URL" value={form.imageUrl} onChange={(value) => setForm({ ...form, imageUrl: value })} />
            <Field label="Instagram URL" value={form.instagramUrl} onChange={(value) => setForm({ ...form, instagramUrl: value })} />
            <Field label="Facebook URL" value={form.facebookUrl} onChange={(value) => setForm({ ...form, facebookUrl: value })} />
            <Field label="X URL" value={form.xUrl} onChange={(value) => setForm({ ...form, xUrl: value })} />

            <div className="grid grid-cols-2 gap-3">
              <Field label="Buyer discount %" type="number" value={form.buyerDiscountPercent} onChange={(value) => setForm({ ...form, buyerDiscountPercent: value })} />
              <Field label="Commission %" type="number" value={form.commissionRate} onChange={(value) => setForm({ ...form, commissionRate: value })} />
            </div>

            {/* Products Section */}
            {(
              <div className="border-t pt-4">
                <h3 className="font-bold mb-3">Eligible Products for Discount</h3>

                {/* Search */}
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setProductPage(1);
                    }}
                    className="w-full rounded border border-black/10 px-3 py-2 text-sm"
                  />
                </div>

                {/* Items per page */}
                <div className="mb-3 flex items-center gap-2">
                  <label className="text-sm font-bold">Show:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setProductPage(1);
                    }}
                    className="rounded border border-black/10 px-3 py-1 text-sm"
                  >
                    <option value={5}>5 items</option>
                    <option value={10}>10 items</option>
                    <option value={20}>20 items</option>
                    <option value={50}>50 items</option>
                  </select>
                </div>

                {/* Product List with Checkboxes */}
                <div className="space-y-2 max-h-60 overflow-y-auto border border-black/10 rounded p-3 bg-black/2">
                  {paginatedProducts.length === 0 ? (
                    <p className="text-sm text-black/60">No products found</p>
                  ) : (
                    paginatedProducts.map((product) => (
                      <label key={product.id} className="flex items-center gap-3 p-2 hover:bg-black/5 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.productIds.includes(product.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm({ ...form, productIds: [...form.productIds, product.id] });
                            } else {
                              setForm({ ...form, productIds: form.productIds.filter(id => id !== product.id) });
                            }
                          }}
                          className="w-4 h-4 rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-bold">{product.name}</p>
                          <p className="text-xs text-black/60">Rs {product.price}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <p className="text-black/60">Page {productPage} of {totalPages}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setProductPage(Math.max(1, productPage - 1))}
                        disabled={productPage === 1}
                        className="px-2 py-1 rounded border border-black/10 disabled:opacity-50"
                      >
                        ← Prev
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductPage(Math.min(totalPages, productPage + 1))}
                        disabled={productPage === totalPages}
                        className="px-2 py-1 rounded border border-black/10 disabled:opacity-50"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}

                {/* Selected count */}
                <p className="text-xs text-black/60 mt-3 font-bold">
                  {form.productIds.length} product{form.productIds.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            )}

            <button className="inline-flex w-full items-center justify-center gap-2 rounded bg-ink px-4 py-3 font-bold text-white">
              <Save size={18} /> Save influencer
            </button>

            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setExpandedInfluencerId(null);
                  setForm(emptyForm);
                  setProductSearch('');
                  setProductPage(1);
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded border border-black/10 px-4 py-3 font-bold"
              >
                Cancel
              </button>
            )}
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function Field({ label, value, onChange, type = 'text', required, placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <input required={required} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="rounded border border-black/10 px-3 py-2" />
    </label>
  );
}
