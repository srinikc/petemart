// =============================================================================
// GET, POST /api/v1/cart
// =============================================================================
// Manages the cart for the authenticated customer.
// POC uses in-memory cart per session.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { handleError, ok, unauthorized, badRequest, notFound } from '@/lib/api-helpers';
import { PRODUCTS } from '@/lib/data';
import { carts, getUserIdFromAuth } from '@/lib/cart-store';

// GET /api/v1/cart
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromAuth(request.headers.get('authorization'));
    if (!userId) return unauthorized();

    const items = carts.get(userId) || [];
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const itemCount = items.reduce((s, i) => s + i.quantity, 0);

    return ok({ items, subtotal, itemCount });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/v1/cart
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromAuth(request.headers.get('authorization'));
    if (!userId) return unauthorized();

    const body = await request.json();
    const { product_id, quantity = 1, mode = 'A' } = body;

    if (!product_id) return badRequest('product_id is required');

    const product = PRODUCTS.find(p => p.id === product_id);
    if (!product) return notFound('Product not found');
    if (!product.is_active) return badRequest('Product is not available');

    const items = carts.get(userId) || [];

    // Check if already in cart
    const existing = items.find(i => i.product_id === product_id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity,
        image: product.images?.[0] || '',
        merchant_id: product.merchant_id,
        merchant_name: product.merchant_name || '',
        mode,
      });
    }

    carts.set(userId, items);
    return NextResponse.json({ success: true, data: { items, itemCount: items.reduce((s, i) => s + i.quantity, 0) } }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/v1/cart
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromAuth(request.headers.get('authorization'));
    if (!userId) return unauthorized();

    carts.delete(userId);
    return ok({ message: 'Cart cleared' });
  } catch (error) {
    return handleError(error);
  }
}
