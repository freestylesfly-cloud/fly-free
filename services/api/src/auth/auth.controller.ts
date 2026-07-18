import { Controller, Post, Body, Get, Headers, HttpException, HttpStatus } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ==================== USER AUTH ====================
  @Post("user/signup")
  async signupUser(@Body() body: { email: string; password: string; name: string }) {
    try {
      return await this.authService.signupUser(body.email, body.password, body.name);
    } catch (error: any) {
      throw new HttpException(
        { error: error?.message || "Signup failed" },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post("user/login")
  async loginUser(@Body() body: { email: string; password: string }) {
    try {
      return await this.authService.loginUser(body.email, body.password);
    } catch (error: any) {
      throw new HttpException(
        { error: error?.message || "Login failed" },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post("user/logout")
  async logoutUser(@Headers("authorization") token: string) {
    try {
      return await this.authService.logoutUser(token);
    } catch (error: any) {
      throw new HttpException(
        { error: error?.message || "Logout failed" },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get("user/profile")
  async getUserProfile(@Headers("authorization") token: string) {
    try {
      return await this.authService.getUserProfile(token);
    } catch (error: any) {
      throw new HttpException(
        { error: error?.message || "Profile fetch failed" },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ==================== ADMIN AUTH ====================
  @Post("admin/login")
  async loginAdmin(@Body() body: { email: string; password: string }) {
    try {
      const result = await this.authService.loginAdmin(body.email, body.password);
      if (result.error) {
        throw new HttpException({ error: result.error }, result.status || HttpStatus.BAD_REQUEST);
      }
      return result;
    } catch (error: any) {
      if (error?.status) throw error;
      throw new HttpException(
        { error: error?.message || "Admin login failed" },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post("admin/logout")
  async logoutAdmin(@Headers("authorization") token: string) {
    try {
      return await this.authService.logoutAdmin(token);
    } catch (error: any) {
      throw new HttpException(
        { error: error?.message || "Admin logout failed" },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get("admin/profile")
  async getAdminProfile(@Headers("authorization") token: string) {
    try {
      const result = await this.authService.getAdminProfile(token);
      if (!result) {
        throw new HttpException(
          { error: "Admin not found" },
          HttpStatus.NOT_FOUND
        );
      }
      return result;
    } catch (error: any) {
      if (error?.status) throw error;
      throw new HttpException(
        { error: error?.message || "Profile fetch failed" },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ==================== PASSWORD RESET ====================
  @Post("forgot-password")
  async forgotPassword(@Body() body: { email: string }) {
    try {
      return await this.authService.sendPasswordResetEmail(body.email);
    } catch (error: any) {
      throw new HttpException(
        { error: error?.message || "Password reset failed" },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post("reset-password")
  async resetPassword(@Body() body: { email: string; code: string; newPassword: string }) {
    try {
      const result = await this.authService.resetPassword(body.email, body.code, body.newPassword);
      if (result.error) {
        throw new HttpException({ error: result.error }, result.status || HttpStatus.BAD_REQUEST);
      }
      return result;
    } catch (error: any) {
      if (error?.status) throw error;
      throw new HttpException(
        { error: error?.message || "Password reset failed" },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ==================== VERIFY EMAIL ====================
  @Post("verify-email")
  async verifyEmail(@Body() body: { email: string; code: string }) {
    try {
      return await this.authService.verifyEmail(body.email, body.code);
    } catch (error: any) {
      throw new HttpException(
        { error: error?.message || "Email verification failed" },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ==================== SOCIAL LOGIN ====================
  @Post("google/login")
  async googleLogin(@Body() body: { idToken: string }) {
    try {
      return await this.authService.googleLogin(body.idToken);
    } catch (error: any) {
      throw new HttpException(
        { error: error?.message || "Google login failed" },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post("github/login")
  async githubLogin(@Body() body: { code: string }) {
    try {
      return await this.authService.githubLogin(body.code);
    } catch (error: any) {
      throw new HttpException(
        { error: error?.message || "GitHub login failed" },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
