/**
 * Small in-process cache for public, read-only storefront responses.
 *
 * The web app fetched these with `cache: "no-store"` and the browser talks straight
 * to this API, so without this every page view by every visitor became a fresh set
 * of Neon queries. One homepage view alone pulled roughly 920 KB across nine
 * endpoints. None of it is per-user and it only changes when an admin edits it, so
 * holding results in memory for a short window removes nearly all of that database
 * traffic — which is what the hosting network-transfer quota is spent on.
 *
 * Deliberately in-process: no Redis to pay for or run. If the API scales to more
 * than one replica each keeps its own copy, which only means staleness stays
 * bounded by the TTL per replica rather than being shared.
 *
 * Only public data belongs here. Never cache a response that varies per user.
 *
 * Stock is included in cached payloads, which is safe because checkout re-reads
 * inventory from the database before taking payment. A shopper may briefly see a
 * just-sold-out item and gets a clear message at checkout rather than an oversell.
 */

const TTL_MS = 60_000;

/** Bounds memory: filter combinations are open-ended, so the map cannot grow freely. */
const MAX_ENTRIES = 300;

type Entry = { value: unknown; expiresAt: number };

const store = new Map<string, Entry>();

/** Seconds, for the matching HTTP `Cache-Control` header on these responses. */
export const PUBLIC_CACHE_SECONDS = TTL_MS / 1000;

/**
 * Returns a cached value for `key`, otherwise runs `load` and caches it.
 *
 * Callers must treat the result as read-only: entries are shared by reference
 * with every other caller until they expire.
 */
export async function cachedPublicRead<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.value as T;
  }

  const value = await load();

  if (store.size >= MAX_ENTRIES) {
    store.clear();
  }
  store.set(key, { value, expiresAt: Date.now() + TTL_MS });

  return value;
}

/** Sentinel: distinguishes "not cached" from a cached `undefined`/`null`. */
export const CACHE_MISS = Symbol("public-cache-miss");

/** Reads without populating. Returns {@link CACHE_MISS} when absent or expired. */
export function peekPublicCache(key: string): unknown | typeof CACHE_MISS {
  const hit = store.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.value;
  }
  return CACHE_MISS;
}

/** Stores a value under `key` for the standard TTL. */
export function putPublicCache(key: string, value: unknown): void {
  if (store.size >= MAX_ENTRIES) {
    store.clear();
  }
  store.set(key, { value, expiresAt: Date.now() + TTL_MS });
}

/**
 * Drops every cached public read.
 *
 * Must be called after any admin write that changes what the storefront shows,
 * otherwise an edit appears to do nothing for up to a minute.
 */
export function invalidatePublicCache(): void {
  store.clear();
}

/** Exposed for diagnostics and tests. */
export function publicCacheSize(): number {
  return store.size;
}
