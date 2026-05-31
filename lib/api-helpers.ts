// =============================================================================
// PeteMart — API Helper Utilities
// =============================================================================
// Shared helpers for API route handlers (server-side).
// =============================================================================

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// ── Response Envelope ────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: Record<string, string[]> };
  meta?: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
}

export function ok<T>(data: T, meta?: ApiResponse['meta']): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = { success: true, data };
  if (meta) response.meta = meta;
  return NextResponse.json(response);
}

export function created<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function badRequest(message: string, details?: Record<string, string[]>): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message, details } }, { status: 400 });
}

export function unauthorized(message = 'Authentication required'): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message } }, { status: 401 });
}

export function forbidden(message = 'Access denied'): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message } }, { status: 403 });
}

export function notFound(message = 'Resource not found'): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message } }, { status: 404 });
}

export function conflict(message = 'Resource already exists'): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error: { code: 'CONFLICT', message } }, { status: 409 });
}

export function serverError(message = 'Internal server error'): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, { status: 500 });
}

// ── Error Handler ────────────────────────────────────────────────────────────
export function handleError(error: unknown): NextResponse<ApiResponse> {
  if (error instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join('.');
      if (!details[path]) details[path] = [];
      details[path].push(issue.message);
    }
    return badRequest('Validation failed', details);
  }
  console.error('[API Error]', error);
  return serverError('An unexpected error occurred');
}

// ── Rate Limiter (Simple In-Memory) ──────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= maxRequests) return false;
  record.count++;
  return true;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || '127.0.0.1';
}

// ── Pagination ───────────────────────────────────────────────────────────────
export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const offset = (page - 1) * limit;
  const sort = searchParams.get('sort') || 'created_at';
  const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';
  return { page, limit, offset, sort, order };
}

export function createPaginationMeta(page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit) || 1;
  return { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 };
}
