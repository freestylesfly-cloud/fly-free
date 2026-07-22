'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@flyfree/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export function Logo({
  size = 'md',
  className = '',
  showText = true
}: LogoProps) {
  const [logoSrc, setLogoSrc] = useState<string>('/logo.png');
  const [loaded, setLoaded] = useState(false);

  const dimensions = {
    sm: { width: 40, height: 40 },
    md: { width: 56, height: 56 },
    lg: { width: 80, height: 80 }
  };

  const { width, height } = dimensions[size];

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 800);

    apiClient.get('/cms/settings/logo', { signal: controller.signal })
      .then(({ data, error }) => {
        if (error) {
          console.warn('Logo fetch failed, using local fallback:', error);
          return;
        }
        if (data?.logoUrl) {
          setLogoSrc(data.logoUrl);
        } else {
          console.warn('Logo endpoint returned no logoUrl, using local fallback.');
        }
      })
      .catch((error) => {
        console.warn('Logo fetch failed, using local fallback:', error);
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });
  }, []);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {logoSrc.startsWith('/') || !logoSrc ? (
        // Fallback: Show text-based logo when no image available
        <div
          className="flex items-center justify-center rounded-lg font-black text-white"
          style={{
            width,
            height,
            backgroundColor: 'var(--color-primary)',
            fontSize: size === 'sm' ? '14px' : size === 'md' ? '20px' : '28px'
          }}
        >
          FF
        </div>
      ) : (
        <img
          src={logoSrc}
          alt="Logo"
          width={width}
          height={height}
          onError={() => {
            console.warn('Logo image failed to load, falling back to text logo.');
            setLogoSrc('');
          }}
          style={{
            width,
            height,
            objectFit: 'contain'
          }}
        />
      )}
      {showText && size !== 'sm' && (
        <span className="font-black text-xl" style={{ color: 'var(--color-primary)' }}>
          Fly Free
        </span>
      )}
    </div>
  );
}
