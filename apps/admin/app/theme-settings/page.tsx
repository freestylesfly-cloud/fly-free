'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Save, Plus, Trash2, Eye, Edit2 } from 'lucide-react';
import { apiService } from '../services/api';

type WebsiteTheme = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  animationStyle: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroDesktopImageUrl?: string;
  heroCtaLabel?: string;
  heroHref?: string;
  isActive: boolean;
  priority: number;
};

const emptyTheme: WebsiteTheme = {
  id: '',
  name: '',
  slug: '',
  description: '',
  primaryColor: '#111827',
  secondaryColor: '#ff6b5b',
  backgroundColor: '#ffffff',
  textColor: '#000000',
  accentColor: '#4ecdc4',
  fontFamily: 'Inter, Arial, sans-serif',
  animationStyle: 'fade',
  heroTitle: '',
  heroSubtitle: '',
  heroDesktopImageUrl: '',
  heroCtaLabel: 'Shop Now',
  heroHref: '/products',
  isActive: false,
  priority: 0,
};

export default function ThemeSettingsPage() {
  const [themes, setThemes] = useState<WebsiteTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTheme, setEditingTheme] = useState<WebsiteTheme | null>(null);
  const [form, setForm] = useState(emptyTheme);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchThemes();
  }, []);

  async function fetchThemes() {
    try {
      setLoading(true);
      // Fetch website themes from API
      const response = await fetch('/api/admin/website-themes');
      if (response.ok) {
        const data = await response.json();
        setThemes(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching themes:', error);
      setMessage('Error loading themes');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    try {
      const payload = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
        description: form.description,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        backgroundColor: form.backgroundColor,
        textColor: form.textColor,
        accentColor: form.accentColor,
        fontFamily: form.fontFamily,
        animationStyle: form.animationStyle,
        heroTitle: form.heroTitle,
        heroSubtitle: form.heroSubtitle,
        heroDesktopImageUrl: form.heroDesktopImageUrl,
        heroCtaLabel: form.heroCtaLabel,
        heroHref: form.heroHref,
        isActive: form.isActive,
        priority: form.priority,
      };

      if (editingTheme?.id) {
        // Update
        const response = await fetch(`/api/admin/website-themes/${editingTheme.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          setMessage('✓ Theme updated successfully');
          fetchThemes();
          resetForm();
        } else {
          const error = await response.json();
          setMessage(`✕ Error: ${error.message}`);
        }
      } else {
        // Create
        const response = await fetch('/api/admin/website-themes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          setMessage('✓ Theme created successfully');
          fetchThemes();
          resetForm();
        } else {
          const error = await response.json();
          setMessage(`✕ Error: ${error.message}`);
        }
      }
    } catch (error) {
      setMessage(`✕ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this theme?')) return;

    try {
      const response = await fetch(`/api/admin/website-themes/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setMessage('✓ Theme deleted');
        fetchThemes();
      } else {
        setMessage('✕ Error deleting theme');
      }
    } catch (error) {
      setMessage('✕ Error deleting theme');
    }
  }

  function resetForm() {
    setForm(emptyTheme);
    setEditingTheme(null);
  }

  function editTheme(theme: WebsiteTheme) {
    setEditingTheme(theme);
    setForm(theme);
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Theme Settings" subtitle="Manage your brand colors, fonts, and hero section">
        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          {/* Theme List */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Active Themes</h2>
              <button
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white font-bold"
              >
                <Plus size={18} /> New Theme
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading themes...</div>
            ) : themes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No themes yet</div>
            ) : (
              <div className="space-y-3">
                {themes.map((theme) => (
                  <div
                    key={theme.id}
                    className="flex items-center justify-between rounded border border-gray-200 p-4"
                    style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-2">
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: theme.primaryColor }}
                            title="Primary"
                          />
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: theme.secondaryColor }}
                            title="Secondary"
                          />
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: theme.accentColor }}
                            title="Accent"
                          />
                        </div>
                        <div>
                          <h3 className="font-bold">{theme.name}</h3>
                          <p className="text-sm opacity-75">{theme.description}</p>
                        </div>
                        {theme.isActive && (
                          <span className="ml-auto rounded px-2 py-1 text-xs font-bold" style={{ backgroundColor: theme.primaryColor, color: '#fff' }}>
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => editTheme(theme)}
                        className="p-2 hover:bg-gray-100 rounded"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(theme.id)}
                        className="p-2 hover:bg-red-50 rounded text-red-600"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Edit Form */}
          <form onSubmit={handleSave} className="space-y-4 rounded border border-gray-200 p-5 h-fit sticky top-5">
            <h2 className="text-lg font-bold">{editingTheme ? 'Edit Theme' : 'New Theme'}</h2>
            {message && (
              <div
                className={`rounded p-3 text-sm font-bold ${
                  message.includes('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {message}
              </div>
            )}

            {/* Theme Preview */}
            <div
              className="rounded p-4 mb-4 text-white"
              style={{
                backgroundColor: form.primaryColor,
                fontFamily: form.fontFamily,
              }}
            >
              <h3 className="text-lg font-bold">{form.name || 'Theme Preview'}</h3>
              <p className="text-sm opacity-90">{form.description}</p>
            </div>

            {/* Form Fields */}
            <div>
              <label className="block text-sm font-bold mb-2">Theme Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded border px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="flex-1 rounded border px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Secondary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.secondaryColor}
                  onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={form.secondaryColor}
                  onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
                  className="flex-1 rounded border px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Accent Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.accentColor}
                  onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={form.accentColor}
                  onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                  className="flex-1 rounded border px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Font Family</label>
              <input
                type="text"
                value={form.fontFamily}
                onChange={(e) => setForm({ ...form, fontFamily: e.target.value })}
                placeholder="Inter, Arial, sans-serif"
                className="w-full rounded border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Hero Title</label>
              <input
                type="text"
                value={form.heroTitle || ''}
                onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
                className="w-full rounded border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-bold mb-3">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                Set as Active Theme
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 rounded bg-blue-600 px-4 py-2 text-white font-bold"
              >
                <Save size={18} /> {editingTheme ? 'Update' : 'Create'}
              </button>
              {editingTheme && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded border px-4 py-2 font-bold"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
