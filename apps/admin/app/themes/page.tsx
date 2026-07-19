'use client';

export const dynamic = 'force-dynamic';

import { useMemo, useState } from 'react';
import { Bell, CalendarClock, Check, Edit3, Palette, Plus, Power, Save, Sparkles, Trash2 } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useFetch } from '../hooks/useFetch';
import { apiService } from '../services/api';

type ThemeForm = {
  name: string;
  slug: string;
  description: string;
  story: string;
  imageUrl: string;
  bannerImageUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  animationStyle: string;
  priority: number;
  active: boolean;
  startsAt: string;
  endsAt: string;
};

const emptyTheme: ThemeForm = {
  name: '',
  slug: '',
  description: '',
  story: '',
  imageUrl: '',
  bannerImageUrl: '',
  primaryColor: '#111827',
  secondaryColor: '#ff6b5b',
  accentColor: '#4ecdc4',
  fontFamily: 'Inter, Arial, sans-serif',
  animationStyle: 'fade',
  priority: 0,
  active: true,
  startsAt: '',
  endsAt: ''
};

type AnnouncementForm = {
  title: string;
  message: string;
  href: string;
  ctaLabel: string;
  themeId: string;
  priority: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

const emptyAnnouncement: AnnouncementForm = {
  title: '',
  message: '',
  href: '',
  ctaLabel: '',
  themeId: '',
  priority: 0,
  startsAt: '',
  endsAt: '',
  isActive: true
};

export default function ThemesPage() {
  const { data: themesRaw, loading, error, refetch } = useFetch<any>(() => apiService.getThemes(), { skip: false });
  const { data: announcementsRaw, refetch: refetchAnnouncements } = useFetch<any>(() => apiService.getAnnouncements(), { skip: false });
  const themes = Array.isArray(themesRaw) ? themesRaw : themesRaw?.data || [];
  const announcements = announcementsRaw?.data || [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [form, setForm] = useState<ThemeForm>(emptyTheme);
  const [announcementForm, setAnnouncementForm] = useState<AnnouncementForm>(emptyAnnouncement);
  const [notice, setNotice] = useState('');
  const activeThemes = useMemo(() => themes.filter((theme: any) => theme.active), [themes]);

  function editTheme(theme: any) {
    setEditingId(theme.id);
    setForm({
      name: theme.name || '',
      slug: theme.slug || '',
      description: theme.description || '',
      story: theme.story || '',
      imageUrl: theme.imageUrl || '',
      bannerImageUrl: theme.bannerImageUrl || '',
      primaryColor: theme.primaryColor || '#111827',
      secondaryColor: theme.secondaryColor || '#ff6b5b',
      accentColor: theme.accentColor || '#4ecdc4',
      fontFamily: theme.fontFamily || 'Inter, Arial, sans-serif',
      animationStyle: theme.animationStyle || 'fade',
      priority: theme.priority || 0,
      active: theme.active ?? true,
      startsAt: toInputDate(theme.startsAt),
      endsAt: toInputDate(theme.endsAt)
    });
  }

  async function saveTheme(event: React.FormEvent) {
    event.preventDefault();
    const payload = {
      ...form,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null
    };

    if (editingId) {
      await apiService.updateTheme(editingId, payload);
      setNotice('Theme updated from database.');
    } else {
      await apiService.createTheme(payload);
      setNotice('Theme created in database.');
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

  function editAnnouncement(item: any) {
    setEditingAnnouncementId(item.id);
    setAnnouncementForm({
      title: item.title || '',
      message: item.message || '',
      href: item.href || '',
      ctaLabel: item.ctaLabel || '',
      themeId: item.themeId || '',
      priority: item.priority || 0,
      startsAt: toInputDate(item.startsAt),
      endsAt: toInputDate(item.endsAt),
      isActive: item.isActive ?? true
    });
  }

  async function deleteAnnouncement(id: string) {
    await apiService.deleteAnnouncement(id);
    if (editingAnnouncementId === id) {
      setEditingAnnouncementId(null);
      setAnnouncementForm(emptyAnnouncement);
    }
    setNotice('Announcement deleted from database.');
    refetchAnnouncements();
  }

  async function saveAnnouncement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      ...announcementForm,
      themeId: announcementForm.themeId || null,
      startsAt: announcementForm.startsAt ? new Date(announcementForm.startsAt).toISOString() : null,
      endsAt: announcementForm.endsAt ? new Date(announcementForm.endsAt).toISOString() : null
    };

    if (editingAnnouncementId) {
      await apiService.updateAnnouncement(editingAnnouncementId, payload);
      setNotice('Announcement updated for the user app bar.');
    } else {
      await apiService.createAnnouncement(payload);
      setNotice('Announcement scheduled for the user app bar.');
    }

    setEditingAnnouncementId(null);
    setAnnouncementForm(emptyAnnouncement);
    refetchAnnouncements();
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Product Themes" subtitle="Shop-by-theme product groups like Puja, Anime, Bihu, Spider-Man">
        <div className="space-y-6">
          {error && <div className="rounded border border-red-200 bg-red-50 p-4 font-bold text-red-700">{error}</div>}
          {notice && <div className="rounded border border-mint/30 bg-mint/10 p-4 font-bold text-ink">{notice}</div>}

          <section className="rounded border border-black/10 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles size={20} className="text-coral" />
              <div>
                <h2 className="font-black">Product themes are part of product catalog</h2>
                <p className="text-sm text-black/60">Use these for Shop by Theme and product assignment. Full website look, font, colors, hero banners, and occasion skins are managed in Website Themes.</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <Mini label="Total themes" value={themes.length} />
              <Mini label="Visible in shop" value={activeThemes.length} />
              <Mini label="Announcements" value={announcements.length} />
              <Mini label="Source" value="Database" />
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
            <section className="rounded border border-black/10 bg-white">
              <div className="border-b border-black/10 p-4 font-black">Product theme groups from database</div>
              {loading ? (
                <p className="p-5 text-sm text-black/60">Loading themes...</p>
              ) : (
                <div className="grid gap-4 p-4 md:grid-cols-2">
                  {themes.map((theme: any) => (
                    <article key={theme.id} className="overflow-hidden rounded border border-black/10">
                      <div
                        className="h-28"
                        style={{
                          background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`
                        }}
                      />
                      <div className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-black text-ink">{theme.name}</h3>
                            <p className="text-sm text-black/60">{theme.description || 'No description yet.'}</p>
                          </div>
                          {theme.active && <span className="inline-flex items-center gap-1 rounded bg-mint/15 px-2 py-1 text-xs font-black text-ink"><Check size={13} /> Visible</span>}
                        </div>
                        <p className="line-clamp-3 text-sm text-black/60">{theme.story}</p>
                        <div className="flex flex-wrap gap-2 text-xs font-bold text-black/55">
                          <span>/{theme.slug}</span>
                          <span>{theme.animationStyle}</span>
                          <span>{theme.products?.length || 0} products</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => editTheme(theme)} className="inline-flex items-center gap-2 rounded bg-ink px-3 py-2 text-sm font-bold text-white">
                            <Palette size={15} /> Edit
                          </button>
                          <button
                            onClick={() => setActiveTheme(theme.id)}
                            className="inline-flex items-center gap-2 rounded border border-black/10 px-3 py-2 text-sm font-bold text-ink"
                          >
                            <Power size={15} /> {theme.active ? 'Hide from shop' : 'Show in shop'}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <form onSubmit={saveTheme} className="rounded border border-black/10 bg-white p-5">
              <h2 className="mb-4 flex items-center gap-2 font-black"><Save size={18} /> {editingId ? 'Edit theme' : 'Create theme'}</h2>
              <div className="space-y-3">
                <Input label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
                <Input label="Slug" value={form.slug} onChange={(value) => setForm({ ...form, slug: value })} />
                <Input label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
                <Textarea label="Story/About this product theme" value={form.story} onChange={(value) => setForm({ ...form, story: value })} />
                <Input label="Theme image URL" value={form.imageUrl} onChange={(value) => setForm({ ...form, imageUrl: value })} />
                <Input label="Banner image URL" value={form.bannerImageUrl} onChange={(value) => setForm({ ...form, bannerImageUrl: value })} />
                <div className="grid grid-cols-3 gap-2">
                  <Color label="Primary" value={form.primaryColor} onChange={(value) => setForm({ ...form, primaryColor: value })} />
                  <Color label="Secondary" value={form.secondaryColor} onChange={(value) => setForm({ ...form, secondaryColor: value })} />
                  <Color label="Accent" value={form.accentColor} onChange={(value) => setForm({ ...form, accentColor: value })} />
                </div>
                <Input label="Font family" value={form.fontFamily} onChange={(value) => setForm({ ...form, fontFamily: value })} />
                <Input label="Animation style" value={form.animationStyle} onChange={(value) => setForm({ ...form, animationStyle: value })} />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Starts" type="datetime-local" value={form.startsAt} onChange={(value) => setForm({ ...form, startsAt: value })} />
                  <Input label="Ends" type="datetime-local" value={form.endsAt} onChange={(value) => setForm({ ...form, endsAt: value })} />
                </div>
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
                  Visible in user shop
                </label>
                <button className="w-full rounded bg-coral px-4 py-3 font-black text-white">{editingId ? 'Save theme' : 'Create theme'}</button>
              </div>
            </form>
          </div>

          <section className="rounded border border-black/10 bg-white p-5">
            <h2 className="mb-4 flex items-center gap-2 font-black"><Bell size={18} /> User app notification carousel</h2>
            <form onSubmit={saveAnnouncement} className="grid gap-3 lg:grid-cols-6">
              <input
                placeholder="Title"
                required
                value={announcementForm.title}
                onChange={(event) => setAnnouncementForm({ ...announcementForm, title: event.target.value })}
                className="rounded border border-black/10 px-3 py-2 lg:col-span-1"
              />
              <input
                placeholder="Message shown in top app bar"
                required
                value={announcementForm.message}
                onChange={(event) => setAnnouncementForm({ ...announcementForm, message: event.target.value })}
                className="rounded border border-black/10 px-3 py-2 lg:col-span-2"
              />
              <input
                placeholder="/themes/bihu"
                value={announcementForm.href}
                onChange={(event) => setAnnouncementForm({ ...announcementForm, href: event.target.value })}
                className="rounded border border-black/10 px-3 py-2"
              />
              <select
                value={announcementForm.themeId}
                onChange={(event) => setAnnouncementForm({ ...announcementForm, themeId: event.target.value })}
                className="rounded border border-black/10 px-3 py-2"
              >
                <option value="">No theme</option>
                {themes.map((theme: any) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}
              </select>
              <button className="inline-flex items-center justify-center gap-2 rounded bg-ink px-4 py-2 font-bold text-white">
                {editingAnnouncementId ? <Save size={16} /> : <Plus size={16} />} {editingAnnouncementId ? 'Save' : 'Add'}
              </button>
              <input
                placeholder="CTA label"
                value={announcementForm.ctaLabel}
                onChange={(event) => setAnnouncementForm({ ...announcementForm, ctaLabel: event.target.value })}
                className="rounded border border-black/10 px-3 py-2"
              />
              <input
                type="number"
                placeholder="Priority"
                value={announcementForm.priority}
                onChange={(event) => setAnnouncementForm({ ...announcementForm, priority: Number(event.target.value || 0) })}
                className="rounded border border-black/10 px-3 py-2"
              />
              <input
                type="datetime-local"
                value={announcementForm.startsAt}
                onChange={(event) => setAnnouncementForm({ ...announcementForm, startsAt: event.target.value })}
                className="rounded border border-black/10 px-3 py-2"
              />
              <input
                type="datetime-local"
                value={announcementForm.endsAt}
                onChange={(event) => setAnnouncementForm({ ...announcementForm, endsAt: event.target.value })}
                className="rounded border border-black/10 px-3 py-2"
              />
              <label className="flex items-center gap-2 rounded border border-black/10 px-3 py-2 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={announcementForm.isActive}
                  onChange={(event) => setAnnouncementForm({ ...announcementForm, isActive: event.target.checked })}
                />
                Show to users
              </label>
              {editingAnnouncementId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingAnnouncementId(null);
                    setAnnouncementForm(emptyAnnouncement);
                  }}
                  className="rounded border border-black/10 px-4 py-2 font-bold"
                >
                  Cancel edit
                </button>
              )}
            </form>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {announcements.map((item: any) => (
                <div key={item.id} className="rounded bg-black/[0.03] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black">{item.title}</p>
                      <p className="text-xs font-bold text-black/45">{item.isActive ? 'Visible' : 'Paused'}{item.theme?.name ? ` · ${item.theme.name}` : ''}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => editAnnouncement(item)} className="rounded border border-black/10 p-2 text-ink" aria-label="Edit announcement">
                        <Edit3 size={15} />
                      </button>
                      <button onClick={() => deleteAnnouncement(item.id)} className="rounded border border-red-200 p-2 text-red-600" aria-label="Delete announcement">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-black/60">{item.message}</p>
                  <p className="mt-2 flex items-center gap-1 text-xs font-bold text-black/45"><CalendarClock size={13} /> {item.startsAt ? new Date(item.startsAt).toLocaleString() : 'Now'} to {item.endsAt ? new Date(item.endsAt).toLocaleString() : 'No end'}</p>
                </div>
              ))}
            </div>
          </section>
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

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase text-black/45">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="w-full rounded border border-black/10 px-3 py-2 text-sm" />
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
