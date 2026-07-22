'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import type React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Grid3x3, List, Search, Shirt, SlidersHorizontal, Star } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { ProductCard } from '../components/ProductCard';
import { getApiBaseUrl } from '../lib/api';

const API_URL = getApiBaseUrl();

type FilterData = {
  categories: any[];
  themes: any[];
  collections: any[];
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsSkeleton />}>
      <ProductsBrowser />
    </Suspense>
  );
}

function ProductsBrowser() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [filters, setFilters] = useState<FilterData>({ categories: [], themes: [], collections: [] });
  const [category, setCategory] = useState('');
  const [theme, setTheme] = useState('');
  const [collection, setCollection] = useState('');
  const [query, setQuery] = useState('');
  const [gender, setGender] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [rating, setRating] = useState('');
  const [sort, setSort] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCategory(searchParams.get('category') || '');
    setTheme(searchParams.get('theme') || '');
    setCollection(searchParams.get('collection') || '');
    setQuery(searchParams.get('q') || '');
    setGender(searchParams.get('gender') || '');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setRating(searchParams.get('rating') || '');
    setSort(searchParams.get('sort') || 'newest');
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category) params.set('category', category);
        if (theme) params.set('theme', theme);
        if (collection) params.set('collection', collection);
        if (query) params.set('q', query);
        if (gender) params.set('gender', gender);
        if (minPrice) params.set('minPrice', minPrice);
        if (maxPrice) params.set('maxPrice', maxPrice);
        if (rating) params.set('rating', rating);
        if (sort) params.set('sort', sort);

        const [productsResponse, filtersResponse] = await Promise.all([
          fetch(`${API_URL}/catalog/products?${params.toString()}`, { cache: 'no-store' }),
          fetch(`${API_URL}/catalog/filters`, { cache: 'no-store' })
        ]);

        const productsData = await productsResponse.json();
        const filtersData = await filtersResponse.json();
        setProducts(Array.isArray(productsData) ? productsData : productsData?.data || []);
        setFilters(filtersData || { categories: [], themes: [], collections: [] });
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = window.setTimeout(fetchData, 250);
    return () => window.clearTimeout(timer);
  }, [category, theme, collection, query, gender, minPrice, maxPrice, rating, sort]);

  const activeCount = useMemo(
    () => [category, theme, collection, query, gender, minPrice, maxPrice, rating].filter(Boolean).length,
    [category, theme, collection, query, gender, minPrice, maxPrice, rating]
  );

  function clearFilters() {
    setCategory('');
    setTheme('');
    setCollection('');
    setQuery('');
    setGender('');
    setMinPrice('');
    setMaxPrice('');
    setRating('');
    setSort('newest');
  }

  return (
    <main style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <section className="border-b" style={{ borderColor: 'var(--border-color)', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
        <div className="mx-auto max-w-7xl px-5 py-10 text-white md:py-14">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-white/75">Fly Free Shop</p>
              <h1 className="mt-2 text-4xl font-black md:text-6xl">Search and Filter Products</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/80">
                Find products by category, type, shop theme, collection, price, rating, or name.
              </p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-black backdrop-blur">
              {loading ? 'Loading products' : `${products.length} result${products.length === 1 ? '' : 's'}`}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[290px_1fr] lg:py-10">
        <aside className="h-fit rounded-2xl border p-4 lg:sticky lg:top-28" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-black">
              <SlidersHorizontal size={18} /> Filters
            </div>
            {activeCount > 0 && <span className="rounded-full px-2 py-1 text-xs font-black text-white" style={{ backgroundColor: 'var(--color-primary)' }}>{activeCount}</span>}
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase" style={{ color: 'var(--text-secondary)' }}>Search</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, tag, theme..." className="w-full rounded border py-2 pl-9 pr-3 text-sm" style={fieldStyle} />
              </div>
            </label>

            <Select label="Category" value={category} onChange={setCategory} options={filters.categories} empty="All categories" />
            <Select label="Product type" value={gender} onChange={setGender} options={[{ slug: 'MEN', name: 'Men' }, { slug: 'WOMEN', name: 'Women' }, { slug: 'UNISEX', name: 'Unisex' }]} empty="All types" />
            <Select label="Shop theme" value={theme} onChange={setTheme} options={filters.themes} empty="All shop themes" />
            <Select label="Collection" value={collection} onChange={setCollection} options={filters.collections} empty="All collections" />

            <div>
              <span className="mb-2 block text-xs font-black uppercase" style={{ color: 'var(--text-secondary)' }}>Price</span>
              <div className="grid grid-cols-2 gap-2">
                <input value={minPrice} onChange={(event) => setMinPrice(event.target.value)} type="number" min="0" placeholder="Min" className="w-full rounded border px-3 py-2 text-sm" style={fieldStyle} />
                <input value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} type="number" min="0" placeholder="Max" className="w-full rounded border px-3 py-2 text-sm" style={fieldStyle} />
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase" style={{ color: 'var(--text-secondary)' }}>Rating</span>
              <select value={rating} onChange={(event) => setRating(event.target.value)} className="w-full rounded border px-3 py-2 text-sm font-bold" style={fieldStyle}>
                <option value="">All ratings</option>
                <option value="4">4 stars and up</option>
                <option value="3">3 stars and up</option>
                <option value="2">2 stars and up</option>
              </select>
            </label>

            <button onClick={clearFilters} className="w-full rounded border px-4 py-2 text-sm font-black" style={{ borderColor: 'var(--border-color)' }}>
              Clear all
            </button>
          </div>
        </aside>

        <section className="min-w-0 space-y-5">
          <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-black">Products</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {loading ? 'Loading...' : `Showing ${products.length} item${products.length === 1 ? '' : 's'}`}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded border px-3 py-2 text-sm font-bold" style={fieldStyle}>
                  <option value="newest">Newest first</option>
                  <option value="popular">Popular</option>
                  <option value="price-asc">Price low to high</option>
                  <option value="price-desc">Price high to low</option>
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <IconButton active={viewMode === 'grid'} label="Grid view" onClick={() => setViewMode('grid')} icon={<Grid3x3 size={18} />} />
                  <IconButton active={viewMode === 'list'} label="List view" onClick={() => setViewMode('list')} icon={<List size={18} />} />
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <ProductLoadingGrid viewMode={viewMode} />
          ) : products.length > 0 ? (
            <div className={viewMode === 'grid' ? 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}>
              {products.map((product) => (
                viewMode === 'grid' ? (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={Math.round((product.price || 0) / 100)}
                    slug={product.slug}
                    image={product.images?.[0]?.url}
                    tag={product.theme?.name || product.category?.name || 'New'}
                  />
                ) : (
                  <ProductListRow key={product.id} product={product} />
                )
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border px-5 py-16 text-center" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <Shirt className="mx-auto mb-4" size={46} style={{ color: 'var(--text-tertiary)' }} />
              <h3 className="text-2xl font-black">No products found</h3>
              <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Try removing a filter or searching another word.</p>
              <button onClick={clearFilters} className="mt-6 rounded px-5 py-3 font-black text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
                Reset filters
              </button>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

const fieldStyle = {
  borderColor: 'var(--border-color)',
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--text-primary)'
};

function Select({ label, value, onChange, options, empty }: { label: string; value: string; onChange: (value: string) => void; options: any[]; empty: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded border px-3 py-2 text-sm font-bold" style={fieldStyle}>
        <option value="">{empty}</option>
        {options.map((item) => (
          <option key={item.id || item.slug} value={item.slug}>{item.name}</option>
        ))}
      </select>
    </label>
  );
}

function IconButton({ active, label, icon, onClick }: { active: boolean; label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex h-10 min-w-10 items-center justify-center rounded border px-3"
      style={{
        borderColor: active ? 'var(--color-primary)' : 'var(--border-color)',
        backgroundColor: active ? 'var(--color-primary)' : 'var(--bg-primary)',
        color: active ? 'white' : 'var(--text-primary)'
      }}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}

function ProductLoadingGrid({ viewMode }: { viewMode: 'grid' | 'list' }) {
  return (
    <div className={viewMode === 'grid' ? 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}>
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div key={item} className="rounded-2xl border p-4" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <div className="aspect-[4/5] animate-pulse rounded-xl bg-black/10" />
          <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-black/10" />
          <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-black/10" />
        </div>
      ))}
    </div>
  );
}

function ProductListRow({ product }: { product: any }) {
  const price = Math.round((product.price || 0) / 100);
  const mrp = Math.round((product.mrp || 0) / 100);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="grid gap-4 rounded-2xl border p-3 transition hover:-translate-y-0.5 hover:shadow-lg sm:grid-cols-[150px_1fr_auto]"
      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
    >
      <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        {product.images?.[0]?.url ? (
          <img src={product.images[0].url} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <Shirt size={42} style={{ color: 'var(--text-tertiary)' }} />
        )}
      </div>
      <div className="min-w-0 py-1">
        <div className="flex flex-wrap gap-2">
          {product.theme?.name && <span className="rounded-full px-3 py-1 text-xs font-black text-white" style={{ backgroundColor: 'var(--color-primary)' }}>{product.theme.name}</span>}
          {product.category?.name && <span className="rounded-full px-3 py-1 text-xs font-black" style={{ backgroundColor: 'var(--bg-tertiary)' }}>{product.category.name}</span>}
          {product.gender && <span className="rounded-full px-3 py-1 text-xs font-black" style={{ backgroundColor: 'var(--bg-tertiary)' }}>{product.gender}</span>}
        </div>
        <h2 className="mt-3 text-xl font-black">{product.name}</h2>
        <p className="mt-2 line-clamp-2 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{product.description}</p>
        <div className="mt-3 flex items-center gap-1 text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
          <Star size={15} fill="currentColor" /> {product.reviews?.length ? `${product.reviews.length} reviews` : 'New drop'}
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
        <div className="text-right">
          <p className="text-xl font-black">{formatCurrency(price)}</p>
          {mrp > price && <p className="text-sm line-through" style={{ color: 'var(--text-tertiary)' }}>{formatCurrency(mrp)}</p>}
        </div>
        <span className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
          View <ArrowRight size={16} />
        </span>
      </div>
    </Link>
  );
}

function ProductsSkeleton() {
  return (
    <main style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <section className="mx-auto max-w-7xl px-5 py-16">
        <div className="mb-8 h-12 w-64 animate-pulse rounded bg-black/10" />
        <div className="grid gap-6 lg:grid-cols-[290px_1fr]">
          <div className="h-96 animate-pulse rounded-2xl bg-black/10" />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => <div key={item} className="aspect-[4/5] animate-pulse rounded-2xl bg-black/10" />)}
          </div>
        </div>
      </section>
    </main>
  );
}
