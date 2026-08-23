'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Edit2, Copy, Check } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ImageUploadField } from '../components/ImageUploadField';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useFetch } from '../hooks/useFetch';
import { apiService } from '../services/api';

interface InstagramPost {
  id: string;
  imageUrl?: string;
  videoUrl?: string;
  caption: string;
  instagramLink: string;
  displayOrder: number;
  createdAt: string;
}

const emptyForm = {
  imageUrl: '',
  videoUrl: '',
  caption: '',
  instagramLink: '',
  displayOrder: '1'
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
  const profileUrl = String(settings?.socialLinks?.instagram || '').trim();

  const [formData, setFormData] = useState(emptyForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
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
      displayOrder: String(post.displayOrder || 1)
    });
    setEditingId(post.id);
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

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
            <section className="rounded border border-black/10 bg-white p-5 lg:col-span-1">
              <h2 className="mb-4 text-lg font-black">{editingId ? 'Edit Post' : 'Add New Post'}</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <ImageUploadField
                  label="Image"
                  value={formData.imageUrl}
                  onChange={(url) => setFormData((current) => ({ ...current, imageUrl: url }))}
                  bucket="product-images"
                  folder="instagram"
                  aspect={3 / 4}
                  targetWidth={900}
                  alt={formData.caption}
                  hint="Upload from your device or paste a URL. Use the real post crop."
                />

                <div>
                  <label className="text-xs font-bold uppercase">Video URL (optional)</label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    placeholder="https://..."
                    className="mt-1 w-full rounded border border-black/10 px-3 py-2 text-sm"
                  />
                  <p className="mt-1 text-xs text-black/60">MP4, WebM</p>
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
                    className="flex-1 rounded bg-ink px-4 py-2 font-bold text-white disabled:opacity-50"
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
            <section className="rounded border border-black/10 bg-white p-5 lg:col-span-2">
              <h2 className="mb-4 text-lg font-black">
                Posts ({posts?.length || 0})
              </h2>

              {loading ? (
                <p className="text-black/60">Loading...</p>
              ) : !posts || posts.length === 0 ? (
                <p className="text-black/60">No posts yet. Add your first Instagram post above.</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {posts.map((post) => (
                    <div key={post.id} className="flex gap-3 rounded border border-black/10 p-3 hover:bg-black/5">
                      {post.imageUrl && (
                        <img
                          src={post.imageUrl}
                          alt={post.caption}
                          className="h-16 w-16 rounded object-cover"
                        />
                      )}

                      <div className="flex-1">
                        <p className="line-clamp-2 font-bold text-sm">{post.caption}</p>
                        <p className="mt-1 text-xs text-black/60">Order: {post.displayOrder}</p>
                        <p className="mt-1 text-xs text-black/60 font-mono break-all">{post.instagramLink}</p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleCopy(post.instagramLink, post.id)}
                          className="flex items-center gap-1 rounded border border-black/10 px-2 py-1 text-xs font-bold hover:bg-black/5"
                        >
                          {copied === post.id ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        <button
                          onClick={() => handleEdit(post)}
                          className="flex items-center gap-1 rounded border border-black/10 px-2 py-1 text-xs font-bold text-ink hover:bg-black/5"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-100"
                        >
                          <Trash2 size={14} />
                        </button>
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

function normalizeForm(formData: typeof emptyForm) {
  const displayOrder = Number.parseInt(formData.displayOrder, 10);
  return {
    ...formData,
    displayOrder: Number.isFinite(displayOrder) && displayOrder > 0 ? displayOrder : 1
  };
}
