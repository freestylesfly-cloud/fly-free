'use client';

export const dynamic = 'force-dynamic';

import { useMemo, useState } from 'react';
import { Check, Palette, Power, Save, Sparkles } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useFetch } from '../hooks/useFetch';
import { apiService } from '../services/api';

type ThemeForm = {
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  active: boolean;
};

const emptyTheme: ThemeForm = {
  name: '',
  description: '',
  primaryColor: '#111827',
  secondaryColor: '#ff6b5b',
  accentColor: '#4ecdc4',
  fontFamily: 'Inter, Arial, sans-serif',
  active: true
};


export default function ThemesPage() {
  const { data: themesRaw, loading, error, refetch } = useFetch<any>(() => apiService.getThemes(), { skip: false });
  const themes = Array.isArray(themesRaw) ? themesRaw : themesRaw?.data || [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ThemeForm>(emptyTheme);
  const [notice, setNotice] = useState('');
  const activeThemes = useMemo(() => themes.filter((theme: any) => theme.active), [themes]);

  function editTheme(theme: any) {
    setEditingId(theme.id);
    setForm({
      name: theme.name || '',
      description: theme.description || '',
      primaryColor: theme.primaryColor || '#111827',
      secondaryColor: theme.secondaryColor || '#ff6b5b',
      accentColor: theme.accentColor || '#4ecdc4',
      fontFamily: theme.fontFamily || 'Inter, Arial, sans-serif',
      active: theme.active ?? true
    });
  }

  async function saveTheme(event: React.FormEvent) {
    event.preventDefault();

    if (editingId) {
      await apiService.updateTheme(editingId, form);
      setNotice('Theme updated.');
    } else {
      await apiService.createTheme(form);
      setNotice('Theme created.');
    }

    setEditingId(null);
    setForm(emptyTheme);
    refetch();
  }

  async function setActiveTheme(id: string) {
    await apiService.setActiveTheme(id);
    setNotice('Active user campaign theme updated. Dark/light mode is still controlled by the customer.');
    refetch();
  }


  return (
    <ProtectedRoute>
      <DashboardLayout title="Website Themes" subtitle="Manage website appearance (colors, fonts)">
        <div className="space-y-6">
          {error && <div className="rounded border border-red-200 bg-red-50 p-4 font-bold text-red-700">{error}</div>}
          {notice && <div className="rounded border border-mint/30 bg-mint/10 p-4 font-bold text-ink">{notice}</div>}

          <section className="rounded border border-black/10 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles size={20} className="text-coral" />
              <div>
                <h2 className="font-black">Website appearance settings</h2>
                <p className="text-sm text-black/60">Manage website colors, fonts, and overall look. For shop-by-theme product groups like Spider-Man or Marvel, see Product Themes.</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Mini label="Active themes" value={activeThemes.length} />
              <Mini label="Total themes" value={themes.length} />
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <section className="rounded border border-black/10 bg-white">
              <div className="border-b border-black/10 p-4 font-black">Website themes</div>
              {loading ? (
                <p className="p-5 text-sm text-black/60">Loading themes...</p>
              ) : (
                <div className="grid gap-4 p-4 md:grid-cols-2">
                  {themes.map((theme: any) => (
                    <article key={theme.id} className="overflow-hidden rounded border border-black/10">
                      <div
                        className="h-24"
                        style={{
                          background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`
                        }}
                      />
                      <div className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-black text-ink">{theme.name}</h3>
                            <p className="text-sm text-black/60">{theme.description || 'No description'}</p>
                          </div>
                          {theme.active && <span className="inline-flex items-center gap-1 rounded bg-mint/15 px-2 py-1 text-xs font-black text-ink"><Check size={13} /> Active</span>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => editTheme(theme)} className="inline-flex items-center gap-2 rounded bg-ink px-3 py-2 text-sm font-bold text-white">
                            <Palette size={15} /> Edit
                          </button>
                          <button
                            onClick={() => setActiveTheme(theme.id)}
                            className="inline-flex items-center gap-2 rounded border border-black/10 px-3 py-2 text-sm font-bold text-ink"
                          >
                            <Power size={15} /> {theme.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <form onSubmit={saveTheme} className="rounded border border-black/10 bg-white p-5">
              <h2 className="mb-4 flex items-center gap-2 font-black"><Save size={18} /> {editingId ? 'Edit' : 'New theme'}</h2>
              <div className="space-y-3">
                <Input label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
                <Input label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
                <div className="grid grid-cols-3 gap-2">
                  <Color label="Primary" value={form.primaryColor} onChange={(value) => setForm({ ...form, primaryColor: value })} />
                  <Color label="Secondary" value={form.secondaryColor} onChange={(value) => setForm({ ...form, secondaryColor: value })} />
                  <Color label="Accent" value={form.accentColor} onChange={(value) => setForm({ ...form, accentColor: value })} />
                </div>
                <Input label="Font family" value={form.fontFamily} onChange={(value) => setForm({ ...form, fontFamily: value })} />
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
                  Active
                </label>
                <button className="w-full rounded bg-coral px-4 py-3 font-black text-white">{editingId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded bg-black/[0.03] p-3">
      <p className="text-xs font-bold uppercase text-black/45">{label}</p>
      <p className="text-xl font-black text-ink">{value}</p>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', required }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase text-black/45">{label}</span>
      <input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded border border-black/10 px-3 py-2 text-sm" />
    </label>
  );
}

function Color({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase text-black/45">{label}</span>
      <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded border border-black/10 bg-white p-1" />
    </label>
  );
}
