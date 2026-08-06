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

/**
 * A failed request, carrying the server's own sentence as `message` so a page
 * can render it straight into the UI. The endpoint and status stay on the
 * object (and in the console) instead of being glued onto the text.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly endpoint: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Nest sends `{ statusCode, message, error }`; `message` is the useful half. */
function readErrorMessage(body: any): string {
  if (!body) return '';
  if (typeof body === 'string') return body;
  if (Array.isArray(body.message)) return body.message.join(' ');
  if (typeof body.message === 'string' && body.message.trim()) return body.message;
  if (typeof body.error === 'string' && body.error.trim()) return body.error;
  return '';
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

      // Only declare a JSON body when one is actually being sent. Fastify
      // rejects a request that advertises application/json but has no body.
      if (options.body != null) {
        Object.entries(this.defaultHeaders).forEach(([key, value]) => headers.set(key, value));
      } else {
        headers.delete('Content-Type');
      }

      // Add auth headers
      Object.entries(this.authHeaders()).forEach(([key, value]) => headers.set(key, value));

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let details = '';
        try {
          details = readErrorMessage(await response.json());
        } catch {
          try {
            details = (await response.text()).trim();
          } catch {
            details = '';
          }
        }

        throw new ApiError(
          details || response.statusText || `Request failed with status ${response.status}`,
          response.status,
          endpoint
        );
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

  /** Active / inactive: hides the product from the storefront, keeps the row. */
  async setProductVisibility(id: string, isVisible: boolean) {
    return this.request<{ id: string; name: string; isVisible: boolean; message: string }>(
      `/api/admin/products/${id}/visibility`,
      {
        method: 'PATCH',
        body: JSON.stringify({ isVisible }),
      }
    );
  }

  async deleteProduct(id: string) {
    return this.request<{ success: boolean; id: string; message: string }>(`/api/admin/products/${id}`, {
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

  /**
   * Fetches the invoice PDF with the admin token attached.
   *
   * This cannot be an `<a href>`: the endpoint is behind AdminGuard and a
   * browser navigation sends no Authorization header, so a plain link always
   * came back as 401 "Authentication required".
   */
  async downloadInvoice(id: string): Promise<{ blob: Blob; filename: string }> {
    const endpoint = `/api/admin/orders/${id}/invoice`;
    const response = await fetch(`${this.baseUrl}${endpoint}`, { headers: this.authHeaders() });

    if (!response.ok) {
      let details = '';
      try {
        details = readErrorMessage(await response.json());
      } catch {
        details = '';
      }
      throw new ApiError(details || 'Could not generate the invoice', response.status, endpoint);
    }

    const disposition = response.headers.get('content-disposition') || '';
    const match = /filename="?([^"]+)"?/i.exec(disposition);

    return { blob: await response.blob(), filename: match?.[1] || `invoice-${id}.pdf` };
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

  async getNewsletterStats() {
    return this.request('/api/admin/newsletter/stats');
  }

  async getNewsletterSubscribers(activeOnly = false) {
    return this.request(`/api/admin/newsletter/subscribers?activeOnly=${activeOnly}`);
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
      mediaUrls: review.mediaUrls ?? [],
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

  /** Reports whether the API server can reach the image bucket. */
  async getStorageStatus() {
    return this.request('/api/admin/storage-status');
  }

  /** Creates any storefront content page that does not exist yet. */
  async createMissingPages() {
    return this.request('/api/admin/pages/create-missing', { method: 'POST' });
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
  async getActivityLogs(params?: { level?: string; status?: string; search?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.level && params.level !== 'ALL') query.append('level', params.level);
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    query.append('page', String(params?.page ?? 1));
    query.append('limit', String(params?.limit ?? 50));

    return this.request<{ data: any[]; total: number; page: number; pages: number }>(
      `/api/admin/activity-logs?${query.toString()}`
    );
  }

  async getActivityLogStats() {
    return this.request<any>('/api/admin/activity-logs/stats');
  }

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

  // ============ INSTAGRAM FEED ============
  async getInstagramPosts<T = any>(): Promise<T[]> {
    const response = await this.request<{ data?: T[] } | T[]>('/api/instagram-posts');
    if (Array.isArray(response)) return response;
    return response?.data ?? [];
  }

  async createInstagramPost(data: any) {
    return this.request<any>('/api/instagram-posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInstagramPost(id: string, data: any) {
    return this.request<any>(`/api/instagram-posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteInstagramPost(id: string) {
    return this.request<any>(`/api/instagram-posts/${id}`, {
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

  // ============ HAMPERS ============
  async getHampers() {
    return this.request('/api/admin/hampers');
  }

  async createHamper(data: any) {
    return this.request('/api/admin/hampers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateHamper(id: string, data: any) {
    return this.request(`/api/admin/hampers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteHamper(id: string) {
    return this.request(`/api/admin/hampers/${id}`, {
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
