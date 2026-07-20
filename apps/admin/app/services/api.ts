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

  private authHeaders(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = window.localStorage.getItem('flyfree_admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const headers = new Headers(options.headers);
      if (options.body !== undefined && options.body !== null) {
        Object.entries(this.defaultHeaders).forEach(([key, value]) => headers.set(key, value));
      }
      Object.entries(this.authHeaders()).forEach(([key, value]) => headers.set(key, value));

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let details = response.statusText;
        try {
          const body = await response.json();
          details = body?.error || body?.message || JSON.stringify(body);
        } catch {
          try {
            details = await response.text();
          } catch {
            details = response.statusText;
          }
        }

        throw new Error(`${endpoint} failed: HTTP ${response.status} ${details}`);
      }

      const text = await response.text();
      return (text ? JSON.parse(text) : null) as T;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // ============ DASHBOARD ============
  async getDashboardStats() {
    const response: any = await this.request('/api/admin/analytics/dashboard');
    const metrics = response?.metrics ?? response?.data ?? {};

    return {
      data: {
        revenue: metrics.revenue ?? 0,
        orders: metrics.orders ?? 0,
        products: metrics.products ?? 0,
        users: metrics.users ?? 0,
        pendingOrders: metrics.pendingOrders ?? 0,
        lowStockProducts: metrics.lowStockProducts ?? 0,
        totalReviews: metrics.totalReviews ?? 0,
        averageRating: metrics.averageRating ?? 0
      },
      recentOrders: response?.recentOrders ?? [],
      charts: response?.charts ?? { orderStatus: [] }
    };
  }

  // ============ PRODUCTS ============
  async getCategories() {
    return this.request('/api/admin/categories');
  }

  async createCategory(data: any) {
    return this.request('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: string, data: any) {
    return this.request(`/api/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: string) {
    return this.request(`/api/admin/categories/${id}`, {
      method: 'DELETE',
    });
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

  async updateOrderStatus(id: string, status: string, note?: string) {
    return this.request(`/api/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note }),
    });
  }

  generateInvoice(id: string) {
    return `${this.baseUrl}/api/admin/orders/${id}/invoice`;
  }

  async sendInvoice(id: string) {
    return this.request(`/api/admin/orders/${id}/send-invoice`, {
      method: 'POST',
    });
  }

  async sendReviewRequest(orderId: string, message?: string) {
    return this.request(`/api/admin/orders/${orderId}/review-request`, {
      method: 'POST',
      body: JSON.stringify({ message }),
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

  // ============ EMAIL ============
  async getEmailStats() {
    return this.request('/api/admin/email/stats');
  }

  async sendBroadcast(data: { title: string; subject: string; message: string }) {
    return this.request('/api/admin/email/send-broadcast', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendPromotional(data: { userIds?: string[]; title: string; message: string; promoCode?: string; discount?: number }) {
    return this.request('/api/admin/email/send-promotional', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendInvite(data: { email: string; message?: string }) {
    return this.request('/api/admin/email/send-invite', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendCustomUserMessage(data: { userId: string; subject: string; message: string }) {
    return this.request('/api/admin/email/send-user-message', {
      method: 'POST',
      body: JSON.stringify(data),
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

  // ============ PAGES ============
  async getPages() {
    return this.request('/api/admin/pages');
  }

  async getPage(id: string) {
    return this.request(`/api/admin/pages/${id}`);
  }

  async createPage(data: any) {
    return this.request('/api/admin/pages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePage(id: string, data: any) {
    return this.request(`/api/admin/pages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePage(id: string) {
    return this.request(`/api/admin/pages/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ INFLUENCERS ============
  async getInfluencers() {
    return this.request('/api/admin/influencers');
  }

  async getInfluencer(id: string) {
    return this.request(`/api/admin/influencers/${id}`);
  }

  async createInfluencer(data: any) {
    return this.request('/api/admin/influencers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInfluencer(id: string, data: any) {
    return this.request(`/api/admin/influencers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteInfluencer(id: string) {
    return this.request(`/api/admin/influencers/${id}`, {
      method: 'DELETE',
    });
  }

  async sendInfluencerCode(id: string) {
    return this.request(`/api/admin/influencers/${id}/send-code`, {
      method: 'POST',
    });
  }

  // ============ NOTIFICATIONS ============
  async getNotifications() {
    return this.request('/api/admin/notifications');
  }

  async markNotificationRead(id: string) {
    return this.request(`/api/admin/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  // ============ THEMES ============
  async getThemes() {
    return this.request('/api/admin/themes');
  }

  async createTheme(data: any) {
    return this.request('/api/admin/themes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTheme(themeId: string, data: any) {
    return this.request(`/api/admin/themes/${themeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async setActiveTheme(themeId: string) {
    return this.request(`/api/admin/themes/${themeId}/activate`, {
      method: 'PUT',
    });
  }

  async getWebsiteThemes() {
    return this.request('/api/admin/website-themes');
  }

  async createWebsiteTheme(data: any) {
    return this.request('/api/admin/website-themes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWebsiteTheme(themeId: string, data: any) {
    return this.request(`/api/admin/website-themes/${themeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async setActiveWebsiteTheme(themeId: string) {
    return this.request(`/api/admin/website-themes/${themeId}/activate`, {
      method: 'PUT',
    });
  }

  async deleteWebsiteTheme(themeId: string) {
    return this.request(`/api/admin/website-themes/${themeId}`, {
      method: 'DELETE',
    });
  }

  // ============ PRODUCT THEMES ============
  async getProductThemes() {
    return this.request('/api/admin/product-themes');
  }

  async createProductTheme(data: any) {
    return this.request('/api/admin/product-themes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProductTheme(themeId: string, data: any) {
    return this.request(`/api/admin/product-themes/${themeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProductTheme(themeId: string) {
    return this.request(`/api/admin/product-themes/${themeId}`, {
      method: 'DELETE',
    });
  }

  async getAnnouncements() {
    return this.request('/api/admin/announcements');
  }

  async createAnnouncement(data: any) {
    return this.request('/api/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAnnouncement(id: string, data: any) {
    return this.request(`/api/admin/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAnnouncement(id: string) {
    return this.request(`/api/admin/announcements/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ SIZE GUIDES ============
  async getSizeGuides() {
    return this.request('/api/admin/size-guides');
  }

  async createSizeGuide(data: any) {
    return this.request('/api/admin/size-guides', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSizeGuide(id: string, data: any) {
    return this.request(`/api/admin/size-guides/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSizeGuide(id: string) {
    return this.request(`/api/admin/size-guides/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ HERO BANNERS ============
  async getHeroBanners() {
    return this.request('/api/admin/hero-banners');
  }

  async createHeroBanner(data: any) {
    return this.request('/api/admin/hero-banners', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateHeroBanner(id: string, data: any) {
    return this.request(`/api/admin/hero-banners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteHeroBanner(id: string) {
    return this.request(`/api/admin/hero-banners/${id}`, {
      method: 'DELETE',
    });
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  // ============ AUTHENTICATION ============
  async login(email: string, password: string) {
    return this.request('/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request('/api/auth/admin/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    return this.request('/api/auth/admin/profile');
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Also export as default for convenience
export const api = apiService;
