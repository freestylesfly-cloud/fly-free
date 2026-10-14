'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FLYFREE_CANNY } from './flyfree';

// Canny is decoration: load it only after the page is interactive, so it never
// competes with the products for the first paint.
const CannyAssistant = dynamic(() => import('./CannyAssistant').then((m) => m.CannyAssistant), { ssr: false });

/** Opens the existing "Ask me anything" chat (StyleAssistant listens for this). */
const config = {
  ...FLYFREE_CANNY,
  onAsk: () => window.dispatchEvent(new Event('flyfree:open-assistant'))
};

export function FlyFreeCanny() {
  const path = usePathname() || '/';
  const [load, setLoad] = useState(false);

  useEffect(() => {
    const start = () => setLoad(true);
    const idle = (window as any).requestIdleCallback as ((cb: () => void, opts?: { timeout: number }) => number) | undefined;
    if (idle) {
      const id = idle(start, { timeout: 3000 });
      return () => (window as any).cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(start, 1500);
    return () => window.clearTimeout(id);
  }, []);

  if (!load) return null;
  return <CannyAssistant config={config} path={path} />;
}
