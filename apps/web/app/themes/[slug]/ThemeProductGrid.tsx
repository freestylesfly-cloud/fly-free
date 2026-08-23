'use client';

import { useMemo, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { ProductCard } from '../../components/ProductCard';

interface ThemeProduct {
  id: string;
  name: string;
  slug: string;
  price?: number;
  compareAtPrice?: number;
  images?: { url: string; alt?: string }[];
  variants?: Array<{
    id?: string;
    size?: string | null;
    color?: string | null;
    price?: number | null;
    inventory?: { stock?: number | null } | null;
  }>;
  category?: { name: string; slug: string };
}

const PRICE_BANDS = [
  { label: '₹500 – ₹799', min: 500, max: 799 },
  { label: '₹800 – ₹999', min: 800, max: 999 },
  { label: '₹1000+', min: 1000, max: Number.MAX_SAFE_INTEGER },
];

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A to Z' },
];

export function ThemeProductGrid({ products }: { products: ThemeProduct[] }) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedBands, setSelectedBands] = useState<string[]>([]);
  const [sort, setSort] = useState('featured');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const productTypes = useMemo(() => {
    const names = new Set<string>();
    products.forEach((p) => p.category?.name && names.add(p.category.name));
    return Array.from(names).sort();
  }, [products]);

  const rupees = (p: ThemeProduct) => Math.round((p.price || 0) / 100);

  const visible = useMemo(() => {
    let list = products;

    if (selectedTypes.length > 0) {
      list = list.filter((p) => p.category?.name && selectedTypes.includes(p.category.name));
    }

    if (selectedBands.length > 0) {
      list = list.filter((p) => {
        const price = rupees(p);
        return PRICE_BANDS.some(
          (band) => selectedBands.includes(band.label) && price >= band.min && price <= band.max
        );
      });
    }

    const sorted = [...list];
    if (sort === 'price-asc') sorted.sort((a, b) => rupees(a) - rupees(b));
    else if (sort === 'price-desc') sorted.sort((a, b) => rupees(b) - rupees(a));
    else if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));

    return sorted;
  }, [products, selectedTypes, selectedBands, sort]);

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const hasFilters = selectedTypes.length > 0 || selectedBands.length > 0;

  const filterPanel = (
    <div className="space-y-8">
      {productTypes.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-black uppercase tracking-wide">Product Type</h3>
          <div className="space-y-2">
            {productTypes.map((type) => (
              <label key={type} className="flex cursor-pointer items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type)}
                  onChange={() => toggle(selectedTypes, setSelectedTypes, type)}
                  className="h-4 w-4 cursor-pointer"
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                <span style={{ color: 'var(--text-secondary)' }}>{type}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-black uppercase tracking-wide">Price</h3>
        <div className="space-y-2">
          {PRICE_BANDS.map((band) => (
            <label key={band.label} className="flex cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={selectedBands.includes(band.label)}
                onChange={() => toggle(selectedBands, setSelectedBands, band.label)}
                className="h-4 w-4 cursor-pointer"
                style={{ accentColor: 'var(--color-primary)' }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>{band.label}</span>
            </label>
          ))}
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={() => {
            setSelectedTypes([]);
            setSelectedBands([]);
          }}
          className="text-sm font-bold underline"
          style={{ color: 'var(--color-primary)' }}
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-10 lg:flex-row">
      <aside className="hidden w-56 flex-shrink-0 lg:block">{filterPanel}</aside>

      <div className="flex-1">
        <div className="mb-6 flex items-center justify-between gap-4">
          <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
            Showing {visible.length} product{visible.length === 1 ? '' : 's'}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setFiltersOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold lg:hidden"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <SlidersHorizontal size={16} /> Filters
            </button>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm font-bold outline-none"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {visible.length === 0 ? (
          <div
            className="rounded-lg border p-12 text-center"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
          >
            <p className="font-bold">No products match these filters</p>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Try clearing a filter to see more from this theme.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                slug={product.slug}
                price={rupees(product)}
                originalPrice={product.compareAtPrice ? Math.round(product.compareAtPrice / 100) : undefined}
                image={product.images?.[0]?.url}
                hoverImage={product.images?.[1]?.url}
                images={product.images}
                variants={product.variants}
                tag={product.category?.name}
              />
            ))}
          </div>
        )}
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="flex-1 bg-black/50" onClick={() => setFiltersOpen(false)} />
          <div
            className="w-72 overflow-y-auto p-6"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-black">Filters</h2>
              <button onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                <X size={22} />
              </button>
            </div>
            {filterPanel}
          </div>
        </div>
      )}
    </div>
  );
}
