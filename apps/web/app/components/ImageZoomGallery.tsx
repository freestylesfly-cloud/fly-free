'use client';

import { useState, useRef, useEffect } from 'react';
import { Shirt, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageZoomGalleryProps {
  images: Array<{ url: string; alt?: string; type?: 'front' | 'back' | 'detail' }>;
  productName: string;
  className?: string;
}

export function ImageZoomGallery({ images, productName, className = '' }: ImageZoomGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

  const currentImage = images[currentImageIndex];
  const hasMultipleImages = images.length > 1;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !isZoomed) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setZoomPosition({
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y))
    });
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const getDominantView = (imageList: Array<{ url: string; alt?: string; type?: 'front' | 'back' | 'detail' }>) => {
    const front = imageList.find((img) => img.type === 'front');
    const back = imageList.find((img) => img.type === 'back');
    return { front, back };
  };

  const { front, back } = getDominantView(images);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Image Display */}
      <div
        ref={imageRef}
        className="relative aspect-[4/5] overflow-hidden rounded-lg cursor-zoom-in group transition-all"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
      >
        {currentImage?.url ? (
          <>
            <img
              src={currentImage.url}
              alt={currentImage.alt || productName}
              className="w-full h-full object-cover"
              style={{
                transform: isZoomed ? `scale(1.8) translate(${(zoomPosition.x - 0.5) * 40}%, ${(zoomPosition.y - 0.5) * 40}%)` : 'scale(1)',
                transformOrigin: `${zoomPosition.x * 100}% ${zoomPosition.y * 100}%`,
                transition: isZoomed ? 'none' : 'transform 0.3s ease-out'
              }}
            />
            {isZoomed && (
              <div className="absolute inset-0 border-2 border-white/50 pointer-events-none rounded-lg" />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Shirt size={54} strokeWidth={1.5} style={{ color: 'var(--text-tertiary)' }} />
          </div>
        )}

        {/* Zoom Indicator */}
        <div className="absolute top-3 right-3 rounded-full p-2 bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn size={16} />
        </div>

        {/* Navigation Arrows */}
        {hasMultipleImages && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-2 bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/40"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/40"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Image Counter */}
        {hasMultipleImages && (
          <div className="absolute bottom-3 left-3 rounded px-2 py-1 text-xs font-bold text-white" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            {currentImageIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Grid */}
      {hasMultipleImages && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((image, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentImageIndex(idx)}
              className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                currentImageIndex === idx ? 'border-white' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: currentImageIndex === idx ? 'var(--color-primary)' : 'transparent'
              }}
              aria-label={`View image ${idx + 1}: ${image.alt || productName}`}
            >
              {image.url ? (
                <img src={image.url} alt={image.alt || `${productName} view ${idx + 1}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Shirt size={16} opacity={0.5} />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* View Type Labels */}
      {(front || back) && (
        <div className="flex gap-2 text-xs font-bold">
          {front && (
            <span className="px-3 py-1 rounded-full text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
              👕 Front View
            </span>
          )}
          {back && (
            <span className="px-3 py-1 rounded-full text-white" style={{ backgroundColor: 'var(--color-primary)', opacity: 0.7 }}>
              🔄 Back View
            </span>
          )}
        </div>
      )}
    </div>
  );
}
