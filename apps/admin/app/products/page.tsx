'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Edit, Eye, EyeOff, Plus, Search, Trash2, X } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { formatRupees } from '../lib/money';
import { apiService } from '../services/api';

type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  mrp: number;
  discountPercent: number;
  category?: { id: string; name: string; productType?: { id: string; name: string } | null };
  theme?: { name: string; active?: boolean } | null;
  variants?: Array<{ inventory?: { stock: number } | null }>;
  images?: Array<{ url: string; color?: string | null }>;
  isVisible: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  isNewArrival?: boolean;
  /** Attachments that decide whether this product can be deleted at all. */
  _count?: { orderItems: number; wishlistItems: number; reviews: number };
};

type TypeOption = { id: string; name: string; categories: Array<{ id: string; name: string }> };
type Filters = { type: string; category: string; theme: string; status: string; stock: string; flag: string; sort: string; limit: string };

const FILTER_KEYS = ['type', 'category', 'theme', 'status', 'stock', 'flag', 'sort', 'limit'] as const;
const EMPTY_FILTERS: Filters = { type: '', category: '', theme: '', status: '', stock: '', flag: '', sort: '', limit: '10' };

const SORTS = [
  { value: '', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'updated', label: 'Recently edited' },
  { value: 'best-selling', label: 'Best selling' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
  { value: 'price', label: 'Price low–high' },
  { value: 'price-desc', label: 'Price high–low' },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [ready, setReady] = useState(false);
  const [types, setTypes] = useState<TypeOption[]>([]);
  const [themes, setThemes] = useState<Array<{ id: string; name: string }>>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Filters live in the URL, so a refresh or Back keeps the admin's view.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearchTerm(params.get('search') || '');
    const next = { ...EMPTY_FILTERS };
    FILTER_KEYS.forEach((key) => {
      if (params.get(key)) next[key] = params.get(key) as string;
    });
    setFilters(next);
    setCurrentPage(Number(params.get('page')) || 1);
    setReady(true);

    Promise.all([apiService.getProductTypes(), apiService.getThemes()])
      .then(([typeData, themeData]: any[]) => {
        setTypes(Array.isArray(typeData) ? typeData : typeData?.data || []);
        setThemes(Array.isArray(themeData) ? themeData : themeData?.data || []);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    FILTER_KEYS.forEach((key) => {
      if (filters[key] && filters[key] !== EMPTY_FILTERS[key]) params.set(key, filters[key]);
    });
    if (currentPage > 1) params.set('page', String(currentPage));
    const query = params.toString();
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
    // Typing waits a moment so each keystroke is not its own request.
    const timer = window.setTimeout(() => void fetchProducts(), searchTerm ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [ready, currentPage, searchTerm, filters]);

  function setFilter(key: keyof Filters, value: string) {
    setFilters((current) => ({
      ...current,
      [key]: value,
      // A style belongs to one type, so changing type clears the style.
      ...(key === 'type' ? { category: '' } : {}),
    }));
    setCurrentPage(1);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setSearchTerm('');
    setCurrentPage(1);
  }

  const styleOptions = filters.type
    ? types.find((type) => type.id === filters.type)?.categories || []
    : types.flatMap((type) => type.categories.map((style) => ({ ...style, name: `${style.name} (${type.name})` })));
  const activeFilterCount = FILTER_KEYS.filter((key) => key !== 'sort' && key !== 'limit' && filters[key]).length + (searchTerm ? 1 : 0);
  const pageSize = Number(filters.limit) || 10;
  const firstShown = total ? (currentPage - 1) * pageSize + 1 : 0;
  const lastShown = Math.min(total, currentPage * pageSize);

  async function fetchProducts() {
    try {
      setLoading(true);
      setError('');
      const result: any = await apiService.getProducts({
        page: currentPage,
        limit: pageSize,
        search: searchTerm || undefined,
        type: filters.type,
        category: filters.category,
        theme: filters.theme,
        status: filters.status,
        stock: filters.stock,
        flag: filters.flag,
        sort: filters.sort,
      });
      setProducts(result.data || []);
      setTotal(result.pagination?.total || 0);
      setTotalPages(result.pagination?.pages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
      setProducts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      setError('');
      const result = await apiService.deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      setNotice(result?.message || `"${deleteTarget.name}" was deleted.`);
      await fetchProducts();
    } catch (err) {
      // The API explains *why* — a product in past orders, or one another admin
      // already removed. Show that sentence rather than "HTTP 500".
      setError(err instanceof Error ? err.message : 'Failed to delete product');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  async function toggleVisibility(product: Product) {
    try {
      setTogglingId(product.id);
      setError('');
      const result = await apiService.setProductVisibility(product.id, !product.isVisible);
      setProducts((current) =>
        current.map((item) => (item.id === product.id ? { ...item, isVisible: !product.isVisible } : item))
      );
      setNotice(result?.message || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change product status');
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Products" subtitle="Catalog">
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-3 h-5 w-5 text-black/40" />
              <input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search name, SKU, style or theme..."
                className="w-full rounded border border-black/10 py-2 pl-10 pr-3"
              />
            </div>
            <Link href="/products/new" className="inline-flex items-center justify-center gap-2 rounded bg-coral px-4 py-2 font-bold text-white">
              <Plus size={18} /> Create Product
            </Link>
          </div>

          <div className="rounded border border-black/10 bg-white p-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
              <FilterSelect label="Type" value={filters.type} onChange={(value) => setFilter('type', value)} options={types.map((type) => ({ value: type.id, label: type.name }))} />
              <FilterSelect label="Style" value={filters.category} onChange={(value) => setFilter('category', value)} options={styleOptions.map((style) => ({ value: style.id, label: style.name }))} />
              <FilterSelect
                label="Theme"
                value={filters.theme}
                onChange={(value) => setFilter('theme', value)}
                options={[{ value: 'none', label: 'No theme' }, ...themes.map((theme) => ({ value: theme.id, label: theme.name }))]}
              />
              <FilterSelect label="Status" value={filters.status} onChange={(value) => setFilter('status', value)} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
              <FilterSelect label="Stock" value={filters.stock} onChange={(value) => setFilter('stock', value)} options={[{ value: 'in', label: 'In stock' }, { value: 'out', label: 'Out of stock' }]} />
              <FilterSelect
                label="Flag"
                value={filters.flag}
                onChange={(value) => setFilter('flag', value)}
                options={[
                  { value: 'featured', label: 'Featured' },
                  { value: 'trending', label: 'Trending' },
                  { value: 'new', label: 'New arrival' },
                  { value: 'sold', label: 'Has orders' },
                ]}
              />
              <FilterSelect label="Sort" value={filters.sort} onChange={(value) => setFilter('sort', value)} options={SORTS.slice(1)} emptyLabel={SORTS[0].label} />
              <FilterSelect label="Per page" value={filters.limit} onChange={(value) => setFilter('limit', value || '10')} options={['25', '50', '100'].map((n) => ({ value: n, label: n }))} emptyLabel="10" emptyValue="10" />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="font-bold text-black/60">
                {loading ? 'Loading…' : total ? `Showing ${firstShown}–${lastShown} of ${total} product${total === 1 ? '' : 's'}` : 'No matching products'}
              </p>
              {activeFilterCount > 0 && (
                <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 rounded border border-black/10 px-2 py-1 font-bold hover:bg-black/5">
                  <X size={14} /> Clear {activeFilterCount} filter{activeFilterCount === 1 ? '' : 's'}
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-start justify-between gap-4 rounded border border-red-200 bg-red-50 p-4 text-red-700">
              <p className="font-bold">{error}</p>
              <button onClick={() => setError('')} className="shrink-0 text-sm font-bold underline">Dismiss</button>
            </div>
          )}

          {notice && (
            <div className="flex items-start justify-between gap-4 rounded border border-green-200 bg-green-50 p-4 text-green-800">
              <p className="font-bold">{notice}</p>
              <button onClick={() => setNotice('')} className="shrink-0 text-sm font-bold underline">Dismiss</button>
            </div>
          )}

          <div className="overflow-hidden rounded border border-black/10 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black/5">
                  <tr>
                    <th className="px-5 py-3 text-left">Product</th>
                    <th className="px-5 py-3 text-left">Theme</th>
                    <th className="px-5 py-3 text-left">Type / Style</th>
                    <th className="px-5 py-3 text-left">SKU</th>
                    <th className="px-5 py-3 text-left">Price</th>
                    <th className="px-5 py-3 text-left">Variants</th>
                    <th className="px-5 py-3 text-left">Stock</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Flags</th>
                    <th className="px-5 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={10} className="px-5 py-8 text-center text-black/60">Loading products...</td></tr>
                  ) : products.length === 0 ? (
                    <tr><td colSpan={10} className="px-5 py-8 text-center text-black/60">{activeFilterCount ? 'No products match these filters.' : 'No products yet.'}</td></tr>
                  ) : products.map((product) => {
                    const stock = (product.variants || []).reduce((sum, variant) => sum + (variant.inventory?.stock || 0), 0);
                    const ordered = product._count?.orderItems || 0;
                    return (
                      <tr key={product.id} className="border-t border-black/5">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-14 w-11 shrink-0 overflow-hidden rounded bg-black/5">
                              {product.images?.[0]?.url && <img src={thumb(product.images[0].url)} alt="" loading="lazy" className="h-full w-full object-cover" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-black">{product.name}</p>
                              <p className="text-sm text-black/50">{product.category?.name || 'No style'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {product.theme ? (
                            <span className="rounded bg-black/[0.04] px-2 py-1 text-xs font-black">
                              {product.theme.name}{product.theme.active ? ' · Active' : ''}
                            </span>
                          ) : (
                            <span className="text-sm text-black/45">No campaign</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm">
                          <p className="font-bold">{product.category?.productType?.name || '—'}</p>
                          <p className="text-black/50">{product.category?.name || 'No style'}</p>
                        </td>
                        <td className="px-5 py-4 text-sm">{product.sku}</td>
                        <td className="px-5 py-4">
                          <p className="font-bold">{formatRupees(product.price)}</p>
                          {product.mrp > product.price && (
                            <p className="text-xs text-black/45 line-through">{formatRupees(product.mrp)}</p>
                          )}
                        </td>
                        <td className="px-5 py-4">{product.variants?.length || 0}</td>
                        <td className="px-5 py-4">
                          <span className={stock > 0 ? 'font-bold text-green-700' : 'font-bold text-red-600'}>{stock}</span>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => toggleVisibility(product)}
                            disabled={togglingId === product.id}
                            title={product.isVisible ? 'Click to deactivate (hide from the store)' : 'Click to activate (show in the store)'}
                            className={`inline-flex items-center gap-2 rounded px-2 py-1 text-xs font-black disabled:opacity-50 ${
                              product.isVisible
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-black/10 text-black/60 hover:bg-black/20'
                            }`}
                          >
                            {product.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                            {togglingId === product.id ? 'Saving...' : product.isVisible ? 'Active' : 'Inactive'}
                          </button>
                          {ordered > 0 && (
                            <p className="mt-1 text-[11px] font-bold text-black/45">In {ordered} order line{ordered === 1 ? '' : 's'}</p>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs font-bold">
                          {product.isFeatured && <span className="mr-2 rounded bg-coral/10 px-2 py-1 text-coral">Featured</span>}
                          {product.isTrending && <span className="mr-2 rounded bg-green-100 px-2 py-1 text-green-700">Trending</span>}
                          {product.isNewArrival && <span className="rounded bg-amber-100 px-2 py-1 text-amber-800">New</span>}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <Link href={`/products/${product.id}`} className="rounded p-2 hover:bg-black/5" title="View"><Eye size={18} /></Link>
                            <Link href={`/products/${product.id}/edit`} className="rounded p-2 hover:bg-black/5" title="Edit"><Edit size={18} /></Link>
                            <button
                              onClick={() => setDeleteTarget(product)}
                              className="rounded p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-black/25 disabled:hover:bg-transparent"
                              disabled={ordered > 0}
                              title={ordered > 0 ? 'Sold products cannot be deleted — deactivate instead' : 'Delete'}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between rounded border border-black/10 bg-white p-3">
              <span className="text-sm font-bold">Page {currentPage} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="rounded border px-3 py-2 disabled:opacity-40">Previous</button>
                <button onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="rounded border px-3 py-2 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>

        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded bg-white p-6">
              <h3 className="text-lg font-black">Delete &ldquo;{deleteTarget.name}&rdquo;?</h3>
              <p className="mt-2 text-sm text-black/60">
                This permanently removes its images, variants and stock rows. It cannot be undone.
              </p>

              {/* Named up front, because deleting takes these with it. */}
              {((deleteTarget._count?.wishlistItems || 0) > 0 || (deleteTarget._count?.reviews || 0) > 0) && (
                <ul className="mt-3 space-y-1 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  {(deleteTarget._count?.wishlistItems || 0) > 0 && (
                    <li>
                      Removed from {deleteTarget._count?.wishlistItems} customer wishlist
                      {deleteTarget._count?.wishlistItems === 1 ? '' : 's'}.
                    </li>
                  )}
                  {(deleteTarget._count?.reviews || 0) > 0 && (
                    <li>
                      {deleteTarget._count?.reviews} review{deleteTarget._count?.reviews === 1 ? '' : 's'} will be deleted.
                    </li>
                  )}
                  <li className="font-bold">To keep them, set the product to Inactive instead.</li>
                </ul>
              )}

              <div className="mt-5 flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 rounded bg-red-600 px-4 py-2 font-bold text-white disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => {
                    void toggleVisibility(deleteTarget);
                    setDeleteTarget(null);
                  }}
                  disabled={deleting || !deleteTarget.isVisible}
                  className="flex-1 rounded border border-black/10 px-4 py-2 font-bold disabled:opacity-40"
                >
                  Deactivate
                </button>
                <button onClick={() => setDeleteTarget(null)} className="rounded border border-black/10 px-4 py-2 font-bold">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  emptyLabel = 'All',
  emptyValue = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  emptyLabel?: string;
  emptyValue?: string;
}) {
  const active = value && value !== emptyValue;
  return (
    <label className="grid gap-1 text-xs font-bold text-black/55">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`rounded border px-2 py-2 text-sm font-bold text-black ${active ? 'border-coral bg-coral/5' : 'border-black/10'}`}
      >
        <option value={emptyValue}>{emptyLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Small Cloudinary rendition for list thumbnails; other hosts are used as-is. */
function thumb(url: string) {
  return url.includes('res.cloudinary.com/') ? url.replace('/upload/', '/upload/w_96,h_120,c_fill,f_auto,q_auto/') : url;
}
