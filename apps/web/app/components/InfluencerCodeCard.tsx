'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

import {
  AtSign,
  Check,
  Copy,
  Facebook,
  Instagram,
  TicketPercent,
  Users,
  Youtube,
} from 'lucide-react';

export type InfluencerCode = {
  id: string;
  name: string;
  code: string;
  imageUrl?: string | null;
  socialHandle?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  xUrl?: string | null;
  youtubeUrl?: string | null;
  followers?: number | null;
  instagramFollowers?: number | null;
  facebookFollowers?: number | null;
  xFollowers?: number | null;
  youtubeFollowers?: number | null;
  buyerDiscountPercent?: number | null;
  products?: Array<{
    id: string;
    name: string;
    slug: string;
    price?: number | null;
    mrp?: number | null;
    images?: Array<{ url?: string | null }>;
  }>;
};

export function InfluencerCodeCard({
  influencer,
}: {
  influencer: InfluencerCode;
}) {
  const [copied, setCopied] = useState(false);

  const discount = influencer.buyerDiscountPercent || 10;

  const socialStats = [
    {
      key: 'instagram',
      label: 'Instagram',
      href: influencer.instagramUrl,
      count: influencer.instagramFollowers,
      icon: <Instagram size={13} />,
    },
    {
      key: 'facebook',
      label: 'Facebook',
      href: influencer.facebookUrl,
      count: influencer.facebookFollowers,
      icon: <Facebook size={13} />,
    },
    {
      key: 'x',
      label: 'X',
      href: influencer.xUrl,
      count: influencer.xFollowers,
      icon: <AtSign size={13} />,
    },
    {
      key: 'youtube',
      label: 'YouTube',
      href: influencer.youtubeUrl,
      count: influencer.youtubeFollowers,
      icon: <Youtube size={13} />,
    },
  ].filter(
    (item) =>
      Boolean(item.href) ||
      Number(item.count || 0) > 0,
  );

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(influencer.code);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{
        borderColor: 'var(--border-color)',
      }}
    >
      {/* IMAGE */}
      <div
        className="relative aspect-[4/4.6] overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-tertiary)',
        }}
      >
        {influencer.imageUrl ? (
          <img
            src={influencer.imageUrl}
            alt={influencer.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-5xl font-black"
            style={{
              color: 'var(--color-primary)',
            }}
          >
            {influencer.name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* IMAGE GRADIENT */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        {/* FOLLOWERS */}
        {Number(influencer.followers || 0) > 0 && (
          <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1.5 text-[9px] font-black uppercase text-white backdrop-blur-md">
            <Users size={10} />
            {shortCount(influencer.followers)}
          </div>
        )}

        {/* CREATOR NAME */}
        <div className="absolute inset-x-0 bottom-0 p-3.5">
          <h3 className="max-w-full text-base font-black uppercase leading-tight tracking-tight text-white sm:text-lg">
            {influencer.name}
          </h3>

          {influencer.socialHandle && (
            <p className="mt-1 text-[10px] font-medium text-white/70">
              {influencer.socialHandle}
            </p>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex flex-1 flex-col p-3">
        {/* SOCIAL STATS */}
        {socialStats.length > 0 && (
          <div className="grid grid-cols-4 gap-1.5">
            {socialStats.map((item) => (
              <SocialStat
                key={item.key}
                label={item.label}
                href={item.href || undefined}
                count={item.count}
                icon={item.icon}
              />
            ))}
          </div>
        )}

        {/* OFFER */}
        <div
          className="mt-3 flex items-center justify-between gap-2 rounded-lg px-3 py-2.5"
          style={{
            backgroundColor:
              'color-mix(in srgb, var(--color-primary) 8%, white)',
          }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white"
              style={{
                backgroundColor: 'var(--color-primary)',
              }}
            >
              <TicketPercent size={13} />
            </span>

            <div className="min-w-0">
              <p
                className="text-[8px] font-black uppercase tracking-widest"
                style={{
                  color: 'var(--text-secondary)',
                }}
              >
                Creator offer
              </p>

              <p
                className="mt-0.5 text-[11px] font-black uppercase"
                style={{
                  color: 'var(--text-primary)',
                }}
              >
                Save on your order
              </p>
            </div>
          </div>

          <span
            className="shrink-0 text-sm font-black"
            style={{
              color: 'var(--color-primary)',
            }}
          >
            {discount}% OFF
          </span>
        </div>

        {/* CODE */}
        <div className="mt-3">
          <p
            className="mb-1.5 text-[9px] font-black uppercase tracking-widest"
            style={{
              color: 'var(--text-secondary)',
            }}
          >
            Use creator code
          </p>

          <div
            className="flex overflow-hidden rounded-lg border-2 bg-white"
            style={{
              borderColor: 'var(--color-primary)',
            }}
          >
            <div className="flex min-w-0 flex-1 items-center px-3 py-2.5">
              <span
                className="block w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-black uppercase tracking-wider"
                style={{
                  color: 'var(--text-primary)',
                }}
                title={influencer.code}
              >
                {influencer.code}
              </span>
            </div>

            <button
              type="button"
              onClick={copyCode}
              aria-label={
                copied
                  ? 'Creator code copied'
                  : `Copy creator code ${influencer.code}`
              }
              title={copied ? 'Copied' : 'Copy code'}
              className="flex h-11 w-11 shrink-0 items-center justify-center text-white transition hover:opacity-90 active:scale-95"
              style={{
                backgroundColor: 'var(--color-primary)',
              }}
            >
              {copied ? (
                <Check size={16} />
              ) : (
                <Copy size={16} />
              )}
            </button>
          </div>

          <div className="mt-1.5 flex min-h-4 items-center justify-between">
            <p
              className="text-[9px] font-medium"
              style={{
                color: 'var(--text-secondary)',
              }}
            >
              Tap copy to use at checkout
            </p>

            {copied && (
              <span
                className="text-[9px] font-black uppercase"
                style={{
                  color: 'var(--color-primary)',
                }}
              >
                Copied ✓
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function SocialStat({
  label,
  href,
  count,
  icon,
}: {
  label: string;
  href?: string | null;
  count?: number | null;
  icon: ReactNode;
}) {
  const hasCount = Number(count || 0) > 0;

  const content = (
    <>
      <span
        className="flex items-center justify-center opacity-65"
        title={label}
      >
        {icon}
      </span>

      {hasCount && (
        <span className="mt-0.5 text-[9px] font-black">
          {shortCount(count)}
        </span>
      )}
    </>
  );

  const className =
    'flex min-h-10 flex-col items-center justify-center rounded-md border bg-black/[0.025] px-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white';

  const style = {
    borderColor: 'var(--border-light)',
    color: 'var(--text-primary)',
  };

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${label}${
          hasCount
            ? `, ${shortCount(count)} followers`
            : ''
        }`}
        title={label}
        className={className}
        style={style}
      >
        {content}
      </a>
    );
  }

  return (
    <div className={className} style={style}>
      {content}
    </div>
  );
}

function shortCount(value?: number | null) {
  const count = Number(value || 0);

  if (count >= 1_000_000) {
    return `${trimNumber(count / 1_000_000)}M`;
  }

  if (count >= 1_000) {
    return `${trimNumber(count / 1_000)}K`;
  }

  return count.toLocaleString('en-IN');
}

function trimNumber(value: number) {
  return value >= 10
    ? String(Math.round(value))
    : value.toFixed(1).replace(/\.0$/, '');
}