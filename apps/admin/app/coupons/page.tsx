'use client';

import { useState } from 'react';
import { Edit2, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useFetch } from '../hooks/useFetch';
import { apiService } from '../services/api';

type Coupon = {
  id: string;
  code: string;
  description?: string | null;
  discountAmount?: number | null;
  discountPercent?: number | null;
  minOrderAmount?: number | null;
  isActive: boolean;
  isFirstOrder: boolean;
};

const emptyForm = { code: '', description: '', discountPercent: '', discountAmount: '', minOrderAmount: '', isActive: true };

export default function CouponsPage() {
  const { data, loading, error, refetch } = useFetch<any>(() => apiService.getCoupons(), { skip: false });
  const coupons = (data?.data || []) as Coupon[];
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  function edit(coupon: Coupon) {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      discountPercent: coupon.discountPercent ? String(coupon.discountPercent) : '',
      discountAmount: coupon.discountAmount ? String(coupon.discountAmount) : '',
      minOrderAmount: coupon.minOrderAmount ? String(coupon.minOrderAmount) : '',
      isActive: coupon.isActive,
    });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        code: form.code,
        description: form.description,
        discountPercent: form.discountPercent ? Number(form.discountPercent) : undefined,
        discountAmount: form.discountAmount ? Number(form.discountAmount) : undefined,
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
        isActive: form.isActive,
      };
      if (editingId) await apiService.updateCoupon(editingId, payload);
      else await apiService.createCoupon(payload);
      setMessage(editingId ? 'Coupon updated.' : 'Coupon created.');
      setForm(emptyForm);
      setEditingId(null);
      refetch();
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : 'Could not save coupon.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this coupon?')) return;
    await apiService.deleteCoupon(id);
    refetch();
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Coupons" subtitle="Manage store offers separately from the first-order offer in Settings">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="rounded border border-black/10 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">All offers</h2>
                <p className="mt-1 text-xs font-bold text-black/50">The first-order offer is managed in Settings. Create extra offers here.</p>
              </div>
              <button type="button" onClick={() => refetch()} className="inline-flex items-center gap-2 rounded border border-black/10 px-3 py-2 text-sm font-bold"><RefreshCw size={15} /> Refresh</button>
            </div>
            {error && <p className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-sm">
                <thead className="bg-black/5 text-left"><tr><th className="p-3">Code</th><th className="p-3">Offer</th><th className="p-3">Minimum</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={5} className="p-4">Loading offers...</td></tr> : coupons.length === 0 ? <tr><td colSpan={5} className="p-4 text-black/60">No offers created yet.</td></tr> : coupons.map((coupon) => (
                    <tr key={coupon.id} className="border-t border-black/10">
                      <td className="p-3"><span className="font-black text-coral">{coupon.code}</span>{coupon.isFirstOrder && <span className="ml-2 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black uppercase text-blue-700">First order</span>}</td>
                      <td className="p-3"><span className="font-bold">{coupon.description || 'Store offer'}</span><span className="block text-xs text-black/55">{coupon.discountPercent ? `${coupon.discountPercent}% off` : `Rs ${coupon.discountAmount || 0} off`}</span></td>
                      <td className="p-3">{coupon.minOrderAmount ? `Rs ${coupon.minOrderAmount}` : 'None'}</td>
                      <td className="p-3"><span className={coupon.isActive ? 'font-bold text-green-700' : 'font-bold text-black/40'}>{coupon.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td className="p-3"><div className="flex gap-2"><button type="button" onClick={() => edit(coupon)} className="inline-flex items-center gap-1 rounded border border-black/10 px-2 py-1.5 text-xs font-bold"><Edit2 size={13} /> Edit</button>{!coupon.isFirstOrder && <button type="button" onClick={() => remove(coupon.id)} className="rounded border border-red-200 px-2 py-1.5 text-xs font-bold text-red-700"><Trash2 size={13} /></button>}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="h-fit rounded border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><h2 className="text-lg font-black">{editingId ? 'Edit offer' : 'New offer'}</h2>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} aria-label="Cancel editing"><X size={18} /></button>}</div>
            <form onSubmit={save} className="mt-4 space-y-4">
              <label className="grid gap-1 text-sm font-bold">Code<input required value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} className="rounded border border-black/10 px-3 py-2" placeholder="WELCOME10" /></label>
              <label className="grid gap-1 text-sm font-bold">Description<input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="rounded border border-black/10 px-3 py-2" placeholder="Weekend offer" /></label>
              <div className="grid grid-cols-2 gap-3"><label className="grid gap-1 text-sm font-bold">Discount %<input type="number" min="0" max="100" value={form.discountPercent} onChange={(event) => setForm({ ...form, discountPercent: event.target.value, discountAmount: '' })} className="rounded border border-black/10 px-3 py-2" /></label><label className="grid gap-1 text-sm font-bold">Flat Rs<input type="number" min="0" value={form.discountAmount} onChange={(event) => setForm({ ...form, discountAmount: event.target.value, discountPercent: '' })} className="rounded border border-black/10 px-3 py-2" /></label></div>
              <label className="grid gap-1 text-sm font-bold">Minimum order Rs<input type="number" min="0" value={form.minOrderAmount} onChange={(event) => setForm({ ...form, minOrderAmount: event.target.value })} className="rounded border border-black/10 px-3 py-2" /></label>
              <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Active for customers</label>
              <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded bg-ink px-4 py-2 font-bold text-white disabled:opacity-60"><Plus size={16} /> {saving ? 'Saving...' : editingId ? 'Update offer' : 'Create offer'}</button>
              {message && <p className="text-sm font-bold text-coral">{message}</p>}
            </form>
          </section>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
