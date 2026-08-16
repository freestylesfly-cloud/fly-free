'use client';

import { useEffect, useState } from 'react';

export function ContentProtection() {
  const [locked, setLocked] = useState(false);
  const enabled =
    process.env.NODE_ENV === 'production' ||
    process.env.NEXT_PUBLIC_ENABLE_CONTENT_PROTECTION === 'true';

  useEffect(() => {
    if (!enabled) return;

    const protectedShortcuts = new Set(['f12']);
    const isProtectedMedia = (target: EventTarget | null) =>
      target instanceof HTMLElement && Boolean(target.closest('img, video, picture'));

    const stopBrowserCopy = (event: Event) => {
      event.preventDefault();
    };

    const stopMediaSave = (event: Event) => {
      if (isProtectedMedia(event.target) || event.type === 'contextmenu') {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const stopInspectionShortcuts = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const protectedCombo =
        protectedShortcuts.has(key) ||
        (event.ctrlKey && event.shiftKey && ['i', 'j', 'c'].includes(key)) ||
        (event.metaKey && event.altKey && ['i', 'j', 'c'].includes(key)) ||
        (event.ctrlKey && ['a', 'c', 's', 'p', 'u', 'x'].includes(key)) ||
        (event.metaKey && ['a', 'c', 's', 'p', 'u', 'x'].includes(key)) ||
        key === 'printscreen';

      if (!protectedCombo) return;
      event.preventDefault();
      event.stopPropagation();

      if (key === 'printscreen' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText('Screenshots are disabled on Fly Free product pages.').catch(() => {});
      }
    };

    const detectDevTools = () => {
      const threshold = 170;
      const widthGap = Math.abs(window.outerWidth - window.innerWidth);
      const heightGap = Math.abs(window.outerHeight - window.innerHeight);
      setLocked(widthGap > threshold || heightGap > threshold);
    };

    document.addEventListener('contextmenu', stopMediaSave, true);
    document.addEventListener('dragstart', stopMediaSave, true);
    document.addEventListener('copy', stopBrowserCopy, true);
    document.addEventListener('cut', stopBrowserCopy, true);
    document.addEventListener('keydown', stopInspectionShortcuts, true);
    window.addEventListener('resize', detectDevTools);

    const timer = window.setInterval(detectDevTools, 1000);
    detectDevTools();

    return () => {
      document.removeEventListener('contextmenu', stopMediaSave, true);
      document.removeEventListener('dragstart', stopMediaSave, true);
      document.removeEventListener('copy', stopBrowserCopy, true);
      document.removeEventListener('cut', stopBrowserCopy, true);
      document.removeEventListener('keydown', stopInspectionShortcuts, true);
      window.removeEventListener('resize', detectDevTools);
      window.clearInterval(timer);
    };
  }, [enabled]);

  if (!enabled || !locked) return null;

  return (
    <div
      className="fixed inset-0 z-[2147483647] grid place-items-center bg-white px-6 text-center"
      style={{ color: 'var(--text-primary)' }}
    >
      <div className="max-w-sm">
        <p className="text-lg font-black uppercase">Protected content</p>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Close developer tools to continue viewing Fly Free products.
        </p>
      </div>
    </div>
  );
}
