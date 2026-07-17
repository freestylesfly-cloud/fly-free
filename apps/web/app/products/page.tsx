import { Suspense } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { Filter } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getProducts() {
  try {
    const response = await fetch(`${API_URL}/api/catalog/products`, {
      cache: 'revalidate',
      next: { revalidate: 60 },
    });

    if (!response.ok) throw new Error('Failed to fetch products');

    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    return { data: [] };
  }
}

export const metadata = {
  title: 'Shop | Fly Free - Custom T-Shirts & Streetwear',
  description: 'Browse our collection of custom t-shirts, streetwear, and apparel with multiple themes and sizes.',
};

function ProductGrid({ products }: { products: any[] }) {
  if (!products || products.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-ink/60 font-semibold">No products found</p>
        <p className="mt-2 text-ink/40">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product: any) => (
        <ProductCard
          key={product.id}
          id={product.id}
          name={product.name}
          price={product.basePrice}
          slug={product.slug}
          image={product.image}
          tag={product.collection?.name || 'New'}
        />
      ))}
    </div>
  );
}

export default async function ProductsPage() {
  const { data: products } = await getProducts();

  return (
    <main className="min-h-screen bg-white">
      {/* Page Header */}
      <section className="bg-gradient-to-b from-ink to-ink/90 text-white py-12">
        <div className="mx-auto max-w-7xl px-5">
          <h1 className="text-4xl md:text-5xl font-black mb-3">Shop All Products</h1>
          <p className="text-white/75 max-w-2xl">
            Explore our curated collection of premium t-shirts, streetwear, and custom apparel across multiple themes.
          </p>
        </div>
      </section>

      {/* Filters & Products */}
      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="flex flex-col gap-8">
          {/* Filter Bar */}
          <div className="flex items-center gap-4 pb-6 border-b border-black/10">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-black/10 hover:bg-black/5 font-semibold transition">
              <Filter size={18} />
              <span>Filters</span>
            </button>
            <p className="text-sm text-ink/60 ml-auto">
              Showing {products?.length || 0} products
            </p>
          </div>

          {/* Products Grid */}
          <Suspense fallback={<div className="text-center py-12">Loading products...</div>}>
            <ProductGrid products={products || []} />
          </Suspense>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-paper border-t border-black/10 py-16">
        <div className="mx-auto max-w-7xl px-5 text-center">
          <h2 className="text-3xl font-black mb-4">Create Your Custom Design</h2>
          <p className="text-ink/60 mb-8 max-w-2xl mx-auto">
            Can't find what you're looking for? Design your own custom t-shirt with our easy-to-use designer tool.
          </p>
          <a
            href="/designer"
            className="inline-block px-8 py-3 bg-coral text-white font-bold rounded-lg hover:opacity-90 transition"
          >
            Start Designing
          </a>
        </div>
      </section>
    </main>
  );
}
