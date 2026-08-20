'use client';

import { useEffect } from 'react';

export function ContentProtection() {
  const enabled =
    process.env.NODE_ENV === 'production' ||
    process.env.NEXT_PUBLIC_ENABLE_CONTENT_PROTECTION === 'true';

  useEffect(() => {
    if (!enabled) return;

    const protectedShortcuts = new Set(['f12']);
    const isProtectedMedia = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return Boolean(target.closest('img, video, picture, [data-protected-media]'));
    };

    const stopMediaSave = (event: Event) => {
      if (isProtectedMedia(event.target) || event.type === 'contextmenu') {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const stopMediaCopy = (event: ClipboardEvent) => {
      const selection = window.getSelection();
      const selectionHasMedia = Array.from({ length: selection?.rangeCount ?? 0 }).some((_, index) => {
        const fragment = selection?.getRangeAt(index).cloneContents();
        return Boolean(fragment?.querySelector?.('img, video, picture, [data-protected-media]'));
      });

      if (!selectionHasMedia && !isProtectedMedia(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
    };

    const stopInspectionShortcuts = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const protectedCombo =
        protectedShortcuts.has(key) ||
        (event.ctrlKey && event.shiftKey && ['i', 'j', 'c'].includes(key)) ||
        (event.metaKey && event.altKey && ['i', 'j', 'c'].includes(key)) ||
        (event.ctrlKey && ['s', 'p', 'u'].includes(key)) ||
        (event.metaKey && ['s', 'p', 'u'].includes(key)) ||
        key === 'printscreen';

      if (!protectedCombo) return;
      event.preventDefault();
      event.stopPropagation();

      if (key === 'printscreen' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText('Screenshots are disabled on Fly Free product pages.').catch(() => {});
      }
    };

    document.addEventListener('contextmenu', stopMediaSave, true);
    document.addEventListener('dragstart', stopMediaSave, true);
    document.addEventListener('copy', stopMediaCopy, true);
    document.addEventListener('cut', stopMediaCopy, true);
    document.addEventListener('keydown', stopInspectionShortcuts, true);

    return () => {
      document.removeEventListener('contextmenu', stopMediaSave, true);
      document.removeEventListener('dragstart', stopMediaSave, true);
      document.removeEventListener('copy', stopMediaCopy, true);
      document.removeEventListener('cut', stopMediaCopy, true);
      document.removeEventListener('keydown', stopInspectionShortcuts, true);
    };
  }, [enabled]);

  return null;
}
