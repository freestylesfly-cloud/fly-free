/**
 * Centralized API Client for Web and Admin apps
 * Handles all API communication with proper error handling and environment variable management
 */

export class ApiClient {
  private baseUrl: string;

  constructor(customBaseUrl?: string) {
    // Use custom URL if provided, otherwise use environment variable
    const apiUrl = customBaseUrl || this.getApiBaseUrl();
    this.baseUrl = apiUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Get the API base URL from environment variables with fallback
   */
  private getApiBaseUrl(): string {
    // Server-side and client-side fallback
    if (typeof window !== 'undefined') {
      // Client-side (browser)
      return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    }
    // Server-side (SSR)
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  /**
   * Build complete endpoint URL
   */
  private buildUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${cleanEndpoint}`;
  }

  /**
   * Handle response parsing
   */
  private async parseResponse(response: Response) {
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    if (!text) return null;

    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        return null;
      }
    }

    return text;
  }

  /**
   * Make a GET request
   */
  async get<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: Error | null }> {
    try {
      const response = await fetch(this.buildUrl(endpoint), {
        ...options,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await this.parseResponse(response);
        throw new Error(
          errorData?.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await this.parseResponse(response);
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Make a POST request
   */
  async post<T = any>(
    endpoint: string,
    body?: any,
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: Error | null }> {
    try {
      const response = await fetch(this.buildUrl(endpoint), {
        ...options,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await this.parseResponse(response);
        throw new Error(
          errorData?.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await this.parseResponse(response);
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(
    endpoint: string,
    body?: any,
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: Error | null }> {
    try {
      const response = await fetch(this.buildUrl(endpoint), {
        ...options,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await this.parseResponse(response);
        throw new Error(
          errorData?.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await this.parseResponse(response);
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: Error | null }> {
    try {
      const response = await fetch(this.buildUrl(endpoint), {
        ...options,
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await this.parseResponse(response);
        throw new Error(
          errorData?.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await this.parseResponse(response);
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    body?: any,
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: Error | null }> {
    try {
      const response = await fetch(this.buildUrl(endpoint), {
        ...options,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await this.parseResponse(response);
        throw new Error(
          errorData?.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await this.parseResponse(response);
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}

// Export singleton instance for convenience
export const apiClient = new ApiClient();
