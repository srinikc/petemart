// =============================================================================
// PATCH /api/v1/cart/update
// =============================================================================
// Updates quantity or mode for a cart item.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { handleError, ok, unauthorized, badRequest, notFound } from '@/lib/api-helpers';
import { carts, getUserIdFromAuth } from '@/lib/cart-store';

export async function PATCH(request: NextRequest) {
  try {
    const userId = getUserIdFromAuth(request.headers.get('authorization'));
    if (!userId) return unauthorized();

    const body = await request.json();
    const { product_id, quantity, mode } = body;
    if (!product_id) return badRequest('product_id is required');

    const items = carts.get(userId);
    if (!items) return notFound('Cart is empty');

    const item = items.find(i => i.product_id === product_id);
    if (!item) return notFound('Item not in cart');

    if (quantity !== undefined) {
      if (quantity <= 0) {
        // Remove item
        const idx = items.indexOf(item);
        items.splice(idx, 1);
        return ok({ message: 'Item removed', items });
      }
      item.quantity = quantity;
    }
    if (mode) item.mode = mode;

    carts.set(userId, items);
    return ok({ items, itemCount: items.reduce((s: number, i: any) => s + i.quantity, 0) });
  } catch (error) {
    return handleError(error);
  }
}
