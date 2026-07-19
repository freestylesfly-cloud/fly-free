'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { CalendarClock, Check, Edit3, ImageIcon, Plus, Power, Save, Trash2, X } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useFetch } from '../hooks/useFetch';
import { apiService } from '../services/api';

type WebsiteThemeForm = {
  name: string;
  slug: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  animationStyle: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDesktopImageUrl: string;
  heroMobileImageUrl: string;
  heroCtaLabel: string;
  heroHref: string;
  priority: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

const emptyForm: WebsiteThemeForm = {
  name: '',
  slug: '',
  description: '',
  primaryColor: '#111827',
  secondaryColor: '#ff6b5b',
  backgroundColor: '#f7f3ea',
  textColor: '#161616',
  accentColor: '#4ecdc4',
  fontFamily: 'Inter, Arial, sans-serif',
  animationStyle: 'fade',
  heroTitle: '',
  heroSubtitle: '',
  heroDesktopImageUrl: '',
  heroMobileImageUrl: '',
  heroCtaLabel: 'Shop now',
  heroHref: '/products',
  priority: 0,
  startsAt: '',
  endsAt: '',
  isActive: false
};

export default function WebsiteThemesPage() {
  const { data: raw, loading, error, refetch } = useFetch<any>(() => apiService.getWebsiteThemes(), { skip: false });
  const themes = Array.isArray(raw) ? raw : raw?.data || [];
  const [form, setForm] = useState<WebsiteThemeForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [formError, setFormError] = useState('');

  function editTheme(theme: any) {
    setEditingId(theme.id);
    setForm({
      name: theme.name || '',
      slug: theme.slug || '',
      description: theme.description || '',
      primaryColor: theme.primaryColor || '#111827',
      secondaryColor: theme.secondaryColor || '#ff6b5b',
      backgroundColor: theme.backgroundColor || '#f7f3ea',
      textColor: theme.textColor || '#161616',
      accentColor: theme.accentColor || '#4ecdc4',
      fontFamily: theme.fontFamily || 'Inter, Arial, sans-serif',
      animationStyle: theme.animationStyle || 'fade',
      heroTitle: theme.heroTitle || '',
      heroSubtitle: theme.heroSubtitle || '',
      heroDesktopImageUrl: theme.heroDesktopImageUrl || '',
      heroMobileImageUrl: theme.heroMobileImageUrl || '',
      heroCtaLabel: theme.heroCtaLabel || 'Shop now',
      heroHref: theme.heroHref || '/products',
      priority: theme.priority || 0,
      startsAt: toInputDate(theme.startsAt),
      endsAt: toInputDate(theme.endsAt),
      isActive: theme.isActive ?? false
    });
  }

  async function saveTheme(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    setNotice('');

    try {
      const payload = {
        ...form,
        slug: form.slug || slugify(form.name),
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null
      };

      if (editingId) {
        await apiService.updateWebsiteTheme(editingId, payload);
        setNotice('Website theme updated. User app will load it from CMS.');
      } else {
        await apiService.createWebsiteTheme(payload);
        setNotice('Website theme created. Activate it when ready.');
      }

      setEditingId(null);
      setForm(emptyForm);
      refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save website theme');
    }
  }

  async function activateTheme(id: string) {
    await apiService.setActiveWebsiteTheme(id);
    setNotice('Global website theme activated for all users.');
    refetch();
  }

  async function deleteTheme(id: string) {
    await apiService.deleteWebsiteTheme(id);
    setNotice('Website theme deleted.');
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyForm);
    }
    refetch();
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Website Themes" subtitle="Global app design for Puja, Bihu, rainy day, winter, game events">
        <div className="space-y-6">
          {(error || formError) && <div className="rounded border border-red-200 bg-red-50 p-4 font-bold text-red-700">{error || formError}</div>}
          {notice && <div className="rounded border border-green-200 bg-green-50 p-4 font-bold text-green-800">{notice}</div>}

          <section className="rounded border border-black/10 bg-white p-5">
            <h2 className="font-black">Global website theme is separate from product theme</h2>
            <p className="mt-1 text-sm text-black/60">
              Use this for full-site design changes: hero banner, base colors, font, motion, and event mood. Product themes remain under Product Themes and are selected while creating products.
            </p>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
            <section className="rounded border border-black/10 bg-white">
              <div className="border-b border-black/10 p-4 font-black">Scheduled website skins</div>
              {loading ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded bg-black/5" />)}
                </div>
              ) : (
                <div className="grid gap-4 p-4 md:grid-cols-2">
                  {themes.map((theme: any) => (
                    <article key={theme.id} className="overflow-hidden rounded border border-black/10">
                      <div
                        className="flex h-36 items-end p-4 text-white"
                        style={{
                          background: theme.heroDesktopImageUrl
                            ? `linear-gradient(135deg, ${theme.primaryColor}bb, ${theme.secondaryColor}bb), url(${theme.heroDesktopImageUrl}) center/cover`
                            : `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                          fontFamily: theme.fontFamily
                        }}
                      >
                        <div>
                          <h3 className="text-xl font-black">{theme.heroTitle || theme.name}</h3>
                          <p className="line-clamp-2 text-sm text-white/80">{theme.heroSubtitle || theme.description}</p>
                        </div>
                      </div>
                      <div className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-ink">{theme.name}</p>
                            <p className="text-xs font-bold text-black/45">/{theme.slug} · {theme.animationStyle}</p>
                          </div>
                          {theme.isActive && <span className="inline-flex items-center gap-1 rounded bg-green-100 px-2 py-1 text-xs font-black text-green-800"><Check size={13} /> Active</span>}
                        </div>
                        <p className="flex items-center gap-1 text-xs font-bold text-black/45">
                          <CalendarClock size={13} />
                          {theme.startsAt ? new Date(theme.startsAt).toLocaleString() : 'Now'} to {theme.endsAt ? new Date(theme.endsAt).toLocaleString() : 'No end'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => editTheme(theme)} className="inline-flex items-center gap-2 rounded bg-ink px-3 py-2 text-sm font-bold text-white">
                            <Edit3 size={15} /> Edit
                          </button>
                          <button onClick={() => activateTheme(theme.id)} disabled={theme.isActive} className="inline-flex items-center gap-2 rounded border border-black/10 px-3 py-2 text-sm font-bold disabled:opacity-45">
                            <Power size={15} /> {theme.isActive ? 'Live' : 'Activate'}
                          </button>
                          <button onClick={() => deleteTheme(theme.id)} className="inline-flex items-center gap-2 rounded border border-red-200 px-3 py-2 text-sm font-bold text-red-600">
                            <Trash2 size={15} /> Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <form onSubmit={saveTheme} className="h-fit rounded border border-black/10 bg-white p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-black">{editingId ? 'Edit website theme' : 'Create website theme'}</h2>
                  <p className="text-sm text-black/55">For occasion/event/trending full-site design.</p>
                </div>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="rounded p-2 hover:bg-black/5" aria-label="Cancel edit">
                    <X size={18} />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <Input label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
                <Input label="Slug" value={form.slug} onChange={(value) => setForm({ ...form, slug: value })} />
                <Textarea label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
                <div className="grid grid-cols-3 gap-2">
                  <Color label="Primary" value={form.primaryColor} onChange={(value) => setForm({ ...form, primaryColor: value })} />
                  <Color label="Secondary" value={form.secondaryColor} onChange={(value) => setForm({ ...form, secondaryColor: value })} />
                  <Color label="Accent" value={form.accentColor} onChange={(value) => setForm({ ...form, accentColor: value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Color label="Background" value={form.backgroundColor} onChange={(value) => setForm({ ...form, backgroundColor: value })} />
                  <Color label="Text" value={form.textColor} onChange={(value) => setForm({ ...form, textColor: value })} />
                </div>
                <Input label="Font family" value={form.fontFamily} onChange={(value) => setForm({ ...form, fontFamily: value })} />
                <select value={form.animationStyle} onChange={(event) => setForm({ ...form, animationStyle: event.target.value })} className="w-full rounded border border-black/10 px-3 py-2 text-sm font-bold">
                  <option value="fade">Fade</option>
                  <option value="glow">Glow</option>
                  <option value="soft-wave">Soft wave</option>
                  <option value="web-swing">Web swing</option>
                  <option value="rain">Rain day</option>
                  <option value="snow">Winter snow</option>
                  <option value="game-pulse">Game pulse</option>
                </select>
                <Input label="Hero title" value={form.heroTitle} onChange={(value) => setForm({ ...form, heroTitle: value })} />
                <Textarea label="Hero subtitle" value={form.heroSubtitle} onChange={(value) => setForm({ ...form, heroSubtitle: value })} />
                <Input label="Desktop hero image URL" value={form.heroDesktopImageUrl} onChange={(value) => setForm({ ...form, heroDesktopImageUrl: value })} />
                <Input label="Mobile hero image URL" value={form.heroMobileImageUrl} onChange={(value) => setForm({ ...form, heroMobileImageUrl: value })} />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="CTA label" value={form.heroCtaLabel} onChange={(value) => setForm({ ...form, heroCtaLabel: value })} />
                  <Input label="CTA link" value={form.heroHref} onChange={(value) => setForm({ ...form, heroHref: value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Starts" type="datetime-local" value={form.startsAt} onChange={(value) => setForm({ ...form, startsAt: value })} />
                  <Input label="Ends" type="datetime-local" value={form.endsAt} onChange={(value) => setForm({ ...form, endsAt: value })} />
                </div>
                <Input label="Priority" type="number" value={form.priority} onChange={(value) => setForm({ ...form, priority: Number(value || 0) })} />
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
                  Active for all users
                </label>
                <button className="inline-flex w-full items-center justify-center gap-2 rounded bg-coral px-4 py-3 font-black text-white">
                  {editingId ? <Save size={18} /> : <Plus size={18} />}
                  {editingId ? 'Save website theme' : 'Create website theme'}
                </button>
              </div>
            </form>
          </div>

          <section className="rounded border border-black/10 bg-white p-5">
            <div className="mb-3 flex items-center gap-2 font-black">
              <ImageIcon size={18} /> How this works
            </div>
            <p className="text-sm leading-6 text-black/60">
              Admin sets one active website theme for all users. The user can still choose dark/light/system, but this website theme controls the brand mood: base campaign colors, font, animation, hero banner, and occasion copy.
            </p>
          </section>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
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

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase text-black/45">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="w-full rounded border border-black/10 px-3 py-2 text-sm" />
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

function toInputDate(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}
