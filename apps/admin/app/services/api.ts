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
  rating?: string;
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
    const response: any = await this.request('/api/admin/analytics/dashboard');
    return {
      data: {
        revenue: response?.metrics?.revenue ?? response?.data?.revenue ?? 0,
        orders: response?.metrics?.orders ?? response?.data?.orders ?? 0,
        products: response?.metrics?.products ?? response?.data?.products ?? 0,
        users: response?.metrics?.users ?? response?.data?.users ?? 0,
        pendingOrders: response?.data?.pendingOrders ?? 0,
        lowStockProducts: response?.data?.lowStockProducts ?? 0,
        totalReviews: response?.data?.totalReviews ?? 0,
        averageRating: response?.data?.averageRating ?? 0
      }
    };
  }

  // ============ PRODUCTS ============
  async getCategories() {
    return this.request('/api/admin/categories');
  }

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

    const response: any = await this.request(`/api/admin/orders?${query.toString()}`);
    const orders = (response?.data ?? response ?? []).map((order: any, index: number) => ({
      ...order,
      orderNumber: order.orderNumber ?? `ORD-${String(index + 1).padStart(3, '0')}`,
      shippingCost: order.shippingCost ?? order.shippingFee ?? 0,
      totalAmount: order.totalAmount ?? order.total ?? 0,
      paymentStatus: order.paymentStatus ?? order.payment?.status ?? 'PENDING',
      user: {
        name: order.user?.name ?? 'Guest Customer',
        email: order.user?.email ?? 'guest@example.com',
        phone: order.user?.phone ?? ''
      },
      items: (order.items ?? []).map((item: any) => ({
        ...item,
        product: item.product ?? { name: item.name ?? 'Product', sku: item.sku ?? '' },
        variant: item.variant ?? null
      }))
    }));

    return { ...response, data: orders };
  }

  async getOrder(id: string) {
    return this.request(`/api/admin/orders/${id}`);
  }

  async updateOrderStatus(id: string, status: string) {
    return this.request(`/api/admin/orders/${id}/status`, {
      method: 'PUT',
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

    const response: any = await this.request(`/api/admin/users?${query.toString()}`);
    const users = (response?.data ?? response ?? []).map((user: any) => ({
      ...user,
      name: user.name ?? user.email?.split('@')[0] ?? 'Customer',
      phone: user.phone ?? null,
      avatar: user.avatar ?? user.image ?? null,
      totalOrders: user.totalOrders ?? 0,
      totalSpent: user.totalSpent ?? 0,
      lastOrderDate: user.lastOrderDate ?? null,
      isActive: user.isActive ?? true,
      addresses: user.addresses ?? []
    }));

    return { ...response, data: users };
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
    if (params?.rating) query.append('rating', params.rating);
    if (params?.search) query.append('search', params.search);

    const response: any = await this.request(`/api/admin/reviews?${query.toString()}`);
    const reviews = (response?.data ?? response ?? []).map((review: any) => ({
      ...review,
      title: review.title ?? 'Untitled review',
      content: review.content ?? review.body ?? '',
      rating: review.rating ?? 0,
      status: review.status ?? 'PENDING',
      product: review.product ?? { name: 'Product' },
      user: review.user ?? { name: 'Customer', email: '' },
      createdAt: review.createdAt ?? new Date().toISOString()
    }));

    return { ...response, data: reviews };
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
    return this.request(`/api/admin/themes/${themeId}/activate`, {
      method: 'PUT',
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
