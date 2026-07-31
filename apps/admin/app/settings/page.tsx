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
  /** Prefix for generated order numbers, e.g. FF -> FF-2026-000123 */
  orderPrefix: string;
  /** Rupees. Charged when the order total is below the free threshold. */
  deliveryFee: number;
  /** Rupees. Orders at or above this ship free. */
  freeDeliveryAbove: number;
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
  orderPrefix: 'FF',
  deliveryFee: 60,
  freeDeliveryAbove: 1000,
  socialLinks: {}
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(emptySettings);
  const [activeTab, setActiveTab] = useState<'general' | 'delivery' | 'social'>('general');
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
      setSettings({ ...emptySettings, ...(result.data || {}) });
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

          <div className="flex gap-2 border-b border-black/10">
            <button onClick={() => setActiveTab('general')} className={`px-4 py-3 font-bold ${activeTab === 'general' ? 'border-b-2 border-coral text-coral' : 'text-black/60'}`}>General</button>
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
                <label className="grid gap-2 text-sm font-bold md:col-span-2">
                  Footer Text
                  <textarea value={settings.footerText} onChange={(event) => update('footerText', event.target.value)} rows={3} className="rounded border border-black/10 px-3 py-2" />
                </label>
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

  function update(key: keyof AppSettings, value: string | number) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="rounded border border-black/10 px-3 py-2" />
    </label>
  );
}
