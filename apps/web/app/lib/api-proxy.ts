/**
 * API Proxy Client
 * Routes requests through /api/proxy to bypass CORS issues
 * Only used in production when backend CORS isn't configured
 */

export class ProxyApiClient {
  private baseUrl = '/api/proxy';

  async get<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const path = endpoint.replace(/^\/api\//, '');
    const response = await fetch(`${this.baseUrl}/${path}`, {
      ...options,
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async post<T = any>(endpoint: string, body?: any, options: RequestInit = {}): Promise<T> {
    const path = endpoint.replace(/^\/api\//, '');
    const response = await fetch(`${this.baseUrl}/${path}`, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async put<T = any>(endpoint: string, body?: any, options: RequestInit = {}): Promise<T> {
    const path = endpoint.replace(/^\/api\//, '');
    const response = await fetch(`${this.baseUrl}/${path}`, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async delete<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const path = endpoint.replace(/^\/api\//, '');
    const response = await fetch(`${this.baseUrl}/${path}`, {
      ...options,
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }
}

export const proxyApiClient = new ProxyApiClient();
