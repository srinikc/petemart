// =============================================================================
// GET /api/v1/merchants/:slug
// =============================================================================
// Returns a single merchant by slug with products and full details. Public.
// =============================================================================

import { NextRequest } from 'next/server';
import { getMerchantBySlug, getProductsByMerchant, getMerchant } from '@/lib/data';
import { ok, notFound, handleError } from '@/lib/api-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const merchant = getMerchantBySlug(slug);

    if (!merchant) {
      // Try to look up by ID if slug doesn't match
      return notFound('Merchant not found');
    }

    const products = getProductsByMerchant(merchant.id);
    const totalProducts = products.length;

    return ok({
      merchant: {
        ...merchant,
        products_count: totalProducts,
        active_products: products.filter(p => p.is_active).length,
      },
      products,
      productsMeta: {
        page: 1,
        limit: totalProducts,
        total: totalProducts,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
