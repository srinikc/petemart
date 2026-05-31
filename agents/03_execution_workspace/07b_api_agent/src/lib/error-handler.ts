// =============================================================================
// PeteMart — Unified Error Handler
// =============================================================================
// Catches all errors from API route handlers and returns a consistent
// JSON error response envelope: { success: false, error: { code, message, details } }
// =============================================================================

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import type { ApiResponse, ApiError } from '@/types';

// ── Custom API Error Classes ─────────────────────────────────────────────────

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: Record<string, string[]>;

  constructor(statusCode: number, code: string, message: string, details?: Record<string, string[]>) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `The requested ${resource} was not found.`);
  }
}

export class ValidationError extends AppError {
  constructor(details: Record<string, string[]>) {
    super(400, 'VALIDATION_ERROR', 'Request validation failed.', details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.');
  }
}

// ── Error Handler ────────────────────────────────────────────────────────────

/**
 * Wraps an API route handler with error handling.
 * All unhandled errors are caught and returned in the standard envelope.
 */
export function withErrorHandler(
  handler: (...args: any[]) => Promise<NextResponse>
): (...args: any[]) => Promise<NextResponse> {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Converts any error into a standardized API error response.
 */
export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  // Zod validation error
  if (error instanceof ZodError) {
    const validationError = fromZodError(error);
    const details: Record<string, string[]> = {};

    for (const issue of error.issues) {
      const path = issue.path.join('.');
      if (!details[path]) details[path] = [];
      details[path].push(issue.message);
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validationError.message,
          details,
        },
      },
      { status: 400 }
    );
  }

  // Custom AppError
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  // Supabase error
  if (error && typeof error === 'object' && 'code' in error) {
    const dbError = error as { code: string; message: string; details?: string };
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: dbError.message || 'A database error occurred.',
        },
      },
      { status: 500 }
    );
  }

  // Unknown error
  console.error('[API Error]', error);
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred. Please try again later.',
      },
    },
    { status: 500 }
  );
}

// ── Edge middleware error helper ─────────────────────────────────────────────
export function createErrorResponse(status: number, code: string, message: string): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: { code, message },
    },
    { status }
  );
}
