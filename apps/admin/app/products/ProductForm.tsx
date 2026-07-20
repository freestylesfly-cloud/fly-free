'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Save, Search, Trash2 } from 'lucide-react';
import { apiService } from '../services/api';
import { ImageUploadField } from '../components/ImageUploadField';

type Category = { id: string; name: string; slug: string };
type Theme = { id: string; name: string; slug: string; active?: boolean };
type ProductFormData = {
  name: string;
  slug: string;
  sku: string;
  description: string;
  gender: 'MEN' | 'WOMEN' | 'UNISEX';
  categoryId: string;
  themeId: string;
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

type HamperRow = {
  name: string;
  description: string;
  contentsText: string;
  imageUrl: string;
  sizeNote: string;
  price: number;
  gstPercent: number;
  isActive: boolean;
  priority: number;
};

const emptyForm: ProductFormData = {
  name: '',
  slug: '',
  sku: '',
  description: '',
  gender: 'UNISEX',
  categoryId: '',
  themeId: '',
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
  const [themes, setThemes] = useState<Theme[]>([]);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [images, setImages] = useState<ImageRow[]>([{ ...emptyImage }]);
  const [variants, setVariants] = useState<VariantRow[]>([{ ...emptyVariant }]);
  const [hampers, setHampers] = useState<HamperRow[]>([]);
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadBaseData();
  }, [productId]);

  async function loadBaseData() {
    try {
      setLoading(true);
      const [categoryResult, themeResult]: any[] = await Promise.all([
        apiService.getCategories(),
        apiService.getThemes()
      ]);
      setCategories(Array.isArray(categoryResult) ? categoryResult : categoryResult.data || []);
      setThemes(Array.isArray(themeResult) ? themeResult : themeResult.data || []);

      if (!productId) return;

      const product: any = await apiService.getProduct(productId);
      setForm({
        name: product.name || '',
        slug: product.slug || '',
        sku: product.sku || '',
        description: product.description || '',
        gender: product.gender || 'UNISEX',
        categoryId: product.categoryId || '',
        themeId: product.themeId || '',
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
      setHampers((product.hampers || []).map((hamper: any) => ({
        name: hamper.name || '',
        description: hamper.description || '',
        contentsText: Array.isArray(hamper.contents) ? hamper.contents.join(', ') : String(hamper.contents || ''),
        imageUrl: hamper.imageUrl || '',
        sizeNote: hamper.sizeNote || '',
        price: hamper.price || 0,
        gstPercent: hamper.gstPercent ?? 5,
        isActive: hamper.isActive ?? true,
        priority: hamper.priority || 0
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
        categoryId: form.categoryId || undefined,
        themeId: form.themeId || null,
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
          <SearchableSelect
            label="Product category"
            value={form.categoryId}
            placeholder="Search Men, Women, Unisex..."
            emptyLabel="Auto / Uncategorized"
            options={categories.map((category) => ({ value: category.id, label: category.name, hint: category.slug }))}
            onChange={(value) => setForm({ ...form, categoryId: value })}
          />
          <label className="grid gap-2 text-sm font-bold">
            Product type
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as ProductFormData['gender'] })} className="rounded border border-black/10 px-3 py-2">
              <option value="UNISEX">Unisex</option>
              <option value="MEN">Men</option>
              <option value="WOMEN">Women</option>
            </select>
          </label>
          <SearchableSelect
            label="Shop-by-theme campaign"
            value={form.themeId}
            placeholder="Search Puja, Bihu, Spider-Man..."
            emptyLabel="No campaign theme"
            options={themes.map((theme) => ({ value: theme.id, label: theme.name, hint: theme.active ? `${theme.slug} - active` : theme.slug }))}
            onChange={(value) => setForm({ ...form, themeId: value })}
          />
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
            <div key={index} className="grid gap-3 rounded border border-black/10 p-3 lg:grid-cols-[1fr_2fr_auto]">
              <div className="grid gap-3">
                <Field label="Color" value={image.color} onChange={(value) => updateImage(index, { color: value })} />
                <Field label="Alt" value={image.alt} onChange={(value) => updateImage(index, { alt: value })} />
              </div>
              <ImageUploadField
                label="Product image"
                value={image.url}
                onChange={(url) => updateImage(index, { url })}
                bucket="products"
                folder={form.slug || slugify(form.name || 'product')}
                aspect={4 / 5}
                alt={image.alt || form.name}
              />
              <button type="button" onClick={() => setImages(images.filter((_, i) => i !== index))} className="h-fit rounded border border-red-200 px-3 py-2 text-red-600"><Trash2 size={16} /></button>
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

function SearchableSelect({
  label,
  value,
  options,
  onChange,
  placeholder,
  emptyLabel
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string; hint?: string }>;
  onChange: (value: string) => void;
  placeholder: string;
  emptyLabel: string;
}) {
  const selected = options.find((option) => option.value === value);
  const [query, setQuery] = useState(selected?.label || '');
  const filtered = options
    .filter((option) => `${option.label} ${option.hint || ''}`.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8);

  useEffect(() => {
    setQuery(selected?.label || '');
  }, [selected?.label]);

  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-black/35" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (!event.target.value) onChange('');
          }}
          placeholder={placeholder}
          className="w-full rounded border border-black/10 py-2 pl-9 pr-3"
        />
        {query && query !== selected?.label && (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded border border-black/10 bg-white shadow-xl">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setQuery('');
              }}
              className="block w-full px-3 py-2 text-left text-sm font-bold hover:bg-black/5"
            >
              {emptyLabel}
            </button>
            {filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setQuery(option.label);
                }}
                className="block w-full px-3 py-2 text-left hover:bg-black/5"
              >
                <span className="block text-sm font-black">{option.label}</span>
                {option.hint && <span className="block text-xs text-black/45">{option.hint}</span>}
              </button>
            ))}
            {filtered.length === 0 && <p className="px-3 py-2 text-sm text-black/50">No match found</p>}
          </div>
        )}
      </div>
    </label>
  );
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}
