// =============================================================================
// GET /api/v1/orders
// =============================================================================
// Returns orders for the authenticated customer.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { ORDERS } from '@/lib/data';
import { ok, unauthorized, handleError } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    // Check for auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      // For POC, return mock orders
      return ok(ORDERS);
    }
    // In production, verify token and filter by user
    return ok(ORDERS);
  } catch (error) {
    return handleError(error);
  }
}
