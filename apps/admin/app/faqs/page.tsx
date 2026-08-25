'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { HelpCircle, Plus, Save, Trash2 } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useFetch } from '../hooks/useFetch';
import { apiService } from '../services/api';

type FaqItem = {
  id: string;
  category: string;
  question: string;
  answer: string;
  priority: number;
  active: boolean;
};

const emptyFaq = { category: 'Support', question: '', answer: '', priority: '0', active: true };

export default function FaqsPage() {
  const { data, loading, error, refetch } = useFetch<FaqItem[]>(() => apiService.getFaqItems() as Promise<FaqItem[]>, { skip: false });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyFaq);
  const [message, setMessage] = useState('');
  const rows = Array.isArray(data) ? data : [];

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    const payload = { ...form, priority: Number.parseInt(form.priority, 10) || 0 };
    if (editingId) {
      await apiService.updateFaqItem(editingId, payload);
      setMessage('FAQ updated.');
    } else {
      await apiService.createFaqItem(payload);
      setMessage('FAQ created.');
    }
    setEditingId(null);
    setForm(emptyFaq);
    refetch();
  }

  function edit(item: FaqItem) {
    setEditingId(item.id);
    setForm({
      category: item.category || 'Support',
      question: item.question || '',
      answer: item.answer || '',
      priority: String(item.priority ?? 0),
      active: item.active !== false,
    });
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Help & FAQs" subtitle="Manage support questions shown on the storefront help page">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="overflow-hidden rounded border border-black/10 bg-white">
            <div className="border-b border-black/10 p-4">
              <h2 className="flex items-center gap-2 font-black"><HelpCircle size={18} /> FAQ items</h2>
            </div>
            {error && <div className="m-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}
            <table className="w-full text-sm">
              <thead className="bg-black/5 text-left">
                <tr>
                  <th className="p-3">Category</th>
                  <th className="p-3">Question</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="p-4">Loading FAQs...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-black/50">No FAQ items yet.</td></tr>
                ) : rows.map((item) => (
                  <tr key={item.id} className="border-t border-black/10">
                    <td className="p-3 font-bold">{item.category}</td>
                    <td className="p-3">{item.question}</td>
                    <td className="p-3">{item.priority}</td>
                    <td className="p-3">{item.active ? 'Published' : 'Hidden'}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => edit(item)} className="rounded border border-black/10 px-3 py-2 font-bold">Edit</button>
                        <button onClick={async () => { await apiService.deleteFaqItem(item.id); refetch(); }} className="rounded border border-red-200 px-3 py-2 text-red-700"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <form onSubmit={submit} className="h-fit space-y-4 rounded border border-black/10 bg-white p-5">
            <h2 className="flex items-center gap-2 text-lg font-black"><Plus size={18} /> {editingId ? 'Edit FAQ' : 'Create FAQ'}</h2>
            {message && <div className="rounded bg-green-50 p-3 text-sm font-bold text-green-700">{message}</div>}
            <Field label="Category" value={form.category} onChange={(value) => setForm({ ...form, category: value })} required />
            <Field label="Question" value={form.question} onChange={(value) => setForm({ ...form, question: value })} required />
            <label className="grid gap-2 text-sm font-bold">
              Answer
              <textarea required rows={8} value={form.answer} onChange={(event) => setForm({ ...form, answer: event.target.value })} className="rounded border border-black/10 px-3 py-2" />
            </label>
            <Field label="Priority" type="number" value={form.priority} onChange={(value) => setForm({ ...form, priority: value })} />
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
              Published
            </label>
            <button className="inline-flex w-full items-center justify-center gap-2 rounded bg-ink px-4 py-3 font-bold text-white">
              <Save size={18} /> Save FAQ
            </button>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function Field({ label, value, onChange, required, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="rounded border border-black/10 px-3 py-2" />
    </label>
  );
}
