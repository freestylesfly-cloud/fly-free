import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as jwt from "jsonwebtoken";

export type ActivityLevel = "INFO" | "WARN" | "ERROR";

export interface ActivityEntry {
  level: ActivityLevel;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  authorization?: string;
  ip?: string;
  userAgent?: string;
  message?: string;
  detail?: string;
}

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persist a request outcome. Never throws and never blocks the response —
   * a logging failure must not turn a working request into an error.
   */
  record(entry: ActivityEntry) {
    const { userId, userEmail } = this.identify(entry.authorization);

    void this.prisma.activityLog
      .create({
        data: {
          level: entry.level,
          method: entry.method,
          path: entry.path.slice(0, 500),
          statusCode: entry.statusCode,
          durationMs: entry.durationMs,
          userId,
          userEmail,
          ip: entry.ip?.slice(0, 64),
          userAgent: entry.userAgent?.slice(0, 300),
          message: entry.message?.slice(0, 1000),
          detail: entry.detail?.slice(0, 4000)
        }
      })
      .catch((error) => {
        this.logger.warn(`Could not persist activity log: ${error?.message ?? error}`);
      });
  }

  /** Best-effort attribution of a request to an account. */
  private identify(authorization?: string) {
    if (!authorization) return { userId: null, userEmail: null };

    try {
      const secret = process.env.JWT_SECRET || "dev-secret-key";
      const decoded = jwt.verify(authorization.replace("Bearer ", ""), secret) as any;
      return { userId: decoded?.userId ?? null, userEmail: decoded?.email ?? null };
    } catch {
      return { userId: null, userEmail: null };
    }
  }

  async list(params: {
    level?: string;
    status?: string;
    search?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(Number(params.page) || 1, 1);
    const limit = Math.min(Math.max(Number(params.limit) || 50, 1), 200);

    const where: any = {};
    if (params.level && params.level !== "ALL") where.level = params.level;
    if (params.userId) where.userId = params.userId;

    if (params.status === "errors") where.statusCode = { gte: 400 };
    else if (params.status === "success") where.statusCode = { lt: 400 };

    if (params.search) {
      where.OR = [
        { path: { contains: params.search, mode: "insensitive" } },
        { message: { contains: params.search, mode: "insensitive" } },
        { userEmail: { contains: params.search, mode: "insensitive" } }
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.activityLog.count({ where })
    ]);

    return { data, total, page, pages: Math.ceil(total / limit) };
  }

  /** Headline counts for the last 24 hours. */
  async stats() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [total, errors, warnings, slowest] = await Promise.all([
      this.prisma.activityLog.count({ where: { createdAt: { gte: since } } }),
      this.prisma.activityLog.count({ where: { createdAt: { gte: since }, statusCode: { gte: 400 } } }),
      this.prisma.activityLog.count({ where: { createdAt: { gte: since }, level: "WARN" } }),
      this.prisma.activityLog.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { durationMs: "desc" },
        take: 5,
        select: { path: true, method: true, durationMs: true, statusCode: true }
      })
    ]);

    return { windowHours: 24, total, errors, warnings, slowest };
  }

  async clear(olderThanDays?: number) {
    const where = olderThanDays
      ? { createdAt: { lt: new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000) } }
      : {};

    const { count } = await this.prisma.activityLog.deleteMany({ where });
    return { removed: count };
  }
}
