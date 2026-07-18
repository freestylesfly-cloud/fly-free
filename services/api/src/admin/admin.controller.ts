import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query } from "@nestjs/common";
import { AdminService } from "./admin.service";

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== PRODUCTS ====================
  @Get("categories")
  listCategories() {
    return this.adminService.listCategories();
  }

  @Get("products")
  listProducts(@Query("page") page?: string, @Query("limit") limit?: string, @Query("search") search?: string) {
    return this.adminService.listProducts(page ? parseInt(page) : 1, limit ? parseInt(limit) : 10, search);
  }

  @Get("products/:id")
  getProduct(@Param("id") id: string) {
    return this.adminService.getProduct(id);
  }

  @Post("products")
  createProduct(@Body() data: any) {
    return this.adminService.createProduct(data);
  }

  @Put("products/:id")
  updateProduct(@Param("id") id: string, @Body() data: any) {
    return this.adminService.updateProduct(id, data);
  }

  @Delete("products/:id")
  deleteProduct(@Param("id") id: string) {
    return this.adminService.deleteProduct(id);
  }

  // ==================== ORDERS ====================
  @Get("orders")
  listOrders(@Query("status") status?: string, @Query("page") page?: string) {
    return this.adminService.listOrders(status, page ? parseInt(page) : 1);
  }

  @Get("orders/:id")
  getOrder(@Param("id") id: string) {
    return this.adminService.getOrder(id);
  }

  @Put("orders/:id/status")
  updateOrderStatus(@Param("id") id: string, @Body() body: { status: string }) {
    return this.adminService.updateOrderStatus(id, body.status);
  }

  // ==================== USERS ====================
  @Get("users")
  listUsers(@Query("page") page?: string, @Query("limit") limit?: string) {
    return this.adminService.listUsers(page ? parseInt(page) : 1, limit ? parseInt(limit) : 10);
  }

  @Get("users/:id")
  getUser(@Param("id") id: string) {
    return this.adminService.getUser(id);
  }

  @Put("users/:id")
  updateUser(@Param("id") id: string, @Body() data: any) {
    return this.adminService.updateUser(id, data);
  }

  // ==================== REVIEWS ====================
  @Get("reviews")
  listReviews(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("rating") rating?: string,
    @Query("search") search?: string
  ) {
    return this.adminService.listReviews({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      status,
      rating: rating ? parseInt(rating) : undefined,
      search
    });
  }

  @Patch("reviews/:id")
  updateReviewStatus(@Param("id") id: string, @Body() body: { status: string }) {
    return this.adminService.updateReviewStatus(id, body.status);
  }

  // ==================== THEMES ====================
  @Get("themes")
  listThemes() {
    return this.adminService.listThemes();
  }

  @Get("themes/active")
  getActiveTheme() {
    return this.adminService.getActiveTheme();
  }

  @Put("themes/:id/activate")
  setActiveTheme(@Param("id") id: string) {
    return this.adminService.setActiveTheme(id);
  }

  // ==================== SETTINGS ====================
  @Get("settings")
  getSettings() {
    return this.adminService.getSettings();
  }

  @Put("settings")
  updateSettings(@Body() data: any) {
    return this.adminService.updateSettings(data);
  }

  // ==================== ANALYTICS ====================
  @Get("analytics/dashboard")
  getDashboardMetrics() {
    return this.adminService.getDashboardMetrics();
  }

  @Get("analytics/sales")
  getSalesAnalytics(@Query("days") days?: string) {
    return this.adminService.getSalesAnalytics(days ? parseInt(days) : 30);
  }

  @Get("analytics/revenue")
  getRevenueAnalytics(@Query("days") days?: string) {
    return this.adminService.getRevenueAnalytics(days ? parseInt(days) : 30);
  }

  @Get("analytics/orders")
  getOrderAnalytics(@Query("days") days?: string) {
    return this.adminService.getOrderAnalytics(days ? parseInt(days) : 30);
  }
}
