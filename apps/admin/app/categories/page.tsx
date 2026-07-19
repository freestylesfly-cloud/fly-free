'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Edit3, ImageIcon, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { apiService } from '../services/api';

type Category = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  priority: number;
  _count?: { products?: number };
};

type CategoryForm = {
  name: string;
  slug: string;
  imageUrl: string;
  priority: number;
};

const emptyForm: CategoryForm = {
  name: '',
  slug: '',
  imageUrl: '',
  priority: 0
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    void loadCategories();
  }, []);

  const filtered = categories.filter((category) =>
    `${category.name} ${category.slug}`.toLowerCase().includes(search.toLowerCase())
  );

  async function loadCategories() {
    try {
      setLoading(true);
      setError('');
      const response: any = await apiService.getCategories();
      setCategories(Array.isArray(response) ? response : response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  async function saveCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const payload = {
        ...form,
        slug: form.slug || slugify(form.name),
        imageUrl: form.imageUrl || null,
        priority: Number(form.priority || 0)
      };

      if (editingId) {
        await apiService.updateCategory(editingId, payload);
        setNotice('Category updated. Product forms will load this immediately.');
      } else {
        await apiService.createCategory(payload);
        setNotice('Category created. You can assign products to it now.');
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category');
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(id: string) {
    try {
      setError('');
      setNotice('');
      await apiService.deleteCategory(id);
      setNotice('Category deleted.');
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  }

  function editCategory(category: Category) {
    setEditingId(category.id);
    setForm({
      name: category.name || '',
      slug: category.slug || '',
      imageUrl: category.imageUrl || '',
      priority: category.priority || 0
    });
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Categories" subtitle="Product type buckets for the user shop">
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <section className="space-y-4">
            <div className="rounded border border-black/10 bg-white p-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 h-5 w-5 text-black/35" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search categories..."
                  className="w-full rounded border border-black/10 py-2 pl-10 pr-3"
                />
              </div>
            </div>

            {error && <div className="rounded border border-red-200 bg-red-50 p-4 font-bold text-red-700">{error}</div>}
            {notice && <div className="rounded border border-green-200 bg-green-50 p-4 font-bold text-green-800">{notice}</div>}

            <div className="overflow-hidden rounded border border-black/10 bg-white">
              <div className="border-b border-black/10 p-4 font-black">Database categories</div>
              {loading ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded bg-black/5" />)}
                </div>
              ) : filtered.length === 0 ? (
                <p className="p-6 text-sm font-bold text-black/50">No categories found.</p>
              ) : (
                <div className="divide-y divide-black/5">
                  {filtered.map((category) => (
                    <article key={category.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded border border-black/10 bg-black/[0.03]">
                          {category.imageUrl ? (
                            <img src={category.imageUrl} alt={category.name} className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="text-black/35" size={22} />
                          )}
                        </div>
                        <div>
                          <h2 className="font-black text-ink">{category.name}</h2>
                          <p className="text-sm font-bold text-black/45">/{category.slug} · Priority {category.priority || 0}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => editCategory(category)} className="inline-flex items-center gap-2 rounded border border-black/10 px-3 py-2 text-sm font-bold">
                          <Edit3 size={15} /> Edit
                        </button>
                        <button onClick={() => deleteCategory(category.id)} className="inline-flex items-center gap-2 rounded border border-red-200 px-3 py-2 text-sm font-bold text-red-600">
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          <form onSubmit={saveCategory} className="h-fit rounded border border-black/10 bg-white p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-black">{editingId ? 'Edit category' : 'Create category'}</h2>
                <p className="text-sm text-black/55">Use for Men, Women, Unisex, Gift Packs, Combos, or new product buckets.</p>
              </div>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="rounded p-2 hover:bg-black/5" aria-label="Cancel edit">
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="space-y-3">
              <Field label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
              <Field label="Slug" value={form.slug} onChange={(value) => setForm({ ...form, slug: value })} placeholder="auto from name if empty" />
              <Field label="Image URL" value={form.imageUrl} onChange={(value) => setForm({ ...form, imageUrl: value })} />
              <label className="grid gap-2 text-sm font-bold">
                Priority
                <input
                  type="number"
                  value={form.priority}
                  onChange={(event) => setForm({ ...form, priority: Number(event.target.value || 0) })}
                  className="rounded border border-black/10 px-3 py-2"
                />
              </label>
              <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded bg-coral px-4 py-3 font-black text-white disabled:opacity-50">
                {editingId ? <Save size={18} /> : <Plus size={18} />}
                {saving ? 'Saving...' : editingId ? 'Save category' : 'Create category'}
              </button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function Field({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} className="rounded border border-black/10 px-3 py-2" />
    </label>
  );
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}
