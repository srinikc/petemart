// =============================================================================
// PeteMart — Standardized Response Helpers
// =============================================================================
// All API responses follow the envelope: { success, data, error, meta }
// =============================================================================

import { NextResponse } from 'next/server';
import type { ApiResponse, PaginationMeta } from '@/types';

// ── Success Responses ────────────────────────────────────────────────────────

/**
 * 200 OK — Successful request with data.
 */
export function successResponse<T>(data: T, meta?: PaginationMeta): ApiResponse<T> {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  if (meta) {
    response.meta = meta;
  }
  return response;
}

/**
 * Returns a NextResponse with 200 status.
 */
export function ok<T>(data: T, meta?: PaginationMeta): NextResponse<ApiResponse<T>> {
  return NextResponse.json(successResponse(data, meta), { status: 200 });
}

/**
 * 201 Created — Resource successfully created.
 */
export function created<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: true, data },
    { status: 201 }
  );
}

/**
 * 204 No Content — Successful request with no body to return.
 */
export function noContent(): NextResponse<null> {
  return new NextResponse(null, { status: 204 });
}

// ── Error Responses ──────────────────────────────────────────────────────────

/**
 * 400 Bad Request — Client error.
 */
export function badRequestResponse(message: string, details?: Record<string, string[]>): ApiResponse {
  return {
    success: false,
    error: {
      code: 'BAD_REQUEST',
      message,
      details,
    },
  };
}

/**
 * 401 Unauthorized — Authentication required.
 */
export function unauthorizedResponse(message: string = 'Authentication required.'): ApiResponse {
  return {
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message,
    },
  };
}

/**
 * 403 Forbidden — Insufficient permissions.
 */
export function forbiddenResponse(message: string = 'Access denied.'): ApiResponse {
  return {
    success: false,
    error: {
      code: 'FORBIDDEN',
      message,
    },
  };
}

/**
 * 404 Not Found — Resource does not exist.
 */
export function notFoundResponse(message: string = 'Resource not found.'): ApiResponse {
  return {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message,
    },
  };
}

/**
 * 409 Conflict — Resource state conflict.
 */
export function conflictResponse(message: string): ApiResponse {
  return {
    success: false,
    error: {
      code: 'CONFLICT',
      message,
    },
  };
}

/**
 * 429 Too Many Requests — Rate limit exceeded.
 */
export function rateLimitResponse(retryAfter: number): ApiResponse {
  return {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Too many requests. Please try again in ${retryAfter} seconds.`,
    },
  };
}

/**
 * 500 Internal Server Error — Unexpected server error.
 */
export function serverErrorResponse(message: string = 'An unexpected error occurred.'): ApiResponse {
  return {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message,
    },
  };
}

// ── Pagination Helper ────────────────────────────────────────────────────────

/**
 * Creates pagination metadata.
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Parses pagination query parameters with defaults.
 */
export function parsePaginationParams(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  offset: number;
  sort: string;
  order: 'asc' | 'desc';
} {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const sort = searchParams.get('sort') || 'created_at';
  const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';

  return {
    page,
    limit,
    offset: (page - 1) * limit,
    sort,
    order,
  };
}
