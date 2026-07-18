import { Controller, Post, Body, Get, Headers } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ==================== USER AUTH ====================
  @Post("user/signup")
  signupUser(@Body() body: { email: string; password: string; name: string }) {
    return this.authService.signupUser(body.email, body.password, body.name);
  }

  @Post("user/login")
  loginUser(@Body() body: { email: string; password: string }) {
    return this.authService.loginUser(body.email, body.password);
  }

  @Post("user/logout")
  logoutUser(@Headers("authorization") token: string) {
    return this.authService.logoutUser(token);
  }

  @Get("user/profile")
  getUserProfile(@Headers("authorization") token: string) {
    return this.authService.getUserProfile(token);
  }

  // ==================== ADMIN AUTH ====================
  @Post("admin/login")
  loginAdmin(@Body() body: { email: string; password: string }) {
    return this.authService.loginAdmin(body.email, body.password);
  }

  @Post("admin/logout")
  logoutAdmin(@Headers("authorization") token: string) {
    return this.authService.logoutAdmin(token);
  }

  @Get("admin/profile")
  getAdminProfile(@Headers("authorization") token: string) {
    return this.authService.getAdminProfile(token);
  }

  // ==================== PASSWORD RESET ====================
  @Post("forgot-password")
  forgotPassword(@Body() body: { email: string }) {
    return this.authService.sendPasswordResetEmail(body.email);
  }

  @Post("reset-password")
  resetPassword(@Body() body: { email: string; code: string; newPassword: string }) {
    return this.authService.resetPassword(body.email, body.code, body.newPassword);
  }

  // ==================== VERIFY EMAIL ====================
  @Post("verify-email")
  verifyEmail(@Body() body: { email: string; code: string }) {
    return this.authService.verifyEmail(body.email, body.code);
  }

  // ==================== SOCIAL LOGIN ====================
  @Post("google/login")
  googleLogin(@Body() body: { idToken: string }) {
    return this.authService.googleLogin(body.idToken);
  }

  @Post("github/login")
  githubLogin(@Body() body: { code: string }) {
    return this.authService.githubLogin(body.code);
  }
}
