/**
 * "Continue with Google", handled by our own API — no auth vendor in between.
 *
 * The flow lives in services/api/src/auth/google-oauth.ts. This side only
 * starts it and checks how it ended: a random nonce is kept in sessionStorage
 * before leaving for Google, and the token that comes back is accepted only if
 * it carries the same nonce. That ties every sign-in to the tab that started
 * it, so nobody can complete one on someone else's behalf.
 */

const NONCE_KEY = 'flyfree_google_nonce';

export function startGoogleSignIn(nextPath = '/') {
  const nonce = crypto.randomUUID();
  try {
    sessionStorage.setItem(NONCE_KEY, nonce);
  } catch {
    throw new Error('Your browser blocked sign-in storage. Allow site data for flyfree.co.in and try again.');
  }

  const params = new URLSearchParams({ origin: window.location.origin, next: nextPath, nonce });
  // Same-origin /api is proxied to the API (next.config.ts rewrites), so Google
  // returns to this website's address, which is what is registered with Google.
  window.location.assign(`/api/auth/google?${params}`);
}

export type GoogleSignInResult =
  | { ok: true; token: string; next: string }
  | { ok: false; error: string };

/** Reads the result the API put in the URL fragment, then wipes it from the address bar. */
export function readGoogleSignInResult(): GoogleSignInResult | null {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  // The token must not linger in the address bar, history or a shared link.
  window.history.replaceState(null, '', window.location.pathname + window.location.search);

  let expected: string | null = null;
  try {
    expected = sessionStorage.getItem(NONCE_KEY);
    sessionStorage.removeItem(NONCE_KEY);
  } catch {
    // Treated as a mismatch below.
  }

  const error = params.get('error');
  if (error) return { ok: false, error };

  const token = params.get('token');
  if (!token) return null;
  if (!expected || params.get('nonce') !== expected) {
    return { ok: false, error: 'This sign-in was started in a different tab or browser. Please try again from here.' };
  }

  const next = params.get('next') || '/';
  return { ok: true, token, next: next.startsWith('/') && !next.startsWith('//') ? next : '/' };
}
