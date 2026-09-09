import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";
import { CACHE_MISS, PUBLIC_CACHE_SECONDS, peekPublicCache, putPublicCache } from "./public-cache";

/**
 * Serves public GET responses from memory, keyed on the request URL.
 *
 * Applied to controllers whose GETs are public and identical for every visitor.
 * The storefront requests these on every page view and the browser talks straight
 * to this API, so a single homepage view was issuing nine uncached queries worth
 * roughly 920 KB. Caching here means the database is read once per TTL instead of
 * once per visitor, and the matching `Cache-Control` lets browsers skip the
 * request entirely on repeat views.
 *
 * Only put this on routes with no per-user variation: it is keyed on the URL
 * alone, so a response that depends on the caller would leak between visitors.
 * {@link PublicCacheInterceptor} clears everything on admin writes.
 */
@Injectable()
export class PublicCacheReadInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest();

    if ((request?.method ?? "GET").toUpperCase() !== "GET") {
      return next.handle();
    }

    // Let browsers and any proxy in front reuse the response too. Fastify replies
    // expose header(), Node/Express ones setHeader(); support both so this keeps
    // working if the adapter changes.
    const response = http.getResponse();
    const cacheControl = `public, max-age=${PUBLIC_CACHE_SECONDS}, stale-while-revalidate=300`;
    if (typeof response?.header === "function") {
      response.header("Cache-Control", cacheControl);
    } else if (typeof response?.setHeader === "function") {
      response.setHeader("Cache-Control", cacheControl);
    }

    const key = `GET:${request.originalUrl ?? request.url}`;
    const cached = peekPublicCache(key);
    if (cached !== CACHE_MISS) {
      return of(cached);
    }

    return next.handle().pipe(tap({ next: (value) => putPublicCache(key, value) }));
  }
}
