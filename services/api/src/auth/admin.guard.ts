import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as jwt from "jsonwebtoken";
import { requireJwtSecret } from "./jwt-secret";

/**
 * Requires a valid admin JWT on every request.
 *
 * Applied at the controller level to everything under /api/admin. Without it
 * those routes are reachable by anyone, which exposes customers, orders and
 * destructive writes.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers?.authorization;

    if (!header) {
      throw new UnauthorizedException("Authentication required");
    }

    let secret: string;
    try {
      // Never fall back to a default secret: a predictable one is the same as no auth.
      secret = requireJwtSecret(this.config);
    } catch {
      throw new UnauthorizedException("Server authentication is not configured (JWT_SECRET missing)");
    }

    let decoded: any;
    try {
      decoded = jwt.verify(header.replace(/^Bearer\s+/i, ""), secret);
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }

    if (!decoded?.isAdmin) {
      throw new UnauthorizedException("Admin access required");
    }

    request.admin = { id: decoded.userId, email: decoded.email };
    return true;
  }
}
