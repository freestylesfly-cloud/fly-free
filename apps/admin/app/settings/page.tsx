'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { apiService } from '../services/api';

type AppSettings = {
  appName: string;
  appDescription: string;
  appLogo: string;
  appFavicon: string;
  contactEmail: string;
  contactPhone: string;
  supportEmail: string;
  footerText: string;
  newsletterTitle: string;
  newsletterText: string;
  newsletterSuccessMessage: string;
  whatsappMessage: string;
  /** Prefix for generated order numbers, e.g. FF -> FF-2026-000123 */
  orderPrefix: string;
  /** Rupees. Charged when the order total is below the free threshold. */
  deliveryFee: number;
  /** Rupees. Orders at or above this ship free. */
  freeDeliveryAbove: number;
  firstOrderOfferEnabled: boolean;
  firstOrderOfferCode: string;
  firstOrderOfferTitle: string;
  firstOrderOfferDiscountPercent: number;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    whatsapp?: string;
  };
};

const emptySettings: AppSettings = {
  appName: '',
  appDescription: '',
  appLogo: '',
  appFavicon: '',
  contactEmail: '',
  contactPhone: '',
  supportEmail: '',
  footerText: '',
  newsletterTitle: '',
  newsletterText: '',
  newsletterSuccessMessage: '',
  whatsappMessage: '',
  orderPrefix: 'FF',
  deliveryFee: 60,
  freeDeliveryAbove: 1000,
  firstOrderOfferEnabled: false,
  firstOrderOfferCode: '',
  firstOrderOfferTitle: 'First order offer',
  firstOrderOfferDiscountPercent: 10,
  socialLinks: {}
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(emptySettings);
  const [activeTab, setActiveTab] = useState<'general' | 'messages' | 'delivery' | 'social'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      setError('');
      const result: any = await apiService.getSettings();
      const loaded = result.data || {};
      setSettings({ ...emptySettings, ...loaded, socialLinks: loaded.socialLinks || {} });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings from database');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setSaved(false);
      setError('');
      await apiService.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Settings" subtitle="Database-backed">
        <div className="space-y-5">
          {error && <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
          {saved && <div className="rounded border border-green-200 bg-green-50 p-4 text-green-700">Settings saved.</div>}

          <StorageStatusCard />

          <div className="flex gap-2 border-b border-black/10">
            <button onClick={() => setActiveTab('general')} className={`px-4 py-3 font-bold ${activeTab === 'general' ? 'border-b-2 border-coral text-coral' : 'text-black/60'}`}>General</button>
            <button onClick={() => setActiveTab('messages')} className={`px-4 py-3 font-bold ${activeTab === 'messages' ? 'border-b-2 border-coral text-coral' : 'text-black/60'}`}>Storefront Messages</button>
            <button onClick={() => setActiveTab('delivery')} className={`px-4 py-3 font-bold ${activeTab === 'delivery' ? 'border-b-2 border-coral text-coral' : 'text-black/60'}`}>Delivery &amp; Orders</button>
            <button onClick={() => setActiveTab('social')} className={`px-4 py-3 font-bold ${activeTab === 'social' ? 'border-b-2 border-coral text-coral' : 'text-black/60'}`}>Social Links</button>
          </div>

          <section className="rounded border border-black/10 bg-white p-6">
            {loading ? (
              <p className="text-black/60">Loading settings...</p>
            ) : activeTab === 'general' ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="App Name" value={settings.appName} onChange={(value) => update('appName', value)} />
                <Field label="Logo URL or Text" value={settings.appLogo} onChange={(value) => update('appLogo', value)} />
                <Field label="Favicon URL" value={settings.appFavicon} onChange={(value) => update('appFavicon', value)} />
                <Field label="Contact Email" value={settings.contactEmail} onChange={(value) => update('contactEmail', value)} />
                <Field label="Contact Phone" value={settings.contactPhone} onChange={(value) => update('contactPhone', value)} />
                <Field label="Support Email" value={settings.supportEmail} onChange={(value) => update('supportEmail', value)} />
                <label className="grid gap-2 text-sm font-bold md:col-span-2">
                  App Description
                  <textarea value={settings.appDescription} onChange={(event) => update('appDescription', event.target.value)} rows={4} className="rounded border border-black/10 px-3 py-2" />
                </label>
              </div>
            ) : activeTab === 'messages' ? (
              <div className="grid gap-4">
                <TextareaField label="Footer Message" value={settings.footerText} onChange={(value) => update('footerText', value)} rows={3} />
                <TextareaField label="Subscriber Heading" value={settings.newsletterTitle} onChange={(value) => update('newsletterTitle', value)} rows={2} />
                <TextareaField label="Subscriber Message" value={settings.newsletterText} onChange={(value) => update('newsletterText', value)} rows={3} />
                <TextareaField label="Subscriber Success Message" value={settings.newsletterSuccessMessage} onChange={(value) => update('newsletterSuccessMessage', value)} rows={2} />
                <TextareaField label="WhatsApp Message" value={settings.whatsappMessage} onChange={(value) => update('whatsappMessage', value)} rows={3} />
              </div>
            ) : activeTab === 'delivery' ? (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold">
                  Delivery Fee (₹)
                  <input
                    type="number"
                    min={0}
                    value={settings.deliveryFee}
                    onChange={(event) => update('deliveryFee', Number(event.target.value))}
                    className="rounded border border-black/10 px-3 py-2"
                  />
                  <span className="text-xs font-normal text-black/50">
                    Charged when the order total is below the free-delivery threshold.
                  </span>
                </label>

                <label className="grid gap-2 text-sm font-bold">
                  Free Delivery Above (₹)
                  <input
                    type="number"
                    min={0}
                    value={settings.freeDeliveryAbove}
                    onChange={(event) => update('freeDeliveryAbove', Number(event.target.value))}
                    className="rounded border border-black/10 px-3 py-2"
                  />
                  <span className="text-xs font-normal text-black/50">
                    Orders at or above this amount ship free.
                  </span>
                </label>

                <label className="grid gap-2 text-sm font-bold">
                  Order Number Prefix
                  <input
                    value={settings.orderPrefix}
                    onChange={(event) => update('orderPrefix', event.target.value.toUpperCase())}
                    className="rounded border border-black/10 px-3 py-2"
                  />
                  <span className="text-xs font-normal text-black/50">
                    Orders are numbered {settings.orderPrefix || 'FF'}-{new Date().getFullYear()}-000001.
                  </span>
                </label>

                <label className="flex items-center gap-3 rounded border border-black/10 p-4 text-sm font-bold md:col-span-2">
                  <input
                    type="checkbox"
                    checked={settings.firstOrderOfferEnabled}
                    onChange={(event) => update('firstOrderOfferEnabled', event.target.checked)}
                    className="h-4 w-4"
                  />
                  Enable first-order offer
                </label>

                <Field label="First Order Offer Title" value={settings.firstOrderOfferTitle} onChange={(value) => update('firstOrderOfferTitle', value)} />
                <Field label="First Order Coupon Code" value={settings.firstOrderOfferCode} onChange={(value) => update('firstOrderOfferCode', value.toUpperCase())} />

                <label className="grid gap-2 text-sm font-bold">
                  First Order Discount %
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={settings.firstOrderOfferDiscountPercent}
                    onChange={(event) => update('firstOrderOfferDiscountPercent', Number(event.target.value))}
                    className="rounded border border-black/10 px-3 py-2"
                  />
                  <span className="text-xs font-normal text-black/50">
                    Saving settings creates or updates this coupon automatically.
                  </span>
                </label>

                <div className="rounded border border-black/10 bg-black/[0.02] p-4 text-sm md:col-span-2">
                  <p className="font-bold">Customer sees</p>
                  <p className="mt-1 text-black/60">
                    Under ₹{settings.freeDeliveryAbove}: delivery ₹{settings.deliveryFee} added at checkout, with a
                    prompt showing how much more to spend for free delivery. At or above ₹{settings.freeDeliveryAbove}:
                    delivery is free. No tax line is shown.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {(['facebook', 'instagram', 'twitter', 'youtube', 'whatsapp'] as const).map((platform) => (
                  <Field
                    key={platform}
                    label={platform[0].toUpperCase() + platform.slice(1)}
                    value={settings.socialLinks[platform] || ''}
                    onChange={(value) => setSettings((prev) => ({ ...prev, socialLinks: { ...prev.socialLinks, [platform]: value } }))}
                  />
                ))}
              </div>
            )}
          </section>

          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving || loading} className="inline-flex items-center gap-2 rounded bg-coral px-5 py-3 font-bold text-white disabled:opacity-50">
              <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );

  function update(key: keyof AppSettings, value: string | number | boolean) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }
}

type StorageStatus = {
  bucket: string;
  supabaseUrl: string | null;
  hasSupabaseUrl: boolean;
  hasServiceRoleKey: boolean;
  bucketReachable: boolean;
  isPublic: boolean | null;
  ok: boolean;
  error: string | null;
};

/**
 * Live check of the image bucket. Uploads are performed by the API server, so
 * this reports the API's configuration — not this admin app's.
 */
function StorageStatusCard() {
  const [status, setStatus] = useState<StorageStatus | null>(null);
  const [checking, setChecking] = useState(true);
  const [failed, setFailed] = useState('');

  async function check() {
    try {
      setChecking(true);
      setFailed('');
      setStatus((await apiService.getStorageStatus()) as StorageStatus);
    } catch (err) {
      setFailed(err instanceof Error ? err.message : 'Could not reach the API server');
      setStatus(null);
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    void check();
  }, []);

  const good = status?.ok === true;
  const tone = checking
    ? 'border-black/10 bg-white'
    : good
      ? 'border-green-200 bg-green-50'
      : 'border-red-200 bg-red-50';

  return (
    <section className={`rounded border p-5 ${tone}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-black">Image storage</h2>
          <p className="text-sm text-black/55">
            Where product, theme, hamper and category uploads are stored.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void check()}
          disabled={checking}
          className="rounded border border-black/15 px-3 py-2 text-sm font-bold disabled:opacity-50"
        >
          {checking ? 'Checking...' : 'Re-check'}
        </button>
      </div>

      {failed && <p className="mt-3 text-sm font-bold text-red-700">API unreachable: {failed}</p>}

      {status && (
        <>
          <p className={`mt-3 font-black ${good ? 'text-green-800' : 'text-red-700'}`}>
            {good ? 'Uploads are working.' : 'Uploads will fail.'}
          </p>
          {status.error && <p className="mt-1 text-sm font-bold text-red-700">{status.error}</p>}

          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <Check label="SUPABASE_URL set on API" ok={status.hasSupabaseUrl} />
            <Check label="SUPABASE_SERVICE_ROLE_KEY set on API" ok={status.hasServiceRoleKey} />
            <Check label={`Bucket "${status.bucket}" reachable`} ok={status.bucketReachable} />
            <Check label="Bucket is public" ok={status.isPublic === true} />
          </dl>

          {status.supabaseUrl && (
            <p className="mt-3 break-all text-xs font-bold text-black/45">Project: {status.supabaseUrl}</p>
          )}

          {!good && (
            <p className="mt-3 text-xs font-bold text-black/60">
              These variables belong on the server that runs the API, not on the frontend host. The
              service-role key must never be added as a NEXT_PUBLIC_ variable.
            </p>
          )}
        </>
      )}
    </section>
  );
}

function Check({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`font-black ${ok ? 'text-green-700' : 'text-red-600'}`}>{ok ? '✓' : '✕'}</span>
      <span className="font-bold text-black/70">{label}</span>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="rounded border border-black/10 px-3 py-2" />
    </label>
  );
}

function TextareaField({ label, value, rows, onChange }: { label: string; value: string; rows: number; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      <span className="flex items-center justify-between gap-3">
        {label}
        {value && (
          <button type="button" onClick={() => onChange('')} className="text-xs font-black uppercase text-black/45 hover:text-coral">
            Clear
          </button>
        )}
      </span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} className="rounded border border-black/10 px-3 py-2" />
    </label>
  );
}
