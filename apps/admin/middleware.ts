import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Whitelist routes that don't need authentication
  const publicRoutes = ['/login', '/_next', '/api', '/favicon.ico'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // For public routes, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes, check token in localStorage via client-side ProtectedRoute component
  // Middleware cannot read localStorage, so we rely on ProtectedRoute for auth check
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|public).*)'],
};
