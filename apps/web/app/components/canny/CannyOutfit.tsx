'use client';

import { useEffect } from 'react';
import { setCannyOutfit } from './bus';

/**
 * Dresses Canny for the page it is on. Render it anywhere on a page:
 *   <CannyOutfit color={theme.primaryColor} label={theme.name} />
 * Canny changes into it, and back into the default tee when the page unmounts.
 */
export function CannyOutfit({ color, label, textColor }: { color: string; label: string; textColor?: string }) {
  useEffect(() => {
    setCannyOutfit({ color, label, textColor });
    return () => setCannyOutfit(null);
  }, [color, label, textColor]);
  return null;
}
