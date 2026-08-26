'use client';

import { useState } from 'react';
import { Check, Copy, Instagram, TicketPercent } from 'lucide-react';

export type InfluencerCode = {
  id: string;
  name: string;
  code: string;
  imageUrl?: string | null;
  socialHandle?: string | null;
  instagramUrl?: string | null;
  buyerDiscountPercent?: number | null;
};

export function InfluencerCodeCard({ influencer }: { influencer: InfluencerCode }) {
  const [copied, setCopied] = useState(false);
  const discount = influencer.buyerDiscountPercent || 10;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(influencer.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="group overflow-hidden rounded-lg border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl" style={{ borderColor: 'var(--border-color)' }}>
      <div className="relative aspect-[4/5] overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        {influencer.imageUrl ? (
          <img src={influencer.imageUrl} alt={influencer.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-6xl font-black" style={{ color: 'var(--color-primary)' }}>
            {influencer.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/0 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-black uppercase text-black shadow-lg">Creator</span>
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <h3 className="text-xl font-black uppercase leading-tight">{influencer.name}</h3>
          {influencer.socialHandle && <p className="mt-1 text-sm font-bold text-white/75">{influencer.socialHandle}</p>}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase" style={{ color: 'var(--text-tertiary)' }}>Use code</p>
            <p className="truncate text-xl font-black tracking-wide">{influencer.code}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-xs font-black text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
            <TicketPercent size={13} /> {discount}% OFF
          </span>
        </div>
        <div className="mt-3">
          <button type="button" onClick={copyCode} className="inline-flex w-full items-center justify-center gap-1 rounded border px-3 py-2 text-xs font-black uppercase transition hover:bg-black/5" style={{ borderColor: 'var(--border-color)' }}>
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        {influencer.instagramUrl && (
          <a href={influencer.instagramUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-black uppercase" style={{ color: 'var(--color-primary)' }}>
            <Instagram size={14} /> View creator
          </a>
        )}
      </div>
    </article>
  );
}
