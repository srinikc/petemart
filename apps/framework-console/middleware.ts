// =============================================================================
// ProductForge — Framework Console Middleware
// Guards the console + QA dashboard; blocks petemart product routes.
// =============================================================================

import { NextResponse, NextRequest } from 'next/server';

const BLOCKED_PREFIXES = ['/(customer)', '/admin', '/merchant', '/api/v1', '/api/token-usage'];

export function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url);

  // Block product-routed paths from the console app
  if (BLOCKED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Not found in Framework Console' } },
      { status: 404 }
    );
  }

  const response = NextResponse.next();

  // CORS headers for API
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Max-Age', '86400');
  }

  // Security headers (all routes)
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Handle OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};