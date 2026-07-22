import { Controller, Post, Body, Get, Headers, HttpException, HttpStatus, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";

@ApiTags("🔐 Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ==================== USER AUTH ====================
  @Post("user/signup")
  async signupUser(@Body() body: { email: string; password: string; name: string; phone?: string }) {
    try {
      return await this.authService.signupUser(body.email, body.password, body.name, body.phone);
    } catch (error: any) {
      throw new HttpException(
        { error: error?.message || "Signup failed" },
        error?.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post("user/verify-email")
  async verifyEmail(@Body() body: { email: string; code?: string; otp?: string }) {
    try {
      const verificationCode = body.code || body.otp;
      if (!verificationCode) {
        throw new Error("Verification code is required");
      }
      return await this.authService.verifyEmail(body.email, verificationCode);
    } catch (error: any) {
      throw new HttpException(
        { error: error?.message || "Verification failed" },
        error?.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post("user/resend-email")
  async resendVerificationEmail(@Body() body: { email: string }) {
    try {
      return await this.authService.resendVerificationEmail(body.email);
    } catch (error: any) {
      throw new HttpException(
        { error: error?.message || "Resend failed" },
        error?.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post("user/resend-otp")
  async resendOtp(@Body() body: { email: string }) {
    try {
      return await this.authService.resendVerificationEmail(body.email);
    } catch (error: any) {
      throw new HttpException(
        { error: error?.message || "Resend failed" },
        error?.status || HttpStatus.BAD_REQUEST
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
        error?.status || HttpStatus.UNAUTHORIZED
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
        error?.status || HttpStatus.UNAUTHORIZED
      );
    }
  }

  @Put("user/profile")
  async updateUserProfile(
    @Headers("authorization") token: string,
    @Body() body: { name?: string; phone?: string; image?: string }
  ) {
    try {
      return await this.authService.updateUserProfile(token, body);
    } catch (error: any) {
      throw new HttpException(
        { error: error?.message || "Profile update failed" },
        error?.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post("user/change-password")
  async changePassword(
    @Headers("authorization") token: string,
    @Body() body: { currentPassword: string; newPassword: string }
  ) {
    try {
      return await this.authService.changePassword(token, body.currentPassword, body.newPassword);
    } catch (error: any) {
      throw new HttpException(
        { error: error?.message || "Password change failed" },
        error?.status || HttpStatus.BAD_REQUEST
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
        HttpStatus.UNAUTHORIZED
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

  // ==================== EMAIL VERIFICATION ====================
  @Post("verify-email")
  async verifyEmailOld(@Body() body: { email: string; code: string }) {
    try {
      return await this.authService.verifyEmail(body.email, body.code);
    } catch (error: any) {
      throw new HttpException(
        { error: error?.message || "Email verification failed" },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // ==================== SOCIAL LOGIN ====================
  @Post("google/login")
  async googleLogin(@Body() body: { idToken: string }) {
    try {
      return { message: "Google login not yet implemented", token: null };
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
      return { message: "GitHub login not yet implemented", token: null };
    } catch (error: any) {
      throw new HttpException(
        { error: error?.message || "GitHub login failed" },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
