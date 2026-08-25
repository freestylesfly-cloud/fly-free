'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getApiBaseUrl } from '../lib/api';

interface SizeRow {
  id: string;
  fitType?: string;
  chartImageUrl?: string | null;
  note?: string | null;
}

export default function SizeGuideDrawer({
  open,
  onClose,
  defaultFit = 'regular',
}: {
  open: boolean;
  onClose: () => void;
  defaultFit?: string;
}) {
  const [rows, setRows] = useState<SizeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFit, setActiveFit] = useState(normalizeFit(defaultFit));

  // Chart images live in the SizeGuide table so admin edits show up here.
  useEffect(() => {
    if (!open || rows.length > 0) return;

    let cancelled = false;
    setLoading(true);

    fetch(`${getApiBaseUrl()}/cms/size-guides`)
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        if (cancelled) return;
        const loaded = Array.isArray(data) ? data : data?.data ?? [];
        setRows(loaded);
        setActiveFit(normalizeFit(defaultFit));
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, rows.length, defaultFit]);

  useEffect(() => {
    if (open) setActiveFit(normalizeFit(defaultFit));
  }, [defaultFit, open]);

  if (!open) return null;

  const fits = fitGroups();
  const activeGuide = rows.find((row) => normalizeFit(row.fitType || 'regular') === activeFit);
  const chartImage = activeGuide?.chartImageUrl;
  const note = activeGuide?.note;

  return (
    <div>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <aside
        className="scrollbar-clean fixed right-0 top-0 z-50 h-full w-full overflow-y-auto shadow-xl sm:max-w-3xl lg:max-w-5xl"
        style={{ backgroundColor: 'var(--bg-primary)', borderLeft: '1px solid var(--border-color)' }}
      >
        <div
          className="sticky top-0 flex items-center justify-between border-b p-4"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
        >
          <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
            Size guide (inches)
          </h3>
          <button onClick={onClose} aria-label="Close size guide" className="p-1">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          {loading ? (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Loading measurements...
            </p>
          ) : rows.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Size measurements have not been published yet.
            </p>
          ) : (
            <>
            <div className="grid grid-cols-3 gap-2">
              {fits.map((fit) => (
                <button
                  key={fit.key}
                  type="button"
                  onClick={() => setActiveFit(fit.key)}
                  className="border px-3 py-2 text-xs font-black uppercase"
                  style={{
                    borderColor: activeFit === fit.key ? 'var(--color-primary)' : 'var(--border-color)',
                    backgroundColor: activeFit === fit.key ? 'var(--color-primary)' : 'var(--bg-secondary)',
                    color: activeFit === fit.key ? '#fff' : 'var(--text-primary)'
                  }}
                >
                  {fit.label}
                </button>
              ))}
            </div>

            {chartImage && (
              <div className="overflow-hidden border bg-white" style={{ borderColor: 'var(--border-color)' }}>
                <img src={chartImage} alt={`${fitLabel(activeFit)} size chart`} className="w-full object-contain" />
              </div>
            )}

            {!chartImage && (
              <div className="border bg-white p-5" style={{ borderColor: 'var(--border-color)' }}>
                <p className="font-black" style={{ color: 'var(--text-primary)' }}>
                  {fitLabel(activeFit)} size chart is coming soon.
                </p>
                <p className="mt-1 text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                  Try another fit tab, or contact us before ordering if you need exact measurements.
                </p>
              </div>
            )}

            <div className="border p-3" style={{ borderColor: 'var(--color-primary)', backgroundColor: 'color-mix(in srgb, var(--color-primary) 8%, white)' }}>
              <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
                Focus on size measurements.
              </p>
              <p className="mt-1 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                The garment drawing only shows where to measure. Choose the fit tab first, then compare chest, shoulder, length and sleeve values in the image.
              </p>
              {note && (
                <p className="mt-2 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                  {note}
                </p>
              )}
            </div>
            </>
          )}

        </div>
      </aside>
    </div>
  );
}

function fitGroups() {
  return ['regular', 'oversized', 'polo'].map((key) => ({ key, label: fitLabel(key) }));
}

function fitLabel(key: string) {
  if (key === 'polo') return 'Polo';
  if (key === 'regular') return 'Regular';
  if (key === 'oversized') return 'Oversized';
  return key.replace(/-/g, ' ');
}

function normalizeFit(value: string) {
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('polo')) return 'polo';
  if (normalized.includes('oversized') || normalized.includes('over-size')) return 'oversized';
  return 'regular';
}
