import { Injectable, Logger, BadRequestException, UnauthorizedException, ConflictException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds = 10;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private emailService: EmailService
  ) {}

  // ==================== USER AUTHENTICATION ====================

  /**
   * Emails arrive from forms with stray whitespace and mixed case. Normalising
   * on the way in keeps one account per address and stops a trailing space from
   * silently locking someone out of their own login.
   */
  private normalizeEmail(email: string) {
    return (email || "").trim().toLowerCase();
  }

  async signupUser(rawEmail: string, password: string, name: string, phone?: string) {
    const email = this.normalizeEmail(rawEmail);

    if (!email || !password || !name) {
      throw new BadRequestException("Email, password, and name are required");
    }

    if (password.length < 8) {
      throw new BadRequestException("Password must be at least 8 characters");
    }

    if (phone && !/^\d{10}$/.test(phone)) {
      throw new BadRequestException("Phone must be exactly 10 digits");
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException("Email already registered");
    }

    if (phone) {
      const existingPhone = await this.prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        throw new ConflictException("Phone number already registered");
      }
    }

    const passwordHash = await bcrypt.hash(password, this.saltRounds);
    const verificationCode = this.generateVerificationCode();

    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        phone,
        passwordHash,
        emailVerified: false
      }
    });

    await this.prisma.emailVerification.upsert({
      where: { email },
      update: { code: verificationCode, expiresAt: this.getExpiryTime(15) },
      create: {
        email,
        code: verificationCode,
        expiresAt: this.getExpiryTime(15)
      }
    });

    try {
      await this.emailService.sendEmail(
        email,
        "Verify Your Fly Free Account",
        this.getVerificationEmailTemplate(name, verificationCode)
      );
    } catch (emailError) {
      console.warn("Email send failed (non-blocking):", emailError);
      // Continue anyway - email can fail without blocking signup
    }

    return {
      message: "Signup successful! Please verify your email.",
      userId: user.id,
      email: user.email,
      requiresVerification: true
    };
  }

  async verifyEmail(rawEmail: string, code: string) {
    const email = this.normalizeEmail(rawEmail);

    if (!email || !code) {
      throw new BadRequestException("Email and verification code are required");
    }

    const verification = await this.prisma.emailVerification.findUnique({
      where: { email }
    });

    if (!verification) {
      throw new BadRequestException("No verification code found for this email");
    }

    if (verification.code !== code) {
      throw new BadRequestException("Invalid verification code");
    }

    if (new Date() > verification.expiresAt) {
      throw new BadRequestException("Verification code has expired");
    }

    await this.prisma.user.update({
      where: { email },
      data: { emailVerified: true, emailVerifiedAt: new Date() }
    });

    await this.prisma.emailVerification.delete({ where: { email } });

    return { message: "Email verified successfully" };
  }

  async resendVerificationEmail(rawEmail: string) {
    const email = this.normalizeEmail(rawEmail);

    if (!email) {
      throw new BadRequestException("Email is required");
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException("User not found");
    }

    if (user.emailVerified) {
      throw new BadRequestException("Email is already verified");
    }

    const verificationCode = this.generateVerificationCode();
    await this.prisma.emailVerification.upsert({
      where: { email },
      update: { code: verificationCode, expiresAt: this.getExpiryTime(15) },
      create: {
        email,
        code: verificationCode,
        expiresAt: this.getExpiryTime(15)
      }
    });

    try {
      await this.emailService.sendEmail(
        email,
        "Verify Your Fly Free Account",
        this.getVerificationEmailTemplate(user.name || "User", verificationCode)
      );
    } catch (emailError) {
      console.warn("Email resend failed (non-blocking):", emailError);
      // Continue anyway - email can fail without blocking resend
    }

    return { message: "Verification email sent. Check your inbox." };
  }

  async loginUser(rawEmail: string, password: string) {
    const email = this.normalizeEmail(rawEmail);

    if (!email || !password) {
      throw new BadRequestException("Email and password are required");
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException("Please verify your email first");
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const token = this.generateToken({ userId: user.id, email: user.email });

    return {
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        image: user.image
      }
    };
  }

  async logoutUser(token: string) {
    return { message: "Logged out successfully" };
  }

  async getUserProfile(token: string) {
    const userId = this.validateToken(token);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: true,
        wishlistItems: { include: { product: true } },
        orders: { include: { items: true } }
      }
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      image: user.image,
      emailVerified: user.emailVerified,
      addressCount: user.addresses.length,
      wishlistCount: user.wishlistItems.length,
      orderCount: user.orders.length
    };
  }

  async updateUserProfile(token: string, data: { name?: string; phone?: string; image?: string }) {
    const userId = this.validateToken(token);

    if (data.phone && !/^\d{10}$/.test(data.phone)) {
      throw new BadRequestException("Phone must be exactly 10 digits");
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        phone: data.phone,
        image: data.image
      }
    });

    return {
      message: "Profile updated successfully",
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        phone: updated.phone,
        image: updated.image
      }
    };
  }

  async changePassword(token: string, currentPassword: string, newPassword: string) {
    if (!currentPassword || !newPassword) {
      throw new BadRequestException("Current and new passwords are required");
    }

    if (newPassword.length < 8) {
      throw new BadRequestException("New password must be at least 8 characters");
    }

    const userId = this.validateToken(token);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("User not found");
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    const newPasswordHash = await bcrypt.hash(newPassword, this.saltRounds);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });

    return { message: "Password changed successfully" };
  }

  // ==================== ADMIN AUTHENTICATION ====================

  async loginAdmin(rawEmail: string, password: string) {
    try {
      const admin = await this.prisma.adminUser.findUnique({
        where: { email: this.normalizeEmail(rawEmail) },
        include: { role: { include: { permissions: true } } }
      });

      if (!admin) {
        return { error: "Admin not found", status: 404 };
      }

      const token = this.generateToken({ userId: admin.id, email: admin.email, isAdmin: true });

      return {
        message: "Admin login successful",
        adminId: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role.name,
        permissions: admin.role.permissions,
        token
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
    const adminId = this.validateToken(token, true);

    return this.prisma.adminUser.findUnique({
      where: { id: adminId },
      include: { role: { include: { permissions: true } } }
    });
  }

  // ==================== PASSWORD RESET ====================

  async sendPasswordResetEmail(rawEmail: string) {
    const email = this.normalizeEmail(rawEmail);

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Deliberately vague so the endpoint cannot be used to enumerate accounts,
      // but log it so a genuine delivery problem is still diagnosable.
      this.logger.warn(`Password reset requested for unknown address: ${email}`);
      return { message: "If user exists, password reset email sent" };
    }

    const resetCode = this.generateVerificationCode();
    await this.prisma.emailVerification.upsert({
      where: { email },
      update: { code: resetCode, expiresAt: this.getExpiryTime(30) },
      create: {
        email,
        code: resetCode,
        expiresAt: this.getExpiryTime(30)
      }
    });

    await this.emailService.sendEmail(
      email,
      "Reset Your Fly Free Password",
      this.getPasswordResetEmailTemplate(user.name || "User", resetCode)
    );

    return { message: "Password reset email sent" };
  }

  async resetPassword(rawEmail: string, code: string, newPassword: string) {
    const email = this.normalizeEmail(rawEmail);

    if (!email || !code || !newPassword) {
      return { error: "Email, code, and new password are required", status: 400 };
    }

    if (newPassword.length < 8) {
      return { error: "Password must be at least 8 characters", status: 400 };
    }

    const verification = await this.prisma.emailVerification.findUnique({
      where: { email }
    });

    if (!verification || verification.code !== code) {
      return { error: "Invalid reset code", status: 400 };
    }

    if (new Date() > verification.expiresAt) {
      return { error: "Reset code has expired", status: 400 };
    }

    const passwordHash = await bcrypt.hash(newPassword, this.saltRounds);
    await this.prisma.user.update({
      where: { email },
      data: { passwordHash }
    });

    await this.prisma.emailVerification.delete({ where: { email } });

    return { message: "Password reset successfully" };
  }

  // ==================== HELPER METHODS ====================

  private generateToken(payload: any): string {
    const secret = this.config.get<string>("JWT_SECRET") || "dev-secret-key";
    return jwt.sign(payload, secret, { expiresIn: "30d" });
  }

  private validateToken(token: string, isAdmin = false): string {
    try {
      const secret = this.config.get<string>("JWT_SECRET") || "dev-secret-key";
      const bearer = token.replace("Bearer ", "");
      const decoded = jwt.verify(bearer, secret) as any;

      if (isAdmin && !decoded.isAdmin) {
        throw new UnauthorizedException("Admin access required");
      }

      return decoded.userId;
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  private generateVerificationCode(): string {
    return Math.random().toString().slice(2, 8);
  }

  private getExpiryTime(minutes: number): Date {
    const now = new Date();
    return new Date(now.getTime() + minutes * 60000);
  }

  private getVerificationEmailTemplate(name: string, code: string): string {
    const verifyUrl = `${this.emailService.webUrl()}/auth/verify-email?email=`;
    return this.emailService.renderEmail({
      eyebrow: "Confirm your email",
      title: "Your verification code",
      preheader: `${code} is your Fly Free verification code`,
      body: `
        <p style="margin:0 0 14px 0;">Hi ${this.escapeHtml(name)},</p>
        <p style="margin:0 0 14px 0;">Welcome to Fly Free. Enter this code on the verification screen to activate your account.</p>
        ${this.emailService.otpBlock(code, "This code expires in 15 minutes.")}
        <p style="margin:0 0 14px 0;">Closed the tab? Open <a href="${verifyUrl}" style="color:#FF6B5B;text-decoration:none;">the verification page</a> and enter your email plus the code above.</p>
        <p style="margin:0;font-size:12px;color:#9A9A9A;">If you did not create a Fly Free account, you can ignore this email - nothing will be activated.</p>
      `
    });
  }

  private getPasswordResetEmailTemplate(name: string, code: string): string {
    return this.emailService.renderEmail({
      eyebrow: "Password reset",
      title: "Reset your password",
      preheader: `${code} is your Fly Free password reset code`,
      body: `
        <p style="margin:0 0 14px 0;">Hi ${this.escapeHtml(name)},</p>
        <p style="margin:0 0 14px 0;">We received a request to reset the password on your Fly Free account. Use the code below to set a new one.</p>
        ${this.emailService.otpBlock(code, "This code expires in 30 minutes.")}
        <p style="margin:0;font-size:12px;color:#9A9A9A;">Did not request this? Ignore this email and your password stays unchanged.</p>
      `
    });
  }

  private escapeHtml(value: string) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
