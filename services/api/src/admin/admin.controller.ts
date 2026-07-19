import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, Header, StreamableFile } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AdminService } from "./admin.service";

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== PRODUCTS ====================
  @ApiTags("👨‍💼 Admin Products")
  @Get("categories")
  listCategories() {
    return this.adminService.listCategories();
  }

  @ApiTags("👨‍💼 Admin Products")
  @Post("categories")
  createCategory(@Body() data: any) {
    return this.adminService.createCategory(data);
  }

  @ApiTags("👨‍💼 Admin Products")
  @Put("categories/:id")
  updateCategory(@Param("id") id: string, @Body() data: any) {
    return this.adminService.updateCategory(id, data);
  }

  @ApiTags("👨‍💼 Admin Products")
  @Delete("categories/:id")
  deleteCategory(@Param("id") id: string) {
    return this.adminService.deleteCategory(id);
  }

  @ApiTags("👨‍💼 Admin Products")
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
  updateOrderStatus(@Param("id") id: string, @Body() body: { status: string; note?: string; changedBy?: string }) {
    return this.adminService.updateOrderStatus(id, body.status, body.note, body.changedBy);
  }

  @Get("orders/:id/invoice")
  @Header("Content-Type", "application/pdf")
  @Header("Content-Disposition", "attachment; filename=invoice.pdf")
  async downloadInvoice(@Param("id") id: string) {
    return new StreamableFile(await this.adminService.generateInvoicePdf(id));
  }

  @Post("orders/:id/send-invoice")
  sendInvoice(@Param("id") id: string) {
    return this.adminService.sendInvoiceEmail(id);
  }

  @Post("orders/:id/review-request")
  sendReviewRequest(@Param("id") id: string, @Body() body: { message?: string }) {
    return this.adminService.sendReviewRequest(id, body.message);
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

  @Post("users/:id/email")
  sendUserEmail(@Param("id") id: string, @Body() body: { subject?: string; message: string }) {
    return this.adminService.sendUserEmail(id, body.message, body.subject);
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

  @Get("website-themes")
  listWebsiteThemes() {
    return this.adminService.listWebsiteThemes();
  }

  @Post("website-themes")
  createWebsiteTheme(@Body() data: any) {
    return this.adminService.createWebsiteTheme(data);
  }

  @Put("website-themes/:id")
  updateWebsiteTheme(@Param("id") id: string, @Body() data: any) {
    return this.adminService.updateWebsiteTheme(id, data);
  }

  @Put("website-themes/:id/activate")
  setActiveWebsiteTheme(@Param("id") id: string) {
    return this.adminService.setActiveWebsiteTheme(id);
  }

  @Delete("website-themes/:id")
  deleteWebsiteTheme(@Param("id") id: string) {
    return this.adminService.deleteWebsiteTheme(id);
  }

  @Post("themes")
  createTheme(@Body() data: any) {
    return this.adminService.createTheme(data);
  }

  @Put("themes/:id")
  updateTheme(@Param("id") id: string, @Body() data: any) {
    return this.adminService.updateTheme(id, data);
  }

  @Put("themes/:id/activate")
  setActiveTheme(@Param("id") id: string) {
    return this.adminService.setActiveTheme(id);
  }

  @Get("announcements")
  listAnnouncements() {
    return this.adminService.listAnnouncements();
  }

  @Post("announcements")
  createAnnouncement(@Body() data: any) {
    return this.adminService.createAnnouncement(data);
  }

  @Put("announcements/:id")
  updateAnnouncement(@Param("id") id: string, @Body() data: any) {
    return this.adminService.updateAnnouncement(id, data);
  }

  @Delete("announcements/:id")
  deleteAnnouncement(@Param("id") id: string) {
    return this.adminService.deleteAnnouncement(id);
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

  // ==================== PAGES ====================
  @Get("pages")
  listPages() {
    return this.adminService.listPages();
  }

  @Get("pages/:id")
  getPage(@Param("id") id: string) {
    return this.adminService.getPage(id);
  }

  @Post("pages")
  createPage(@Body() data: any) {
    return this.adminService.createPage(data);
  }

  @Put("pages/:id")
  updatePage(@Param("id") id: string, @Body() data: any) {
    return this.adminService.updatePage(id, data);
  }

  @Delete("pages/:id")
  deletePage(@Param("id") id: string) {
    return this.adminService.deletePage(id);
  }

  // ==================== INFLUENCERS ====================
  @Get("influencers")
  listInfluencers() {
    return this.adminService.listInfluencers();
  }

  @Get("influencers/:id")
  getInfluencer(@Param("id") id: string) {
    return this.adminService.getInfluencer(id);
  }

  @Post("influencers")
  createInfluencer(@Body() data: any) {
    return this.adminService.createInfluencer(data);
  }

  @Put("influencers/:id")
  updateInfluencer(@Param("id") id: string, @Body() data: any) {
    return this.adminService.updateInfluencer(id, data);
  }

  @Delete("influencers/:id")
  deleteInfluencer(@Param("id") id: string) {
    return this.adminService.deleteInfluencer(id);
  }

  @Post("influencers/:id/send-code")
  sendInfluencerCode(@Param("id") id: string) {
    return this.adminService.sendInfluencerCode(id);
  }

  // ==================== NOTIFICATIONS ====================
  @Get("notifications")
  listNotifications() {
    return this.adminService.listNotifications();
  }

  @Patch("notifications/:id/read")
  markNotificationRead(@Param("id") id: string) {
    return this.adminService.markNotificationRead(id);
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
