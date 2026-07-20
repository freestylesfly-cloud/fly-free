'use client';

import { useRef, useState } from 'react';
import { Check, Crop, ImageIcon, Link as LinkIcon, Trash2, Upload, X } from 'lucide-react';
import { deleteImage, uploadImage } from '../lib/supabase';

type ImageUploadFieldProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  bucket: string;
  folder?: string;
  aspect?: number;
  alt?: string;
  onDelete?: (url: string) => void;
};

export function ImageUploadField({
  label,
  value,
  onChange,
  bucket,
  folder = '',
  aspect = 1,
  alt = '',
  onDelete
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [preview, setPreview] = useState('');
  const [fileName, setFileName] = useState('upload.webp');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'original' | 'crop'>('crop');

  function pickFile(file?: File) {
    setError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError('Image must be under 12MB.');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result || ''));
    reader.readAsDataURL(file);
  }

  async function uploadPreview() {
    try {
      setUploading(true);
      setError('');
      const blob = mode === 'crop' ? await cropToBlob() : await dataUrlToBlob(preview);
      const file = new File([blob], fileName.replace(/\.[^.]+$/, '.webp'), { type: blob.type || 'image/webp' });
      const url = await uploadImage(bucket, file, folder);
      onChange(url);
      setPreview('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function removeImage() {
    const current = value;
    onChange('');
    onDelete?.(current);
    try {
      await deleteImage(bucket, current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image URL removed, but storage cleanup failed.');
    }
  }

  async function cropToBlob() {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) throw new Error('Image preview is not ready.');

    const sourceWidth = img.naturalWidth;
    const sourceHeight = img.naturalHeight;
    const sourceAspect = sourceWidth / sourceHeight;
    let sx = 0;
    let sy = 0;
    let sw = sourceWidth;
    let sh = sourceHeight;

    if (sourceAspect > aspect) {
      sw = sourceHeight * aspect;
      sx = (sourceWidth - sw) / 2;
    } else {
      sh = sourceWidth / aspect;
      sy = (sourceHeight - sh) / 2;
    }

    canvas.width = Math.round(Math.min(1800, sw));
    canvas.height = Math.round(canvas.width / aspect);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not supported.');
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not prepare image.')), 'image/webp', 0.9);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-black">{label}</span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded bg-ink px-3 py-2 text-xs font-bold text-white"
        >
          <Upload size={14} /> Upload
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-[120px_1fr]">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded border border-black/10 bg-black/[0.03]">
          {value ? <img src={value} alt={alt || label} className="h-full w-full object-cover" /> : <ImageIcon className="text-black/35" size={24} />}
        </div>
        <div className="space-y-2">
          <div className="relative">
            <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-black/35" />
            <input
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder="Paste image URL or upload from device"
              className="w-full rounded border border-black/10 py-2 pl-9 pr-3 text-sm"
            />
          </div>
          {value && (
            <button type="button" onClick={removeImage} className="inline-flex items-center gap-2 rounded border border-red-200 px-3 py-2 text-xs font-bold text-red-600">
              <Trash2 size={14} /> Remove and clean storage
            </button>
          )}
          {error && <p className="text-xs font-bold text-red-600">{error}</p>}
        </div>
      </div>

      <input
        ref={inputRef}
        hidden
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => pickFile(event.target.files?.[0])}
      />

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-black">Preview upload</h3>
              <button type="button" onClick={() => setPreview('')} className="rounded p-2 hover:bg-black/5"><X size={18} /></button>
            </div>
            <div className="overflow-hidden rounded border border-black/10 bg-black">
              <img ref={imageRef} src={preview} alt="Upload preview" className="max-h-[55vh] w-full object-contain" />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <button type="button" onClick={() => setMode('crop')} className={`inline-flex items-center gap-2 rounded border px-3 py-2 text-sm font-bold ${mode === 'crop' ? 'bg-ink text-white' : ''}`}>
                  <Crop size={15} /> Crop fit
                </button>
                <button type="button" onClick={() => setMode('original')} className={`rounded border px-3 py-2 text-sm font-bold ${mode === 'original' ? 'bg-ink text-white' : ''}`}>
                  Original
                </button>
              </div>
              <button type="button" disabled={uploading} onClick={uploadPreview} className="inline-flex items-center gap-2 rounded bg-coral px-4 py-2 font-black text-white disabled:opacity-50">
                <Check size={16} /> {uploading ? 'Uploading...' : 'Use this image'}
              </button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}
    </div>
  );
}

async function dataUrlToBlob(dataUrl: string) {
  const response = await fetch(dataUrl);
  return response.blob();
}
