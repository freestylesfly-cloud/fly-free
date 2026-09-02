'use client';

export const dynamic = 'force-dynamic';

import { Fragment, useMemo, useState } from 'react';
import { ChevronDown, Mail, Plus, RefreshCw, Save, Search, Trash2, X } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ImageUploadField } from '../components/ImageUploadField';
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
  youtubeUrl?: string | null;
  socialHandle?: string | null;
  followers?: number | null;
  instagramFollowers?: number | null;
  facebookFollowers?: number | null;
  xFollowers?: number | null;
  youtubeFollowers?: number | null;
  displayOrder?: number | null;
  homepageFeatured?: boolean;
  buyerDiscountPercent: number;
  commissionRate: number;
  totalEarnings: number;
  totalReferrals: number;
  isActive: boolean;
  products?: Array<{ id: string; name: string; sku?: string | null; price?: number | null }>;
  referrals?: Array<{ id: string; conversions: number; clicks: number; order?: { total: number; status: string } | null }>;
};

type ProductOption = {
  id: string;
  name: string;
  sku?: string | null;
  price?: number | null;
};

const emptyForm = {
  name: '',
  email: '',
  code: '',
  imageUrl: '',
  instagramUrl: '',
  facebookUrl: '',
  xUrl: '',
  youtubeUrl: '',
  socialHandle: '',
  followers: '',
  instagramFollowers: '',
  facebookFollowers: '',
  xFollowers: '',
  youtubeFollowers: '',
  displayOrder: '0',
  homepageFeatured: false,
  buyerDiscountPercent: '10',
  commissionRate: '8',
  productIds: [] as string[],
  isActive: true,
};

export default function InfluencersPage() {
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedInfluencerId, setExpandedInfluencerId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const { data, loading, error, refetch } = useFetch<any>(() => apiService.getInfluencers(), { skip: false });
  const { data: productData } = useFetch<any>(() => apiService.getProducts({ page: 1, limit: 500 }), { skip: false });

  const influencers = (data?.data || []) as Influencer[];
  const allProducts = (productData?.data || []) as ProductOption[];

  const filteredInfluencers = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return influencers;
    return influencers.filter((item) =>
      [item.name, item.email, item.code, item.socialHandle || ''].some((field) => field.toLowerCase().includes(value))
    );
  }, [influencers, query]);

  const filteredProducts = useMemo(() => {
    const value = productSearch.trim().toLowerCase();
    if (!value) return allProducts;
    return allProducts.filter((product) =>
      [product.name, product.sku || ''].some((field) => field.toLowerCase().includes(value))
    );
  }, [allProducts, productSearch]);

  const paginatedProducts = useMemo(() => {
    const start = (productPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, productPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const selectedProducts = allProducts.filter((product) => form.productIds.includes(product.id));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      code: form.code.trim().toUpperCase(),
      imageUrl: form.imageUrl.trim() || null,
      instagramUrl: form.instagramUrl.trim() || null,
      facebookUrl: form.facebookUrl.trim() || null,
      xUrl: form.xUrl.trim() || null,
      youtubeUrl: form.youtubeUrl.trim() || null,
      socialHandle: form.socialHandle.trim() || null,
      followers: form.followers ? Number(form.followers) : null,
      instagramFollowers: form.instagramFollowers ? Number(form.instagramFollowers) : null,
      facebookFollowers: form.facebookFollowers ? Number(form.facebookFollowers) : null,
      xFollowers: form.xFollowers ? Number(form.xFollowers) : null,
      youtubeFollowers: form.youtubeFollowers ? Number(form.youtubeFollowers) : null,
      displayOrder: Number(form.displayOrder || 0),
      homepageFeatured: form.homepageFeatured,
      buyerDiscountPercent: Number(form.buyerDiscountPercent || 10),
      commissionRate: Number(form.commissionRate || 0),
      productIds: form.productIds,
      isActive: form.isActive,
    };

    try {
      if (editingId) {
        await apiService.updateInfluencer(editingId, payload);
        setMessage('Influencer updated.');
      } else {
        await apiService.createInfluencer(payload);
        setMessage('Influencer created.');
      }

      resetForm();
      refetch();
    } catch (err) {
      setMessage('Error saving influencer.');
      console.error(err);
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setProductSearch('');
    setProductPage(1);
  }

  function edit(item: Influencer) {
    setEditingId(item.id);
    setExpandedInfluencerId(item.id);
    setProductSearch('');
    setProductPage(1);
    setForm({
      name: item.name,
      email: item.email,
      code: item.code,
      imageUrl: item.imageUrl || '',
      instagramUrl: item.instagramUrl || '',
      facebookUrl: item.facebookUrl || '',
      xUrl: item.xUrl || '',
      youtubeUrl: item.youtubeUrl || '',
      socialHandle: item.socialHandle || '',
      followers: item.followers ? String(item.followers) : '',
      instagramFollowers: item.instagramFollowers ? String(item.instagramFollowers) : '',
      facebookFollowers: item.facebookFollowers ? String(item.facebookFollowers) : '',
      xFollowers: item.xFollowers ? String(item.xFollowers) : '',
      youtubeFollowers: item.youtubeFollowers ? String(item.youtubeFollowers) : '',
      displayOrder: String(item.displayOrder || 0),
      homepageFeatured: item.homepageFeatured || false,
      buyerDiscountPercent: String(item.buyerDiscountPercent),
      commissionRate: String(item.commissionRate),
      productIds: item.products?.map((product) => product.id) || [],
      isActive: item.isActive,
    });
  }

  function toggleProduct(productId: string, checked: boolean) {
    setForm((current) => ({
      ...current,
      productIds: checked
        ? Array.from(new Set([...current.productIds, productId]))
        : current.productIds.filter((id) => id !== productId),
    }));
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Influencers" subtitle="Manage links, codes, discounts, and referral orders">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-2.5 text-black/40" size={18} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search influencers" className="w-full rounded border border-black/10 py-2 pl-10 pr-3" />
              </div>
              <button type="button" onClick={() => refetch()} className="inline-flex items-center justify-center gap-2 rounded bg-ink px-4 py-2 font-bold text-white">
                <RefreshCw size={16} /> Refresh
              </button>
            </div>
            <div className="rounded border border-blue-100 bg-blue-50 p-3 text-sm font-bold text-blue-900">
              Website order follows the Order index below. Active influencers with selected products appear on the storefront creator promotion section.
            </div>

            {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

            <div className="overflow-x-auto rounded border border-black/10 bg-white">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-black/5 text-left">
                  <tr>
                    <th className="p-3">Website order</th>
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
                    <tr><td className="p-4" colSpan={7}>Loading influencers...</td></tr>
                  ) : filteredInfluencers.length === 0 ? (
                    <tr><td className="p-4 text-black/60" colSpan={7}>No influencers found.</td></tr>
                  ) : filteredInfluencers.map((item) => (
                    <Fragment key={item.id}>
                      <tr className="border-t border-black/10 align-top">
                        <td className="p-3">
                          <div className="font-black text-ink">{item.displayOrder ?? 0}</div>
                          <div className={`mt-1 inline-flex rounded-full px-2 py-1 text-[10px] font-black uppercase ${item.isActive ? 'bg-green-50 text-green-700' : 'bg-black/5 text-black/50'}`}>
                            {item.isActive ? 'Active' : 'Hidden'}{item.homepageFeatured ? ' · Homepage' : ''}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-ink">{item.name}</div>
                          <div className="text-black/60">{item.email}</div>
                          <div className="text-black/50">{item.socialHandle || 'No handle'}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-black text-coral">{item.code}</div>
                          <div className="text-xs text-black/50">{item.linkKey || 'No link key'}</div>
                        </td>
                        <td className="p-3">
                          <div>{item.buyerDiscountPercent}% buyer</div>
                          <div className="text-black/60">{item.commissionRate}% commission</div>
                        </td>
                        <td className="p-3">
                          {item.products?.length ? (
                            <div>
                              <p className="font-bold">{item.products.length} products</p>
                              <p className="mt-1 text-xs text-black/60">{item.products.slice(0, 2).map((product) => product.name).join(', ')}{item.products.length > 2 ? '...' : ''}</p>
                            </div>
                          ) : (
                            <p className="text-black/60">No products</p>
                          )}
                        </td>
                        <td className="p-3">
                          <div>Rs {item.totalEarnings.toLocaleString('en-IN')}</div>
                          <div className="text-black/60">{item.totalReferrals} referrals</div>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setExpandedInfluencerId(expandedInfluencerId === item.id ? null : item.id)} className="inline-flex items-center gap-1 rounded border border-black/10 px-3 py-2 text-sm font-bold">
                              View <ChevronDown className={expandedInfluencerId === item.id ? 'rotate-180 transition' : 'transition'} size={14} />
                            </button>
                            <button type="button" onClick={() => edit(item)} className="rounded border border-black/10 px-3 py-2 text-sm font-bold">Edit</button>
                            <button type="button" onClick={async () => { await apiService.sendInfluencerCode(item.id); setMessage(`Code sent to ${item.email}`); }} className="rounded bg-coral px-3 py-2 text-sm font-bold text-white"><Mail size={16} /></button>
                            <button type="button" onClick={async () => { await apiService.deleteInfluencer(item.id); refetch(); }} className="rounded border border-red-200 px-3 py-2 text-sm text-red-700"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                      {expandedInfluencerId === item.id && (
                        <tr className="border-t border-black/10 bg-black/[0.02]">
                          <td colSpan={7} className="p-4">
                            <div className="grid gap-4 md:grid-cols-3">
                              <DetailBlock title="Social links" values={[item.instagramUrl, item.facebookUrl, item.xUrl, item.youtubeUrl]} empty="No social links added" />
                              <div>
                                <p className="text-xs font-black uppercase text-black/50">Offer products</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {item.products?.length ? item.products.map((product) => (
                                    <span key={product.id} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-ink shadow-sm">{product.name}</span>
                                  )) : <span className="text-sm text-black/60">No products assigned</span>}
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-black uppercase text-black/50">Performance</p>
                                <p className="mt-2 text-sm text-black/70">{item.followers?.toLocaleString('en-IN') || 0} total followers</p>
                                <p className="text-sm text-black/70">IG {item.instagramFollowers?.toLocaleString('en-IN') || 0} · FB {item.facebookFollowers?.toLocaleString('en-IN') || 0} · X {item.xFollowers?.toLocaleString('en-IN') || 0} · YT {item.youtubeFollowers?.toLocaleString('en-IN') || 0}</p>
                                <p className="text-sm text-black/70">{item.referrals?.length || 0} tracked referrals</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <form onSubmit={submit} className="max-h-[90vh] space-y-4 overflow-y-auto rounded border border-black/10 bg-white p-5">
            <h2 className="flex items-center gap-2 text-lg font-black"><Plus size={18} /> {editingId ? 'Edit influencer' : 'Add influencer'}</h2>
            {message && <div className={`rounded p-3 text-sm font-bold ${message.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{message}</div>}

            <Field label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
            <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Code" value={form.code} onChange={(value) => setForm({ ...form, code: value.toUpperCase() })} placeholder="Auto if blank" />
              <Field label="Website order index" type="number" value={form.displayOrder} onChange={(value) => setForm({ ...form, displayOrder: value })} />
            </div>
            <p className="-mt-2 text-xs font-bold text-black/50">Lower numbers show first on the website.</p>
            <label className="flex items-center gap-2 rounded border border-black/10 px-3 py-2 text-sm font-bold">
              <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
              Show this influencer on website
            </label>
            <label className="flex items-center gap-2 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-900">
              <input type="checkbox" checked={form.homepageFeatured} onChange={(event) => setForm({ ...form, homepageFeatured: event.target.checked })} />
              Feature this creator on homepage
            </label>
            <p className="-mt-2 text-xs font-bold text-black/50">If none are selected, the first active creator with products is shown.</p>
            <ImageUploadField
              label="Photo"
              value={form.imageUrl}
              onChange={(value) => setForm((current) => ({ ...current, imageUrl: value }))}
              bucket="product-images"
              folder="influencers"
              aspect={1}
              targetWidth={800}
              alt={form.name}
              hint="Square avatar in the creators row. Centre the face."
            />
            <Field label="Instagram URL" value={form.instagramUrl} onChange={(value) => setForm({ ...form, instagramUrl: value })} />
            <Field label="Facebook URL" value={form.facebookUrl} onChange={(value) => setForm({ ...form, facebookUrl: value })} />
            <Field label="X URL" value={form.xUrl} onChange={(value) => setForm({ ...form, xUrl: value })} />
            <Field label="YouTube URL" value={form.youtubeUrl} onChange={(value) => setForm({ ...form, youtubeUrl: value })} />
            <Field label="Social handle (display name or profile URL)" value={form.socialHandle} onChange={(value) => setForm({ ...form, socialHandle: value })} />
            <Field label="Total followers (all platforms)" type="number" value={form.followers} onChange={(value) => setForm({ ...form, followers: value })} />

            <div className="grid grid-cols-2 gap-3">
              <Field label="Instagram followers" type="number" value={form.instagramFollowers} onChange={(value) => setForm({ ...form, instagramFollowers: value })} />
              <Field label="Facebook followers" type="number" value={form.facebookFollowers} onChange={(value) => setForm({ ...form, facebookFollowers: value })} />
              <Field label="X followers" type="number" value={form.xFollowers} onChange={(value) => setForm({ ...form, xFollowers: value })} />
              <Field label="YouTube followers" type="number" value={form.youtubeFollowers} onChange={(value) => setForm({ ...form, youtubeFollowers: value })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Buyer discount %" type="number" value={form.buyerDiscountPercent} onChange={(value) => setForm({ ...form, buyerDiscountPercent: value })} />
              <Field label="Commission %" type="number" value={form.commissionRate} onChange={(value) => setForm({ ...form, commissionRate: value })} />
            </div>

            <div className="border-t pt-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-bold">Promoted products</h3>
                <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-bold text-black/60">{form.productIds.length} selected</span>
              </div>
              <p className="mb-3 text-xs font-bold text-black/50">These products appear under this influencer card and are eligible for their code.</p>

              {selectedProducts.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {selectedProducts.map((product) => (
                    <button key={product.id} type="button" onClick={() => toggleProduct(product.id, false)} className="inline-flex items-center gap-1 rounded-full bg-coral/10 px-3 py-1 text-xs font-bold text-coral">
                      {product.name} <X size={12} />
                    </button>
                  ))}
                </div>
              )}

              <input
                type="text"
                placeholder="Search products"
                value={productSearch}
                onChange={(event) => {
                  setProductSearch(event.target.value);
                  setProductPage(1);
                }}
                className="mb-3 w-full rounded border border-black/10 px-3 py-2 text-sm"
              />

              <div className="mb-3 flex items-center gap-2">
                <label className="text-sm font-bold">Show</label>
                <select value={itemsPerPage} onChange={(event) => { setItemsPerPage(Number(event.target.value)); setProductPage(1); }} className="rounded border border-black/10 px-3 py-1 text-sm">
                  <option value={5}>5 items</option>
                  <option value={10}>10 items</option>
                  <option value={20}>20 items</option>
                  <option value={50}>50 items</option>
                </select>
              </div>

              <div className="max-h-60 space-y-2 overflow-y-auto rounded border border-black/10 bg-black/[0.02] p-3">
                {paginatedProducts.length === 0 ? (
                  <p className="text-sm text-black/60">No products found</p>
                ) : paginatedProducts.map((product) => (
                  <label key={product.id} className="flex cursor-pointer items-center gap-3 rounded p-2 hover:bg-black/5">
                    <input type="checkbox" checked={form.productIds.includes(product.id)} onChange={(event) => toggleProduct(product.id, event.target.checked)} className="h-4 w-4 rounded" />
                    <div className="flex-1">
                      <p className="text-sm font-bold">{product.name}</p>
                      <p className="text-xs text-black/60">{product.sku || 'No SKU'}{product.price ? ` - Rs ${product.price}` : ''}</p>
                    </div>
                  </label>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-3 flex items-center justify-between text-sm">
                  <p className="text-black/60">Page {productPage} of {totalPages}</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setProductPage(Math.max(1, productPage - 1))} disabled={productPage === 1} className="rounded border border-black/10 px-2 py-1 disabled:opacity-50">Prev</button>
                    <button type="button" onClick={() => setProductPage(Math.min(totalPages, productPage + 1))} disabled={productPage === totalPages} className="rounded border border-black/10 px-2 py-1 disabled:opacity-50">Next</button>
                  </div>
                </div>
              )}
            </div>

            <button className="inline-flex w-full items-center justify-center gap-2 rounded bg-ink px-4 py-3 font-bold text-white">
              <Save size={18} /> Save influencer
            </button>

            {editingId && (
              <button type="button" onClick={resetForm} className="inline-flex w-full items-center justify-center gap-2 rounded border border-black/10 px-4 py-3 font-bold">
                Cancel
              </button>
            )}
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function DetailBlock({ title, values, empty }: { title: string; values: Array<string | null | undefined>; empty: string }) {
  const visibleValues = values.filter(Boolean) as string[];
  return (
    <div>
      <p className="text-xs font-black uppercase text-black/50">{title}</p>
      <div className="mt-2 space-y-1 text-sm text-black/70">
        {visibleValues.length ? visibleValues.map((value, index) => <p key={`${value}-${index}`}>{value}</p>) : <p>{empty}</p>}
      </div>
    </div>
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
