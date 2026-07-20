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
  const [logoSrc, setLogoSrc] = useState<string>('/logo.png');
  const [loaded, setLoaded] = useState(false);

  const dimensions = {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 }
  };

  const { width, height } = dimensions[size];

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 800);

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/cms/settings/logo`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    })
      .then(res => res.ok ? res.json() : null)
      .then((data) => {
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
      <img
        src={logoSrc}
        alt="Logo"
        width={width}
        height={height}
        onError={() => {
          console.warn('Logo image failed to load, falling back to local logo.');
          setLogoSrc('/logo.png');
        }}
        style={{
          width,
          height,
          objectFit: 'contain'
        }}
      />
      {showText && size !== 'sm' && (
        <span className="font-black text-lg" style={{ color: 'var(--color-primary)' }}>
          Fly Free
        </span>
      )}
    </div>
  );
}
