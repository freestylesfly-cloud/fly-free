'use client';

import { useEffect } from 'react';

export function ContentProtection() {
  useEffect(() => {
    const protectedShortcuts = new Set(['f12']);
    const isProtectedMedia = (target: EventTarget | null) =>
      target instanceof HTMLElement && Boolean(target.closest('img, video, picture'));

    const stopMediaSave = (event: Event) => {
      if (!isProtectedMedia(event.target)) return;
      event.preventDefault();
    };

    const stopInspectionShortcuts = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const protectedCombo =
        protectedShortcuts.has(key) ||
        (event.ctrlKey && event.shiftKey && ['i', 'j', 'c'].includes(key)) ||
        (event.metaKey && event.altKey && ['i', 'j', 'c'].includes(key)) ||
        (event.ctrlKey && ['u', 's', 'p'].includes(key)) ||
        (event.metaKey && ['u', 's', 'p'].includes(key)) ||
        key === 'printscreen';

      if (!protectedCombo) return;
      event.preventDefault();
    };

    document.addEventListener('contextmenu', stopMediaSave);
    document.addEventListener('dragstart', stopMediaSave);
    document.addEventListener('keydown', stopInspectionShortcuts);

    return () => {
      document.removeEventListener('contextmenu', stopMediaSave);
      document.removeEventListener('dragstart', stopMediaSave);
      document.removeEventListener('keydown', stopInspectionShortcuts);
    };
  }, []);

  return null;
}
