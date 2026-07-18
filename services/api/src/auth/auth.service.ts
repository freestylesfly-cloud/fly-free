import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  // ==================== USER AUTHENTICATION ====================
  async signupUser(email: string, password: string, name: string) {
    // Check if user exists
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "User already exists", status: 400 };
    }

    // Create new user (password should be hashed in production)
    const user = await this.prisma.user.create({
      data: { email, name }
    });

    return {
      message: "Signup successful! Please verify your email.",
      userId: user.id,
      email: user.email,
      token: `jwt_token_${user.id}` // In production, use proper JWT
    };
  }

  async loginUser(email: string, password: string) {
    // Find user by email
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { error: "User not found", status: 404 };
    }

    // Verify password (in production, use bcrypt)
    // TODO: Integrate with Supabase for proper password verification

    return {
      message: "Login successful",
      userId: user.id,
      email: user.email,
      name: user.name,
      token: `jwt_token_${user.id}`,
      user
    };
  }

  async logoutUser(token: string) {
    // Clear session/token
    return { message: "Logged out successfully" };
  }

  async getUserProfile(token: string) {
    // Extract user ID from token and return profile
    const userId = token.replace("Bearer ", "").replace("jwt_token_", "");

    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { orders: true, addresses: true, wishlistItems: true }
    });
  }

  // ==================== ADMIN AUTHENTICATION ====================
  async loginAdmin(email: string, password: string) {
    try {
      const admin = await this.prisma.adminUser.findUnique({
        where: { email },
        include: { role: { include: { permissions: true } } }
      });

      if (!admin) {
        return { error: "Admin not found", status: 404 };
      }

      return {
        message: "Admin login successful",
        adminId: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role.name,
        permissions: admin.role.permissions,
        token: `admin_jwt_${admin.id}`
      };
    } catch (error: any) {
      console.error("Admin login error:", error);
      return { error: error?.message || "Database error", status: 500 };
    }
  }

  async logoutAdmin(token: string) {
    return { message: "Admin logged out successfully" };
  }

  async getAdminProfile(token: string) {
    const adminId = token.replace("Bearer ", "").replace("admin_jwt_", "");

    return this.prisma.adminUser.findUnique({
      where: { id: adminId },
      include: { role: { include: { permissions: true } } }
    });
  }

  // ==================== PASSWORD RESET ====================
  async sendPasswordResetEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: "If user exists, password reset email sent" };
    }

    // TODO: Generate reset token and send email via Nodemailer/SendGrid
    return {
      message: "Password reset email sent to " + email,
      resetToken: `reset_${Date.now()}` // Mock token
    };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { error: "User not found", status: 404 };
    }

    // Verify reset code and update password
    // TODO: Implement with Supabase
    return { message: "Password reset successfully" };
  }

  // ==================== EMAIL VERIFICATION ====================
  async verifyEmail(email: string, code: string) {
    // Verify email code and mark user email as verified
    // TODO: Implement with Supabase
    return { message: "Email verified successfully" };
  }

  // ==================== SOCIAL AUTH ====================
  async googleLogin(idToken: string) {
    // Verify Google ID token and create/login user
    // TODO: Implement with Supabase Google provider
    return { message: "Google login successful", token: `jwt_google_${Date.now()}` };
  }

  async githubLogin(code: string) {
    // Exchange GitHub code for access token
    // TODO: Implement with Supabase GitHub provider
    return { message: "GitHub login successful", token: `jwt_github_${Date.now()}` };
  }
}
