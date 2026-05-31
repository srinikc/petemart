// =============================================================================
// PeteMart — Test Helpers
// =============================================================================
// Provides mock request creation and test utility functions.
// =============================================================================

import { NextRequest } from 'next/server';

/**
 * Creates a mock NextRequest for testing route handlers.
 */
export function createMockRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  options?: {
    body?: Record<string, any>;
    headers?: Record<string, string>;
    params?: Record<string, string>;
    searchParams?: Record<string, string>;
    cookies?: Record<string, string>;
  }
): NextRequest {
  const url = new URL('http://localhost:3000/api/v1/test');

  // Add search params
  if (options?.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      url.searchParams.set(key, value);
    }
  }

  const request = new NextRequest(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
      ...options?.headers,
    },
    body: method !== 'GET' && method !== 'DELETE' && options?.body
      ? JSON.stringify(options.body)
      : undefined,
  });

  return request;
}

/**
 * Creates a mock authenticated request with a Bearer token.
 */
export function createAuthMockRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  token: string = 'test-jwt-token',
  options?: {
    body?: Record<string, any>;
    searchParams?: Record<string, string>;
  }
): NextRequest {
  return createMockRequest(method, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Creates a mock merchant-authenticated request.
 */
export function createMerchantMockRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  options?: {
    body?: Record<string, any>;
    searchParams?: Record<string, string>;
  }
): NextRequest {
  return createAuthMockRequest(method, 'merchant-jwt-token', options);
}

/**
 * Creates a mock admin-authenticated request.
 */
export function createAdminMockRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  options?: {
    body?: Record<string, any>;
    searchParams?: Record<string, string>;
  }
): NextRequest {
  return createAuthMockRequest(method, 'admin-jwt-token', options);
}

/**
 * Parses a NextResponse JSON body for assertions.
 */
export async function parseResponse(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Mock console.error to keep test output clean.
 */
export function suppressConsoleError(): () => void {
  const original = console.error;
  console.error = jest.fn();
  return () => { console.error = original; };
}
