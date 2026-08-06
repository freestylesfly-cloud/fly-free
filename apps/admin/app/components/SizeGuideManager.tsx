'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { apiService } from '../services/api';

interface SizeGuide {
  id: string;
  size: string;
  chest: string;
  shoulder: string;
  length: string;
  sleeve: string;
  priority: number;
  active: boolean;
}

export function SizeGuideManager() {
  const [sizes, setSizes] = useState<SizeGuide[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    size: '',
    chest: '',
    shoulder: '',
    length: '',
    sleeve: '',
    priority: 0,
    active: true,
  });

  useEffect(() => {
    loadSizes();
  }, []);

  // Goes through apiService so the admin bearer token is attached — these
  // routes sit behind AdminGuard and a bare fetch just gets a silent 401.
  const loadSizes = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getSizeGuides();
      setSizes(Array.isArray(data) ? data : (data as any)?.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load size guides');
      setSizes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      if (editingId) {
        await apiService.updateSizeGuide(editingId, formData);
      } else {
        await apiService.createSizeGuide(formData);
      }
      setFormData({ size: '', chest: '', shoulder: '', length: '', sleeve: '', priority: 0, active: true });
      setEditingId(null);
      setShowForm(false);
      await loadSizes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save size guide');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (size: SizeGuide) => {
    setFormData({
      size: size.size,
      chest: size.chest,
      shoulder: size.shoulder,
      length: size.length,
      sleeve: size.sleeve,
      priority: size.priority,
      active: size.active,
    });
    setEditingId(size.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this size guide?')) return;
    try {
      setError('');
      await apiService.deleteSizeGuide(id);
      await loadSizes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete size guide');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Size Guides</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ size: '', chest: '', shoulder: '', length: '', sleeve: '', priority: 0, active: true });
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-black text-white px-4 py-2 font-bold hover:bg-black/90"
        >
          <Plus size={18} /> Add Size
        </button>
      </div>

      {error && (
        <div className="flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-bold">{error}</p>
          <button onClick={() => setError('')} className="shrink-0 text-sm font-bold underline">Dismiss</button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-black/10 bg-white p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Size (S, M, L, XL)"
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              className="rounded-lg border border-black/10 px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder='Chest (44 inch, 46 inch)'
              value={formData.chest}
              onChange={(e) => setFormData({ ...formData, chest: e.target.value })}
              className="rounded-lg border border-black/10 px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder='Shoulder (20.5 inch, 21.5 inch)'
              value={formData.shoulder}
              onChange={(e) => setFormData({ ...formData, shoulder: e.target.value })}
              className="rounded-lg border border-black/10 px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder='Length (28 inch, 29 inch)'
              value={formData.length}
              onChange={(e) => setFormData({ ...formData, length: e.target.value })}
              className="rounded-lg border border-black/10 px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder='Sleeve (8.5 inch, 9 inch)'
              value={formData.sleeve}
              onChange={(e) => setFormData({ ...formData, sleeve: e.target.value })}
              className="rounded-lg border border-black/10 px-3 py-2"
              required
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
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            />
            <span>Active</span>
          </label>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-black text-white px-4 py-2 font-bold hover:bg-black/90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
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
        <div className="overflow-x-auto rounded-lg border border-black/10">
          <table className="w-full">
            <thead className="bg-black/5 border-b border-black/10">
              <tr>
                <th className="px-4 py-3 text-left font-bold">Size</th>
                <th className="px-4 py-3 text-left font-bold">Chest</th>
                <th className="px-4 py-3 text-left font-bold">Shoulder</th>
                <th className="px-4 py-3 text-left font-bold">Length</th>
                <th className="px-4 py-3 text-left font-bold">Sleeve</th>
                <th className="px-4 py-3 text-left font-bold">Priority</th>
                <th className="px-4 py-3 text-left font-bold">Status</th>
                <th className="px-4 py-3 text-center font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sizes.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-black/60">
                    No size guides yet. Use &ldquo;Add Size&rdquo; to create one.
                  </td>
                </tr>
              )}
              {sizes.map((size) => (
                <tr key={size.id} className="border-b border-black/5 hover:bg-black/2">
                  <td className="px-4 py-3 font-bold">{size.size}</td>
                  <td className="px-4 py-3">{size.chest}</td>
                  <td className="px-4 py-3">{size.shoulder}</td>
                  <td className="px-4 py-3">{size.length}</td>
                  <td className="px-4 py-3">{size.sleeve}</td>
                  <td className="px-4 py-3">{size.priority}</td>
                  <td className="px-4 py-3">{size.active ? '✓ Active' : '✗ Inactive'}</td>
                  <td className="px-4 py-3 flex justify-center gap-2">
                    <button
                      onClick={() => handleEdit(size)}
                      className="p-2 hover:bg-black/10 rounded-lg transition"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(size.id)}
                      className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
