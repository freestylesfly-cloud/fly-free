'use client';

import { useState, useEffect } from 'react';

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

  // The brand mark is 1920x1080 (16:9), so it must be constrained by HEIGHT and
  // allowed to take its natural width. Forcing it into a square box shrinks it
  // to a fraction of the available space.
  const height = { sm: 30, md: 42, lg: 60 }[size];
  const imageStyle: React.CSSProperties = {
    height,
    width: 'auto',
    maxWidth: '240px',
    objectFit: 'contain'
  };

  useEffect(() => {
    // Only try to fetch API logo if not already failed
    if (hasError) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 800);

    fetch('/api/cms/settings/logo', { signal: controller.signal })
      .then(res => res.json())
      .then((data: any) => {
        // Ignore the legacy "/logo.png" default; the real asset lives in /brand.
        const url = String(data?.logoUrl || '').trim();
        if (url && url !== '/logo.png') {
          setLogoSrc(url);
          setHasError(false);
        } else {
          setHasError(true);
        }
      })
      .catch((error) => {
        console.warn('Logo fetch failed, using local fallback:', error);
        setHasError(true);
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [hasError]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {logoSrc && !hasError ? (
        <img
          src={logoSrc}
          alt="Fly Free"
          style={imageStyle}
          onError={() => setHasError(true)}
        />
      ) : (
        <img src="/brand/logo.png" alt="Fly Free" style={imageStyle} />
      )}
      {showText && size !== 'sm' && (
        <span className="font-black text-xl" style={{ color: 'var(--color-primary)' }}>
          Fly Free
        </span>
      )}
    </div>
  );
}
