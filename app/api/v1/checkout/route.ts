// =============================================================================
// POST /api/v1/checkout
// =============================================================================
// Converts cart items into an order. For POC, returns mock order confirmation.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { handleError, ok, unauthorized, badRequest } from '@/lib/api-helpers';
import { carts, getUserIdFromAuth } from '@/lib/cart-store';

let orderCounter = 100;

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer mock-jwt-')) return unauthorized();

    const body = await request.json();
    const { address_id, payment_method = 'COD' } = body;

    if (!address_id) return badRequest('Delivery address is required');

    const userId = getUserIdFromAuth(auth)!;
    const items = carts.get(userId) || [];
    if (items.length === 0) return badRequest('Cart is empty');

    const subtotal = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
    const deliveryFee = subtotal > 500 ? 0 : 49;
    const platformFee = 5;
    const total = subtotal + deliveryFee + platformFee;

    const orderId = `ORD-${++orderCounter}`;

    // Clear cart
    carts.set(userId, []);

    // Return order confirmation
    return NextResponse.json({
      success: true,
      data: {
        id: orderId,
        items,
        subtotal,
        delivery_fee: deliveryFee,
        platform_fee: platformFee,
        total,
        status: 'confirmed',
        estimated_delivery: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
        payment_method,
        created_at: new Date().toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
