// =============================================================================
// GET /api/v1/orders/:id
// =============================================================================
// Returns a single order with all items and tracking info.
// Accessible by: order owner (customer), relevant merchant, admin.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, NotFoundError, AppError } from '@/lib/error-handler';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { authenticateRequest } from '@/lib/auth-middleware';
import { ok, unauthorizedResponse } from '@/lib/response';
import { getServiceClient } from '@/lib/supabase-client';
import type { ApiResponse, Order } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    const rateLimitCheck = rateLimitMiddleware(request, 'default');
    if (rateLimitCheck) return rateLimitCheck;

    const { user, error } = await authenticateRequest(request);
    if (error || !user) {
      return error || NextResponse.json(unauthorizedResponse(), { status: 401 });
    }

    const { id } = params;
    const supabase = getServiceClient();

    // Fetch order with items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items (
          id, product_id, merchant_id, quantity, unit_price, total_price, notes, created_at,
          product:product_id (id, name, slug, images, price, unit),
          merchant:merchant_id (id, business_name, slug, city, locality)
        )
      `)
      .eq('id', id)
      .single();

    if (orderError || !order) {
      throw new NotFoundError('order');
    }

    // Authorization: customer (owner), merchant (relevant), admin
    const isOwner = order.user_id === user.id;
    const isAdmin = user.role === 'admin';
    const isMerchant = user.role === 'merchant' && order.items?.some(
      (item: any) => item.merchant_id
    );

    if (!isOwner && !isAdmin && !isMerchant) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have access to this order.' } },
        { status: 403 }
      );
    }

    // For merchant view, filter items to only their products
    let filteredItems = order.items;
    if (isMerchant && !isOwner && !isAdmin) {
      const { data: merchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (merchant) {
        filteredItems = order.items.filter((item: any) => item.merchant_id === merchant.id);
      }
    }

    return NextResponse.json(
      ok({
        ...order,
        items: filteredItems,
      } as Order)
    );
  } catch (error) {
    return handleApiError(error);
  }
}
