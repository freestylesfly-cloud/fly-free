import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";

/**
 * "Continue with Google", talking to Google directly — no auth vendor in between.
 *
 * Standard OAuth 2.0 authorization-code flow, with this API as the confidential
 * client (the client secret never leaves the server):
 *
 *   1. The login page sends the browser to GET /api/auth/google with its own
 *      origin, the page to return to, and a random nonce it keeps in
 *      sessionStorage.
 *   2. We redirect to Google with a signed `state` carrying those three values.
 *   3. Google redirects back to <origin>/api/auth/google/callback (the website
 *      proxies /api to this server), we exchange the code for an ID token over
 *      TLS with the client secret, and find or create the user by email.
 *   4. We redirect to <origin>/auth/callback#token=…&nonce=…; the page accepts
 *      the token only if the nonce matches the one it stored, which ties the
 *      login to the tab that started it.
 *
 * The token travels in the URL fragment, which browsers never send to a server,
 * so it does not end up in access logs or Referer headers.
 */

/**
 * Websites allowed to start a Google sign-in. Each must ALSO be registered in
 * Google Cloud → Credentials → the OAuth client → "Authorized redirect URIs" as
 * `<origin>/api/auth/google/callback`. Google does not accept wildcards, which
 * is why preview deployments are not on this list.
 * Override per environment with GOOGLE_AUTH_ORIGINS="https://a,https://b".
 */
const DEFAULT_ORIGINS = [
  "https://flyfree.co.in",
  "https://www.flyfree.co.in",
  "https://fly-free-web.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
];

const STATE_AUDIENCE = "flyfree-google-oauth-state";
const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

export interface GoogleProfile {
  email: string;
  name: string;
  image?: string;
}

interface SignInState {
  origin: string;
  next: string;
  nonce: string;
}

export function allowedOrigins(): string[] {
  const configured = (process.env.GOOGLE_AUTH_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
  return configured.length ? configured : DEFAULT_ORIGINS;
}

/** Where to send someone when the request is too broken to trust its origin. */
export function fallbackOrigin() {
  return allowedOrigins()[0];
}

/** Only same-site paths: "/checkout" yes, "//evil.com" or "https://…" no. */
export function safeNextPath(next: unknown) {
  const path = String(next || "/");
  return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\") ? path.slice(0, 500) : "/";
}

function credentials() {
  const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();
  if (!clientId || !clientSecret) {
    throw new BadRequestException(
      "Google sign-in is not configured: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set on the API server."
    );
  }
  return { clientId, clientSecret };
}

const redirectUriFor = (origin: string) => `${origin}/api/auth/google/callback`;

/** Step 2: the Google consent URL for this sign-in attempt. */
export function buildGoogleAuthorizeUrl(params: { origin: unknown; next: unknown; nonce: unknown }, jwtSecret: string) {
  const origin = String(params.origin || "").replace(/\/$/, "");
  if (!allowedOrigins().includes(origin)) {
    throw new BadRequestException("Google sign-in is not enabled for this website address.");
  }
  const nonce = String(params.nonce || "");
  if (!/^[A-Za-z0-9-]{16,100}$/.test(nonce)) {
    throw new BadRequestException("Sign-in could not be started. Please try again.");
  }

  const { clientId } = credentials();
  const state = jwt.sign(
    { origin, next: safeNextPath(params.next), nonce, r: randomBytes(8).toString("hex") } satisfies SignInState & { r: string },
    jwtSecret,
    { audience: STATE_AUDIENCE, expiresIn: "10m" }
  );

  const url = new URL(GOOGLE_AUTHORIZE_URL);
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUriFor(origin),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account"
  }).toString();
  return url.toString();
}

/** Reads back the signed state. Throws if it was forged, altered or is stale. */
export function readSignInState(state: unknown, jwtSecret: string): SignInState {
  try {
    const decoded = jwt.verify(String(state || ""), jwtSecret, { audience: STATE_AUDIENCE }) as any;
    if (!allowedOrigins().includes(decoded.origin)) throw new Error("origin");
    return { origin: decoded.origin, next: safeNextPath(decoded.next), nonce: String(decoded.nonce || "") };
  } catch {
    throw new UnauthorizedException("This sign-in link has expired. Please try again.");
  }
}

/** Step 3: exchanges Google's one-time code for the user's verified profile. */
export async function exchangeCodeForProfile(code: unknown, origin: string): Promise<GoogleProfile> {
  const { clientId, clientSecret } = credentials();
  if (!code) throw new UnauthorizedException("Google did not return a sign-in code.");

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: String(code),
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUriFor(origin),
      grant_type: "authorization_code"
    }),
    signal: AbortSignal.timeout(10000)
  });
  const body: any = await response.json().catch(() => null);
  if (!response.ok || !body?.id_token) {
    throw new UnauthorizedException(
      body?.error === "invalid_client"
        ? "Google rejected the client credentials. Check GOOGLE_CLIENT_SECRET on the API server."
        : "Google sign-in could not be completed. Please try again."
    );
  }

  // The ID token came straight from Google's token endpoint over TLS, in
  // exchange for our client secret, so its signature does not need checking
  // again (OpenID Connect Core §3.1.3.7). Its claims still do.
  const claims = decodeJwtPayload(body.id_token);
  if (!GOOGLE_ISSUERS.includes(claims.iss) || claims.aud !== clientId || Number(claims.exp) * 1000 < Date.now()) {
    throw new UnauthorizedException("Google sign-in could not be verified.");
  }
  // An unverified address could belong to someone else — and accounts here are
  // matched by email, so accepting it would hand them that person's account.
  if (!claims.email || claims.email_verified !== true) {
    throw new UnauthorizedException("Your Google account's email address is not verified.");
  }

  const email = String(claims.email);
  return {
    email,
    name: String(claims.name || [claims.given_name, claims.family_name].filter(Boolean).join(" ") || email.split("@")[0]).trim(),
    image: claims.picture ? String(claims.picture) : undefined
  };
}

function decodeJwtPayload(token: string): any {
  try {
    return JSON.parse(Buffer.from(String(token).split(".")[1] || "", "base64url").toString("utf8"));
  } catch {
    throw new UnauthorizedException("Google returned an unreadable sign-in token.");
  }
}
