// =============================================================================
// POST /api/v1/cart/checkout
// =============================================================================
// Place an order with items from one or multiple merchants. Authenticated.
// Validates stock, calculates fees, creates order.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PRODUCTS } from '@/lib/data';
import { handleError, badRequest, unauthorized, notFound, conflict, ok } from '@/lib/api-helpers';

const checkoutItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  merchantId: z.string().min(1, 'Merchant ID is required'),
  quantity: z.number().int().min(1, 'Minimum quantity is 1'),
  notes: z.string().optional(),
});

const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, 'At least one item is required').max(50, 'Maximum 50 items'),
  deliveryAddress: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().optional(),
    pincode: z.string().min(1),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
  deliveryNotes: z.string().optional(),
  contactPhone: z.string().min(1, 'Contact phone is required'),
  paymentMethod: z.enum(['card', 'upi', 'cod', 'wallet']).default('upi'),
});

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer mock-jwt-')) {
      return unauthorized('Authentication required');
    }

    const body = await request.json();
    const result = checkoutSchema.safeParse(body);

    if (!result.success) {
      const details: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        if (!details[path]) details[path] = [];
        details[path].push(issue.message);
      }
      return badRequest('Validation failed', details);
    }

    const data = result.data;

    // Validate all products exist and are available
    const orderItems = [];
    for (const item of data.items) {
      const product = PRODUCTS.find(p => p.id === item.productId);
      if (!product) return notFound(`Product ${item.productId} not found`);
      if (!product.is_active) return conflict(`Product "${product.name}" is not available`);
      if (product.stock_count < item.quantity) {
        return conflict(`Insufficient stock for "${product.name}". Available: ${product.stock_count}`);
      }
      if (product.merchant_id !== item.merchantId) {
        return badRequest(`Product "${product.name}" does not belong to the specified merchant`);
      }

      orderItems.push({
        product_id: product.id,
        merchant_id: product.merchant_id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: product.price,
        total_price: product.price * item.quantity,
        notes: item.notes || null,
      });
    }

    // Calculate fees
    const uniqueMerchants = new Set(orderItems.map(i => i.merchant_id)).size;
    const subtotal = orderItems.reduce((s, i) => s + i.total_price, 0);
    const deliveryFee = Math.min(uniqueMerchants * 15, 30); // ₹15 per merchant, capped at ₹30
    const platformFee = Math.max(5, Math.min(subtotal * 0.02, 50)); // 2%, min ₹5, max ₹50
    const total = subtotal + deliveryFee + platformFee;

    // Generate order number
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderNumber = `PM-${dateStr}-${randomStr}`;

    const order = {
      id: `order-${Date.now()}`,
      orderNumber,
      status: 'pending',
      subtotal: Math.round(subtotal * 100) / 100,
      deliveryFee: Math.round(deliveryFee * 100) / 100,
      platformFee: Math.round(platformFee * 100) / 100,
      total: Math.round(total * 100) / 100,
      items: orderItems,
      isMultiMerchant: uniqueMerchants > 1,
      delivery_address: data.deliveryAddress,
      contact_phone: data.contactPhone,
      payment_method: data.paymentMethod,
      created_at: now.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: {
        order,
        message: `Order ${orderNumber} placed successfully.`,
      },
    }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
