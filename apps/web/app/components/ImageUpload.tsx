'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, X, ZoomIn, ZoomOut, RotateCw, Crop, Check } from 'lucide-react';
import { uploadImage, deleteImage } from '../../lib/supabase';

interface ImageUploadProps {
  bucket: string;
  folder?: string;
  onUpload: (url: string) => void;
  onRemove?: (url: string) => void;
  maxSize?: number; // in MB
  acceptedFormats?: string[];
  multiple?: boolean;
  initialImage?: string;
}

export function ImageUpload({
  bucket,
  folder = '',
  onUpload,
  onRemove,
  maxSize = 10,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  multiple = false,
  initialImage = ''
}: ImageUploadProps) {
  const [images, setImages] = useState<string[]>(initialImage ? [initialImage] : []);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cropMode, setCropMode] = useState(false);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const files = e.target.files;
    if (!files) return;

    const file = files[0];

    // Validate file type
    if (!acceptedFormats.includes(file.type)) {
      setError(`Invalid format. Accepted: ${acceptedFormats.join(', ')}`);
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size exceeds ${maxSize}MB limit`);
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewImage(event.target?.result as string);
      setCropMode(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCrop = async () => {
    if (!canvasRef.current || !imageRef.current || !selectedFile) return;

    try {
      setLoading(true);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = imageRef.current;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
      ctx.drawImage(img, 0, 0);
      ctx.restore();

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const croppedFile = new File([blob], selectedFile.name, {
          type: selectedFile.type,
        });

        // Upload to Supabase
        const url = await uploadImage(bucket, croppedFile, folder);

        if (multiple) {
          setImages([...images, url]);
        } else {
          if (images[0]) {
            await deleteImage(bucket, images[0]);
          }
          setImages([url]);
        }

        onUpload(url);
        setCropMode(false);
        setPreviewImage('');
        setSelectedFile(null);
        setScale(1);
        setRotation(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, selectedFile.type);
    } catch (err) {
      setError('Failed to upload image. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = async (url: string) => {
    try {
      setLoading(true);
      await deleteImage(bucket, url);
      setImages(images.filter(img => img !== url));
      onRemove?.(url);
    } catch (err) {
      setError('Failed to delete image. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCrop = () => {
    setCropMode(false);
    setPreviewImage('');
    setSelectedFile(null);
    setScale(1);
    setRotation(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .image-upload-container {
          animation: fadeIn 0.3s ease;
        }

        .preview-image {
          animation: fadeIn 0.3s ease;
        }

        .upload-area {
          border: 2px dashed var(--border-color);
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background-color: var(--bg-tertiary);
        }

        .upload-area:hover {
          border-color: var(--color-primary);
          background-color: var(--bg-tertiary);
        }

        .upload-area.drag-active {
          border-color: var(--color-primary);
          background-color: var(--color-primary);
          background-opacity: 0.1;
        }

        .crop-container {
          position: relative;
          max-width: 100%;
          max-height: 400px;
          overflow: hidden;
          border-radius: 12px;
          background: #000;
        }

        .crop-image {
          width: 100%;
          height: auto;
          display: block;
          transform-origin: center;
        }

        .controls-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 8px;
        }

        .control-button {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .control-button:hover {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }

        .control-button.primary {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }

        .image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px;
        }

        .image-item {
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          aspect-ratio: 1;
          animation: fadeIn 0.3s ease;
        }

        .image-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-remove {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 32px;
          height: 32px;
          background: rgba(0, 0, 0, 0.7);
          border: none;
          border-radius: 6px;
          color: white;
          cursor: pointer;
          opacity: 0;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .image-item:hover .image-remove {
          opacity: 1;
        }

        .image-remove:hover {
          background: rgba(255, 107, 91, 0.9);
        }

        .slider-control {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .slider-control input {
          flex: 1;
          height: 6px;
          border-radius: 3px;
          background: var(--border-color);
          outline: none;
          -webkit-appearance: none;
        }

        .slider-control input::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--color-primary);
          cursor: pointer;
        }

        .slider-control input::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--color-primary);
          cursor: pointer;
          border: none;
        }
      `}</style>

      {/* Crop Mode */}
      {cropMode ? (
        <div className="image-upload-container rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h3 className="text-lg font-bold mb-4">Edit Image</h3>

          <div className="crop-container mb-6">
            <img
              ref={imageRef}
              src={previewImage}
              alt="Crop preview"
              className="crop-image"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
              }}
            />
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Zoom Control */}
            <div className="slider-control">
              <ZoomOut size={18} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
              />
              <ZoomIn size={18} style={{ color: 'var(--text-secondary)' }} />
              <span className="text-sm font-bold" style={{ minWidth: '40px' }}>{scale.toFixed(1)}x</span>
            </div>

            {/* Rotation Control */}
            <div className="slider-control">
              <RotateCw size={18} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="range"
                min="0"
                max="360"
                step="15"
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value))}
              />
              <span className="text-sm font-bold" style={{ minWidth: '40px' }}>{rotation}°</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelCrop}
                className="flex-1 control-button"
              >
                <X size={16} /> Cancel
              </button>
              <button
                onClick={handleCrop}
                disabled={loading}
                className="flex-1 control-button primary"
              >
                <Check size={16} /> {loading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Upload Area */}
          <div
            className="upload-area"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const files = e.dataTransfer.files;
              if (files) {
                const input = fileInputRef.current;
                if (input) {
                  input.files = files;
                  handleFileSelect({ target: input } as any);
                }
              }
            }}
          >
            <Upload size={32} style={{ color: 'var(--color-primary)', margin: '0 auto 8px' }} />
            <p className="font-bold mb-2">Drop images here or click to select</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Supported: JPEG, PNG, WebP (Max {maxSize}MB)
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept={acceptedFormats.join(',')}
            onChange={handleFileSelect}
          />

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(255, 107, 91, 0.1)', color: 'var(--accent-primary)' }}>
              {error}
            </div>
          )}

          {/* Image Preview Grid */}
          {images.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-3 uppercase" style={{ color: 'var(--text-secondary)' }}>
                Uploaded Images ({images.length})
              </h3>
              <div className="image-grid">
                {images.map((url, idx) => (
                  <div key={idx} className="image-item">
                    <img src={url} alt={`Upload ${idx + 1}`} />
                    <button
                      onClick={() => handleRemoveImage(url)}
                      disabled={loading}
                      className="image-remove"
                      title="Delete image"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
