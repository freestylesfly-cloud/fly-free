import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { invalidatePublicCache } from "./public-cache";

/**
 * Clears the public response cache after any successful admin write.
 *
 * Applied once at the admin controller rather than called from each mutation:
 * there are dozens of write endpoints and more get added, and a single missed
 * call would leave an admin staring at a stale storefront wondering why their
 * edit did nothing. Clearing on unrelated writes (a coupon, say) costs one
 * repeated query, which is far cheaper than that confusion.
 */
@Injectable()
export class PublicCacheInterceptor implements NestInterceptor {
  private static readonly WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const method: string = context.switchToHttp().getRequest()?.method ?? "GET";

    if (!PublicCacheInterceptor.WRITE_METHODS.has(method.toUpperCase())) {
      return next.handle();
    }

    // Only on success: a rejected write changed nothing, so the cache is valid.
    return next.handle().pipe(tap({ next: () => invalidatePublicCache() }));
  }
}
