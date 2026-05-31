// =============================================================================
// GET /api/v1/orders/:id
// =============================================================================
// Returns a single order with details.
// =============================================================================

import { NextRequest } from 'next/server';
import { ORDERS } from '@/lib/data';
import { ok, notFound, handleError } from '@/lib/api-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = ORDERS.find(o => o.id === id);
    if (!order) return notFound('Order not found');
    return ok(order);
  } catch (error) {
    return handleError(error);
  }
}
