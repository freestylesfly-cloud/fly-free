'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Edit3, Plus, Search, Trash2, X } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { apiService } from '../services/api';

type ProductTheme = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  priority: number;
  active: boolean;
  _count?: { products?: number };
  createdAt?: string;
};

type ThemeForm = {
  name: string;
  slug: string;
  description: string;
  priority: number;
};

const emptyForm: ThemeForm = {
  name: '',
  slug: '',
  description: '',
  priority: 0
};

export default function ProductThemesPage() {
  const [themes, setThemes] = useState<ProductTheme[]>([]);
  const [form, setForm] = useState<ThemeForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    void loadThemes();
  }, []);

  const filtered = themes.filter((theme) =>
    `${theme.name} ${theme.slug}`.toLowerCase().includes(search.toLowerCase())
  );

  async function loadThemes() {
    try {
      setLoading(true);
      setError('');
      const response: any = await apiService.getProductThemes();
      setThemes(Array.isArray(response) ? response : response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load themes');
    } finally {
      setLoading(false);
    }
  }

  async function saveTheme(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const payload = {
        ...form,
        slug: form.slug || slugify(form.name),
        priority: Number(form.priority || 0)
      };

      if (editingId) {
        await apiService.updateProductTheme(editingId, payload);
        setNotice('Product theme updated. Products can now be assigned to it.');
      } else {
        await apiService.createProductTheme(payload);
        setNotice('Product theme created. You can assign products to it now.');
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadThemes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save theme');
    } finally {
      setSaving(false);
    }
  }

  async function deleteTheme(id: string) {
    if (!confirm('Delete this theme? Make sure no products are assigned to it.')) return;
    try {
      setError('');
      setNotice('');
      await apiService.deleteProductTheme(id);
      setNotice('Product theme deleted.');
      await loadThemes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete theme');
    }
  }

  function editTheme(theme: ProductTheme) {
    setEditingId(theme.id);
    setForm({
      name: theme.name || '',
      slug: theme.slug || '',
      description: theme.description || '',
      priority: theme.priority || 0
    });
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Product Themes" subtitle="Shop-by-theme groups: Spider-Man, Marvel, Movies, etc. Each theme can have multiple products.">
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          {/* Left: List */}
          <section className="space-y-4">
            <div className="rounded border border-black/10 bg-white p-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 h-5 w-5 text-black/35" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search themes..."
                  className="w-full rounded border border-black/10 py-2 pl-10 pr-3"
                />
              </div>
            </div>

            {error && <div className="rounded border border-red-200 bg-red-50 p-4 font-bold text-red-700">{error}</div>}
            {notice && <div className="rounded border border-green-200 bg-green-50 p-4 font-bold text-green-800">{notice}</div>}

            <div className="overflow-hidden rounded border border-black/10 bg-white">
              <div className="border-b border-black/10 p-4 font-black">Product themes</div>
              {loading ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded bg-black/5" />)}
                </div>
              ) : filtered.length === 0 ? (
                <p className="p-6 text-sm font-bold text-black/50">No themes found.</p>
              ) : (
                <div className="divide-y divide-black/5">
                  {filtered.map((theme) => (
                    <article key={theme.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <h2 className="font-black text-ink">{theme.name}</h2>
                        <p className="text-sm font-bold text-black/45">
                          /{theme.slug} · {theme._count?.products || 0} products · Priority {theme.priority}
                        </p>
                        {theme.description && (
                          <p className="mt-1 text-sm text-black/60">{theme.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => editTheme(theme)} className="inline-flex items-center gap-2 rounded border border-black/10 px-3 py-2 text-sm font-bold">
                          <Edit3 size={15} /> Edit
                        </button>
                        <button onClick={() => deleteTheme(theme.id)} className="inline-flex items-center gap-2 rounded border border-red-200 px-3 py-2 text-sm font-bold text-red-600">
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Right: Form */}
          <form onSubmit={saveTheme} className="h-fit rounded border border-black/10 bg-white p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-black">{editingId ? 'Edit theme' : 'Create theme'}</h2>
                <p className="text-sm text-black/55">Shop categories like Spider-Man, Marvel, Movies, etc.</p>
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
              <Field label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} placeholder="What's this theme about?" isTextarea />
              <Field label="Priority" value={String(form.priority)} onChange={(value) => setForm({ ...form, priority: Number(value) })} type="number" />

              <button
                type="submit"
                disabled={saving || !form.name}
                className="w-full rounded bg-ink px-4 py-2.5 font-black text-white transition enabled:hover:bg-ink/90 disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingId ? 'Update theme' : 'Create theme'}
              </button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  isTextarea?: boolean;
}

function Field({ label, value, onChange, type = 'text', required, placeholder, isTextarea }: FieldProps) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      {isTextarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="rounded border border-black/10 px-3 py-2"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="rounded border border-black/10 px-3 py-2"
        />
      )}
    </label>
  );
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
}
