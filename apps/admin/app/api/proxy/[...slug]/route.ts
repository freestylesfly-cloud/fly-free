/**
 * API Proxy Route (Admin)
 * Proxies requests to the backend API and keeps the admin JWT in an HttpOnly
 * cookie instead of browser-readable localStorage.
 */

const API_BASE = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
const ADMIN_COOKIE = 'flyfree_admin_session';

function readCookie(request: Request, name: string) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.slice(name.length + 1)) : '';
}

function sessionCookie(token: string, maxAge: number) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${ADMIN_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

async function proxy(request: Request, params: any, method: string) {
  const resolvedParams = await params;
  const slug = Array.isArray(resolvedParams.slug) ? resolvedParams.slug : [resolvedParams.slug];
  const path = slug.join('/');
  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();
  const fullUrl = `${API_BASE}/api/${path}${searchParams ? `?${searchParams}` : ''}`;
  const body = method === 'GET' || method === 'DELETE' ? undefined : await request.text();
  const incomingAuth = request.headers.get('authorization');
  const cookieToken = readCookie(request, ADMIN_COOKIE);
  const authorization = incomingAuth || (cookieToken ? `Bearer ${cookieToken}` : '');

  try {
    const response = await fetch(fullUrl, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': request.headers.get('content-type') || 'application/json' } : {}),
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body,
    });

    const contentType = response.headers.get('content-type') || 'application/json';
    const bodyBuffer = await response.arrayBuffer();
    let text = contentType.includes('application/json') ? new TextDecoder().decode(bodyBuffer) : '';
    const headers = new Headers({ 'Content-Type': contentType });
    const disposition = response.headers.get('content-disposition');
    if (disposition) headers.set('Content-Disposition', disposition);
    let parsed: any = null;

    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = null;
    }

    if (path === 'auth/admin/login' && response.ok && parsed?.token) {
      headers.append('Set-Cookie', sessionCookie(parsed.token, 60 * 60 * 24 * 7));
      delete parsed.token;
      text = JSON.stringify(parsed);
    }

    if (path === 'auth/admin/logout') {
      headers.append('Set-Cookie', sessionCookie('', 0));
    }

    const responseBody = text ? text : bodyBuffer.byteLength ? bodyBuffer : '{}';
    return new Response(responseBody, { status: response.status, headers });
  } catch (error) {
    console.error('Proxy error:', error);
    const message = error instanceof Error ? error.message : 'Unknown proxy error';
    return new Response(JSON.stringify({ error: `Failed to fetch from API: ${message}`, upstream: fullUrl }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(request: Request, { params }: any) {
  return proxy(request, params, 'GET');
}

export async function POST(request: Request, { params }: any) {
  return proxy(request, params, 'POST');
}

export async function PUT(request: Request, { params }: any) {
  return proxy(request, params, 'PUT');
}

export async function PATCH(request: Request, { params }: any) {
  return proxy(request, params, 'PATCH');
}

export async function DELETE(request: Request, { params }: any) {
  return proxy(request, params, 'DELETE');
}
