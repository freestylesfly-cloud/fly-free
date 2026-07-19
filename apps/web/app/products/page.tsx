'use client';

import { ProductCard } from '../components/ProductCard';
import Link from 'next/link';
import { getApiBaseUrl } from '../lib/api';
import { useEffect, useState } from 'react';
import { Sparkles, Grid3x3, List, ArrowRight, Search } from 'lucide-react';

const API_URL = getApiBaseUrl();

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [filters, setFilters] = useState({ categories: [], themes: [], collections: [] });
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let url = `${API_URL}/catalog/products`;
        const params = new URLSearchParams();
        if (selectedCategory) params.append('category', selectedCategory);
        if (selectedTheme) params.append('theme', selectedTheme);
        if (searchQuery) params.append('q', searchQuery);
        if (params.toString()) url += `?${params.toString()}`;

        const [productsRes, filtersRes] = await Promise.all([
          fetch(url),
          fetch(`${API_URL}/catalog/filters`)
        ]);

        const productsData = await productsRes.json();
        setProducts(Array.isArray(productsData) ? productsData : productsData?.data || []);

        const filtersData = await filtersRes.json();
        setFilters(filtersData || { categories: [], themes: [], collections: [] });
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [selectedCategory, selectedTheme, searchQuery]);

  return (
    <main style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <style jsx>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .page-header {
          animation: fadeInDown 0.6s ease;
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
        }

        .filter-chip {
          animation: fadeInUp 0.6s ease;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .filter-chip:hover {
          transform: translateY(-2px);
        }

        .filter-chip.active {
          transform: scale(1.05);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .search-box {
          animation: fadeInUp 0.6s ease;
          animation-delay: 0.1s;
        }

        .products-section {
          animation: fadeInUp 0.6s ease;
          animation-delay: 0.2s;
        }

        .product-item {
          animation: fadeInUp 0.6s ease;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .product-item:hover {
          transform: translateY(-12px);
        }

        .empty-state {
          animation: fadeInUp 0.6s ease;
        }

        .view-toggle {
          display: flex;
          gap: 8px;
          animation: fadeInUp 0.6s ease;
          animation-delay: 0.15s;
        }

        .view-button {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-button.active {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }
      `}</style>

      {/* Page Header */}
      <section className="page-header text-white py-12 md:py-20">
        <div className="mx-auto max-w-7xl px-5">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles size={24} />
            <span className="text-sm font-bold uppercase">Explore Collection</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-4">Shop Premium Tees</h1>
          <p className="text-lg text-white/80 max-w-2xl">
            Curated streetwear from Fly Free. Browse by theme, category, or search for exactly what you want.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-5 py-12 md:py-16">
        <div className="space-y-8">
          {/* Search Bar */}
          <div className="search-box flex gap-3">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border transition"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                  borderWidth: '1px',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            <div className="view-toggle">
              <button
                onClick={() => setViewMode('grid')}
                className="view-button"
                style={viewMode === 'grid' ? { backgroundColor: 'var(--color-primary)', color: 'white', borderColor: 'var(--color-primary)' } : {}}
                title="Grid view"
              >
                <Grid3x3 size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="view-button"
                style={viewMode === 'list' ? { backgroundColor: 'var(--color-primary)', color: 'white', borderColor: 'var(--color-primary)' } : {}}
                title="List view"
              >
                <List size={18} />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-4 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
            {/* Category Filters */}
            <div>
              <h3 className="text-sm font-bold uppercase mb-3" style={{ color: 'var(--text-secondary)' }}>Category</h3>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`filter-chip px-4 py-2 rounded-lg font-semibold transition ${
                    !selectedCategory ? 'active' : ''
                  }`}
                  style={{
                    backgroundColor: !selectedCategory ? 'var(--color-primary)' : 'var(--bg-secondary)',
                    color: !selectedCategory ? 'white' : 'var(--text-primary)',
                    borderColor: 'var(--border-color)',
                    borderWidth: '1px'
                  }}
                >
                  All Products
                </button>
                {filters.categories.map((category: any) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.slug)}
                    className={`filter-chip px-4 py-2 rounded-lg font-semibold transition ${
                      selectedCategory === category.slug ? 'active' : ''
                    }`}
                    style={{
                      backgroundColor: selectedCategory === category.slug ? 'var(--color-primary)' : 'var(--bg-secondary)',
                      color: selectedCategory === category.slug ? 'white' : 'var(--text-primary)',
                      borderColor: 'var(--border-color)',
                      borderWidth: '1px'
                    }}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Filters */}
            <div>
              <h3 className="text-sm font-bold uppercase mb-3" style={{ color: 'var(--text-secondary)' }}>Themes</h3>
              <div className="flex gap-2 flex-wrap">
                {filters.themes.map((theme: any) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(selectedTheme === theme.slug ? '' : theme.slug)}
                    className={`filter-chip px-4 py-2 rounded-lg font-semibold transition text-white ${
                      selectedTheme === theme.slug ? 'active' : ''
                    }`}
                    style={{
                      background: selectedTheme === theme.slug
                        ? `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`
                        : `linear-gradient(135deg, ${theme.primaryColor}44, ${theme.secondaryColor}44)`
                    }}
                  >
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Count */}
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {loading ? 'Loading...' : `Showing ${products?.length || 0} products`}
            </p>
          </div>

          {/* Products Grid/List */}
          <div className="products-section">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 animate-spin" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <div className="w-8 h-8 rounded-full" style={{ borderTop: '2px solid var(--color-primary)', borderRight: '2px solid transparent' }}></div>
                  </div>
                  <p className="font-semibold">Loading products...</p>
                </div>
              </div>
            ) : products && products.length > 0 ? (
              <div className={viewMode === 'grid' ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'space-y-4'}>
                {products.map((product: any, idx: number) => (
                  <div
                    key={product.id}
                    className="product-item"
                    style={{ animationDelay: `${(idx % 8) * 0.05}s` }}
                  >
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      price={Math.round((product.price || 0) / 100)}
                      slug={product.slug}
                      image={product.images?.[0]?.url}
                      tag={product.theme?.name || product.category?.name || 'New'}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state py-20 text-center">
                <div className="mb-4">
                  <Sparkles size={48} style={{ color: 'var(--text-tertiary)', marginLeft: 'auto', marginRight: 'auto' }} />
                </div>
                <h3 className="text-2xl font-black mb-2">No products found</h3>
                <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                  Try adjusting your search or filters
                </p>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                >
                  View All Products <ArrowRight size={18} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {products.length > 0 && (
        <section className="py-16 md:py-20" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="mx-auto max-w-7xl px-5 text-center">
            <h2 className="text-4xl font-black mb-4">Can't find what you want?</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Design your own custom t-shirt with our easy-to-use designer tool
            </p>
            <Link
              href="/designer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all hover:shadow-lg"
              style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
            >
              Start Designing <ArrowRight size={20} />
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
