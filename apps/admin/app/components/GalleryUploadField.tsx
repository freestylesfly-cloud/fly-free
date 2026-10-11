'use client';

import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Trash2 } from 'lucide-react';
import { deleteImage, uploadImage } from '../lib/supabase';

/**
 * An ordered list of photos, uploaded several at a time.
 *
 * Phone photos are routinely 4–8 MB. Each file is scaled down in the browser to
 * `maxWidth` and re-encoded as WebP before it is sent, so an event gallery costs
 * a few hundred KB per photo instead of the original camera file — that is what
 * keeps storage and the storefront fast. Files upload one at a time so a slow
 * connection shows steady progress instead of one long stall.
 */
export function GalleryUploadField({
  label,
  value,
  onChange,
  folder,
  max = 40,
  maxWidth = 1600,
  hint
}: {
  label: string;
  value: string[];
  onChange: (urls: string[]) => void;
  folder: string;
  max?: number;
  maxWidth?: number;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState('');

  async function addFiles(fileList: FileList | null) {
    const files = Array.from(fileList || []).filter((file) => file.type.startsWith('image/'));
    if (files.length === 0) return;

    const room = max - value.length;
    if (room <= 0) {
      setError(`The gallery is full (${max} photos). Remove one to add another.`);
      return;
    }

    const batch = files.slice(0, room);
    setError(files.length > room ? `Only the first ${room} photo(s) were added — the gallery holds ${max}.` : '');
    setProgress({ done: 0, total: batch.length });

    // Built up locally so each finished upload appears straight away, and a
    // failure part-way keeps everything that already succeeded.
    let urls = [...value];
    const failed: string[] = [];
    for (const file of batch) {
      try {
        const resized = await shrink(file, maxWidth);
        const url = await uploadImage('product-images', resized, folder);
        urls = [...urls, url];
        onChange(urls);
      } catch (uploadError) {
        failed.push(`${file.name}: ${uploadError instanceof Error ? uploadError.message : 'upload failed'}`);
      }
      setProgress((current) => (current ? { ...current, done: current.done + 1 } : current));
    }

    setProgress(null);
    if (failed.length) setError(`Could not upload ${failed.length} photo(s). ${failed.join(' · ')}`);
    if (inputRef.current) inputRef.current.value = '';
  }

  function move(index: number, by: -1 | 1) {
    const target = index + by;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function remove(index: number) {
    const url = value[index];
    onChange(value.filter((_, i) => i !== index));
    void deleteImage('product-images', url);
  }

  const busy = progress !== null;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="block text-xs font-bold uppercase text-black/45">
          {label} ({value.length}/{max})
        </span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy || value.length >= max}
          className="inline-flex items-center gap-1 rounded border border-black/15 px-2.5 py-1.5 text-xs font-bold disabled:opacity-50"
        >
          <ImagePlus size={14} /> {busy ? `Uploading ${progress.done + 1} of ${progress.total}...` : 'Add photos'}
        </button>
      </div>
      {hint && <p className="mb-2 text-xs text-black/50">{hint}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => void addFiles(event.target.files)}
      />

      {value.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="grid h-28 w-full place-items-center rounded border-2 border-dashed border-black/15 text-sm font-bold text-black/50"
        >
          {busy ? `Uploading ${progress.done + 1} of ${progress.total}...` : 'Select several photos at once'}
        </button>
      ) : (
        <ul className="grid grid-cols-3 gap-2">
          {value.map((url, index) => (
            <li key={url} className="group relative aspect-square overflow-hidden rounded border border-black/10 bg-black/5">
              <img src={url} alt={`Gallery photo ${index + 1}`} className="h-full w-full object-cover" />
              <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 text-[10px] font-bold text-white">{index + 1}</span>
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/55 p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move earlier" className="p-1 text-white disabled:opacity-30">
                  <ArrowLeft size={14} />
                </button>
                <button type="button" onClick={() => remove(index)} aria-label="Remove photo" className="p-1 text-white">
                  <Trash2 size={14} />
                </button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === value.length - 1} aria-label="Move later" className="p-1 text-white disabled:opacity-30">
                  <ArrowRight size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-2 text-xs font-bold text-red-700">{error}</p>}
    </div>
  );
}

/** Scales an image down to `maxWidth` (never up) and re-encodes it as WebP. */
async function shrink(file: File, maxWidth: number): Promise<File> {
  // GIFs would lose their animation; leave them as they are.
  if (file.type === 'image/gif') return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
}
