// =============================================================================
// PUT /api/v1/merchant/orders/:id/status
// =============================================================================
// Updates the status of an order. Merchant-only.
// Enforces valid state machine transitions.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, ValidationError, AppError } from '@/lib/error-handler';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { authenticateRequest, requireRole } from '@/lib/auth-middleware';
import { ok, unauthorizedResponse, notFoundResponse, badRequestResponse } from '@/lib/response';
import { getServiceClient } from '@/lib/supabase-client';
import { updateOrderStatusSchema } from '@/lib/validators';
import { canTransition } from '@/types';
import type { ApiResponse, OrderStatus } from '@/types';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
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
    const { id } = params;

    // Find merchant
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(notFoundResponse('Merchant profile not found.'), { status: 404 });
    }

    // Verify order exists and merchant has items in it
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, order_number')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(notFoundResponse('Order not found.'), { status: 404 });
    }

    // Check merchant has items in this order
    const { data: merchantItems } = await supabase
      .from('order_items')
      .select('id')
      .eq('order_id', id)
      .eq('merchant_id', merchant.id)
      .limit(1);

    if (!merchantItems || merchantItems.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'This order does not contain your products.' } },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parsed = updateOrderStatusSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(
        Object.fromEntries(
          parsed.error.issues.map((i) => [i.path.join('.'), [i.message]])
        )
      );
    }

    const { status: newStatus, reason } = parsed.data;

    // Validate state machine transition
    const currentStatus = order.status as OrderStatus;
    if (!canTransition(currentStatus, newStatus)) {
      return NextResponse.json(
        badRequestResponse(
          `Cannot transition order from '${currentStatus}' to '${newStatus}'. ` +
          `Valid transitions: ${canTransition(currentStatus, newStatus as OrderStatus) || 'none'}.`
        ),
        { status: 400 }
      );
    }

    // Require reason for cancellations
    if (newStatus === 'cancelled' && !reason) {
      return NextResponse.json(
        badRequestResponse('A cancellation reason is required.'),
        { status: 400 }
      );
    }

    // Update order status
    const updateData: Record<string, any> = { status: newStatus };
    if (reason) {
      updateData.delivery_notes = supabase.rpc('concat_delivery_notes', {
        order_id: id,
        note: `Cancelled: ${reason}`,
      }) as any;
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      throw new AppError(500, 'ORDER_UPDATE_FAILED', 'Failed to update order status.');
    }

    return NextResponse.json(
      ok({
        orderId: id,
        orderNumber: order.order_number,
        previousStatus: currentStatus,
        newStatus,
        updatedAt: new Date().toISOString(),
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}
