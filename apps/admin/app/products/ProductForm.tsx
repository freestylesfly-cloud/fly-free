'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Save, Trash2 } from 'lucide-react';
import { apiService } from '../services/api';

type Category = { id: string; name: string; slug: string };
type ProductFormData = {
  name: string;
  slug: string;
  sku: string;
  description: string;
  gender: 'MEN' | 'WOMEN' | 'UNISEX';
  categoryId: string;
  price: number;
  mrp: number;
  discountPercent: number;
  gstPercent: number;
  material: string;
  washCare: string;
  tagsText: string;
  isVisible: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  isNewArrival: boolean;
  seoTitle: string;
  seoDescription: string;
};

type ImageRow = { color: string; url: string; alt: string; priority: number };
type VariantRow = {
  sku: string;
  color: string;
  size: string;
  price: number | '';
  stock: number;
  lowStockAlert: number;
  warehouse: string;
  barcode: string;
};

const emptyForm: ProductFormData = {
  name: '',
  slug: '',
  sku: '',
  description: '',
  gender: 'UNISEX',
  categoryId: '',
  price: 0,
  mrp: 0,
  discountPercent: 0,
  gstPercent: 5,
  material: '',
  washCare: '',
  tagsText: '',
  isVisible: true,
  isFeatured: false,
  isTrending: false,
  isNewArrival: false,
  seoTitle: '',
  seoDescription: ''
};

const emptyImage: ImageRow = { color: '', url: '', alt: '', priority: 0 };
const emptyVariant: VariantRow = {
  sku: '',
  color: '',
  size: 'M',
  price: '',
  stock: 0,
  lowStockAlert: 5,
  warehouse: '',
  barcode: ''
};

export function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [images, setImages] = useState<ImageRow[]>([{ ...emptyImage }]);
  const [variants, setVariants] = useState<VariantRow[]>([{ ...emptyVariant }]);
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadBaseData();
  }, [productId]);

  async function loadBaseData() {
    try {
      setLoading(true);
      const categoryResult: any = await apiService.getCategories();
      setCategories(Array.isArray(categoryResult) ? categoryResult : categoryResult.data || []);

      if (!productId) return;

      const product: any = await apiService.getProduct(productId);
      setForm({
        name: product.name || '',
        slug: product.slug || '',
        sku: product.sku || '',
        description: product.description || '',
        gender: product.gender || 'UNISEX',
        categoryId: product.categoryId || '',
        price: product.price || 0,
        mrp: product.mrp || 0,
        discountPercent: product.discountPercent || 0,
        gstPercent: product.gstPercent || 5,
        material: product.material || '',
        washCare: product.washCare || '',
        tagsText: (product.tags || []).join(', '),
        isVisible: product.isVisible ?? true,
        isFeatured: product.isFeatured ?? false,
        isTrending: product.isTrending ?? false,
        isNewArrival: product.isNewArrival ?? false,
        seoTitle: product.seoTitle || '',
        seoDescription: product.seoDescription || ''
      });
      setImages((product.images || []).map((image: any) => ({
        color: image.color || '',
        url: image.url || '',
        alt: image.alt || '',
        priority: image.priority || 0
      })));
      setVariants((product.variants || []).map((variant: any) => ({
        sku: variant.sku || '',
        color: variant.color || '',
        size: variant.size || '',
        price: variant.price || '',
        stock: variant.inventory?.stock || 0,
        lowStockAlert: variant.inventory?.lowStockAlert || 5,
        warehouse: variant.inventory?.warehouse || '',
        barcode: variant.inventory?.barcode || ''
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product form');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        ...form,
        slug: form.slug || slugify(form.name),
        tags: form.tagsText.split(',').map((tag) => tag.trim()).filter(Boolean),
        images: images.filter((image) => image.url.trim()).map((image, index) => ({ ...image, priority: image.priority || index })),
        variants: variants.filter((variant) => variant.sku && variant.color && variant.size)
      };

      if (productId) {
        await apiService.updateProduct(productId, payload);
      } else {
        await apiService.createProduct(payload);
      }

      router.push('/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="rounded border border-black/10 bg-white p-6 font-bold">Loading product...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

      <section className="rounded border border-black/10 bg-white p-5">
        <h3 className="text-lg font-black">Product Details</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
          <Field label="Slug" value={form.slug} onChange={(value) => setForm({ ...form, slug: value })} placeholder="auto-generated if empty" />
          <Field label="SKU" value={form.sku} onChange={(value) => setForm({ ...form, sku: value })} required />
          <label className="grid gap-2 text-sm font-bold">
            Category
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="rounded border border-black/10 px-3 py-2">
              <option value="">Auto / Uncategorized</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Gender
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as ProductFormData['gender'] })} className="rounded border border-black/10 px-3 py-2">
              <option value="UNISEX">Unisex</option>
              <option value="MEN">Men</option>
              <option value="WOMEN">Women</option>
            </select>
          </label>
          <Field label="Tags" value={form.tagsText} onChange={(value) => setForm({ ...form, tagsText: value })} placeholder="anime, oversized, assam" />
          <label className="grid gap-2 text-sm font-bold md:col-span-2">
            Description
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={5} className="rounded border border-black/10 px-3 py-2" />
          </label>
        </div>
      </section>

      <section className="rounded border border-black/10 bg-white p-5">
        <h3 className="text-lg font-black">Pricing</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <NumberField label="Price" value={form.price} onChange={(value) => setForm({ ...form, price: value })} />
          <NumberField label="MRP" value={form.mrp} onChange={(value) => setForm({ ...form, mrp: value })} />
          <NumberField label="Discount %" value={form.discountPercent} onChange={(value) => setForm({ ...form, discountPercent: value })} />
          <NumberField label="GST %" value={form.gstPercent} onChange={(value) => setForm({ ...form, gstPercent: value })} />
        </div>
      </section>

      <section className="rounded border border-black/10 bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black">Color Images</h3>
          <button type="button" onClick={() => setImages([...images, { ...emptyImage }])} className="inline-flex items-center gap-2 rounded bg-ink px-3 py-2 text-sm font-bold text-white"><Plus size={16} /> Add image</button>
        </div>
        <div className="mt-5 grid gap-3">
          {images.map((image, index) => (
            <div key={index} className="grid gap-3 rounded border border-black/10 p-3 md:grid-cols-[1fr_2fr_1fr_auto]">
              <Field label="Color" value={image.color} onChange={(value) => updateImage(index, { color: value })} />
              <Field label="Image URL" value={image.url} onChange={(value) => updateImage(index, { url: value })} />
              <Field label="Alt" value={image.alt} onChange={(value) => updateImage(index, { alt: value })} />
              <button type="button" onClick={() => setImages(images.filter((_, i) => i !== index))} className="mt-7 rounded border border-red-200 px-3 py-2 text-red-600"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded border border-black/10 bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black">Variants, Sizes, Stock</h3>
          <button type="button" onClick={() => setVariants([...variants, { ...emptyVariant }])} className="inline-flex items-center gap-2 rounded bg-ink px-3 py-2 text-sm font-bold text-white"><Plus size={16} /> Add variant</button>
        </div>
        <div className="mt-5 grid gap-3">
          {variants.map((variant, index) => (
            <div key={index} className="grid gap-3 rounded border border-black/10 p-3 md:grid-cols-4">
              <Field label="Variant SKU" value={variant.sku} onChange={(value) => updateVariant(index, { sku: value })} />
              <Field label="Color" value={variant.color} onChange={(value) => updateVariant(index, { color: value })} />
              <Field label="Size" value={variant.size} onChange={(value) => updateVariant(index, { size: value })} />
              <NumberField label="Stock" value={variant.stock} onChange={(value) => updateVariant(index, { stock: value })} />
              <NumberField label="Offer Price Override" value={variant.price || 0} onChange={(value) => updateVariant(index, { price: value || '' })} />
              <NumberField label="Low Stock Alert" value={variant.lowStockAlert} onChange={(value) => updateVariant(index, { lowStockAlert: value })} />
              <Field label="Warehouse" value={variant.warehouse} onChange={(value) => updateVariant(index, { warehouse: value })} />
              <button type="button" onClick={() => setVariants(variants.filter((_, i) => i !== index))} className="mt-7 rounded border border-red-200 px-3 py-2 text-red-600"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded border border-black/10 bg-white p-5">
        <h3 className="text-lg font-black">Visibility and SEO</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          {[
            ['isVisible', 'Visible'],
            ['isFeatured', 'Featured'],
            ['isTrending', 'Trending'],
            ['isNewArrival', 'New Arrival']
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 rounded border border-black/10 p-3 text-sm font-bold">
              <input type="checkbox" checked={Boolean(form[key as keyof ProductFormData])} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />
              {label}
            </label>
          ))}
          <Field label="Material" value={form.material} onChange={(value) => setForm({ ...form, material: value })} />
          <Field label="Wash Care" value={form.washCare} onChange={(value) => setForm({ ...form, washCare: value })} />
          <Field label="SEO Title" value={form.seoTitle} onChange={(value) => setForm({ ...form, seoTitle: value })} />
          <Field label="SEO Description" value={form.seoDescription} onChange={(value) => setForm({ ...form, seoDescription: value })} />
        </div>
      </section>

      <div className="sticky bottom-0 flex justify-end gap-3 border-t border-black/10 bg-paper py-4">
        <button type="button" onClick={() => router.push('/products')} className="rounded border border-black/10 px-5 py-3 font-bold">Cancel</button>
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded bg-coral px-5 py-3 font-bold text-white disabled:opacity-50"><Save size={18} /> {saving ? 'Saving...' : 'Save Product'}</button>
      </div>
    </form>
  );

  function updateImage(index: number, patch: Partial<ImageRow>) {
    setImages(images.map((image, i) => i === index ? { ...image, ...patch } : image));
  }

  function updateVariant(index: number, patch: Partial<VariantRow>) {
    setVariants(variants.map((variant, i) => i === index ? { ...variant, ...patch } : variant));
  }
}

function Field({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} className="rounded border border-black/10 px-3 py-2" />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="rounded border border-black/10 px-3 py-2" />
    </label>
  );
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}
