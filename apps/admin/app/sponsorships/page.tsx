'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Handshake, Plus, Save, Trash2, X } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ImageUploadField } from '../components/ImageUploadField';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useFetch } from '../hooks/useFetch';
import { apiService } from '../services/api';

interface Sponsorship {
  id: string;
  partnerName: string;
  partnerHandle?: string | null;
  partnerUrl?: string | null;
  eventName: string;
  eventDate?: string | null;
  location?: string | null;
  headline?: string | null;
  blurb?: string | null;
  bannerImageUrl?: string | null;
  partnerLogoUrl?: string | null;
  isActive: boolean;
  showWinners: boolean;
  priority: number;
  startsAt?: string | null;
  endsAt?: string | null;
  winnersUntil?: string | null;
  // Totals come from a grouped aggregate, not a nested voucher load.
  voucherCount?: number;
  totalIssued?: number;
  totalRemaining?: number;
}

const emptyForm = {
  partnerName: '',
  partnerHandle: '',
  partnerUrl: '',
  eventName: '',
  eventDate: '',
  location: '',
  headline: '',
  blurb: '',
  bannerImageUrl: '',
  partnerLogoUrl: '',
  isActive: false,
  showWinners: false,
  priority: '0',
  startsAt: '',
  endsAt: '',
  winnersUntil: ''
};

export default function SponsorshipsPage() {
  const { data, loading, error, refetch } = useFetch<any>(() => apiService.getSponsorships(), { skip: false });
  const sponsorships = (data?.data || []) as Sponsorship[];

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setNotice('');
    setFormError('');

    const payload = {
      ...form,
      priority: Number(form.priority) || 0,
      eventDate: form.eventDate ? new Date(form.eventDate).toISOString() : null,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      winnersUntil: form.winnersUntil ? new Date(form.winnersUntil).toISOString() : null
    };

    try {
      if (editingId) await apiService.updateSponsorship(editingId, payload);
      else await apiService.createSponsorship(payload);
      setNotice(editingId ? 'Sponsorship updated.' : 'Sponsorship created. Add the winners once the event is over.');
      setForm(emptyForm);
      setEditingId(null);
      refetch();
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Could not save sponsorship.');
    } finally {
      setSaving(false);
    }
  }

  function edit(sponsorship: Sponsorship) {
    setForm({
      partnerName: sponsorship.partnerName || '',
      partnerHandle: sponsorship.partnerHandle || '',
      partnerUrl: sponsorship.partnerUrl || '',
      eventName: sponsorship.eventName || '',
      eventDate: toInputDate(sponsorship.eventDate),
      location: sponsorship.location || '',
      headline: sponsorship.headline || '',
      blurb: sponsorship.blurb || '',
      bannerImageUrl: sponsorship.bannerImageUrl || '',
      partnerLogoUrl: sponsorship.partnerLogoUrl || '',
      isActive: sponsorship.isActive,
      showWinners: sponsorship.showWinners,
      priority: String(sponsorship.priority ?? 0),
      startsAt: toInputDate(sponsorship.startsAt),
      endsAt: toInputDate(sponsorship.endsAt),
      winnersUntil: toInputDate(sponsorship.winnersUntil)
    });
    setEditingId(sponsorship.id);
    setNotice('');
    setFormError('');
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this sponsorship and its vouchers?')) return;
    try {
      await apiService.deleteSponsorship(id);
      setNotice('Sponsorship deleted.');
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      refetch();
    } catch (deleteError) {
      setFormError(deleteError instanceof Error ? deleteError.message : 'Could not delete sponsorship.');
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Sponsorships" subtitle="Partner events Fly Free backs, and the prize vouchers their winners receive">
        <div className="space-y-6">
          {(error || formError) && (
            <div className="rounded border border-red-200 bg-red-50 p-4 font-bold text-red-700">{error || formError}</div>
          )}
          {notice && <div className="rounded border border-green-200 bg-green-50 p-4 font-bold text-green-800">{notice}</div>}

          <div className="grid gap-6 xl:grid-cols-[1fr_430px]">
            {/* LIST */}
            <section className="rounded border border-black/10 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black">Sponsorships ({sponsorships.length})</h2>
              <p className="mt-1 text-xs font-bold text-black/50">
                Only an active sponsorship inside its date window shows on the storefront.
              </p>

              <div className="mt-4 space-y-3">
                {loading ? (
                  <p className="text-black/60">Loading sponsorships...</p>
                ) : sponsorships.length === 0 ? (
                  <p className="text-black/60">No sponsorships yet. Create one to run the banner before the event.</p>
                ) : (
                  sponsorships.map((sponsorship) => {
                    const count = sponsorship.voucherCount ?? 0;
                    const issued = sponsorship.totalIssued ?? 0;
                    const left = sponsorship.totalRemaining ?? 0;
                    const winnersExpired = sponsorship.winnersUntil
                      ? new Date(sponsorship.winnersUntil).getTime() < Date.now()
                      : false;

                    return (
                      <div key={sponsorship.id} className="rounded border border-black/10 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-base font-black">{sponsorship.partnerName}</span>
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                                  sponsorship.isActive ? 'bg-green-50 text-green-700' : 'bg-black/5 text-black/50'
                                }`}
                              >
                                {sponsorship.isActive ? 'Live' : 'Draft'}
                              </span>
                              {sponsorship.showWinners && (
                                <span
                                  className={`inline-flex rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                                    winnersExpired ? 'bg-black/5 text-black/50' : 'bg-blue-50 text-blue-700'
                                  }`}
                                >
                                  {winnersExpired ? 'Winners retired' : 'Winners shown'}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm font-bold text-black/60">
                              {sponsorship.eventName}
                              {sponsorship.location ? ` · ${sponsorship.location}` : ''}
                              {sponsorship.eventDate ? ` · ${new Date(sponsorship.eventDate).toLocaleDateString('en-IN')}` : ''}
                            </p>
                            <p className="mt-2 text-xs font-bold text-black/55">
                              {count} voucher{count === 1 ? '' : 's'} · Rs {issued.toLocaleString('en-IN')} issued · Rs{' '}
                              {left.toLocaleString('en-IN')} unspent
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/sponsorships/${sponsorship.id}`}
                              className="inline-flex items-center gap-1 rounded bg-ink px-3 py-2 text-xs font-bold text-white"
                            >
                              Winners &amp; vouchers <ArrowRight size={14} />
                            </Link>
                            <button
                              type="button"
                              onClick={() => edit(sponsorship)}
                              className="rounded border border-black/10 px-3 py-2 text-xs font-bold"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => remove(sponsorship.id)}
                              className="rounded border border-red-200 px-2 py-1.5 text-xs font-bold text-red-700"
                              aria-label="Delete sponsorship"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* FORM */}
            <section className="h-fit max-h-[90vh] overflow-y-auto rounded border border-black/10 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-black">
                  <Handshake size={18} /> {editingId ? 'Edit sponsorship' : 'New sponsorship'}
                </h2>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setForm(emptyForm);
                    }}
                    className="inline-flex items-center gap-1 rounded border border-black/10 px-2 py-1 text-xs font-bold"
                  >
                    <X size={12} /> Cancel
                  </button>
                )}
              </div>

              <form onSubmit={save} className="space-y-4">
                <Input label="Partner name" value={form.partnerName} onChange={(v) => setForm({ ...form, partnerName: v })} required placeholder="Dibrugarh Korean Club" />
                <Input label="Event name" value={form.eventName} onChange={(v) => setForm({ ...form, eventName: v })} required placeholder="Korean Culture Fest 2026" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Social handle" value={form.partnerHandle} onChange={(v) => setForm({ ...form, partnerHandle: v })} placeholder="@dibrugarhkorean.club" />
                  <Input label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} placeholder="Dibrugarh, Assam" />
                </div>

                <Input label="Partner link" value={form.partnerUrl} onChange={(v) => setForm({ ...form, partnerUrl: v })} type="url" placeholder="https://instagram.com/..." />
                <Input label="Event date" value={form.eventDate} onChange={(v) => setForm({ ...form, eventDate: v })} type="datetime-local" />

                <Input label="Banner headline" value={form.headline} onChange={(v) => setForm({ ...form, headline: v })} placeholder="Falls back to the partner and event names" />
                <Textarea label="Banner text" value={form.blurb} onChange={(v) => setForm({ ...form, blurb: v })} placeholder="One or two lines about the collaboration." />

                <ImageUploadField
                  label="Banner image"
                  value={form.bannerImageUrl}
                  onChange={(value) => setForm((current) => ({ ...current, bannerImageUrl: value }))}
                  bucket="product-images"
                  folder="sponsorships"
                  aspect={16 / 9}
                  targetWidth={1600}
                  alt={form.partnerName}
                  hint="Wide artwork behind the banner on the homepage."
                />

                <ImageUploadField
                  label="Partner logo"
                  value={form.partnerLogoUrl}
                  onChange={(value) => setForm((current) => ({ ...current, partnerLogoUrl: value }))}
                  bucket="product-images"
                  folder="sponsorships"
                  aspect={1}
                  targetWidth={600}
                  alt={form.partnerName}
                  hint="Square mark shown beside the partner name."
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Show from" value={form.startsAt} onChange={(v) => setForm({ ...form, startsAt: v })} type="datetime-local" />
                  <Input label="Hide after" value={form.endsAt} onChange={(v) => setForm({ ...form, endsAt: v })} type="datetime-local" />
                </div>

                <Input label="Priority (lower shows first)" value={form.priority} onChange={(v) => setForm({ ...form, priority: v })} type="number" />

                <label className="flex items-center gap-2 text-sm font-bold">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  Show this sponsorship on the storefront
                </label>

                <label className="flex items-center gap-2 text-sm font-bold">
                  <input type="checkbox" checked={form.showWinners} onChange={(e) => setForm({ ...form, showWinners: e.target.checked })} />
                  Publish the winners list
                </label>
                <p className="-mt-2 text-xs text-black/50">
                  Only each winner&apos;s name and position are published. Phone numbers and voucher codes never leave this portal.
                </p>

                {form.showWinners && (
                  <>
                    <Input label="Stop showing winners after" value={form.winnersUntil} onChange={(v) => setForm({ ...form, winnersUntil: v })} type="datetime-local" />
                    <p className="-mt-2 text-xs text-black/50">
                      Leave blank for one month from now. After this date the banner stays but the winners list retires by itself.
                    </p>
                  </>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded bg-coral px-4 py-3 font-black text-white disabled:opacity-50"
                >
                  {editingId ? <Save size={16} /> : <Plus size={16} />}
                  {saving ? 'Saving...' : editingId ? 'Update sponsorship' : 'Create sponsorship'}
                </button>
              </form>
            </section>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase text-black/45">{label}</span>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded border border-black/10 px-3 py-2 text-sm"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase text-black/45">{label}</span>
      <textarea
        rows={4}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded border border-black/10 px-3 py-2 text-sm"
      />
    </label>
  );
}

/** ISO timestamp to the local value `<input type="datetime-local">` expects. */
function toInputDate(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}
