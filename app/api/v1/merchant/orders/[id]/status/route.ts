// =============================================================================
// PUT /api/v1/merchant/orders/:id/status
// =============================================================================
// Update the status of an order. Validates state machine transitions.
// Roles: merchant
// =============================================================================

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ORDERS } from '@/lib/data';
import { canTransition } from '@/types';
import {
  handleError, ok, badRequest, unauthorized, notFound, forbidden,
} from '@/lib/api-helpers';

const updateStatusSchema = z.object({
  status: z.string().min(1, 'Status is required'),
  reason: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer mock-jwt-merchant-') && !auth?.startsWith('Bearer mock-jwt-admin-')) {
      return unauthorized('Merchant or admin access required');
    }

    const { id } = await params;
    const order = ORDERS.find(o => o.id === id);
    if (!order) return notFound('Order not found');

    const body = await request.json();
    const result = updateStatusSchema.safeParse(body);
    if (!result.success) {
      return badRequest('Validation failed');
    }

    const { status: newStatus, reason } = result.data;

    // Validate state machine transition
    if (!canTransition(order.status as any, newStatus as any)) {
      return badRequest(`Cannot transition from '${order.status}' to '${newStatus}'`);
    }

    if (newStatus === 'cancelled' && !reason) {
      return badRequest('Reason is required when cancelling an order');
    }

    return ok({
      orderId: order.id,
      orderNumber: order.order_id,
      previousStatus: order.status,
      newStatus,
      reason: reason || null,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return handleError(error);
  }
}
