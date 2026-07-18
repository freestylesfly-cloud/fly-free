'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Edit } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { apiService } from '../../services/api';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadProduct();
  }, [params.id]);

  async function loadProduct() {
    try {
      setLoading(true);
      setError('');
      setProduct(await apiService.getProduct(params.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Product Details" subtitle="Catalog">
        {loading ? <div className="rounded bg-white p-6">Loading product...</div> : error ? (
          <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
        ) : product ? (
          <div className="space-y-5">
            <div className="flex items-start justify-between rounded border border-black/10 bg-white p-5">
              <div>
                <h2 className="text-2xl font-black">{product.name}</h2>
                <p className="mt-1 text-black/60">{product.sku} · {product.category?.name || 'Uncategorized'}</p>
                <p className="mt-3 max-w-3xl">{product.description}</p>
              </div>
              <Link href={`/products/${product.id}/edit`} className="inline-flex items-center gap-2 rounded bg-coral px-4 py-2 font-bold text-white"><Edit size={18} /> Edit</Link>
            </div>

            <section className="rounded border border-black/10 bg-white p-5">
              <h3 className="font-black">Images By Color</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {(product.images || []).map((image: any) => (
                  <div key={image.id} className="rounded border border-black/10 p-3">
                    <div className="aspect-square overflow-hidden rounded bg-paper">
                      <img src={image.url} alt={image.alt || product.name} className="h-full w-full object-cover" />
                    </div>
                    <p className="mt-2 text-sm font-bold">{image.color || 'Default'}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded border border-black/10 bg-white p-5">
              <h3 className="font-black">Variants and Stock</h3>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black/5">
                    <tr><th className="p-3 text-left">SKU</th><th className="p-3 text-left">Color</th><th className="p-3 text-left">Size</th><th className="p-3 text-left">Price</th><th className="p-3 text-left">Stock</th></tr>
                  </thead>
                  <tbody>
                    {(product.variants || []).map((variant: any) => (
                      <tr key={variant.id} className="border-t border-black/5">
                        <td className="p-3">{variant.sku}</td>
                        <td className="p-3">{variant.color}</td>
                        <td className="p-3">{variant.size}</td>
                        <td className="p-3">{variant.price || product.price}</td>
                        <td className="p-3 font-bold">{variant.inventory?.stock || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : null}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
