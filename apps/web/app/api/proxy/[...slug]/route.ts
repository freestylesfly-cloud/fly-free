/**
 * API Proxy Route
 * Proxies requests to the backend API to bypass CORS issues
 * Usage: /api/proxy/cms/home -> backend /api/cms/home
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(
  request: Request,
  { params }: any
) {
  const resolvedParams = await params;
  const slug = Array.isArray(resolvedParams.slug) ? resolvedParams.slug : [resolvedParams.slug];
  const path = slug.join('/');
  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();

  const fullUrl = `${API_BASE}/api/${path}${searchParams ? `?${searchParams}` : ''}`;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Forward Authorization header if present
    const auth = request.headers.get('authorization');
    if (auth) {
      headers['Authorization'] = auth;
    }

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch from API' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function POST(
  request: Request,
  { params }: any
) {
  const resolvedParams = await params;
  const slug = Array.isArray(resolvedParams.slug) ? resolvedParams.slug : [resolvedParams.slug];
  const path = slug.join('/');
  const fullUrl = `${API_BASE}/api/${path}`;
  const body = await request.text();

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const auth = request.headers.get('authorization');
    if (auth) {
      headers['Authorization'] = auth;
    }

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers,
      body,
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch from API' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: any
) {
  const resolvedParams = await params;
  const slug = Array.isArray(resolvedParams.slug) ? resolvedParams.slug : [resolvedParams.slug];
  const path = slug.join('/');
  const fullUrl = `${API_BASE}/api/${path}`;
  const body = await request.text();

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const auth = request.headers.get('authorization');
    if (auth) {
      headers['Authorization'] = auth;
    }

    const response = await fetch(fullUrl, {
      method: 'PUT',
      headers,
      body,
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch from API' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: any
) {
  const resolvedParams = await params;
  const slug = Array.isArray(resolvedParams.slug) ? resolvedParams.slug : [resolvedParams.slug];
  const path = slug.join('/');
  const fullUrl = `${API_BASE}/api/${path}`;
  const body = await request.text();

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const auth = request.headers.get('authorization');
    if (auth) {
      headers['Authorization'] = auth;
    }

    const response = await fetch(fullUrl, {
      method: 'PATCH',
      headers,
      body,
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch from API' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: any
) {
  const resolvedParams = await params;
  const slug = Array.isArray(resolvedParams.slug) ? resolvedParams.slug : [resolvedParams.slug];
  const path = slug.join('/');
  const fullUrl = `${API_BASE}/api/${path}`;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const auth = request.headers.get('authorization');
    if (auth) {
      headers['Authorization'] = auth;
    }

    const response = await fetch(fullUrl, {
      method: 'DELETE',
      headers,
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch from API' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
