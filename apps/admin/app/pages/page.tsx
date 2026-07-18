'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { FileText, Plus, Save, Trash2 } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useFetch } from '../hooks/useFetch';
import { apiService } from '../services/api';

type PageRecord = {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaTitle?: string | null;
  metaDesc?: string | null;
  isPublished: boolean;
  updatedAt: string;
};

const emptyPage = { slug: '', title: '', content: '', metaTitle: '', metaDesc: '', isPublished: true };

export default function PagesPage() {
  const { data, loading, error, refetch } = useFetch<any>(() => apiService.getPages(), { skip: false });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyPage);
  const [message, setMessage] = useState('');
  const pages = (data?.data || []) as PageRecord[];

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    if (editingId) {
      await apiService.updatePage(editingId, form);
      setMessage('Page updated.');
    } else {
      await apiService.createPage(form);
      setMessage('Page created.');
    }
    setEditingId(null);
    setForm(emptyPage);
    refetch();
  }

  function edit(page: PageRecord) {
    setEditingId(page.id);
    setForm({
      slug: page.slug,
      title: page.title,
      content: page.content,
      metaTitle: page.metaTitle || '',
      metaDesc: page.metaDesc || '',
      isPublished: page.isPublished,
    });
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Pages" subtitle="Manage website content, policies, SEO, and size chart text from database">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
          <section className="overflow-hidden rounded border border-black/10 bg-white">
            <div className="border-b border-black/10 p-4">
              <h2 className="flex items-center gap-2 font-black"><FileText size={18} /> Content pages</h2>
            </div>
            {error && <div className="m-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}
            <table className="w-full text-sm">
              <thead className="bg-black/5 text-left">
                <tr>
                  <th className="p-3">Title</th>
                  <th className="p-3">Slug</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Updated</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="p-4">Loading pages...</td></tr>
                ) : pages.map((page) => (
                  <tr key={page.id} className="border-t border-black/10">
                    <td className="p-3 font-bold text-ink">{page.title}</td>
                    <td className="p-3 text-black/60">{page.slug}</td>
                    <td className="p-3">{page.isPublished ? 'Published' : 'Draft'}</td>
                    <td className="p-3 text-black/60">{new Date(page.updatedAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => edit(page)} className="rounded border border-black/10 px-3 py-2 font-bold">Edit</button>
                        <button onClick={async () => { await apiService.deletePage(page.id); refetch(); }} className="rounded border border-red-200 px-3 py-2 text-red-700"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <form onSubmit={submit} className="space-y-4 rounded border border-black/10 bg-white p-5">
            <h2 className="flex items-center gap-2 text-lg font-black"><Plus size={18} /> {editingId ? 'Edit page' : 'Create page'}</h2>
            {message && <div className="rounded bg-green-50 p-3 text-sm font-bold text-green-700">{message}</div>}
            <Field label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} required />
            <Field label="Slug" value={form.slug} onChange={(value) => setForm({ ...form, slug: value })} placeholder="about-us" />
            <label className="grid gap-2 text-sm font-bold">
              Content
              <textarea required rows={10} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} className="rounded border border-black/10 px-3 py-2" />
            </label>
            <Field label="SEO Title" value={form.metaTitle} onChange={(value) => setForm({ ...form, metaTitle: value })} />
            <label className="grid gap-2 text-sm font-bold">
              SEO Description
              <textarea rows={3} value={form.metaDesc} onChange={(event) => setForm({ ...form, metaDesc: event.target.value })} className="rounded border border-black/10 px-3 py-2" />
            </label>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} />
              Published
            </label>
            <button className="inline-flex w-full items-center justify-center gap-2 rounded bg-ink px-4 py-3 font-bold text-white">
              <Save size={18} /> Save page
            </button>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function Field({ label, value, onChange, required, placeholder }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; placeholder?: string }) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <input required={required} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="rounded border border-black/10 px-3 py-2" />
    </label>
  );
}
