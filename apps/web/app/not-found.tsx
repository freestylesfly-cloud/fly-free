import Link from 'next/link';
import { ArrowRight, Home, Search, ShoppingBag } from 'lucide-react';
import { getApiBaseUrl } from './lib/api';

interface Theme {
  id: string;
  name: string;
  slug: string;
  bannerImageUrl?: string;
  primaryColor?: string;
}

/**
 * A dead end should still offer a way forward, so pull the live themes and
 * offer them as routes back into the catalogue.
 */
async function getThemes(): Promise<Theme[]> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/cms/themes`, { cache: 'no-store' });
    if (!response.ok) return [];
    const data = await response.json();
    return (Array.isArray(data) ? data : data?.data ?? []).slice(0, 6);
  } catch {
    return [];
  }
}

export default async function NotFound() {
  const themes = await getThemes();

  return (
    <main
      className="flex min-h-[70vh] items-center justify-center px-5 py-16"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="w-full max-w-2xl text-center">
        <p
          className="text-sm font-black uppercase tracking-[0.3em]"
          style={{ color: 'var(--color-primary)' }}
        >
          Error 404
        </p>

        <h1
          className="mt-4 text-4xl font-black leading-tight sm:text-5xl"
          style={{ color: 'var(--text-primary)' }}
        >
          This page has gone off the rack
        </h1>

        <p className="mx-auto mt-4 max-w-md leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          The link may be old, or the product might have sold out and been retired. Everything below
          is still in stock.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-black text-white transition hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Home size={18} /> Home
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-lg border-2 px-6 py-3 font-black transition hover:opacity-70"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <ShoppingBag size={18} /> Shop all
          </Link>
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 rounded-lg border-2 px-6 py-3 font-black transition hover:opacity-70"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <Search size={18} /> My cart
          </Link>
        </div>

        {themes.length > 0 && (
          <div className="mt-12">
            <p
              className="mb-4 text-xs font-black uppercase tracking-wide"
              style={{ color: 'var(--text-secondary)' }}
            >
              Or jump into a drop
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {themes.map((theme) => (
                <Link
                  key={theme.id}
                  href={`/themes/${theme.slug}`}
                  className="group flex items-center justify-between gap-2 rounded-lg border-2 px-4 py-3 text-left font-bold transition hover:shadow-md"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <span className="truncate">{theme.name}</span>
                  <ArrowRight
                    size={16}
                    className="flex-shrink-0 transition group-hover:translate-x-0.5"
                    style={{ color: 'var(--color-primary)' }}
                  />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
