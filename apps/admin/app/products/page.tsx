'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Filter, Download } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  mrp: number;
  discountPercent: number;
  category: { name: string };
  collection: { name: string } | null;
  variants: any[];
  isFeatured: boolean;
  isTrending: boolean;
  createdAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: 0,
    mrp: 0,
    discountPercent: 0,
    categoryId: '',
    isFeatured: false,
    isTrending: false,
  });

  const itemsPerPage = 10;

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/admin/products?page=1&limit=50');
      const data = await response.json();
      setProducts(data.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setFormData({
          name: '',
          sku: '',
          description: '',
          price: 0,
          mrp: 0,
          discountPercent: 0,
          categoryId: '',
          isFeatured: false,
          isTrending: false,
        });
        fetchProducts();
      }
    } catch (error) {
      console.error('Failed to create product:', error);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const response = await fetch(`http://localhost:3001/api/admin/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setEditingProduct(null);
        setFormData({
          name: '',
          sku: '',
          description: '',
          price: 0,
          mrp: 0,
          discountPercent: 0,
          categoryId: '',
          isFeatured: false,
          isTrending: false,
        });
        fetchProducts();
      }
    } catch (error) {
      console.error('Failed to update product:', error);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShowDeleteConfirm(null);
        fetchProducts();
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterCategory === 'all' || product.category.name === filterCategory)
  );

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <ProtectedRoute>
      <DashboardLayout title="Products" subtitle="Manage">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-3 w-5 h-5 text-black/40" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral focus:ring-2 focus:ring-coral/30"
              />
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-coral text-white font-bold rounded-lg hover:bg-coral/90 transition-all"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral"
          >
            <option value="all">All Categories</option>
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Unisex">Unisex</option>
          </select>
        </div>

        {/* Products Table */}
        <div className="rounded-lg border border-black/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-black/5 border-b border-black/10">
                  <th className="px-6 py-4 text-left font-bold text-ink">Product</th>
                  <th className="px-6 py-4 text-left font-bold text-ink">SKU</th>
                  <th className="px-6 py-4 text-left font-bold text-ink">Price</th>
                  <th className="px-6 py-4 text-left font-bold text-ink">Category</th>
                  <th className="px-6 py-4 text-left font-bold text-ink">Discount</th>
                  <th className="px-6 py-4 text-left font-bold text-ink">Featured</th>
                  <th className="px-6 py-4 text-left font-bold text-ink">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-black/60">
                      Loading products...
                    </td>
                  </tr>
                ) : paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-black/60">
                      No products found
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product) => (
                    <tr key={product.id} className="border-b border-black/5 hover:bg-black/2 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-ink">{product.name}</p>
                          <p className="text-sm text-black/60">{product.category.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-black/60">{product.sku}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold">₹{product.price}</p>
                          <p className="text-sm text-black/60 line-through">₹{product.mrp}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{product.category.name}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-lg bg-mint/20 text-mint font-bold text-sm">
                          {product.discountPercent}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {product.isFeatured ? (
                          <span className="px-2 py-1 rounded-lg bg-coral/20 text-coral font-bold text-sm">Yes</span>
                        ) : (
                          <span className="text-black/40">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingProduct(product);
                              setFormData({
                                name: product.name,
                                sku: product.sku,
                                description: '',
                                price: product.price,
                                mrp: product.mrp,
                                discountPercent: product.discountPercent,
                                categoryId: '',
                                isFeatured: product.isFeatured,
                                isTrending: product.isTrending,
                              });
                              setShowCreateModal(true);
                            }}
                            className="p-2 hover:bg-black/5 rounded-lg transition text-ink"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(product.id)}
                            className="p-2 hover:bg-red-100 rounded-lg transition text-red-500"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-black/60">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-black/10 hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg font-bold transition ${
                      currentPage === page
                        ? 'bg-coral text-white'
                        : 'border border-black/10 hover:bg-black/5'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-black/10 hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-black/10 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-ink">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingProduct(null);
                }}
                className="text-black/60 hover:text-ink transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Product Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-2 px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral"
                  required
                />

                <input
                  type="text"
                  placeholder="SKU"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral"
                  required
                />

                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="unisex">Unisex</option>
                </select>

                <input
                  type="number"
                  placeholder="Price (₹)"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral"
                  required
                />

                <input
                  type="number"
                  placeholder="MRP (₹)"
                  value={formData.mrp}
                  onChange={(e) => setFormData({ ...formData, mrp: Number(e.target.value) })}
                  className="px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral"
                  required
                />

                <input
                  type="number"
                  placeholder="Discount %"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({ ...formData, discountPercent: Number(e.target.value) })}
                  className="px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral"
                />
              </div>

              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral"
                rows={4}
              />

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-bold text-ink">Featured Product</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isTrending}
                    onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-bold text-ink">Trending</span>
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-coral text-white font-bold rounded-lg hover:bg-coral/90 transition"
                >
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingProduct(null);
                  }}
                  className="flex-1 px-4 py-2 border border-black/10 text-ink font-bold rounded-lg hover:bg-black/5 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <h3 className="text-lg font-bold text-ink mb-4">Delete Product?</h3>
            <p className="text-black/60 mb-6">This action cannot be undone.</p>
            <div className="flex gap-4">
              <button
                onClick={() => handleDeleteProduct(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-black/10 text-ink font-bold rounded-lg hover:bg-black/5 transition"
              >
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
