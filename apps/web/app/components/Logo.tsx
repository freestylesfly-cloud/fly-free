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

  // Constrained by HEIGHT with the width left to follow, because the mark is much
  // wider than it is tall and a square box would scale it down to fit the wrong
  // dimension.
  //
  // That makes the height budget the whole story: whatever empty canvas the file
  // carries is scaled along with the artwork. The source is kept cropped to the
  // ink for exactly this reason — an earlier 2000x2000 export had the mark filling
  // 38% of its height, so a 42px box drew it at 16px. If the logo ever looks small
  // again, measure the file before touching these numbers.
  const height = { sm: 30, md: 44, lg: 60 }[size];
  const imageStyle: React.CSSProperties = {
    height,
    width: 'auto',
    // Wide enough for a ~2.5:1 mark at `lg`; stops an unexpectedly wide file from
    // pushing the header's other controls off the row.
    maxWidth: '260px'
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
