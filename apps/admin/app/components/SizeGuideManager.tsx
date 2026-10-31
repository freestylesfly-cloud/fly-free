'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Image as ImageIcon, Save } from 'lucide-react';
import { apiService } from '../services/api';
import { ImageUploadField } from './ImageUploadField';

/**
 * One size chart per style, grouped by product type (T-Shirts: Regular /
 * Oversized / Polo; Hoodies: Pullover / Zip-up; Socks…). A chart is stored
 * against the style's slug, so adding a style in Types & Styles adds a card
 * here automatically.
 */

interface SizeGuide {
  id: string;
  fitType?: string;
  chartImageUrl?: string;
  note?: string;
  priority: number;
  active: boolean;
}

type Style = { id: string; name: string; slug: string };
type TypeGroup = { id: string; name: string; categories: Style[] };

type FitForm = {
  id?: string;
  chartImageUrl: string;
  note: string;
  priority: string;
  active: boolean;
};

const DEFAULT_NOTE = 'Compare with a piece you already own that fits you well. Measurements are of the garment, laid flat.';

function emptyFitForm(): FitForm {
  return { chartImageUrl: '', note: DEFAULT_NOTE, priority: '0', active: true };
}

export function SizeGuideManager() {
  const [groups, setGroups] = useState<TypeGroup[]>([]);
  const [forms, setForms] = useState<Record<string, FitForm>>({});
  const [loading, setLoading] = useState(true);
  const [savingFit, setSavingFit] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError('');
      const [guideData, typeData]: any[] = await Promise.all([apiService.getSizeGuides(), apiService.getProductTypes()]);
      const guides: SizeGuide[] = Array.isArray(guideData) ? guideData : guideData?.data ?? [];
      const types: TypeGroup[] = Array.isArray(typeData) ? typeData : typeData?.data ?? [];
      setGroups(types.filter((type) => type.categories.length > 0));
      const next: Record<string, FitForm> = {};
      for (const type of types) {
        for (const style of type.categories) {
          const guide = guides.find((row) => row.fitType === style.slug);
          next[style.slug] = guide
            ? {
                id: guide.id,
                chartImageUrl: guide.chartImageUrl || '',
                note: guide.note || DEFAULT_NOTE,
                priority: String(guide.priority ?? 0),
                active: guide.active !== false
              }
            : emptyFitForm();
        }
      }
      setForms(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load size guides');
    } finally {
      setLoading(false);
    }
  }

  async function saveFit(style: Style) {
    const form = forms[style.slug];
    try {
      setSavingFit(style.slug);
      setError('');
      setNotice('');
      const payload = {
        fitType: style.slug,
        chartImageUrl: form.chartImageUrl || null,
        note: form.note || null,
        priority: Number.parseInt(form.priority, 10) || 0,
        active: form.active
      };
      if (form.id) await apiService.updateSizeGuide(form.id, payload);
      else await apiService.createSizeGuide(payload);
      setNotice(`${style.name} chart saved.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to save ${style.name} chart`);
    } finally {
      setSavingFit(null);
    }
  }

  const updateForm = (slug: string, patch: Partial<FitForm>) => {
    setForms((current) => ({ ...current, [slug]: { ...(current[slug] || emptyFitForm()), ...patch } }));
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-black/45">Size Guides</p>
        <h2 className="text-2xl font-black">Size chart images</h2>
        <p className="mt-1 text-sm font-semibold text-black/55">
          One chart per style. Shoppers see the chart for the style of the product they are looking at.
        </p>
      </div>

      {error && (
        <div className="flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-bold">{error}</p>
          <button onClick={() => setError('')} className="shrink-0 text-sm font-bold underline">Dismiss</button>
        </div>
      )}
      {notice && <div className="rounded-lg border border-green-200 bg-green-50 p-4 font-bold text-green-800">{notice}</div>}

      {loading ? (
        <p className="text-black/60">Loading...</p>
      ) : (
        groups.map((type) => (
          <section key={type.id} className="space-y-3">
            <h3 className="text-lg font-black">{type.name}</h3>
            <div className="grid gap-5 lg:grid-cols-3">
              {type.categories.map((style) => {
                const form = forms[style.slug] || emptyFitForm();
                const isSaving = savingFit === style.slug;
                return (
                  <section key={style.id} className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-xl font-black">{style.name}</h4>
                        <p className="mt-1 text-sm font-semibold text-black/55">
                          {type.name} · {form.chartImageUrl ? 'Chart ready' : 'No chart yet'}
                        </p>
                      </div>
                      <div className="rounded-full bg-black p-2 text-white">
                        {form.chartImageUrl ? <CheckCircle2 size={18} /> : <ImageIcon size={18} />}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <ImageUploadField
                        label={`${style.name} chart image`}
                        value={form.chartImageUrl}
                        onChange={(value) => updateForm(style.slug, { chartImageUrl: value })}
                        bucket="product-images"
                        folder="size-guides"
                        aspect={3 / 2}
                        targetWidth={1800}
                        hint="The full chart image shoppers should see for this style."
                      />
                      <label className="grid gap-2 text-sm font-bold">
                        Customer note
                        <textarea
                          value={form.note}
                          onChange={(event) => updateForm(style.slug, { note: event.target.value })}
                          rows={3}
                          className="rounded-lg border border-black/10 px-3 py-2"
                        />
                      </label>
                      <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                        <input
                          type="number"
                          placeholder="Priority"
                          value={form.priority}
                          onChange={(event) => updateForm(style.slug, { priority: event.target.value })}
                          className="rounded-lg border border-black/10 px-3 py-2"
                        />
                        <label className="flex items-center gap-2 text-sm font-bold">
                          <input type="checkbox" checked={form.active} onChange={(event) => updateForm(style.slug, { active: event.target.checked })} />
                          Active
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => saveFit(style)}
                        disabled={isSaving}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 font-black text-white hover:bg-black/90 disabled:opacity-50"
                      >
                        <Save size={18} />
                        {isSaving ? 'Saving...' : `Save ${style.name} chart`}
                      </button>
                    </div>
                  </section>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
