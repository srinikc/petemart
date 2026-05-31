// =============================================================================
// GET /api/v1/products/:id
// =============================================================================
// Returns a single product with merchant details.
// =============================================================================

import { NextRequest } from 'next/server';
import { getProductById, getMerchant } from '@/lib/data';
import { ok, notFound, handleError, checkRateLimit, getClientIp } from '@/lib/api-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = getProductById(id);

    if (!product) return notFound('Product not found');

    const merchant = getMerchant(product.merchant_id);

    return ok({
      ...product,
      merchant_name: merchant?.store_name || 'Unknown',
      merchant,
    });
  } catch (error) {
    return handleError(error);
  }
}
