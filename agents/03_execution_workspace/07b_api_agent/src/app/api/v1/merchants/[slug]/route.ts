// =============================================================================
// GET /api/v1/merchants/:slug
// =============================================================================
// Returns a single merchant's details with their products.
// The slug is derived from the merchant's business_name.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, NotFoundError } from '@/lib/error-handler';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { ok, createPaginationMeta, parsePaginationParams } from '@/lib/response';
import { createPublicClient } from '@/lib/supabase-client';
import type { ApiResponse, Merchant, Product } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    const rateLimitCheck = rateLimitMiddleware(request, 'public');
    if (rateLimitCheck) return rateLimitCheck;

    const { slug } = params;
    const supabase = createPublicClient();
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePaginationParams(searchParams);

    // Find merchant by slug (derived from business_name)
    const slugFromName = slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Try direct slug match first, then search by business_name
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('*')
      .eq('status', 'active')
      .or(`id.eq.${slug},slug.eq.${slugFromName}`)
      .single();

    // If no direct match, search by business_name-derived slug
    let foundMerchant = merchant;
    if (!foundMerchant) {
      const { data: nameMatch } = await supabase
        .from('merchants')
        .select('*')
        .eq('status', 'active')
        .filter('business_name', 'ilike', `%${slug.replace(/-/g, ' ')}%`)
        .limit(1);

      if (nameMatch && nameMatch.length > 0) {
        foundMerchant = nameMatch[0];
      }
    }

    if (!foundMerchant) {
      throw new NotFoundError('merchant');
    }

    // Fetch merchant's products
    const { data: products, count: productsCount, error: productsError } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('merchant_id', foundMerchant.id)
      .eq('is_available', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (productsError) throw productsError;

    return NextResponse.json(
      ok({
        merchant: foundMerchant as Merchant,
        products: (products || []) as Product[],
        productsMeta: createPaginationMeta(page, limit, productsCount || 0),
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}
