'use client';

export const dynamic = 'force-dynamic';

import { useMemo, useState } from 'react';
import { Mail, Plus, RefreshCw, Save, Search, Trash2 } from 'lucide-react';
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
  product?: { id: string; name: string } | null;
  referrals?: Array<{ id: string; conversions: number; clicks: number; order?: { total: number; status: string } | null }>;
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
  buyerDiscountPercent: '20',
  commissionRate: '8',
  productId: '',
};

export default function InfluencersPage() {
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const { data, loading, error, refetch } = useFetch<any>(() => apiService.getInfluencers(), { skip: false });
  const { data: productData } = useFetch<any>(() => apiService.getProducts({ page: 1, limit: 100 }), { skip: false });

  const influencers = (data?.data || []) as Influencer[];
  const products = productData?.data || [];
  const filtered = useMemo(() => {
    const value = query.toLowerCase();
    return influencers.filter((item) =>
      [item.name, item.email, item.code, item.socialHandle || ''].some((field) => field.toLowerCase().includes(value))
    );
  }, [influencers, query]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    const payload = {
      ...form,
      followers: form.followers ? Number(form.followers) : undefined,
      buyerDiscountPercent: Number(form.buyerDiscountPercent || 0),
      commissionRate: Number(form.commissionRate || 0),
      productId: form.productId || undefined,
    };

    if (editingId) {
      await apiService.updateInfluencer(editingId, payload);
      setMessage('Influencer updated.');
    } else {
      await apiService.createInfluencer(payload);
      setMessage('Influencer created.');
    }

    setForm(emptyForm);
    setEditingId(null);
    refetch();
  }

  function edit(item: Influencer) {
    setEditingId(item.id);
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
      productId: item.product?.id || '',
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
                    <th className="p-3">Code and link</th>
                    <th className="p-3">Offer</th>
                    <th className="p-3">Product</th>
                    <th className="p-3">Performance</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td className="p-4" colSpan={6}>Loading influencers...</td></tr>
                  ) : filtered.map((item) => {
                    const link = `${process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'}?promo=${item.code}`;
                    return (
                      <tr key={item.id} className="border-t border-black/10 align-top">
                        <td className="p-3">
                          <div className="font-bold text-ink">{item.name}</div>
                          <div className="text-black/60">{item.email}</div>
                          <div className="text-black/50">{item.socialHandle}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-black text-coral">{item.code}</div>
                          <div className="max-w-xs break-all text-xs text-black/60">{link}</div>
                        </td>
                        <td className="p-3">
                          <div>{item.buyerDiscountPercent}% buyer discount</div>
                          <div className="text-black/60">{item.commissionRate}% commission</div>
                        </td>
                        <td className="p-3">{item.product?.name || 'All products'}</td>
                        <td className="p-3">
                          <div>Rs {item.totalEarnings.toLocaleString('en-IN')}</div>
                          <div className="text-black/60">{item.totalReferrals} referrals</div>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button onClick={() => edit(item)} className="rounded border border-black/10 px-3 py-2 font-bold">Edit</button>
                            <button onClick={async () => { await apiService.sendInfluencerCode(item.id); setMessage(`Code sent to ${item.email}`); }} className="rounded bg-coral px-3 py-2 font-bold text-white"><Mail size={16} /></button>
                            <button onClick={async () => { await apiService.deleteInfluencer(item.id); refetch(); }} className="rounded border border-red-200 px-3 py-2 text-red-700"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <form onSubmit={submit} className="space-y-4 rounded border border-black/10 bg-white p-5">
            <h2 className="flex items-center gap-2 text-lg font-black"><Plus size={18} /> {editingId ? 'Edit influencer' : 'Add influencer'}</h2>
            {message && <div className="rounded bg-green-50 p-3 text-sm font-bold text-green-700">{message}</div>}
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
            <select value={form.productId} onChange={(event) => setForm({ ...form, productId: event.target.value })} className="w-full rounded border border-black/10 px-3 py-2">
              <option value="">All products</option>
              {products.map((product: any) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
            <button className="inline-flex w-full items-center justify-center gap-2 rounded bg-ink px-4 py-3 font-bold text-white">
              <Save size={18} /> Save influencer
            </button>
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
