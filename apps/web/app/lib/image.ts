/**
 * Serve Supabase Storage images through the Next image optimizer.
 *
 * Supabase bills every read of a public object as egress — including reads that
 * its CDN serves from cache. Pointing `<img src>` straight at the bucket meant
 * each visitor re-downloaded every full-size original on every page view, which
 * is what pushed the project 1,162% over its free egress quota.
 *
 * Rewriting the URL through `/_next/image` puts Vercel's CDN in front: Supabase
 * is read once per image, and every later request is served (and resized) by
 * Vercel. Non-Supabase URLs and local `/public` assets are returned untouched.
 */

const SUPABASE_PUBLIC_OBJECT = /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//i;

/**
 * Widths the optimizer accepts, mirroring `deviceSizes` + `imageSizes` in
 * next.config.ts. Anything not on this list is rejected with a 400, so a
 * requested width is rounded UP to the nearest entry.
 */
const ALLOWED_WIDTHS = [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920];

/** Rendered widths, named for where they are used rather than by number. */
export const IMAGE_WIDTH = {
  /** Colour swatches and cart line-item thumbnails. */
  thumb: 96,
  /** Gallery strips and small avatars. */
  small: 256,
  /** Product grid and carousel cards. */
  card: 640,
  /** Product detail main image. */
  detail: 1080,
  /** Full-bleed hero art. */
  hero: 1920
} as const;

export function storageImage(
  url: string | null | undefined,
  width: number = IMAGE_WIDTH.card,
  quality = 70
): string {
  if (!url) return "";
  // Leave data URIs, blob previews, local assets and third-party hosts alone;
  // only Supabase objects are both billable and safe to treat as immutable.
  if (!SUPABASE_PUBLIC_OBJECT.test(url)) return url;

  const resolved = ALLOWED_WIDTHS.find((candidate) => candidate >= width) ?? ALLOWED_WIDTHS.at(-1)!;
  return `/_next/image?url=${encodeURIComponent(url)}&w=${resolved}&q=${quality}`;
}
