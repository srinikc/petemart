// =============================================================================
// PeteMart — Next.js Edge Middleware
// =============================================================================
// Handles rate limiting, authentication checks, CORS, and request validation
// at the edge before requests reach API route handlers.
// =============================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── Public Paths (no auth required) ──────────────────────────────────────────
const PUBLIC_PATHS = [
  '/api/v1/auth/signup',
  '/api/v1/auth/login',
  '/api/v1/auth/verify-otp',
  '/api/v1/auth/send-otp',
  '/api/v1/markets',
  '/api/v1/merchants',
  '/api/v1/products',
  '/api/v1/whatsapp',
  '/api/v1/config',
  '/api/v1/bullion',
  '/health',
];

// ── Rate Limit Thresholds (per path prefix) ──────────────────────────────────
const RATE_LIMIT_MAP: Record<string, { maxRequests: number; windowMs: number }> = {
  '/api/v1/auth/otp': { maxRequests: 5, windowMs: 60000 },       // 5 OTP requests per minute
  '/api/v1/auth': { maxRequests: 20, windowMs: 60000 },          // 20 auth requests per minute
  '/api/v1/checkout': { maxRequests: 10, windowMs: 60000 },      // 10 checkout requests per minute
  '/api/v1/admin': { maxRequests: 60, windowMs: 60000 },         // 60 admin requests per minute
  '/api/v1/merchant': { maxRequests: 60, windowMs: 60000 },      // 60 merchant requests per minute
  '/api/v1': { maxRequests: 100, windowMs: 60000 },              // 100 general API requests per minute
};

// ── Simple In-Memory Rate Limiter (Edge-compatible) ──────────────────────────
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();

// Cleanup stale entries periodically (in edge, this runs per instance)
const CLEANUP_INTERVAL = 60000;
let lastCleanup = Date.now();

function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, value] of ipRequestCounts.entries()) {
    if (now > value.resetAt) {
      ipRequestCounts.delete(key);
    }
  }
}

function getRateLimitKey(pathname: string, ip: string): string {
  // Find the most specific matching rate limit rule
  const sortedPrefixes = Object.keys(RATE_LIMIT_MAP).sort((a, b) => b.length - a.length);
  for (const prefix of sortedPrefixes) {
    if (pathname.startsWith(prefix)) {
      return `${prefix}:${ip}`;
    }
  }
  return `${ip}`;
}

function isRateLimited(pathname: string, ip: string): { limited: boolean; retryAfter: number } {
  cleanupStaleEntries();
  const key = getRateLimitKey(pathname, ip);
  const configKey = Object.keys(RATE_LIMIT_MAP).find((p) => pathname.startsWith(p)) || '/api/v1';
  const config = RATE_LIMIT_MAP[configKey] || RATE_LIMIT_MAP['/api/v1'];
  const now = Date.now();

  let record = ipRequestCounts.get(key);
  if (!record || now > record.resetAt) {
    record = { count: 1, resetAt: now + config.windowMs };
    ipRequestCounts.set(key, record);
    return { limited: false, retryAfter: 0 };
  }

  record.count += 1;
  if (record.count > config.maxRequests) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { limited: true, retryAfter };
  }

  return { limited: false, retryAfter: 0 };
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'));
}

// ── Middleware Handler ───────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── CORS Preflight ─────────────────────────────────────────────────────────
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // ── Health Check ───────────────────────────────────────────────────────────
  if (pathname === '/health') {
    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  // ── API Routes Only ────────────────────────────────────────────────────────
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // ── Rate Limiting ──────────────────────────────────────────────────────────
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || '127.0.0.1';

  const { limited, retryAfter } = isRateLimited(pathname, ip);
  if (limited) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests. Please try again in ${retryAfter} seconds.`,
        },
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  // ── Public paths pass through ──────────────────────────────────────────────
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // ── Authenticated paths — let route handlers handle JWT verification ──────
  // The route handlers use @/lib/auth-middleware which handles both cookie
  // and Bearer token auth. We just pass through and let them decide.
  return NextResponse.next();
}

// ── Matcher Configuration ────────────────────────────────────────────────────
export const config = {
  matcher: [
    '/api/:path*',
    '/health',
  ],
};
