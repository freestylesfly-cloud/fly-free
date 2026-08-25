'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Image as ImageIcon, Save } from 'lucide-react';
import { apiService } from '../services/api';
import { ImageUploadField } from './ImageUploadField';

interface SizeGuide {
  id: string;
  fitType?: string;
  chartImageUrl?: string;
  note?: string;
  priority: number;
  active: boolean;
}

type FitKey = 'regular' | 'oversized' | 'polo';

type FitForm = {
  id?: string;
  chartImageUrl: string;
  note: string;
  priority: string;
  active: boolean;
};

const FITS: Array<{ key: FitKey; label: string; description: string }> = [
  { key: 'regular', label: 'Regular', description: 'Classic t-shirt and standard fit charts.' },
  { key: 'oversized', label: 'Oversized', description: 'Relaxed streetwear fit charts.' },
  { key: 'polo', label: 'Polo', description: 'Polo collar product fit charts.' },
];

const DEFAULT_NOTE = 'Focus on the body measurements. The t-shirt drawing is only a guide for where to measure.';

function emptyFitForm(): FitForm {
  return {
    chartImageUrl: '',
    note: DEFAULT_NOTE,
    priority: '0',
    active: true,
  };
}

export function SizeGuideManager() {
  const [sizes, setSizes] = useState<SizeGuide[]>([]);
  const [forms, setForms] = useState<Record<FitKey, FitForm>>({
    regular: emptyFitForm(),
    oversized: emptyFitForm(),
    polo: emptyFitForm(),
  });
  const [loading, setLoading] = useState(true);
  const [savingFit, setSavingFit] = useState<FitKey | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSizes();
  }, []);

  const stats = useMemo(() => {
    return FITS.map((fit) => ({
      ...fit,
      count: sizes.filter((size) => normalizeFit(size.fitType) === fit.key).length,
      hasImage: Boolean(forms[fit.key]?.chartImageUrl),
    }));
  }, [forms, sizes]);

  const loadSizes = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getSizeGuides();
      const loaded = Array.isArray(data) ? data : (data as any)?.data ?? [];
      setSizes(loaded);
      setForms(buildFitForms(loaded));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load size guides');
      setSizes([]);
    } finally {
      setLoading(false);
    }
  };

  const saveFit = async (fit: FitKey) => {
    const form = forms[fit];

    try {
      setSavingFit(fit);
      setError('');

      const payload = {
        fitType: fit,
        chartImageUrl: form.chartImageUrl || null,
        note: form.note || null,
        priority: Number.parseInt(form.priority, 10) || 0,
        active: form.active,
      };

      if (form.id) {
        await apiService.updateSizeGuide(form.id, payload);
      } else {
        await apiService.createSizeGuide(payload);
      }

      await loadSizes();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to save ${fit} chart`);
    } finally {
      setSavingFit(null);
    }
  };

  const updateForm = (fit: FitKey, patch: Partial<FitForm>) => {
    setForms((current) => ({
      ...current,
      [fit]: { ...current[fit], ...patch },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-black/45">Size Guides</p>
          <h2 className="text-2xl font-black">Fit chart images</h2>
          <p className="mt-1 text-sm font-semibold text-black/55">
            Upload one chart image for each fit type. Customers only see these chart images.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-xl border border-black/10 bg-white p-2">
          {stats.map((fit) => (
            <div key={fit.key} className="min-w-20 px-3 py-2 text-center">
              <p className="text-xs font-black uppercase text-black/45">{fit.label}</p>
              <p className="mt-1 text-sm font-black">{fit.hasImage ? 'Ready' : 'No image'}</p>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-bold">{error}</p>
          <button onClick={() => setError('')} className="shrink-0 text-sm font-bold underline">Dismiss</button>
        </div>
      )}

      {loading ? (
        <p className="text-black/60">Loading...</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          {FITS.map((fit) => {
            const form = forms[fit.key];
            const isSaving = savingFit === fit.key;

            return (
              <section key={fit.key} className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-black">{fit.label}</h3>
                    <p className="mt-1 text-sm font-semibold text-black/55">{fit.description}</p>
                  </div>
                  <div className="rounded-full bg-black p-2 text-white">
                    {form.chartImageUrl ? <CheckCircle2 size={18} /> : <ImageIcon size={18} />}
                  </div>
                </div>

                <div className="space-y-4">
                  <ImageUploadField
                    label={`${fit.label} chart image`}
                    value={form.chartImageUrl}
                    onChange={(value) => updateForm(fit.key, { chartImageUrl: value })}
                    bucket="product-images"
                    folder="size-guides"
                    aspect={3 / 2}
                    targetWidth={1800}
                    hint="Upload the full chart image customers should see for this fit."
                  />

                  <label className="grid gap-2 text-sm font-bold">
                    Customer note
                    <textarea
                      value={form.note}
                      onChange={(event) => updateForm(fit.key, { note: event.target.value })}
                      rows={3}
                      className="rounded-lg border border-black/10 px-3 py-2"
                    />
                  </label>

                  <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                    <input
                      type="number"
                      placeholder="Priority"
                      value={form.priority}
                      onChange={(event) => updateForm(fit.key, { priority: event.target.value })}
                      className="rounded-lg border border-black/10 px-3 py-2"
                    />
                    <label className="flex items-center gap-2 text-sm font-bold">
                      <input
                        type="checkbox"
                        checked={form.active}
                        onChange={(event) => updateForm(fit.key, { active: event.target.checked })}
                      />
                      Active
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => saveFit(fit.key)}
                    disabled={isSaving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 font-black text-white hover:bg-black/90 disabled:opacity-50"
                  >
                    <Save size={18} />
                    {isSaving ? 'Saving...' : `Save ${fit.label} chart`}
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function buildFitForms(sizes: SizeGuide[]): Record<FitKey, FitForm> {
  return FITS.reduce((result, fit) => {
    const fitRows = sizes.filter((size) => normalizeFit(size.fitType) === fit.key);
    const representative = fitRows.find((size) => size.chartImageUrl) || fitRows[0];

    result[fit.key] = representative
      ? {
          id: representative.id,
          chartImageUrl: representative.chartImageUrl || '',
          note: representative.note || DEFAULT_NOTE,
          priority: String(representative.priority ?? 0),
          active: representative.active !== false,
        }
      : emptyFitForm();

    return result;
  }, {} as Record<FitKey, FitForm>);
}

function normalizeFit(value?: string | null): FitKey {
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('polo')) return 'polo';
  if (normalized.includes('oversized') || normalized.includes('over-size')) return 'oversized';
  return 'regular';
}
