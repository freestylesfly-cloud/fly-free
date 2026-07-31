import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { ActivityLogService, ActivityLevel } from "./activity-log.service";

/** Reading the log viewer must not generate more log noise. */
const IGNORED_PREFIXES = ["/api/admin/activity-logs", "/api/admin/logs"];

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(private readonly activityLog: ActivityLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const path: string = request.url || request.originalUrl || "";

    if (IGNORED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
      return next.handle();
    }

    const startedAt = Date.now();
    const base = {
      method: request.method,
      path,
      authorization: request.headers?.authorization,
      ip: request.ip || request.headers?.["x-forwarded-for"],
      userAgent: request.headers?.["user-agent"]
    };

    return next.handle().pipe(
      tap({
        next: () => {
          const statusCode = http.getResponse()?.statusCode ?? 200;
          this.activityLog.record({
            ...base,
            level: statusCode >= 400 ? "WARN" : "INFO",
            statusCode,
            durationMs: Date.now() - startedAt
          });
        },
        error: (error) => {
          const statusCode = Number(error?.status || error?.statusCode) || 500;
          const level: ActivityLevel = statusCode >= 500 ? "ERROR" : "WARN";

          this.activityLog.record({
            ...base,
            level,
            statusCode,
            durationMs: Date.now() - startedAt,
            message: error?.message ?? "Request failed",
            detail: error?.stack
          });
        }
      })
    );
  }
}
