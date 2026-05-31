// =============================================================================
// GET, PATCH /api/v1/merchant-orders
// =============================================================================
// Returns and updates orders for a specific merchant.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { ORDERS } from '@/lib/data';
import { handleError, ok, unauthorized, notFound } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer mock-jwt-')) return unauthorized();

    // Filter orders relevant to this merchant
    const merchantOrders = ORDERS.map(o => ({
      ...o,
      origin: 'PeteMart',
    }));

    return ok(merchantOrders);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer mock-jwt-')) return unauthorized();

    const body = await request.json();
    const { order_id, status } = body;

    if (!order_id || !status) {
      return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'order_id and status are required' } }, { status: 400 });
    }

    const validStatuses = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` } }, { status: 400 });
    }

    return ok({ order_id, status, updated_at: new Date().toISOString() });
  } catch (error) {
    return handleError(error);
  }
}
