// =============================================================================
// PeteMart — Token Bucket Rate Limiter
// =============================================================================
// In-memory token bucket algorithm for POC. For production, replace with
// Upstash Redis or Vercel KV for distributed rate limiting.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';

// ── Token Bucket Entry ───────────────────────────────────────────────────────
interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

// ── Rate Limit Configuration ─────────────────────────────────────────────────
export interface RateLimitConfig {
  maxTokens: number;      // Maximum burst capacity
  refillRate: number;     // Tokens added per second
  refillInterval: number; // Interval in ms between refills
}

export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  default: { maxTokens: 100, refillRate: 10, refillInterval: 1000 },
  auth: { maxTokens: 10, refillRate: 2, refillInterval: 1000 },   // Auth endpoints
  otp: { maxTokens: 5, refillRate: 1, refillInterval: 1000 },     // OTP endpoints (per phone)
  checkout: { maxTokens: 10, refillRate: 3, refillInterval: 1000 }, // Checkout endpoints
  admin: { maxTokens: 60, refillRate: 10, refillInterval: 1000 },  // Admin endpoints
  merchant: { maxTokens: 60, refillRate: 10, refillInterval: 1000 }, // Merchant endpoints
  public: { maxTokens: 100, refillRate: 20, refillInterval: 1000 },  // Public read endpoints
};

// ── In-Memory Store ──────────────────────────────────────────────────────────
// Note: For production, use Redis/Upstash to persist across serverless instances.
const buckets = new Map<string, TokenBucket>();

// Periodic cleanup to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
      if (now - bucket.lastRefill > 60000) {
        buckets.delete(key); // Remove entries idle for > 1 min
      }
    }
  }, 60000);
}

// ── Rate Limiter Logic ───────────────────────────────────────────────────────

/**
 * Returns the IP address from the request.
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return '127.0.0.1';
}

/**
 * Creates a rate limit key based on config group and client identifier.
 */
function getRateLimitKey(configKey: string, clientId: string): string {
  return `${configKey}:${clientId}`;
}

/**
 * Checks if a request should be rate limited.
 * Returns the remaining tokens and whether the request is allowed.
 */
function checkRateLimit(configKey: string, clientId: string): {
  allowed: boolean;
  remaining: number;
  resetIn: number;
} {
  const config = RATE_LIMIT_CONFIGS[configKey] || RATE_LIMIT_CONFIGS.default;
  const key = getRateLimitKey(configKey, clientId);
  const now = Date.now();

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: config.maxTokens, lastRefill: now };
    buckets.set(key, bucket);
  }

  // Refill tokens
  const elapsed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor(elapsed / config.refillInterval) * config.refillRate;
  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(config.maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  // Check if allowed
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    const resetIn = Math.ceil((config.refillInterval - (now - bucket.lastRefill)) / 1000);
    return { allowed: true, remaining: bucket.tokens, resetIn };
  }

  const resetIn = Math.ceil((config.refillInterval - (now - bucket.lastRefill)) / 1000);
  return { allowed: false, remaining: 0, resetIn };
}

/**
 * Rate limiting middleware for API routes.
 * Usage: const rateLimitResult = rateLimit(request, 'auth');
 */
export function rateLimit(
  request: NextRequest,
  configKey: string = 'default',
  customIdentifier?: string
): { allowed: boolean; remaining: number; resetIn: number } {
  const identifier = customIdentifier || getClientIp(request);
  return checkRateLimit(configKey, identifier);
}

/**
 * Creates a NextResponse with 429 status if rate limited.
 */
export function rateLimitMiddleware(
  request: NextRequest,
  configKey: string = 'default',
  customIdentifier?: string
): NextResponse<ApiResponse> | null {
  const result = rateLimit(request, configKey, customIdentifier);

  if (!result.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests. Please try again in ${result.resetIn} seconds.`,
        },
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(result.resetIn),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.resetIn),
        },
      }
    );
  }

  return null;
}
