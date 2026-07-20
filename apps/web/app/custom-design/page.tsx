'use client';

import { useState, useRef } from 'react';
import { Upload, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { DesignCanvasPreview } from '../components/DesignCanvasPreview';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface FormData {
  title: string;
  description: string;
  size: string;
  color: string;
  placement: string;
  notes: string;
}

export default function CustomDesignPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    size: 'M',
    color: '#000000',
    placement: 'Front',
    notes: ''
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [orderId, setOrderId] = useState('');

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const colors = [
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#ffffff' },
    { name: 'Navy', value: '#001f3f' },
    { name: 'Gray', value: '#666666' },
    { name: 'Red', value: '#ff0000' },
    { name: 'Blue', value: '#0074d9' }
  ];
  const placements = ['Front', 'Back', 'Front & Back', 'Sleeve'];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 3) {
      setMessage({ type: 'error', text: 'Maximum 3 images allowed' });
      return;
    }

    setImages([...images, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreviews((prev) => [...prev, event.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    if (!formData.title.trim()) {
      setMessage({ type: 'error', text: 'Title is required' });
      return;
    }

    if (images.length === 0) {
      setMessage({ type: 'error', text: 'At least one image is required' });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('flyfree_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const form = new FormData();
      form.append('title', formData.title);
      form.append('description', formData.description);
      form.append('size', formData.size);
      form.append('color', formData.color);
      form.append('placement', formData.placement);
      form.append('notes', formData.notes);

      images.forEach((img) => {
        form.append('images', img);
      });

      const response = await fetch(`${API_BASE}/api/ecommerce/custom-designs`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: form
      });

      if (response.ok) {
        const data = await response.json();
        setOrderId(data.id || 'CUSTOM-001');
        setSuccess(true);

        setTimeout(() => {
          router.push('/profile?tab=custom-orders');
        }, 2500);
      } else {
        const errData = await response.json();
        setMessage({ type: 'error', text: errData.message || 'Failed to submit design' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error submitting design' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="rounded-2xl shadow-2xl p-8 max-w-md w-full text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: '#d1fae5' }}>
              <Check className="text-green-600" size={32} />
            </div>
            <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>
              Design Submitted!
            </h2>
            <p style={{ color: 'var(--text-secondary)' }} className="mb-2">
              Your custom t-shirt design has been received.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Order ID: <span className="font-bold">{orderId}</span>
            </p>
          </div>
          <p style={{ color: 'var(--text-secondary)' }} className="mb-6">
            Our team will review your design and send you an approval email with pricing details.
          </p>
          <button
            onClick={() => router.push('/profile?tab=custom-orders')}
            className="w-full px-6 py-3 text-white font-bold rounded-lg transition hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            View My Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', paddingBottom: '80px' }}>
      {/* Header */}
      <div className="px-4 md:px-6 py-8 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <h1 className="text-4xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>
          Custom T-Shirt Design
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Upload your design and we'll print it on a high-quality t-shirt
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {message && (
              <div
                className={`p-4 rounded-lg flex items-center gap-3 font-bold ${
                  message.type === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                {message.text}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Design Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="E.g., My Custom Logo Design"
                className="w-full px-4 py-3 rounded-lg border-2 font-bold"
                style={{ borderColor: 'var(--border-color)' }}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell us about your design..."
                rows={3}
                className="w-full px-4 py-3 rounded-lg border-2 font-bold"
                style={{ borderColor: 'var(--border-color)' }}
              />
            </div>

            {/* Size */}
            <div>
              <label className="block font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                T-Shirt Size *
              </label>
              <select
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 font-bold"
                style={{ borderColor: 'var(--border-color)' }}
              >
                {sizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div>
              <label className="block font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                T-Shirt Color *
              </label>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`p-4 rounded-lg font-bold border-3 transition text-xs text-center`}
                    style={{
                      backgroundColor: color.value,
                      borderColor: formData.color === color.value ? 'var(--text-primary)' : 'transparent',
                      color: color.value === '#ffffff' ? '#000' : '#fff'
                    }}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-12 w-20 rounded cursor-pointer"
                />
                <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>
                  {formData.color}
                </span>
              </div>
            </div>

            {/* Placement */}
            <div>
              <label className="block font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Design Placement *
              </label>
              <select
                value={formData.placement}
                onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 font-bold"
                style={{ borderColor: 'var(--border-color)' }}
              >
                {placements.map((placement) => (
                  <option key={placement} value={placement}>
                    {placement}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Special Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special requirements or notes..."
                rows={2}
                className="w-full px-4 py-3 rounded-lg border-2 font-bold"
                style={{ borderColor: 'var(--border-color)' }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 text-white font-black rounded-lg transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Design
                </>
              )}
            </button>
          </form>

          {/* Preview */}
          <div className="space-y-6">
            {/* Canvas Preview */}
            <div>
              <label className="block font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Preview
              </label>
              <div className="rounded-2xl shadow-lg p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                {imagePreviews.length > 0 ? (
                  <DesignCanvasPreview
                    imageUrl={imagePreviews[0]}
                    tshirtColor={formData.color}
                    placement={formData.placement}
                    size={formData.size}
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Upload an image to see preview</p>
                  </div>
                )}
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Design Images (Max 3) *
              </label>

              {/* Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 rounded-xl border-3 border-dashed flex flex-col items-center gap-3 font-bold transition hover:opacity-80"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
              >
                <Upload size={32} style={{ color: 'var(--color-primary)' }} />
                <div>
                  <p style={{ color: 'var(--text-primary)' }}>Click to upload or drag & drop</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>PNG, JPG, GIF up to 10MB</p>
                </div>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {imagePreviews.map((preview, idx) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden group" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <img src={preview} alt={`Preview ${idx}`} className="w-full h-32 object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '12px' }}>
                {images.length} / 3 images uploaded
              </p>
            </div>

            {/* Info Box */}
            <div className="rounded-xl p-4 border-2" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
              <h4 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                How it works:
              </h4>
              <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <li className="font-bold">✓ Upload your design (up to 3 images)</li>
                <li className="font-bold">✓ Choose size and color</li>
                <li className="font-bold">✓ Admin reviews and approves</li>
                <li className="font-bold">✓ You pay when approved</li>
                <li className="font-bold">✓ We print and ship your order</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
