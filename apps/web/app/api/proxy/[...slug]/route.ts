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
  const slug = Array.isArray(params.slug) ? params.slug : [params.slug];
  const path = slug.join('/');
  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();

  const fullUrl = `${API_BASE}/api/${path}${searchParams ? `?${searchParams}` : ''}`;

  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...Object.fromEntries(
          Array.from(request.headers.entries()).filter(
            ([key]) => key.toLowerCase() === 'authorization'
          )
        ),
      },
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
  const slug = Array.isArray(params.slug) ? params.slug : [params.slug];
  const path = slug.join('/');
  const fullUrl = `${API_BASE}/api/${path}`;
  const body = await request.text();

  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...Object.fromEntries(
          Array.from(request.headers.entries()).filter(
            ([key]) => key.toLowerCase() === 'authorization'
          )
        ),
      },
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
  const slug = Array.isArray(params.slug) ? params.slug : [params.slug];
  const path = slug.join('/');
  const fullUrl = `${API_BASE}/api/${path}`;
  const body = await request.text();

  try {
    const response = await fetch(fullUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...Object.fromEntries(
          Array.from(request.headers.entries()).filter(
            ([key]) => key.toLowerCase() === 'authorization'
          )
        ),
      },
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

export async function DELETE(
  request: Request,
  { params }: any
) {
  const slug = Array.isArray(params.slug) ? params.slug : [params.slug];
  const path = slug.join('/');
  const fullUrl = `${API_BASE}/api/${path}`;

  try {
    const response = await fetch(fullUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(
          Array.from(request.headers.entries()).filter(
            ([key]) => key.toLowerCase() === 'authorization'
          )
        ),
      },
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
