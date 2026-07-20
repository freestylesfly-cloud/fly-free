'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { ImageUploader } from './ImageUploader';

interface HeroBanner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
  priority: number;
  isActive: boolean;
}

export function HeroBannerManager() {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    mobileImageUrl: '',
    ctaLabel: '',
    ctaHref: '',
    priority: 0,
    isActive: true,
  });

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${api.getBaseUrl()}/api/admin/hero-banners`);
      if (response.ok) {
        const data = await response.json();
        setBanners(data);
      }
    } catch (error) {
      console.error('Failed to load banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await fetch(`${api.getBaseUrl()}/api/admin/hero-banners/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        await fetch(`${api.getBaseUrl()}/api/admin/hero-banners`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      setFormData({
        title: '',
        subtitle: '',
        imageUrl: '',
        mobileImageUrl: '',
        ctaLabel: '',
        ctaHref: '',
        priority: 0,
        isActive: true,
      });
      setEditingId(null);
      setShowForm(false);
      loadBanners();
    } catch (error) {
      console.error('Failed to save banner:', error);
    }
  };

  const handleEdit = (banner: HeroBanner) => {
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      imageUrl: banner.imageUrl,
      mobileImageUrl: banner.mobileImageUrl || '',
      ctaLabel: banner.ctaLabel || '',
      ctaHref: banner.ctaHref || '',
      priority: banner.priority,
      isActive: banner.isActive,
    });
    setEditingId(banner.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this hero banner?')) return;
    try {
      await fetch(`${api.getBaseUrl()}/api/admin/hero-banners/${id}`, { method: 'DELETE' });
      loadBanners();
    } catch (error) {
      console.error('Failed to delete banner:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Hero Banners</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              title: '',
              subtitle: '',
              imageUrl: '',
              mobileImageUrl: '',
              ctaLabel: '',
              ctaHref: '',
              priority: 0,
              isActive: true,
            });
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-black text-white px-4 py-2 font-bold hover:bg-black/90"
        >
          <Plus size={18} /> Add Banner
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-black/10 bg-white p-6 space-y-4">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Banner Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-black/10 px-3 py-2"
              required
            />
            <textarea
              placeholder="Subtitle (optional)"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full rounded-lg border border-black/10 px-3 py-2 h-20"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">Desktop Image (1920x600px)</label>
              <ImageUploader
                value={formData.imageUrl}
                onChange={(url) => setFormData({ ...formData, imageUrl: url })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Mobile Image (600x800px) - Optional</label>
              <ImageUploader
                value={formData.mobileImageUrl}
                onChange={(url) => setFormData({ ...formData, mobileImageUrl: url })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="CTA Label (e.g., Shop Now)"
              value={formData.ctaLabel}
              onChange={(e) => setFormData({ ...formData, ctaLabel: e.target.value })}
              className="rounded-lg border border-black/10 px-3 py-2"
            />
            <input
              type="text"
              placeholder="CTA URL (e.g., /shop/summer)"
              value={formData.ctaHref}
              onChange={(e) => setFormData({ ...formData, ctaHref: e.target.value })}
              className="rounded-lg border border-black/10 px-3 py-2"
            />
            <input
              type="number"
              placeholder="Priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              className="rounded-lg border border-black/10 px-3 py-2"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <span>Active</span>
          </label>

          <div className="flex gap-3">
            <button type="submit" className="rounded-lg bg-black text-white px-4 py-2 font-bold hover:bg-black/90">
              {editingId ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-black/10 px-4 py-2 font-bold hover:bg-black/5"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-black/60">Loading...</p>
      ) : (
        <div className="grid gap-4">
          {banners.map((banner) => (
            <div key={banner.id} className="rounded-lg border border-black/10 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{banner.title}</h3>
                  {banner.subtitle && <p className="text-sm text-black/60">{banner.subtitle}</p>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${banner.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {banner.isActive ? '✓ Active' : '✗ Inactive'}
                </span>
              </div>
              <div className="flex gap-2 aspect-video rounded-lg overflow-hidden bg-black/5">
                <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
              </div>
              {banner.ctaLabel && (
                <p className="text-sm text-black/60">
                  CTA: <strong>{banner.ctaLabel}</strong> → {banner.ctaHref}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(banner)}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-black text-white px-3 py-2 font-bold hover:bg-black/90"
                >
                  <Edit2 size={16} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(banner.id)}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-100 text-red-700 px-3 py-2 font-bold hover:bg-red-200"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
