'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Check, ImageIcon, Link as LinkIcon, Trash2, Upload, X, ZoomIn } from 'lucide-react';
import { deleteImage, uploadImage } from '../lib/supabase';

type ImageUploadFieldProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  bucket: string;
  folder?: string;
  /** Width / height of the box this image renders in on the storefront. */
  aspect?: number;
  /** Exact pixel width the cropped file is written at. Height follows `aspect`. */
  targetWidth?: number;
  alt?: string;
  hint?: string;
  onDelete?: (url: string) => void;
};

type CropState = { zoom: number; x: number; y: number };

const MAX_ZOOM = 4;

export function ImageUploadField({
  label,
  value,
  onChange,
  bucket,
  folder = '',
  aspect = 1,
  targetWidth = 1600,
  alt = '',
  hint,
  onDelete
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null);

  const [preview, setPreview] = useState('');
  const [fileName, setFileName] = useState('upload.webp');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);
  const [frameWidth, setFrameWidth] = useState(0);
  const [crop, setCrop] = useState<CropState>({ zoom: 1, x: 0, y: 0 });

  const targetHeight = Math.round(targetWidth / aspect);
  const frameHeight = frameWidth / aspect;

  // Scale that makes the image exactly cover the crop frame at zoom 1.
  const coverScale = natural && frameWidth
    ? Math.max(frameWidth / natural.width, frameHeight / natural.height)
    : 0;
  const scale = coverScale * crop.zoom;
  const drawWidth = natural ? natural.width * scale : 0;
  const drawHeight = natural ? natural.height * scale : 0;

  /** Keeps the frame fully covered — no empty gutters however far you drag. */
  const clamp = useCallback(
    (next: CropState): CropState => {
      if (!natural || !frameWidth) return next;
      const s = coverScale * next.zoom;
      const width = natural.width * s;
      const height = natural.height * s;
      const minX = Math.min(0, frameWidth - width);
      const minY = Math.min(0, frameHeight - height);
      return {
        zoom: next.zoom,
        x: Math.min(0, Math.max(minX, next.x)),
        y: Math.min(0, Math.max(minY, next.y))
      };
    },
    [natural, frameWidth, frameHeight, coverScale]
  );

  // Centre the image whenever a new file is picked or the frame is measured.
  useEffect(() => {
    if (!natural || !frameWidth) return;
    const width = natural.width * coverScale;
    const height = natural.height * coverScale;
    setCrop({ zoom: 1, x: (frameWidth - width) / 2, y: (frameHeight - height) / 2 });
  }, [natural, frameWidth, frameHeight, coverScale]);

  useLayoutEffect(() => {
    if (!preview) return;
    const element = frameRef.current;
    if (!element) return;
    const measure = () => setFrameWidth(element.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [preview]);

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
    setNatural(null);
    setFrameWidth(0);
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result || ''));
    reader.readAsDataURL(file);
  }

  function zoomBy(delta: number) {
    setCrop((current) => clamp({ ...current, zoom: Math.min(MAX_ZOOM, Math.max(1, current.zoom + delta)) }));
  }

  function setZoom(zoom: number) {
    setCrop((current) => {
      if (!natural || !frameWidth) return { ...current, zoom };
      // Zoom around the centre of the frame so the subject stays put.
      const ratio = zoom / current.zoom;
      const centreX = frameWidth / 2;
      const centreY = frameHeight / 2;
      return clamp({
        zoom,
        x: centreX - (centreX - current.x) * ratio,
        y: centreY - (centreY - current.y) * ratio
      });
    });
  }

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: crop.x,
      originY: crop.y
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onDrag(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setCrop((current) =>
      clamp({
        zoom: current.zoom,
        x: drag.originX + (event.clientX - drag.startX),
        y: drag.originY + (event.clientY - drag.startY)
      })
    );
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  }

  function closePreview() {
    setPreview('');
    setNatural(null);
    setFrameWidth(0);
  }

  async function uploadPreview() {
    try {
      setUploading(true);
      setError('');
      const blob = await cropToBlob();
      const file = new File([blob], fileName.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
      const url = await uploadImage(bucket, file, folder);
      onChange(url);
      closePreview();
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

  /** Maps the on-screen crop frame back onto the source pixels. */
  async function cropToBlob() {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || !natural || !frameWidth) throw new Error('Image preview is not ready.');

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not supported.');
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      img,
      -crop.x / scale,
      -crop.y / scale,
      frameWidth / scale,
      frameHeight / scale,
      0,
      0,
      targetWidth,
      targetHeight
    );

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not prepare image.'))), 'image/webp', 0.92);
    });
  }

  const tooSmall = natural ? natural.width < targetWidth * 0.5 : false;

  useEffect(() => {
    if (!preview) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !uploading) closePreview();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [preview, uploading]);

  return (
    <div className="space-y-3 rounded-lg border border-black/10 bg-black/[0.015] p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="block text-sm font-black">{label}</span>
          <span className="mt-1 block text-xs font-bold text-black/45">{formatAspect(aspect)} · {targetWidth} × {targetHeight}px</span>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded bg-ink px-3 py-2 text-xs font-bold text-white"
        >
          <Upload size={14} /> Upload
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(140px,180px)_minmax(0,1fr)] sm:items-start">
        <div
          className="relative flex w-full items-center justify-center overflow-hidden rounded border border-black/10 bg-white shadow-sm"
          style={{ aspectRatio: String(aspect) }}
        >
          {value ? (
            <img src={value} alt={alt || label} className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-black/35">
              <ImageIcon size={26} />
              <span className="text-[10px] font-black uppercase">No image</span>
            </div>
          )}
        </div>
        <div className="min-w-0 space-y-2">
          <div className="relative">
            <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-black/35" />
            <input
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder="Paste image URL"
              className="w-full rounded border border-black/10 py-2 pl-9 pr-3 text-sm"
            />
          </div>
          {value && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded border border-black/10 px-3 py-2 text-xs font-bold"
              >
                <Upload size={14} /> Replace image
              </button>
              <button
                type="button"
                onClick={removeImage}
                className="inline-flex items-center gap-2 rounded border border-red-200 px-3 py-2 text-xs font-bold text-red-600"
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>
          )}
          {hint && <p className="text-xs text-black/50">{hint}</p>}
          {error && <p className="text-xs font-bold text-red-600">{error}</p>}
        </div>
      </div>

      <input
        ref={inputRef}
        hidden
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => {
          pickFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />

      {preview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 p-3 sm:p-5" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !uploading) closePreview();
        }}>
          <div className="my-auto max-h-[calc(100svh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-4 shadow-2xl sm:max-h-[calc(100svh-2.5rem)] sm:p-5" onMouseDown={(event) => event.stopPropagation()}>
            <div className="mb-1 flex items-center justify-between">
              <h3 className="font-black">Crop {label.toLowerCase()}</h3>
              <button type="button" onClick={closePreview} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 hover:bg-black/5" aria-label="Close crop preview" title="Close crop preview">
                <X size={20} />
              </button>
            </div>
            <p className="mb-4 text-xs font-bold text-black/50">
              Drag to reposition, zoom to fill. Saved at {targetWidth} × {targetHeight}px ({formatAspect(aspect)}).
            </p>

            <div
              ref={frameRef}
              onPointerDown={startDrag}
              onPointerMove={onDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              className="relative mx-auto max-h-[min(62svh,720px)] w-full cursor-grab touch-none select-none overflow-hidden rounded border border-black/10 bg-black active:cursor-grabbing"
              style={{ aspectRatio: String(aspect) }}
            >
              <img
                ref={imageRef}
                src={preview}
                alt="Crop preview"
                draggable={false}
                onLoad={(event) =>
                  setNatural({
                    width: event.currentTarget.naturalWidth,
                    height: event.currentTarget.naturalHeight
                  })
                }
                className="absolute max-w-none origin-top-left"
                style={{
                  left: 0,
                  top: 0,
                  width: drawWidth ? `${drawWidth}px` : 'auto',
                  height: drawHeight ? `${drawHeight}px` : 'auto',
                  transform: `translate(${crop.x}px, ${crop.y}px)`,
                  visibility: natural && frameWidth ? 'visible' : 'hidden'
                }}
              />
              {/* Rule-of-thirds guides so the subject can be centred reliably. */}
              <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, index) => (
                  <div key={index} className="border border-white/20" />
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <ZoomIn size={16} className="shrink-0 text-black/50" />
              <input
                type="range"
                min={1}
                max={MAX_ZOOM}
                step={0.01}
                value={crop.zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full"
                aria-label="Zoom"
              />
              <button type="button" onClick={() => zoomBy(-0.25)} className="rounded border px-2 py-1 text-xs font-bold">
                −
              </button>
              <button type="button" onClick={() => zoomBy(0.25)} className="rounded border px-2 py-1 text-xs font-bold">
                +
              </button>
            </div>

            {natural && (
              <p className="mt-2 text-xs font-bold text-black/45">
                Source {natural.width} × {natural.height}px
                {tooSmall && <span className="text-amber-600"> · below the recommended size, it may look soft</span>}
              </p>
            )}
            {error && <p className="mt-2 text-xs font-bold text-red-600">{error}</p>}

            <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
              <button type="button" onClick={closePreview} className="rounded border border-black/10 px-4 py-2 text-sm font-bold">
                Cancel
              </button>
              <button
                type="button"
                disabled={uploading || !natural}
                onClick={uploadPreview}
                className="inline-flex items-center gap-2 rounded bg-coral px-4 py-2 font-black text-white disabled:opacity-50"
              >
                <Check size={16} /> {uploading ? 'Uploading...' : 'Crop and upload'}
              </button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}
    </div>
  );
}

function formatAspect(aspect: number) {
  const known: Array<[number, string]> = [
    [16 / 9, '16:9'],
    [4 / 5, '4:5'],
    [3 / 4, '3:4'],
    [1, '1:1'],
    [4 / 3, '4:3'],
    [3 / 2, '3:2'],
    [21 / 9, '21:9']
  ];
  const match = known.find(([ratio]) => Math.abs(ratio - aspect) < 0.01);
  return match ? match[1] : `${aspect.toFixed(2)}:1`;
}
