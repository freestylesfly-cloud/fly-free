/**
 * Centralized API Client Service
 * Handles all API calls with consistent error handling, auth, loading states, and response handling
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface ApiError {
  message: string;
  status: number;
  endpoint: string;
}

export class ApiClient {
  private baseUrl = '/api/proxy';
  private token: string | null = null;
  private loadingCallbacks: Set<() => void> = new Set();
  private isLoading = false;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private getHeaders(customHeaders?: Record<string, string>) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private setLoading(loading: boolean) {
    this.isLoading = loading;
    this.loadingCallbacks.forEach(cb => cb());
  }

  onLoadingChange(callback: () => void): () => void {
    this.loadingCallbacks.add(callback);
    return () => this.loadingCallbacks.delete(callback);
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    let data: any = null;
    if (isJson) {
      try {
        data = await response.json();
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
      }
    } else {
      data = await response.text();
    }

    if (response.ok) {
      return {
        success: true,
        data: data?.data || data,
        status: response.status,
      };
    }

    return {
      success: false,
      error: data?.error || data?.message || 'Unknown error',
      status: response.status,
    };
  }

  async get<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    this.setLoading(true);
    try {
      const path = endpoint.replace(/^\/api\//, '');
      const response = await fetch(`${this.baseUrl}/${path}`, {
        ...options,
        method: 'GET',
        headers: this.getHeaders(options.headers as Record<string, string>),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`GET ${endpoint} failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    } finally {
      this.setLoading(false);
    }
  }

  async post<T = any>(endpoint: string, body?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    this.setLoading(true);
    try {
      const path = endpoint.replace(/^\/api\//, '');
      const response = await fetch(`${this.baseUrl}/${path}`, {
        ...options,
        method: 'POST',
        headers: this.getHeaders(options.headers as Record<string, string>),
        body: body ? JSON.stringify(body) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`POST ${endpoint} failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    } finally {
      this.setLoading(false);
    }
  }

  async put<T = any>(endpoint: string, body?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    this.setLoading(true);
    try {
      const path = endpoint.replace(/^\/api\//, '');
      const response = await fetch(`${this.baseUrl}/${path}`, {
        ...options,
        method: 'PUT',
        headers: this.getHeaders(options.headers as Record<string, string>),
        body: body ? JSON.stringify(body) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`PUT ${endpoint} failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    } finally {
      this.setLoading(false);
    }
  }

  async patch<T = any>(endpoint: string, body?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    this.setLoading(true);
    try {
      const path = endpoint.replace(/^\/api\//, '');
      const response = await fetch(`${this.baseUrl}/${path}`, {
        ...options,
        method: 'PATCH',
        headers: this.getHeaders(options.headers as Record<string, string>),
        body: body ? JSON.stringify(body) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`PATCH ${endpoint} failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    } finally {
      this.setLoading(false);
    }
  }

  async delete<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    this.setLoading(true);
    try {
      const path = endpoint.replace(/^\/api\//, '');
      const response = await fetch(`${this.baseUrl}/${path}`, {
        ...options,
        method: 'DELETE',
        headers: this.getHeaders(options.headers as Record<string, string>),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`DELETE ${endpoint} failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    } finally {
      this.setLoading(false);
    }
  }
}

// Singleton instance
export const apiClient = new ApiClient();
