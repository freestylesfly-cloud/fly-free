'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getApiBaseUrl } from '../lib/api';

interface SizeRow {
  id: string;
  size: string;
  chest: string;
  shoulder: string;
  length: string;
  sleeve: string;
}

export default function SizeGuideDrawer({
  open,
  onClose,
  content,
}: {
  open: boolean;
  onClose: () => void;
  /** Optional prose shown above the table, managed via the CMS size-chart page. */
  content?: string;
}) {
  const [rows, setRows] = useState<SizeRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Measurements live in the SizeGuide table so admin edits show up here.
  useEffect(() => {
    if (!open || rows.length > 0) return;

    let cancelled = false;
    setLoading(true);

    fetch(`${getApiBaseUrl()}/cms/size-guides`)
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        if (cancelled) return;
        setRows(Array.isArray(data) ? data : data?.data ?? []);
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
  }, [open, rows.length]);

  if (!open) return null;

  return (
    <div>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <aside
        className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto shadow-xl"
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

        <div className="space-y-5 p-4">
          {content && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {content}
            </p>
          )}

          {loading ? (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Loading measurements...
            </p>
          ) : rows.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Size measurements have not been published yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}>
                    <th className="p-2 text-left">Size</th>
                    <th className="p-2 text-right">Chest</th>
                    <th className="p-2 text-right">Shoulder</th>
                    <th className="p-2 text-right">Length</th>
                    <th className="p-2 text-right">Sleeve</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                      <td className="p-2 font-black" style={{ color: 'var(--text-primary)' }}>{row.size}</td>
                      <td className="p-2 text-right" style={{ color: 'var(--text-secondary)' }}>{row.chest}</td>
                      <td className="p-2 text-right" style={{ color: 'var(--text-secondary)' }}>{row.shoulder}</td>
                      <td className="p-2 text-right" style={{ color: 'var(--text-secondary)' }}>{row.length}</td>
                      <td className="p-2 text-right" style={{ color: 'var(--text-secondary)' }}>{row.sleeve}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div>
            <h4 className="font-black" style={{ color: 'var(--text-primary)' }}>How to measure</h4>
            <ol className="mt-2 list-inside list-decimal space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <li>Chest — around the fullest part, tape level and parallel to the ground.</li>
              <li>Shoulder — straight across the back, seam to seam.</li>
              <li>Length — from the highest shoulder point down to the hem.</li>
              <li>Sleeve — from the shoulder seam to the sleeve opening.</li>
            </ol>
          </div>
        </div>
      </aside>
    </div>
  );
}
