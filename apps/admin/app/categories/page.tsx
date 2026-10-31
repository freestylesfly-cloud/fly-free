'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Edit3, Eye, EyeOff, ImageIcon, Plus, Save, Shirt, Trash2, X, ExternalLink } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ImageUploadField } from '../components/ImageUploadField';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { apiService } from '../services/api';

/** Storefront base for "View in shop" links (same variable and default as the web app). */
const SHOP_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://flyfree.co.in').replace(/\/$/, '');

/**
 * Product types and their styles.
 *
 * A type is what the product is (T-Shirts, Hoodies, Socks, Caps) and owns the
 * size list shoppers choose from. A style sits under a type (Regular /
 * Oversized / Polo for T-Shirts) and is what each product is assigned to. The
 * storefront menu is built from this: a type appears once it has a visible
 * product, so new types can be prepared here before launch.
 */

type Style = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  priority: number;
  productTypeId?: string | null;
  productCount?: number;
};

type ProductType = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  sizes: string[];
  priority: number;
  isActive: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  categories: Style[];
  productCount?: number;
};

const emptyType = {
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
  sizes: 'S, M, L, XL, XXL',
  priority: 0,
  isActive: true,
  seoTitle: '',
  seoDescription: ''
};

const emptyStyle = { name: '', slug: '', imageUrl: '', priority: 0, productTypeId: '' };

type Editing = { kind: 'type'; id: string | null } | { kind: 'style'; id: string | null };

export default function TypesAndStylesPage() {
  const [types, setTypes] = useState<ProductType[]>([]);
  const [unassigned, setUnassigned] = useState<Style[]>([]);
  const [editing, setEditing] = useState<Editing>({ kind: 'type', id: null });
  const [typeForm, setTypeForm] = useState(emptyType);
  const [styleForm, setStyleForm] = useState(emptyStyle);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError('');
      const [typeResponse, styleResponse]: any[] = await Promise.all([apiService.getProductTypes(), apiService.getCategories()]);
      const typeList: ProductType[] = Array.isArray(typeResponse) ? typeResponse : typeResponse?.data || [];
      const styleList: Style[] = Array.isArray(styleResponse) ? styleResponse : styleResponse?.data || [];
      setTypes(typeList);
      setUnassigned(styleList.filter((style) => !style.productTypeId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product types');
    } finally {
      setLoading(false);
    }
  }

  function done(message: string) {
    setNotice(message);
    setEditing({ kind: 'type', id: null });
    setTypeForm(emptyType);
    setStyleForm(emptyStyle);
    void load();
  }

  async function saveType(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const payload = {
        ...typeForm,
        slug: typeForm.slug || slugify(typeForm.name),
        sizes: typeForm.sizes.split(',').map((size) => size.trim()).filter(Boolean),
        priority: Number(typeForm.priority || 0)
      };
      if (editing.id) await apiService.updateProductType(editing.id, payload);
      else await apiService.createProductType(payload);
      done(editing.id ? 'Product type saved.' : 'Product type created. Add its styles next.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product type');
    } finally {
      setSaving(false);
    }
  }

  async function saveStyle(event: React.FormEvent) {
    event.preventDefault();
    if (!styleForm.productTypeId) {
      setError('Choose which product type this style belongs to.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const payload = {
        ...styleForm,
        slug: styleForm.slug || slugify(styleForm.name),
        imageUrl: styleForm.imageUrl || null,
        priority: Number(styleForm.priority || 0)
      };
      if (editing.id) await apiService.updateCategory(editing.id, payload);
      else await apiService.createCategory(payload);
      done(editing.id ? 'Style saved.' : 'Style created. Products can use it now.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save style');
    } finally {
      setSaving(false);
    }
  }

  async function removeType(type: ProductType) {
    if (!window.confirm(`Delete "${type.name}" and its empty styles?`)) return;
    try {
      setError('');
      await apiService.deleteProductType(type.id);
      done('Product type deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product type');
    }
  }

  async function removeStyle(style: Style) {
    if (!window.confirm(`Delete the "${style.name}" style?`)) return;
    try {
      setError('');
      await apiService.deleteCategory(style.id);
      done('Style deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete style');
    }
  }

  async function toggleType(type: ProductType) {
    try {
      await apiService.updateProductType(type.id, { isActive: !type.isActive });
      done(type.isActive ? `${type.name} hidden from the shop.` : `${type.name} can show in the shop again.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product type');
    }
  }

  function editType(type: ProductType | null) {
    setNotice('');
    setEditing({ kind: 'type', id: type?.id || null });
    setTypeForm(
      type
        ? {
            name: type.name,
            slug: type.slug,
            description: type.description || '',
            imageUrl: type.imageUrl || '',
            sizes: (type.sizes || []).join(', '),
            priority: type.priority || 0,
            isActive: type.isActive,
            seoTitle: type.seoTitle || '',
            seoDescription: type.seoDescription || ''
          }
        : emptyType
    );
  }

  function editStyle(style: Style | null, typeId = '') {
    setNotice('');
    setEditing({ kind: 'style', id: style?.id || null });
    setStyleForm(
      style
        ? {
            name: style.name,
            slug: style.slug,
            imageUrl: style.imageUrl || '',
            priority: style.priority || 0,
            productTypeId: style.productTypeId || typeId
          }
        : { ...emptyStyle, productTypeId: typeId }
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Types & styles" subtitle="What you sell (T-Shirts, Hoodies, Socks, Caps), their styles, and the sizes each one comes in">
        <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
          <section className="space-y-4">
            {error && <div className="rounded border border-red-200 bg-red-50 p-4 font-bold text-red-700">{error}</div>}
            {notice && <div className="rounded border border-green-200 bg-green-50 p-4 font-bold text-green-800">{notice}</div>}

            <div className="flex flex-wrap gap-2">
              <button onClick={() => editType(null)} className="inline-flex items-center gap-2 rounded bg-ink px-4 py-2 text-sm font-black text-white">
                <Plus size={16} /> New product type
              </button>
              <p className="self-center text-xs font-bold text-black/50">
                A type shows in the shop menu once it has a visible product.
              </p>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded bg-black/5" />)}
              </div>
            ) : (
              types.map((type) => (
                <article key={type.id} className="overflow-hidden rounded border border-black/10 bg-white">
                  <header className="flex flex-wrap items-start justify-between gap-3 border-b border-black/10 p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded border border-black/10 bg-black/[0.03]">
                        {type.imageUrl ? <img src={type.imageUrl} alt={type.name} className="h-full w-full object-cover" /> : <Shirt className="text-black/35" size={22} />}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-black">{type.name}</h2>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                              !type.isActive ? 'bg-black/5 text-black/50' : type.productCount ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {!type.isActive ? 'Hidden' : type.productCount ? 'In the shop' : 'Ready — add products'}
                          </span>
                        </div>
                        <p className="flex flex-wrap items-center gap-x-2 text-xs font-bold text-black/50">
                          /{type.slug} · {type.productCount || 0} product{type.productCount === 1 ? '' : 's'}
                          {type.isActive && (type.productCount || 0) > 0 && (
                            <ShopLink href={`${SHOP_URL}/products?type=${type.slug}`} />
                          )}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(type.sizes || []).length ? (
                            type.sizes.map((size) => (
                              <span key={size} className="rounded border border-black/15 px-2 py-0.5 text-xs font-black">
                                {size}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs font-bold text-red-600">No sizes yet</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => toggleType(type)} className="inline-flex items-center gap-1 rounded border border-black/10 px-3 py-2 text-xs font-bold" title={type.isActive ? 'Hide from shop' : 'Allow in shop'}>
                        {type.isActive ? <EyeOff size={14} /> : <Eye size={14} />} {type.isActive ? 'Hide' : 'Show'}
                      </button>
                      <button onClick={() => editType(type)} className="inline-flex items-center gap-1 rounded border border-black/10 px-3 py-2 text-xs font-bold">
                        <Edit3 size={14} /> Edit
                      </button>
                      <button onClick={() => removeType(type)} className="rounded border border-red-200 px-2 py-2 text-red-600" aria-label={`Delete ${type.name}`}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </header>

                  <div className="divide-y divide-black/5">
                    {type.categories.map((style) => (
                      <div key={style.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center overflow-hidden rounded border border-black/10 bg-black/[0.03]">
                            {style.imageUrl ? <img src={style.imageUrl} alt={style.name} className="h-full w-full object-cover" /> : <ImageIcon size={16} className="text-black/30" />}
                          </div>
                          <div>
                            <p className="text-sm font-black">{style.name}</p>
                            <p className="flex flex-wrap items-center gap-x-2 text-xs font-bold text-black/45">
                              /{style.slug} · {style.productCount || 0} product{style.productCount === 1 ? '' : 's'}
                              {type.isActive && (style.productCount || 0) > 0 && (
                                <ShopLink href={`${SHOP_URL}/products?type=${type.slug}&category=${style.slug}`} />
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => editStyle(style)} className="rounded border border-black/10 px-2.5 py-1.5 text-xs font-bold">
                            Edit
                          </button>
                          <button onClick={() => removeStyle(style)} className="rounded border border-red-200 px-2 py-1.5 text-red-600" aria-label={`Delete ${style.name}`}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => editStyle(null, type.id)} className="flex w-full items-center gap-2 px-4 py-3 text-left text-xs font-black text-coral hover:bg-black/[0.02]">
                      <Plus size={14} /> Add a {type.name.replace(/s$/, '').toLowerCase()} style
                    </button>
                  </div>
                </article>
              ))
            )}

            {unassigned.length > 0 && (
              <article className="rounded border border-amber-200 bg-amber-50 p-4">
                <h2 className="font-black text-amber-900">Styles without a type</h2>
                <p className="text-xs font-bold text-amber-800">Give each one a type so it appears in the right place in the shop menu.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {unassigned.map((style) => (
                    <button key={style.id} onClick={() => editStyle(style)} className="rounded border border-amber-300 bg-white px-3 py-1.5 text-xs font-black">
                      {style.name} — assign type
                    </button>
                  ))}
                </div>
              </article>
            )}
          </section>

          {editing.kind === 'type' ? (
            <form onSubmit={saveType} className="h-fit space-y-3 rounded border border-black/10 bg-white p-5">
              <PanelHeader title={editing.id ? 'Edit product type' : 'New product type'} hint="For example Hoodies, Socks or Caps." onClose={editing.id ? () => editType(null) : undefined} />
              <Field label="Name" value={typeForm.name} onChange={(value) => setTypeForm({ ...typeForm, name: value })} required placeholder="Hoodies" />
              <Field label="Slug (web address)" value={typeForm.slug} onChange={(value) => setTypeForm({ ...typeForm, slug: value })} placeholder="auto from name" />
              <Field
                label="Sizes, in order (comma separated)"
                value={typeForm.sizes}
                onChange={(value) => setTypeForm({ ...typeForm, sizes: value })}
                placeholder="S, M, L, XL, XXL  or  Free size"
              />
              <p className="-mt-1 text-xs text-black/50">The product form offers exactly these sizes, and the shop lists them in this order.</p>
              <Field label="Short description" value={typeForm.description} onChange={(value) => setTypeForm({ ...typeForm, description: value })} />
              <ImageUploadField
                label="Menu image"
                value={typeForm.imageUrl}
                onChange={(value) => setTypeForm((current) => ({ ...current, imageUrl: value }))}
                bucket="product-images"
                folder={`types/${typeForm.slug || slugify(typeForm.name) || 'general'}`}
                aspect={1}
                targetWidth={800}
                alt={typeForm.name}
                hint="Square picture used in the shop menu."
              />
              <Field label="SEO title (optional)" value={typeForm.seoTitle} onChange={(value) => setTypeForm({ ...typeForm, seoTitle: value })} placeholder="Hoodies for men and women | Fly Free" />
              <Field label="SEO description (optional)" value={typeForm.seoDescription} onChange={(value) => setTypeForm({ ...typeForm, seoDescription: value })} />
              <NumberField label="Menu order" value={typeForm.priority} onChange={(value) => setTypeForm({ ...typeForm, priority: value })} />
              <label className="flex items-center gap-2 text-sm font-bold">
                <input type="checkbox" checked={typeForm.isActive} onChange={(event) => setTypeForm({ ...typeForm, isActive: event.target.checked })} />
                Show in the shop once it has products
              </label>
              <SaveButton saving={saving} label={editing.id ? 'Save type' : 'Create type'} />
            </form>
          ) : (
            <form onSubmit={saveStyle} className="h-fit space-y-3 rounded border border-black/10 bg-white p-5">
              <PanelHeader title={editing.id ? 'Edit style' : 'New style'} hint="For example Pullover for Hoodies, Ankle for Socks." onClose={() => editType(null)} />
              <label className="grid gap-2 text-sm font-bold">
                Product type
                <select
                  value={styleForm.productTypeId}
                  onChange={(event) => setStyleForm({ ...styleForm, productTypeId: event.target.value })}
                  required
                  className="rounded border border-black/10 px-3 py-2"
                >
                  <option value="">Choose a type…</option>
                  {types.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </label>
              <Field label="Style name" value={styleForm.name} onChange={(value) => setStyleForm({ ...styleForm, name: value })} required placeholder="Oversized" />
              <Field label="Slug (web address)" value={styleForm.slug} onChange={(value) => setStyleForm({ ...styleForm, slug: value })} placeholder="auto from name" />
              <ImageUploadField
                label="Style image"
                value={styleForm.imageUrl}
                onChange={(value) => setStyleForm((current) => ({ ...current, imageUrl: value }))}
                bucket="product-images"
                folder={`categories/${styleForm.slug || slugify(styleForm.name) || 'general'}`}
                aspect={1}
                targetWidth={800}
                alt={styleForm.name}
                hint="Square tile used in the shop menu."
              />
              <NumberField label="Order within the type" value={styleForm.priority} onChange={(value) => setStyleForm({ ...styleForm, priority: value })} />
              <SaveButton saving={saving} label={editing.id ? 'Save style' : 'Create style'} />
            </form>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function PanelHeader({ title, hint, onClose }: { title: string; hint: string; onClose?: () => void }) {
  return (
    <div className="mb-2 flex items-start justify-between gap-3">
      <div>
        <h2 className="font-black">{title}</h2>
        <p className="text-sm text-black/55">{hint}</p>
      </div>
      {onClose && (
        <button type="button" onClick={onClose} className="rounded p-2 hover:bg-black/5" aria-label="Close">
          <X size={18} />
        </button>
      )}
    </div>
  );
}

function SaveButton({ saving, label }: { saving: boolean; label: string }) {
  return (
    <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded bg-coral px-4 py-3 font-black text-white disabled:opacity-50">
      <Save size={18} /> {saving ? 'Saving...' : label}
    </button>
  );
}

function Field({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} className="rounded border border-black/10 px-3 py-2" />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value || 0))} className="rounded border border-black/10 px-3 py-2" />
    </label>
  );
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

function ShopLink({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-coral hover:underline">
      View in shop <ExternalLink size={12} />
    </a>
  );
}
