// =============================================================================
// GET /api/v1/orders
// =============================================================================
// Returns the authenticated customer's order history with pagination.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/error-handler';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { authenticateRequest } from '@/lib/auth-middleware';
import { ok, unauthorizedResponse, createPaginationMeta, parsePaginationParams } from '@/lib/response';
import { getServiceClient } from '@/lib/supabase-client';
import type { ApiResponse, Order } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const rateLimitCheck = rateLimitMiddleware(request, 'default');
    if (rateLimitCheck) return rateLimitCheck;

    const { user, error } = await authenticateRequest(request);
    if (error || !user) {
      return error || NextResponse.json(unauthorizedResponse(), { status: 401 });
    }

    const supabase = getServiceClient();
    const { searchParams } = new URL(request.url);
    const { page, limit, offset, sort, order } = parsePaginationParams(searchParams);

    // Status filter
    const status = searchParams.get('status');

    let query = supabase
      .from('orders')
      .select(`
        *,
        items:order_items (
          id, product_id, merchant_id, quantity, unit_price, total_price, notes,
          product:product_id (id, name, slug, images)
        )
      `, { count: 'exact' })
      .eq('user_id', user.id);

    if (status) {
      query = query.eq('status', status);
    }

    // Get count
    const { count: total } = await query;
    const totalCount = total || 0;

    // Apply sort and pagination
    query = query
      .order(sort as any, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    const { data: orders, error: ordersError } = await query;

    if (ordersError) throw ordersError;

    return NextResponse.json(
      ok(orders as Order[], createPaginationMeta(page, limit, totalCount))
    );
  } catch (error) {
    return handleApiError(error);
  }
}
