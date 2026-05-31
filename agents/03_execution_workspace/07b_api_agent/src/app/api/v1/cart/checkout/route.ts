// =============================================================================
// POST /api/v1/cart/checkout
// =============================================================================
// Places an order with items from one or multiple merchants.
// Validates stock, calculates totals, creates order records, and clears cart.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, ValidationError, AppError } from '@/lib/error-handler';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { authenticateRequest } from '@/lib/auth-middleware';
import { ok, badRequestResponse, unauthorizedResponse, created } from '@/lib/response';
import { getServiceClient } from '@/lib/supabase-client';
import { checkoutSchema } from '@/lib/validators';
import type { ApiResponse } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const rateLimitCheck = rateLimitMiddleware(request, 'checkout');
    if (rateLimitCheck) return rateLimitCheck;

    // Authenticate
    const { user, error } = await authenticateRequest(request);
    if (error || !user) {
      return error || NextResponse.json(unauthorizedResponse(), { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(
        Object.fromEntries(
          parsed.error.issues.map((i) => [i.path.join('.'), [i.message]])
        )
      );
    }

    const { items, deliveryAddress, deliveryNotes, contactPhone, paymentMethod } = parsed.data;

    const supabase = getServiceClient();

    // ── Validate all products exist and have sufficient stock ─────────────────
    const productIds = items.map((item) => item.productId);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, merchant_id, name, price, stock_quantity, is_available, unit')
      .in('id', productIds);

    if (productsError) throw productsError;

    if (!products || products.length !== productIds.length) {
      return NextResponse.json(
        badRequestResponse('One or more products not found.'),
        { status: 400 }
      );
    }

    // Validate stock and build product lookup
    const productMap = new Map(products.map((p) => [p.id, p]));
    const stockErrors: string[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        stockErrors.push(`Product ${item.productId} not found.`);
        continue;
      }
      if (!product.is_available) {
        stockErrors.push(`${product.name} is currently unavailable.`);
        continue;
      }
      if (product.stock_quantity < item.quantity) {
        stockErrors.push(
          `${product.name} has insufficient stock. Available: ${product.stock_quantity}, requested: ${item.quantity}.`
        );
      }
    }

    if (stockErrors.length > 0) {
      return NextResponse.json(
        badRequestResponse('Stock validation failed.', { items: stockErrors }),
        { status: 409 }
      );
    }

    // ── Calculate totals ─────────────────────────────────────────────────────
    // Group items by merchant for multi-merchant handling
    const merchantGroups = new Map<string, typeof items>();
    for (const item of items) {
      const existing = merchantGroups.get(item.merchantId) || [];
      existing.push(item);
      merchantGroups.set(item.merchantId, existing);
    }

    const isMultiMerchant = merchantGroups.size > 1;

    // Calculate subtotal
    let subtotal = 0;
    const orderItemsData = items.map((item) => {
      const product = productMap.get(item.productId)!;
      const totalPrice = product.price * item.quantity;
      subtotal += totalPrice;
      return {
        product_id: item.productId,
        merchant_id: item.merchantId,
        quantity: item.quantity,
        unit_price: product.price,
        total_price: totalPrice,
        notes: item.notes || null,
      };
    });

    // Calculate delivery fee (simplified: ₹10 per item, capped at ₹30 for consolidation)
    const deliveryFeePerMerchant = merchantGroups.size * 15;
    const deliveryFee = Math.min(deliveryFeePerMerchant, isMultiMerchant ? 30 : 15);

    // Platform fee (2% of subtotal, min ₹5, max ₹50)
    const platformFee = Math.min(Math.max(subtotal * 0.02, 5), 50);

    // No discount for POC
    const discount = 0;

    const total = subtotal + deliveryFee + platformFee - discount;

    // ── Generate order number ────────────────────────────────────────────────
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderNumber = `PM-${dateStr}-${randomStr}`;

    // ── Create order ─────────────────────────────────────────────────────────
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: user.id,
        status: 'pending',
        subtotal,
        delivery_fee: deliveryFee,
        platform_fee: platformFee,
        discount,
        total,
        delivery_address: deliveryAddress as any,
        delivery_notes: deliveryNotes || null,
        contact_phone: contactPhone,
        payment_status: 'pending',
        payment_method: paymentMethod,
        is_multi_merchant: isMultiMerchant,
      })
      .select()
      .single();

    if (orderError || !order) {
      throw new AppError(500, 'ORDER_CREATION_FAILED', 'Failed to create order. Please try again.');
    }

    // ── Create order items ───────────────────────────────────────────────────
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(
        orderItemsData.map((item) => ({
          ...item,
          order_id: order.id,
        }))
      );

    if (itemsError) {
      // Rollback order creation
      await supabase.from('orders').delete().eq('id', order.id);
      throw new AppError(500, 'ORDER_ITEMS_FAILED', 'Failed to create order items. Please try again.');
    }

    // ── Decrement stock quantities ───────────────────────────────────────────
    for (const item of items) {
      const product = productMap.get(item.productId)!;
      const newStock = product.stock_quantity - item.quantity;
      await supabase
        .from('products')
        .update({ stock_quantity: Math.max(0, newStock) })
        .eq('id', item.productId);
    }

    // ── Clear user's cart ────────────────────────────────────────────────────
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    return NextResponse.json(
      created({
        order: {
          id: order.id,
          orderNumber: order.order_number,
          status: order.status,
          subtotal: order.subtotal,
          deliveryFee: order.delivery_fee,
          platformFee: order.platform_fee,
          total: order.total,
          items: orderItemsData,
          isMultiMerchant,
        },
        message: `Order ${orderNumber} placed successfully.`,
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}
