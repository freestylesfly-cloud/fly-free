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

/** A content page the storefront asks for by slug. Supplied by the API. */
type StandardPage = {
  slug: string;
  title: string;
  route: string;
  exists: boolean;
  isPublished: boolean;
};

const emptyPage = { slug: '', title: '', content: '', metaTitle: '', metaDesc: '', isPublished: true };

export default function PagesPage() {
  const { data, loading, error, refetch } = useFetch<any>(() => apiService.getPages(), { skip: false });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyPage);
  const [message, setMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const pages = (data?.data || []) as PageRecord[];
  const standard = (data?.standard || []) as StandardPage[];
  const missing = standard.filter((page) => !page.exists);

  async function createMissing() {
    try {
      setCreating(true);
      setMessage('');
      const result: any = await apiService.createMissingPages();
      const created = result?.created?.length ?? 0;
      setMessage(created > 0 ? `Created ${created} page(s). Edit the text before launch.` : 'Nothing missing.');
      refetch();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not create pages');
    } finally {
      setCreating(false);
    }
  }

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
          <section className="space-y-6">
            {/* Which storefront pages are live, and which still show the
                hard-coded fallback text baked into the site. */}
            <div className={`rounded border p-5 ${missing.length > 0 ? 'border-amber-300 bg-amber-50' : 'border-black/10 bg-white'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-black">Storefront pages</h2>
                  <p className="text-sm text-black/55">
                    These slugs are read by the website. A missing page falls back to built-in text that you cannot edit.
                  </p>
                </div>
                {missing.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void createMissing()}
                    disabled={creating}
                    className="rounded bg-ink px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : `Create ${missing.length} missing page(s)`}
                  </button>
                )}
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {standard.map((page) => {
                  const live = page.exists && page.isPublished;
                  return (
                    <div key={page.slug} className="flex items-start gap-2 text-sm">
                      <span className={`font-black ${live ? 'text-green-700' : 'text-amber-700'}`}>
                        {live ? '✓' : '!'}
                      </span>
                      <span>
                        <span className="font-bold text-ink">{page.title}</span>
                        <span className="block text-xs font-bold text-black/45">
                          {page.slug} · {page.route}
                          {page.exists && !page.isPublished && ' · DRAFT, not visible'}
                          {!page.exists && ' · using built-in text'}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="overflow-hidden rounded border border-black/10 bg-white">
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
            </div>
          </section>

          <form onSubmit={submit} className="h-fit space-y-4 rounded border border-black/10 bg-white p-5">
            <h2 className="flex items-center gap-2 text-lg font-black"><Plus size={18} /> {editingId ? 'Edit page' : 'Create page'}</h2>
            {message && <div className="rounded bg-green-50 p-3 text-sm font-bold text-green-700">{message}</div>}
            <Field label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} required />
            <Field label="Slug" value={form.slug} onChange={(value) => setForm({ ...form, slug: value })} placeholder="about-us" />
            <label className="grid gap-2 text-sm font-bold">
              Content
              <textarea required rows={14} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} className="rounded border border-black/10 px-3 py-2 font-mono text-sm" />
              <span className="text-xs font-bold text-black/45">
                Formatting: <code>## Heading</code> for a section, <code>- item</code> for a bullet,
                <code> 1. item</code> for a numbered step, blank line for a new paragraph.
              </span>
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
