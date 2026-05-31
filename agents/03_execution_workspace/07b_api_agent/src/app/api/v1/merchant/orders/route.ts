// =============================================================================
// GET /api/v1/merchant/orders
// =============================================================================
// Returns incoming orders for the authenticated merchant.
// Merchant-only endpoint.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/error-handler';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { authenticateRequest, requireRole } from '@/lib/auth-middleware';
import { ok, unauthorizedResponse, notFoundResponse, createPaginationMeta, parsePaginationParams } from '@/lib/response';
import { getServiceClient } from '@/lib/supabase-client';
import type { ApiResponse, Order, OrderItem } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const rateLimitCheck = rateLimitMiddleware(request, 'merchant');
    if (rateLimitCheck) return rateLimitCheck;

    const { user, error } = await authenticateRequest(request);
    if (error || !user) {
      return error || NextResponse.json(unauthorizedResponse(), { status: 401 });
    }

    const roleError = requireRole(user, ['merchant']);
    if (roleError) return roleError;

    const supabase = getServiceClient();
    const { searchParams } = new URL(request.url);
    const { page, limit, offset, sort, order } = parsePaginationParams(searchParams);

    // Find merchant
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(notFoundResponse('Merchant profile not found.'), { status: 404 });
    }

    // Status filter
    const status = searchParams.get('status');

    // Get orders that contain this merchant's products
    // We use order_items to find relevant orders
    let orderIdsQuery = supabase
      .from('order_items')
      .select('order_id')
      .eq('merchant_id', merchant.id);

    const { data: relevantItems } = await orderIdsQuery;
    const orderIds = [...new Set((relevantItems || []).map((item: any) => item.order_id))];

    if (orderIds.length === 0) {
      return NextResponse.json(
        ok([], createPaginationMeta(page, limit, 0))
      );
    }

    // Fetch orders with their items (filtered to this merchant)
    let query = supabase
      .from('orders')
      .select(`
        *,
        items:order_items!inner(*,
          product:product_id (id, name, slug, images)
        )
      `, { count: 'exact' })
      .in('id', orderIds);

    // Filter items to only this merchant's products
    // Using inner join ensures we only get relevant order items

    if (status) {
      query = query.eq('status', status);
    }

    // Get count
    const { count: total } = await query;
    const totalCount = total || 0;

    // Apply pagination
    query = query
      .order(sort as any, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    const { data: orders, error: ordersError } = await query;

    if (ordersError) throw ordersError;

    // Filter items to only this merchant's products
    const filteredOrders = (orders || []).map((order: any) => ({
      ...order,
      items: (order.items || []).filter(
        (item: any) => item.merchant_id === merchant.id
      ),
    }));

    return NextResponse.json(
      ok(filteredOrders as Order[], createPaginationMeta(page, limit, totalCount))
    );
  } catch (error) {
    return handleApiError(error);
  }
}
