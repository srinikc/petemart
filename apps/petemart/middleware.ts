// =============================================================================
// PeteMart — Product App Middleware
// Blocks framework-console routes; enforces API rate limiting, security headers,
// and admin auth for the product API.
// =============================================================================

import { NextResponse, NextRequest } from 'next/server';

const RATE_LIMIT_MAP = new Map<string, { count: number; resetAt: number }>();
const BLOCKED_PREFIXES = ['/agentic-console', '/qa-dashboard', '/api/agentic-console', '/api/qa'];

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || '127.0.0.1';
}

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const record = RATE_LIMIT_MAP.get(key);
  if (!record || now > record.resetAt) {
    RATE_LIMIT_MAP.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= maxRequests) return false;
  record.count++;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of RATE_LIMIT_MAP.entries()) {
    if (now > value.resetAt) RATE_LIMIT_MAP.delete(key);
  }
}, 300000);

export function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url);

  // Block framework-console routes from the product app
  if (BLOCKED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Not found in PeteMart' } },
      { status: 404 }
    );
  }

  // ── API Rate Limiting ──────────────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    const ip = getClientIp(request);
    const isAllowed = checkRateLimit(`api:${ip}`, 200, 60000);
    if (!isAllowed) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' } },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  }

  // ── Security Headers ───────────────────────────────────────────────────────
  const response = NextResponse.next();

  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Max-Age', '86400');
  }

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // ── API Auth enforcement (minimal for POC) ────────────────────────────────
  if (pathname.startsWith('/api/v1/admin/') && request.method !== 'OPTIONS') {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer mock-jwt-admin-')) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 401 }
      );
    }
  }

  // ── Handle OPTIONS preflight ───────────────────────────────────────────────
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