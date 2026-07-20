'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Bell, CalendarClock, Edit3, ImageIcon, Plus, Save, Trash2, X } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { ImageUploadField } from '../components/ImageUploadField';
import { useFetch } from '../hooks/useFetch';
import { apiService } from '../services/api';

type AnnouncementForm = {
  title: string;
  message: string;
  href: string;
  imageUrl: string;
  ctaLabel: string;
  type: string;
  websiteThemeId: string;
  priority: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

const emptyAnnouncement: AnnouncementForm = {
  title: '',
  message: '',
  href: '',
  imageUrl: '',
  ctaLabel: '',
  type: 'INFO',
  websiteThemeId: '',
  priority: 0,
  startsAt: '',
  endsAt: '',
  isActive: true
};

export default function AnnouncementsPage() {
  const { data: announcementsRaw, loading, error, refetch } = useFetch<any>(() => apiService.getAnnouncements(), { skip: false });
  const { data: websiteThemesRaw } = useFetch<any>(() => apiService.getWebsiteThemes(), { skip: false });
  const announcements = announcementsRaw?.data || [];
  const websiteThemes = Array.isArray(websiteThemesRaw) ? websiteThemesRaw : websiteThemesRaw?.data || [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AnnouncementForm>(emptyAnnouncement);
  const [notice, setNotice] = useState('');
  const [formError, setFormError] = useState('');

  function editAnnouncement(item: any) {
    setEditingId(item.id);
    setForm({
      title: item.title || '',
      message: item.message || '',
      href: item.href || '',
      imageUrl: item.imageUrl || '',
      ctaLabel: item.ctaLabel || '',
      type: item.type || 'INFO',
      websiteThemeId: item.websiteThemeId || '',
      priority: item.priority || 0,
      startsAt: toInputDate(item.startsAt),
      endsAt: toInputDate(item.endsAt),
      isActive: item.isActive ?? true
    });
  }

  async function saveAnnouncement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('');
    setFormError('');

    try {
      const payload = {
        ...form,
        websiteThemeId: form.websiteThemeId || null,
        themeId: null,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null
      };

      if (editingId) {
        await apiService.updateAnnouncement(editingId, payload);
        setNotice('Announcement updated for the user app carousel.');
      } else {
        await apiService.createAnnouncement(payload);
        setNotice('Announcement scheduled for the user app carousel.');
      }

      setEditingId(null);
      setForm(emptyAnnouncement);
      refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save announcement');
    }
  }

  async function deleteAnnouncement(id: string) {
    await apiService.deleteAnnouncement(id);
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyAnnouncement);
    }
    setNotice('Announcement deleted.');
    refetch();
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Announcements" subtitle="Website-skin top app bar carousel, offers, and event messages">
        <div className="space-y-6">
          {(error || formError) && <div className="rounded border border-red-200 bg-red-50 p-4 font-bold text-red-700">{error || formError}</div>}
          {notice && <div className="rounded border border-green-200 bg-green-50 p-4 font-bold text-green-800">{notice}</div>}

          <section className="rounded border border-black/10 bg-white p-5">
            <div className="flex items-start gap-3">
              <Bell className="mt-1 text-coral" size={20} />
              <div>
                <h2 className="font-black">Announcements belong to website skin</h2>
                <p className="mt-1 text-sm leading-6 text-black/60">
                  Use this for site-wide notices: Puja sale, Bihu launch, rainy-day offer, winter drop, game night. Product themes stay under Store so products can be assigned to them.
                </p>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1fr_430px]">
            <section className="rounded border border-black/10 bg-white">
              <div className="border-b border-black/10 p-4 font-black">Scheduled carousel messages</div>
              {loading ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded bg-black/5" />)}
                </div>
              ) : (
                <div className="grid gap-3 p-4 md:grid-cols-2">
                  {announcements.map((item: any) => (
                    <article key={item.id} className="overflow-hidden rounded border border-black/10 bg-white">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.title} className="h-28 w-full object-cover" />
                      )}
                      <div className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black">{item.title}</p>
                            <p className="text-xs font-bold text-black/45">
                              {item.isActive ? 'Visible' : 'Paused'} - {item.websiteTheme?.name || 'All website skins'} - {item.type || 'INFO'}
                            </p>
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
                        <p className="text-sm leading-6 text-black/60">{item.message}</p>
                        <p className="flex items-center gap-1 text-xs font-bold text-black/45">
                          <CalendarClock size={13} />
                          {item.startsAt ? new Date(item.startsAt).toLocaleString() : 'Now'} to {item.endsAt ? new Date(item.endsAt).toLocaleString() : 'No end'}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <form onSubmit={saveAnnouncement} className="h-fit rounded border border-black/10 bg-white p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-black">{editingId ? 'Edit announcement' : 'Create announcement'}</h2>
                  <p className="text-sm text-black/55">Shown in the user app top carousel.</p>
                </div>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setForm(emptyAnnouncement); }} className="rounded p-2 hover:bg-black/5" aria-label="Cancel edit">
                    <X size={18} />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <Input label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} required />
                <Textarea label="Message" value={form.message} onChange={(value) => setForm({ ...form, message: value })} />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="CTA label" value={form.ctaLabel} onChange={(value) => setForm({ ...form, ctaLabel: value })} />
                  <Input label="Link" value={form.href} onChange={(value) => setForm({ ...form, href: value })} placeholder="/products" />
                </div>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase text-black/45">Website skin</span>
                  <select
                    value={form.websiteThemeId}
                    onChange={(event) => setForm({ ...form, websiteThemeId: event.target.value })}
                    className="w-full rounded border border-black/10 px-3 py-2 text-sm font-bold"
                  >
                    <option value="">All website skins</option>
                    {websiteThemes.map((theme: any) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold uppercase text-black/45">Type</span>
                    <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="w-full rounded border border-black/10 px-3 py-2 text-sm font-bold">
                      <option value="INFO">Info</option>
                      <option value="OFFER">Offer</option>
                      <option value="EVENT">Event</option>
                      <option value="SKIN">Website skin</option>
                      <option value="GIFTING">Gifting</option>
                    </select>
                  </label>
                  <Input label="Priority" type="number" value={form.priority} onChange={(value) => setForm({ ...form, priority: Number(value || 0) })} />
                </div>
                <ImageUploadField
                  label="Optional banner image"
                  value={form.imageUrl}
                  onChange={(value) => setForm({ ...form, imageUrl: value })}
                  bucket="banners"
                  folder="announcements"
                  aspect={16 / 5}
                  alt={form.title}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Starts" type="datetime-local" value={form.startsAt} onChange={(value) => setForm({ ...form, startsAt: value })} />
                  <Input label="Ends" type="datetime-local" value={form.endsAt} onChange={(value) => setForm({ ...form, endsAt: value })} />
                </div>
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
                  Show to users
                </label>
                <button className="inline-flex w-full items-center justify-center gap-2 rounded bg-coral px-4 py-3 font-black text-white">
                  {editingId ? <Save size={18} /> : <Plus size={18} />}
                  {editingId ? 'Save announcement' : 'Create announcement'}
                </button>
              </div>
            </form>
          </div>

          <section className="rounded border border-black/10 bg-white p-5">
            <div className="mb-3 flex items-center gap-2 font-black">
              <ImageIcon size={18} /> Image upload
            </div>
            <p className="text-sm leading-6 text-black/60">
              Paste an image URL or upload from device. Device uploads go to the Supabase banners bucket and the public URL is saved in the database.
            </p>
          </section>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function Input({ label, value, onChange, type = 'text', required, placeholder }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase text-black/45">{label}</span>
      <input type={type} required={required} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded border border-black/10 px-3 py-2 text-sm" />
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

function toInputDate(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}
