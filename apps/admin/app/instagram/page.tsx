'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Edit2, Copy, Check, Play, Upload, Link as LinkIcon, FileVideo, ImageIcon, X } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ImageUploadField } from '../components/ImageUploadField';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useFetch } from '../hooks/useFetch';
import { apiService } from '../services/api';
import { uploadMedia } from '../lib/supabase';

interface InstagramPost {
  id: string;
  imageUrl?: string;
  videoUrl?: string;
  caption: string;
  instagramLink: string;
  displayOrder: number;
  products?: Product[];
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  sku?: string;
  price?: number;
}

const emptyForm = {
  imageUrl: '',
  videoUrl: '',
  caption: '',
  instagramLink: '',
  displayOrder: '1',
  productIds: [] as string[]
};

/** "https://www.instagram.com/flyfree.ne/" -> "@flyfree.ne". */
function instagramHandle(url: string) {
  try {
    const path = new URL(url).pathname.split('/').filter(Boolean)[0];
    return path ? `@${path}` : '';
  } catch {
    return '';
  }
}

export default function InstagramPage() {
  const { data: posts, loading, refetch } = useFetch<InstagramPost[]>(
    () => apiService.getInstagramPosts(),
    { skip: false }
  );

  // The store's own profile URL is a setting, not a constant — a new post
  // starts there so a link is never left pointing nowhere.
  const { data: settings } = useFetch<any>(() => apiService.getSettings(), { skip: false });
  const { data: productData } = useFetch<any>(() => apiService.getProducts({ page: 1, limit: 500 }), { skip: false });
  const profileUrl = String(settings?.socialLinks?.instagram || '').trim();
  const allProducts: Product[] = Array.isArray(productData?.data) ? productData.data : [];

  const [formData, setFormData] = useState(emptyForm);
  const [productSearch, setProductSearch] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  // Only ever fills a blank field, so it cannot stomp on what is being typed
  // or on the link of a post being edited.
  useEffect(() => {
    if (!profileUrl) return;
    setFormData((current) => (current.instagramLink ? current : { ...current, instagramLink: profileUrl }));
  }, [profileUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      if (editingId) {
        await apiService.updateInstagramPost(editingId, normalizeForm(formData));
        setMessage('Post updated successfully');
      } else {
        await apiService.createInstagramPost(normalizeForm(formData));
        setMessage('Post created successfully');
      }

      setFormData({ ...emptyForm, instagramLink: profileUrl });
      setEditingId(null);
      refetch();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save post');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this post?')) return;

    try {
      await apiService.deleteInstagramPost(id);
      setMessage('Post deleted successfully');
      refetch();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete post');
    }
  }

  function handleEdit(post: InstagramPost) {
    setFormData({
      imageUrl: post.imageUrl || '',
      videoUrl: post.videoUrl || '',
      caption: post.caption,
      instagramLink: post.instagramLink,
      displayOrder: String(post.displayOrder || 1),
      productIds: post.products?.map((product) => product.id) || []
    });
    setEditingId(post.id);
  }

  function toggleProduct(productId: string, checked: boolean) {
    setFormData((current) => ({
      ...current,
      productIds: checked
        ? Array.from(new Set([...current.productIds, productId]))
        : current.productIds.filter((id) => id !== productId)
    }));
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleVideoFile(file?: File) {
    setVideoError('');
    if (!file) return;
    if (!['video/mp4', 'video/webm'].includes(file.type)) {
      setVideoError('Use MP4 or WebM video.');
      return;
    }
    if (file.size > 80 * 1024 * 1024) {
      setVideoError('Video must be under 80MB.');
      return;
    }

    try {
      setVideoUploading(true);
      const url = await uploadMedia('product-images', file, 'instagram/videos');
      setFormData((current) => ({ ...current, videoUrl: url }));
    } catch (error) {
      setVideoError(error instanceof Error ? error.message : 'Video upload failed');
    } finally {
      setVideoUploading(false);
    }
  }

  const selectedProducts = allProducts.filter((product) => formData.productIds.includes(product.id));
  const filteredProducts = allProducts
    .filter((product) => {
      const query = productSearch.trim().toLowerCase();
      if (!query) return true;
      return product.name.toLowerCase().includes(query) || String(product.sku || '').toLowerCase().includes(query);
    })
    .slice(0, 40);

  return (
    <ProtectedRoute>
      <DashboardLayout title="Instagram Feed Manager" subtitle="Manage posts displayed on homepage">
        <div className="space-y-5">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-black/60 hover:text-ink">
            <ArrowLeft size={16} /> Back to dashboard
          </Link>

          {message && (
            <div className={`rounded border ${message.includes('success') ? 'bg-mint/15 text-ink' : 'bg-red-50 text-red-700'} border-black/10 p-4`}>
              {message}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Form */}
            <section className="rounded border border-black/10 bg-white p-5 shadow-sm lg:col-span-1">
              <div className="mb-4">
                <h2 className="text-lg font-black">{editingId ? 'Edit Post' : 'Add New Post'}</h2>
                <p className="mt-1 text-xs font-bold text-black/50">Upload a cover image, optional video, caption, and the Instagram link.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <ImageUploadField
                  label="Cover image"
                  value={formData.imageUrl}
                  onChange={(url) => setFormData((current) => ({ ...current, imageUrl: url }))}
                  bucket="product-images"
                  folder="instagram"
                  aspect={3 / 4}
                  targetWidth={900}
                  alt={formData.caption}
                  hint="Used as image post media and as the poster for videos."
                />

                <VideoUploadField
                  value={formData.videoUrl}
                  onChange={(url) => setFormData((current) => ({ ...current, videoUrl: url }))}
                  onPickFile={handleVideoFile}
                  uploading={videoUploading}
                  error={videoError}
                />

                <div className="rounded border border-black/10 bg-black/[0.02] p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <label className="text-sm font-black">Associated products</label>
                    <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-bold text-black/60">{formData.productIds.length} selected</span>
                  </div>

                  {selectedProducts.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {selectedProducts.map((product) => (
                        <button key={product.id} type="button" onClick={() => toggleProduct(product.id, false)} className="inline-flex items-center gap-1 rounded-full bg-coral/10 px-3 py-1 text-xs font-bold text-coral">
                          {product.name} <X size={12} />
                        </button>
                      ))}
                    </div>
                  )}

                  <input
                    type="text"
                    value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)}
                    placeholder="Search product to attach"
                    className="mb-3 w-full rounded border border-black/10 px-3 py-2 text-sm"
                  />

                  <div className="max-h-52 space-y-1 overflow-y-auto rounded border border-black/10 bg-white p-2">
                    {filteredProducts.length === 0 ? (
                      <p className="p-2 text-sm text-black/60">No products found</p>
                    ) : filteredProducts.map((product) => (
                      <label key={product.id} className="flex cursor-pointer items-center gap-3 rounded p-2 hover:bg-black/5">
                        <input type="checkbox" checked={formData.productIds.includes(product.id)} onChange={(event) => toggleProduct(product.id, event.target.checked)} className="h-4 w-4 rounded" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold">{product.name}</span>
                          <span className="text-xs text-black/55">{product.sku || 'No SKU'}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase">Caption</label>
                  <textarea
                    value={formData.caption}
                    onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                    placeholder="Post caption / description"
                    rows={3}
                    className="mt-1 w-full rounded border border-black/10 px-3 py-2 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase">Instagram Post Link</label>
                  <input
                    type="url"
                    value={formData.instagramLink}
                    onChange={(e) => setFormData({ ...formData, instagramLink: e.target.value })}
                    placeholder={profileUrl ? `${profileUrl.replace(/\/?$/, '/')}p/...` : 'https://www.instagram.com/<handle>/p/...'}
                    className="mt-1 w-full rounded border border-black/10 px-3 py-2 text-sm"
                    required
                  />
                  <p className="mt-1 text-xs text-black/60">
                    {profileUrl
                      ? `Link to the actual post. Leave the profile URL (${instagramHandle(profileUrl) || profileUrl}) if the post has no permalink yet.`
                      : 'Link to the actual post. Set your profile URL in Settings → Social links to have this prefilled.'}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase">Display Order</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                    min="1"
                    className="mt-1 w-full rounded border border-black/10 px-3 py-2 text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded bg-ink px-4 py-2 font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    <Plus size={16} className="inline mr-2" />
                    {editingId ? 'Update Post' : 'Add Post'}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setFormData({ ...emptyForm, instagramLink: profileUrl });
                      }}
                      className="rounded border border-black/10 px-4 py-2 font-bold hover:bg-black/5"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>

            {/* Posts List */}
            <section className="rounded border border-black/10 bg-white p-5 shadow-sm lg:col-span-2">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black">Posts ({posts?.length || 0})</h2>
                  <p className="mt-1 text-xs font-bold text-black/50">Sorted by display order. Videos show with controls on the community page.</p>
                </div>

                <div className="rounded bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">
                  MP4/WebM under 80MB
                </div>
              </div>

              {loading ? (
                <p className="text-black/60">Loading...</p>
              ) : !posts || posts.length === 0 ? (
                <p className="text-black/60">No posts yet. Add your first Instagram post above.</p>
              ) : (
                <div className="grid max-h-[680px] gap-4 overflow-y-auto pr-1 sm:grid-cols-2">
                  {posts.map((post) => (
                    <div key={post.id} className="overflow-hidden rounded border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                      <div className="relative aspect-[4/5] overflow-hidden bg-black/5">
                        {post.videoUrl ? (
                          <>
                            <video src={post.videoUrl} poster={post.imageUrl} className="h-full w-full object-cover" muted playsInline preload="metadata" controls />
                            <span className="absolute inset-0 grid place-items-center bg-black/20 text-white">
                              <Play size={34} fill="currentColor" />
                            </span>
                          </>
                        ) : post.imageUrl ? (
                          <img
                            src={post.imageUrl}
                            alt={post.caption}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="grid h-full w-full place-items-center text-xs font-black uppercase text-black/40">Post</span>
                        )}
                        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-[10px] font-black uppercase text-black">
                          {post.videoUrl ? <FileVideo size={12} /> : <ImageIcon size={12} />}
                          {post.videoUrl ? 'Video' : 'Image'}
                        </span>
                      </div>

                      <div className="p-3">
                        <p className="line-clamp-3 text-sm font-black leading-snug">{post.caption}</p>
                        <p className="mt-2 text-xs font-bold text-black/60">Display order: {post.displayOrder}</p>
                        {post.products && post.products.length > 0 && (
                          <p className="mt-1 line-clamp-2 text-xs font-bold text-coral">
                            Products: {post.products.map((product) => product.name).join(', ')}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-black/60 font-mono break-all">{post.instagramLink}</p>

                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => handleCopy(post.instagramLink, post.id)}
                            className="inline-flex flex-1 items-center justify-center gap-1 rounded border border-black/10 px-2 py-2 text-xs font-bold hover:bg-black/5"
                          >
                            {copied === post.id ? <Check size={14} /> : <Copy size={14} />} Copy
                          </button>
                          <button
                            onClick={() => handleEdit(post)}
                            className="inline-flex flex-1 items-center justify-center gap-1 rounded border border-black/10 px-2 py-2 text-xs font-bold text-ink hover:bg-black/5"
                          >
                            <Edit2 size={14} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="inline-flex items-center justify-center rounded border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                            aria-label="Delete post"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function VideoUploadField({
  value,
  onChange,
  onPickFile,
  uploading,
  error
}: {
  value: string;
  onChange: (url: string) => void;
  onPickFile: (file?: File) => void;
  uploading: boolean;
  error: string;
}) {
  return (
    <div className="space-y-2 rounded border border-black/10 bg-black/[0.02] p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <label className="text-sm font-black">Video</label>
          <p className="mt-1 text-xs font-bold text-black/50">MP4/WebM, 9:16 or 4:5 works best, under 80MB.</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded bg-blue-600 px-3 py-2 text-xs font-black text-white transition hover:-translate-y-0.5">
          <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload'}
          <input
            hidden
            type="file"
            accept="video/mp4,video/webm"
            disabled={uploading}
            onChange={(event) => {
              onPickFile(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
        </label>
      </div>

      {value && (
        <div className="relative overflow-hidden rounded border border-black/10 bg-black">
          <video src={value} className="aspect-[9/16] max-h-[360px] w-full object-cover" controls playsInline preload="metadata" />
        </div>
      )}

      <div className="relative">
        <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-black/35" />
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste video URL or upload from device"
          className="w-full rounded border border-black/10 py-2 pl-9 pr-3 text-sm"
        />
      </div>

      {value && (
        <button type="button" onClick={() => onChange('')} className="inline-flex items-center gap-2 rounded border border-black/10 px-3 py-2 text-xs font-bold hover:bg-white">
          <Trash2 size={14} /> Remove video
        </button>
      )}
      {error && <p className="text-xs font-bold text-red-600">{error}</p>}
    </div>
  );
}

function normalizeForm(formData: typeof emptyForm) {
  const displayOrder = Number.parseInt(formData.displayOrder, 10);
  return {
    ...formData,
    displayOrder: Number.isFinite(displayOrder) && displayOrder > 0 ? displayOrder : 1,
    productIds: formData.productIds
  };
}
