'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import type React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Check, ChevronDown, Grid3x3, List, Search, Shirt, SlidersHorizontal, Star, X } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { ProductCard } from '../components/ProductCard';
import { getApiBaseUrl } from '../lib/api';

const API_URL = getApiBaseUrl();

type FilterData = {
  categories: any[];
  themes: any[];
  collections: any[];
};

const genderOptions = [
  { slug: 'MEN', name: 'Men' },
  { slug: 'WOMEN', name: 'Women' },
  { slug: 'UNISEX', name: 'Unisex' },
];

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
  const [filterOpen, setFilterOpen] = useState(false);

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
          fetch(`${API_URL}/catalog/filters`, { cache: 'no-store' }),
        ]);

        const productsData = await productsResponse.json();
        const filtersData = await filtersResponse.json();
        setProducts(Array.isArray(productsData) ? productsData : productsData?.data || []);
        setFilters(filtersData || { categories: [], themes: [], collections: [] });
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = window.setTimeout(fetchData, 220);
    return () => window.clearTimeout(timer);
  }, [category, theme, collection, query, gender, minPrice, maxPrice, rating, sort]);

  const activeCount = useMemo(
    () => [category, theme, collection, query, gender, minPrice, maxPrice, rating].filter(Boolean).length,
    [category, theme, collection, query, gender, minPrice, maxPrice, rating]
  );

  const activeLabels = useMemo(() => {
    const labelFor = (items: any[], slug: string) => items.find((item) => item.slug === slug)?.name || slug;
    return [
      category && labelFor(filters.categories, category),
      theme && labelFor(filters.themes, theme),
      collection && labelFor(filters.collections, collection),
      gender && labelFor(genderOptions, gender),
      query && `"${query}"`,
      minPrice && `From ${formatCurrency(Number(minPrice))}`,
      maxPrice && `To ${formatCurrency(Number(maxPrice))}`,
      rating && `${rating}+ stars`,
    ].filter(Boolean) as string[];
  }, [category, collection, filters, gender, maxPrice, minPrice, query, rating, theme]);

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

  const filterPanel = (
    <FilterPanel
      filters={filters}
      category={category}
      setCategory={setCategory}
      gender={gender}
      setGender={setGender}
      theme={theme}
      setTheme={setTheme}
      collection={collection}
      setCollection={setCollection}
      minPrice={minPrice}
      setMinPrice={setMinPrice}
      maxPrice={maxPrice}
      setMaxPrice={setMaxPrice}
      rating={rating}
      setRating={setRating}
      clearFilters={clearFilters}
      activeCount={activeCount}
    />
  );

  return (
    <main className="min-h-screen pb-24 md:pb-0" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <section className="border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-7">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase" style={{ color: 'var(--text-secondary)' }}>
                <Link href="/" className="hover:underline">Home</Link>
                <span>/</span>
                <span>Shop</span>
              </div>
              <h1 className="mt-3 text-2xl font-black md:text-4xl">T-shirts for every mood</h1>
              <p className="mt-2 text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
                {loading ? 'Finding fresh drops...' : `${products.length} product${products.length === 1 ? '' : 's'} found`}
              </p>
            </div>
            <div className="hidden items-center gap-2 lg:flex">
              <SortSelect sort={sort} setSort={setSort} />
              <IconButton active={viewMode === 'grid'} label="Grid view" onClick={() => setViewMode('grid')} icon={<Grid3x3 size={18} />} />
              <IconButton active={viewMode === 'list'} label="List view" onClick={() => setViewMode('list')} icon={<List size={18} />} />
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <SearchBox value={query} onChange={setQuery} />
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded border px-4 py-3 text-sm font-black lg:hidden"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
            >
              <SlidersHorizontal size={17} /> Filters {activeCount > 0 && <span className="rounded-full px-2 py-0.5 text-xs text-white" style={{ backgroundColor: 'var(--color-primary)' }}>{activeCount}</span>}
            </button>
          </div>

          {activeLabels.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {activeLabels.map((label) => (
                <span key={label} className="rounded-full border px-3 py-1 text-xs font-bold" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>{label}</span>
              ))}
              <button type="button" onClick={clearFilters} className="rounded-full px-3 py-1 text-xs font-black text-white" style={{ backgroundColor: 'var(--color-primary)' }}>Clear</button>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:px-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-lg border p-4" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            {filterPanel}
          </div>
        </aside>

        <section className="min-w-0 space-y-5">
          <div className="hidden rounded-lg border p-3 lg:flex lg:items-center lg:justify-between" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
              {loading ? 'Loading...' : `Showing ${products.length} item${products.length === 1 ? '' : 's'}`}
            </p>
            <p className="text-xs font-black uppercase" style={{ color: 'var(--text-tertiary)' }}>Hover cards to switch product view</p>
          </div>

          {loading ? (
            <ProductLoadingGrid viewMode={viewMode} />
          ) : products.length > 0 ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4' : 'space-y-4'}>
              {products.map((product) => (
                viewMode === 'grid' ? (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={Math.round((product.price || 0) / 100)}
                    slug={product.slug}
                    image={product.images?.[0]?.url}
                    hoverImage={product.images?.[1]?.url}
                    tag={product.theme?.name || product.category?.name || 'New'}
                  />
                ) : (
                  <ProductListRow key={product.id} product={product} />
                )
              ))}
            </div>
          ) : (
            <div className="rounded-lg border px-5 py-16 text-center" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <Shirt className="mx-auto mb-4" size={46} style={{ color: 'var(--text-tertiary)' }} />
              <h3 className="text-2xl font-black">No products found</h3>
              <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Try removing a filter or searching another word.</p>
              <button type="button" onClick={clearFilters} className="mt-6 rounded px-5 py-3 font-black text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
                Reset filters
              </button>
            </div>
          )}
        </section>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t bg-white lg:hidden" style={{ borderColor: 'var(--border-color)' }}>
        <button type="button" onClick={() => setFilterOpen(true)} className="flex h-14 items-center justify-center gap-2 text-sm font-black">
          <SlidersHorizontal size={18} /> Filters
        </button>
        <button type="button" onClick={() => setFilterOpen(true)} className="flex h-14 items-center justify-center gap-2 border-l text-sm font-black" style={{ borderColor: 'var(--border-color)' }}>
          <List size={18} /> Sort by
        </button>
      </div>

      {filterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close filters" className="absolute inset-0 bg-black/50" onClick={() => setFilterOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-2xl bg-white shadow-2xl" style={{ color: 'var(--text-primary)' }}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-4" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <h2 className="text-lg font-black">Filter products</h2>
                <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{activeCount} active filters</p>
              </div>
              <button type="button" onClick={() => setFilterOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full border" style={{ borderColor: 'var(--border-color)' }} aria-label="Close filters">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-5 p-4">
              <SortSelect sort={sort} setSort={setSort} full />
              <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
              {filterPanel}
            </div>
            <div className="sticky bottom-0 grid grid-cols-[1fr_1.5fr] gap-3 border-t bg-white p-4" style={{ borderColor: 'var(--border-color)' }}>
              <button type="button" onClick={clearFilters} className="rounded border px-4 py-3 text-sm font-black" style={{ borderColor: 'var(--border-color)' }}>Clear</button>
              <button type="button" onClick={() => setFilterOpen(false)} className="rounded px-4 py-3 text-sm font-black text-white" style={{ backgroundColor: 'var(--color-primary)' }}>Show products</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function FilterPanel(props: {
  filters: FilterData;
  category: string;
  setCategory: (value: string) => void;
  gender: string;
  setGender: (value: string) => void;
  theme: string;
  setTheme: (value: string) => void;
  collection: string;
  setCollection: (value: string) => void;
  minPrice: string;
  setMinPrice: (value: string) => void;
  maxPrice: string;
  setMaxPrice: (value: string) => void;
  rating: string;
  setRating: (value: string) => void;
  clearFilters: () => void;
  activeCount: number;
}) {
  return (
    <div className="space-y-5">
      <div className="hidden items-center justify-between lg:flex">
        <div className="flex items-center gap-2 font-black"><SlidersHorizontal size={18} /> Filters</div>
        {props.activeCount > 0 && <span className="rounded-full px-2 py-1 text-xs font-black text-white" style={{ backgroundColor: 'var(--color-primary)' }}>{props.activeCount}</span>}
      </div>

      <FilterGroup label="Size">
        {['S', 'M', 'L', 'XL', 'XXL'].map((size) => <CheckRow key={size} label={size} active={false} onClick={() => {}} />)}
      </FilterGroup>

      <FilterGroup label="Category">
        <RadioRows value={props.category} onChange={props.setCategory} options={props.filters.categories} emptyLabel="All categories" />
      </FilterGroup>

      <FilterGroup label="Product type">
        <RadioRows value={props.gender} onChange={props.setGender} options={genderOptions} emptyLabel="All types" />
      </FilterGroup>

      <FilterGroup label="Shop theme">
        <RadioRows value={props.theme} onChange={props.setTheme} options={props.filters.themes} emptyLabel="All themes" />
      </FilterGroup>

      <FilterGroup label="Collection">
        <RadioRows value={props.collection} onChange={props.setCollection} options={props.filters.collections} emptyLabel="All collections" />
      </FilterGroup>

      <FilterGroup label="Price">
        <div className="grid grid-cols-2 gap-2">
          <input value={props.minPrice} onChange={(event) => props.setMinPrice(event.target.value)} type="number" min="0" placeholder="Min" className="w-full rounded border px-3 py-2 text-sm" style={fieldStyle} />
          <input value={props.maxPrice} onChange={(event) => props.setMaxPrice(event.target.value)} type="number" min="0" placeholder="Max" className="w-full rounded border px-3 py-2 text-sm" style={fieldStyle} />
        </div>
      </FilterGroup>

      <FilterGroup label="Rating">
        {[
          { slug: '', name: 'All ratings' },
          { slug: '4', name: '4 stars and up' },
          { slug: '3', name: '3 stars and up' },
          { slug: '2', name: '2 stars and up' },
        ].map((item) => <CheckRow key={item.name} label={item.name} active={props.rating === item.slug} onClick={() => props.setRating(item.slug)} />)}
      </FilterGroup>

      <button type="button" onClick={props.clearFilters} className="hidden w-full rounded border px-4 py-3 text-sm font-black lg:block" style={{ borderColor: 'var(--border-color)' }}>
        Clear all filters
      </button>
    </div>
  );
}

function SearchBox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search tees, drops, themes"
        className="h-12 w-full rounded border py-3 pl-12 pr-4 text-base font-bold outline-none transition focus:ring-2"
        style={fieldStyle}
      />
    </label>
  );
}

function SortSelect({ sort, setSort, full }: { sort: string; setSort: (value: string) => void; full?: boolean }) {
  return (
    <label className={full ? 'grid gap-2 text-sm font-black' : 'block'}>
      {full && <span>Sort by</span>}
      <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-10 rounded border px-3 text-sm font-bold" style={{ ...fieldStyle, width: full ? '100%' : undefined }}>
        <option value="newest">Newest first</option>
        <option value="popular">Popular</option>
        <option value="price-asc">Price low to high</option>
        <option value="price-desc">Price high to low</option>
        <option value="name-asc">Name A-Z</option>
        <option value="name-desc">Name Z-A</option>
      </select>
    </label>
  );
}

function ViewToggle({ viewMode, setViewMode }: { viewMode: 'grid' | 'list'; setViewMode: (value: 'grid' | 'list') => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <IconButton active={viewMode === 'grid'} label="Grid view" onClick={() => setViewMode('grid')} icon={<Grid3x3 size={18} />} />
      <IconButton active={viewMode === 'list'} label="List view" onClick={() => setViewMode('list')} icon={<List size={18} />} />
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="border-b pb-4 last:border-b-0" style={{ borderColor: 'var(--border-color)' }}>
      <button type="button" onClick={() => setOpen(!open)} className="mb-3 flex w-full items-center justify-between text-left text-sm font-black uppercase">
        {label}
        <ChevronDown className={open ? 'rotate-180 transition' : 'transition'} size={16} />
      </button>
      {open && <div className="space-y-2">{children}</div>}
    </section>
  );
}

function RadioRows({ value, onChange, options, emptyLabel }: { value: string; onChange: (value: string) => void; options: any[]; emptyLabel: string }) {
  return (
    <>
      <CheckRow label={emptyLabel} active={!value} onClick={() => onChange('')} />
      {options.map((item) => <CheckRow key={item.id || item.slug} label={item.name} active={value === item.slug} onClick={() => onChange(item.slug)} />)}
    </>
  );
}

function CheckRow({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-between gap-3 rounded px-2 py-1.5 text-left text-sm font-bold hover:bg-black/5">
      <span>{label}</span>
      <span className="flex h-4 w-4 items-center justify-center rounded border" style={{ borderColor: active ? 'var(--color-primary)' : 'var(--border-color)', backgroundColor: active ? 'var(--color-primary)' : 'transparent' }}>
        {active && <Check size={12} color="white" />}
      </span>
    </button>
  );
}

const fieldStyle = {
  borderColor: 'var(--border-color)',
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--text-primary)',
};

function IconButton({ active, label, icon, onClick }: { active: boolean; label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 min-w-10 items-center justify-center rounded border px-3"
      style={{
        borderColor: active ? 'var(--color-primary)' : 'var(--border-color)',
        backgroundColor: active ? 'var(--color-primary)' : 'var(--bg-primary)',
        color: active ? 'white' : 'var(--text-primary)',
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
    <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4' : 'space-y-4'}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
        <div key={item} className="rounded-lg border p-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <div className="aspect-[4/5] animate-pulse rounded bg-black/10" />
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
      className="grid gap-4 rounded-lg border p-3 transition hover:-translate-y-0.5 hover:shadow-lg sm:grid-cols-[150px_1fr_auto]"
      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
    >
      <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        {product.images?.[0]?.url ? (
          <>
            <img src={product.images[0].url} alt={product.name} className="h-full w-full object-cover" />
            {product.images?.[1]?.url && <img src={product.images[1].url} alt={`${product.name} alternate view`} className="absolute inset-0 h-full w-full object-cover opacity-0 transition hover:opacity-100" />}
          </>
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
        <span className="inline-flex items-center gap-2 rounded px-4 py-3 text-sm font-black text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
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
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="h-96 animate-pulse rounded-lg bg-black/10" />
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => <div key={item} className="aspect-[4/5] animate-pulse rounded-lg bg-black/10" />)}
          </div>
        </div>
      </section>
    </main>
  );
}
