'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@flyfree/utils';
import Image from 'next/image';

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
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  const dimensions = {
    sm: { width: 48, height: 48 },
    md: { width: 72, height: 72 },
    lg: { width: 100, height: 100 }
  };

  const { width, height } = dimensions[size];

  useEffect(() => {
    // Only try to fetch API logo if not already failed
    if (hasError) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 800);

    apiClient.get('/cms/settings/logo', { signal: controller.signal })
      .then(({ data, error }) => {
        if (error) {
          console.warn('Logo fetch failed, using local fallback');
          setHasError(true);
          return;
        }
        if (data?.logoUrl && data.logoUrl.trim()) {
          setLogoSrc(data.logoUrl);
          setHasError(false);
        } else {
          setHasError(true);
        }
      })
      .catch(() => {
        setHasError(true);
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });

    return () => clearTimeout(timeoutId);
  }, [hasError]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {logoSrc && !hasError ? (
        // API logo loaded successfully
        <img
          src={logoSrc}
          alt="Logo"
          width={width}
          height={height}
          onError={() => {
            console.warn('API Logo image failed to load, using local logo');
            setHasError(true);
          }}
          style={{
            width,
            height,
            objectFit: 'contain'
          }}
        />
      ) : (
        // Fallback: Use local public logo
        <img
          src="/logo.png"
          alt="Fly Free Logo"
          width={width}
          height={height}
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
