// =============================================================================
// PUT, DELETE /api/v1/merchant/products/:id
// =============================================================================
// Update or soft-delete a product. Only the owning merchant can modify.
// Roles: merchant
// =============================================================================

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { MERCHANTS, PRODUCTS } from '@/lib/data';
import {
  handleError, ok, badRequest, unauthorized, notFound, forbidden,
} from '@/lib/api-helpers';

function getMerchantInfo(auth: string | null): { userId: string; merchantId: string } | null {
  if (!auth?.startsWith('Bearer mock-jwt-merchant-')) return null;
  const token = auth.slice(7);
  const parts = token.split('-');
  const userId = parts.slice(3, -1).join('-');
  const merchant = MERCHANTS.find(m => m.user_id === userId);
  if (!merchant) return null;
  return { userId, merchantId: merchant.id };
}

const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  mrp: z.number().positive().optional(),
  stock_count: z.number().int().min(0).optional(),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
});

// PUT /api/v1/merchant/products/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const merchantInfo = getMerchantInfo(request.headers.get('authorization'));
    if (!merchantInfo) return unauthorized('Merchant access required');

    const { id } = await params;
    const product = PRODUCTS.find(p => p.id === id);
    if (!product) return notFound('Product not found');
    if (product.merchant_id !== merchantInfo.merchantId) return forbidden('Not your product');

    const body = await request.json();
    const result = updateProductSchema.safeParse(body);
    if (!result.success) {
      const details: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        if (!details[path]) details[path] = [];
        details[path].push(issue.message);
      }
      return badRequest('Validation failed', details);
    }

    const updated = { ...product, ...result.data };
    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/v1/merchant/products/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const merchantInfo = getMerchantInfo(request.headers.get('authorization'));
    if (!merchantInfo) return unauthorized('Merchant access required');

    const { id } = await params;
    const product = PRODUCTS.find(p => p.id === id);
    if (!product) return notFound('Product not found');
    if (product.merchant_id !== merchantInfo.merchantId) return forbidden('Not your product');

    // Soft delete
    return ok({ id, is_active: false, message: 'Product deleted successfully' });
  } catch (error) {
    return handleError(error);
  }
}
