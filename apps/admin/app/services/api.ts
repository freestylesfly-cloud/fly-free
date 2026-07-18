/**
 * Centralized API Service Layer
 * All API calls should go through this service, not directly in components
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  filter?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class ApiService {
  private baseUrl = API_BASE;
  private defaultHeaders = {
    'Content-Type': 'application/json',
  };

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // ============ DASHBOARD ============
  async getDashboardStats() {
    return this.request('/api/admin/dashboard');
  }

  // ============ PRODUCTS ============
  async getProducts(params?: PaginationParams) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);

    return this.request(`/api/admin/products?${query.toString()}`);
  }

  async getProduct(id: string) {
    return this.request(`/api/admin/products/${id}`);
  }

  async createProduct(data: any) {
    return this.request('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id: string, data: any) {
    return this.request(`/api/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/api/admin/products/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ ORDERS ============
  async getOrders(params?: PaginationParams) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.filter) query.append('status', params.filter);
    if (params?.search) query.append('search', params.search);

    return this.request(`/api/admin/orders?${query.toString()}`);
  }

  async getOrder(id: string) {
    return this.request(`/api/admin/orders/${id}`);
  }

  async updateOrderStatus(id: string, status: string) {
    return this.request(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async generateInvoice(id: string) {
    return this.request(`/api/admin/orders/${id}/invoice`, {
      method: 'GET',
    });
  }

  // ============ USERS ============
  async getUsers(params?: PaginationParams) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);

    return this.request(`/api/admin/users?${query.toString()}`);
  }

  async getUser(id: string) {
    return this.request(`/api/admin/users/${id}`);
  }

  async sendEmailToUser(id: string, message: string) {
    return this.request(`/api/admin/users/${id}/email`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // ============ REVIEWS ============
  async getReviews(params?: PaginationParams) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.filter) query.append('status', params.filter);

    return this.request(`/api/admin/reviews?${query.toString()}`);
  }

  async updateReviewStatus(id: string, status: string) {
    return this.request(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // ============ SETTINGS ============
  async getSettings() {
    return this.request('/api/admin/settings');
  }

  async updateSettings(data: any) {
    return this.request('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ============ THEMES ============
  async getThemes() {
    return this.request('/api/admin/themes');
  }

  async setActiveTheme(themeId: string) {
    return this.request('/api/admin/themes/active', {
      method: 'POST',
      body: JSON.stringify({ themeId }),
    });
  }

  // ============ AUTHENTICATION ============
  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    return this.request('/api/auth/me');
  }
}

// Export singleton instance
export const apiService = new ApiService();
