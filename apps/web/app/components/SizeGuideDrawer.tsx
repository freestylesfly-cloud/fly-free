'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getApiBaseUrl } from '../lib/api';
import { IMAGE_WIDTH, storageImage } from '../lib/image';

type StyleTab = { slug: string; name: string };

interface SizeRow {
  id: string;
  fitType?: string;
  chartImageUrl?: string | null;
  note?: string | null;
}

export default function SizeGuideDrawer({
  open,
  onClose,
  defaultFit = '',
  styles = [],
}: {
  open: boolean;
  onClose: () => void;
  /** Slug of the product's style; charts are stored against it. */
  defaultFit?: string;
  /** Every style of the product's type (Regular / Oversized / Polo for tees). */
  styles?: StyleTab[];
}) {
  const [rows, setRows] = useState<SizeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFit, setActiveFit] = useState(defaultFit);

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
        setActiveFit(defaultFit);
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
    if (open) setActiveFit(defaultFit);
  }, [defaultFit, open]);

  if (!open) return null;

  // Tabs only for styles of this type; with a single style there is nothing to switch.
  const fits = styles.length ? styles : defaultFit ? [{ slug: defaultFit, name: fitLabel(defaultFit) }] : [];
  const activeName = fits.find((fit) => fit.slug === activeFit)?.name || fitLabel(activeFit);
  const activeGuide = rows.find((row) => row.fitType === activeFit);
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
            {fits.length > 1 && (
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(fits.length, 4)}, minmax(0, 1fr))` }}>
              {fits.map((fit) => (
                <button
                  key={fit.slug}
                  type="button"
                  onClick={() => setActiveFit(fit.slug)}
                  className="border px-3 py-2 text-xs font-black uppercase"
                  style={{
                    borderColor: activeFit === fit.slug ? 'var(--color-primary)' : 'var(--border-color)',
                    backgroundColor: activeFit === fit.slug ? 'var(--color-primary)' : 'var(--bg-secondary)',
                    color: activeFit === fit.slug ? '#fff' : 'var(--text-primary)'
                  }}
                >
                  {fit.name}
                </button>
              ))}
            </div>
            )}

            {chartImage && (
              <div className="overflow-hidden border bg-white" style={{ borderColor: 'var(--border-color)' }}>
                <img src={storageImage(chartImage, IMAGE_WIDTH.card)} alt={`${activeName} size chart`} loading="lazy" decoding="async" className="w-full object-contain" />
              </div>
            )}

            {!chartImage && (
              <div className="border bg-white p-5" style={{ borderColor: 'var(--border-color)' }}>
                <p className="font-black" style={{ color: 'var(--text-primary)' }}>
                  {activeName} size chart is coming soon.
                </p>
                <p className="mt-1 text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                  {fits.length > 1 ? 'Try another style tab, or contact' : 'Contact'} us before ordering if you need exact measurements.
                </p>
              </div>
            )}

            <div className="border p-3" style={{ borderColor: 'var(--color-primary)', backgroundColor: 'color-mix(in srgb, var(--color-primary) 8%, white)' }}>
              <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
                Focus on size measurements.
              </p>
              <p className="mt-1 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                The drawing only shows where to measure. Compare the measurements in the chart with a piece you already own that fits you well.
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

function fitLabel(slug: string) {
  const words = String(slug || '').replace(/-/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
