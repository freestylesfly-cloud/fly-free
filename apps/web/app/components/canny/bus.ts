import type { CannyOutfitStyle } from './CannyBird';

/**
 * How pages talk to Canny without importing it.
 *
 * Canny is loaded lazily, after the page, so a page may announce an outfit
 * before Canny exists. The latest outfit is kept here and read on mount.
 */

const OUTFIT_EVENT = 'canny:outfit';
const SAY_EVENT = 'canny:say';

let currentOutfit: CannyOutfitStyle | null = null;

export function setCannyOutfit(outfit: CannyOutfitStyle | null) {
  currentOutfit = outfit;
  window.dispatchEvent(new CustomEvent(OUTFIT_EVENT, { detail: outfit }));
}

export function getCannyOutfit() {
  return currentOutfit;
}

export function onCannyOutfit(listener: (outfit: CannyOutfitStyle | null) => void) {
  const handler = (event: Event) => listener((event as CustomEvent).detail ?? null);
  window.addEventListener(OUTFIT_EVENT, handler);
  return () => window.removeEventListener(OUTFIT_EVENT, handler);
}

/** Lets any page make Canny say something, e.g. after adding to cart. */
export function cannySay(text: string) {
  window.dispatchEvent(new CustomEvent(SAY_EVENT, { detail: text }));
}

export function onCannySay(listener: (text: string) => void) {
  const handler = (event: Event) => listener(String((event as CustomEvent).detail || ''));
  window.addEventListener(SAY_EVENT, handler);
  return () => window.removeEventListener(SAY_EVENT, handler);
}
