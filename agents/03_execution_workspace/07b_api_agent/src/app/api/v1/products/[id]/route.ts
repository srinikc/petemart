// =============================================================================
// GET /api/v1/products/:id
// =============================================================================
// Returns a single product with merchant and category details.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, NotFoundError } from '@/lib/error-handler';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { ok } from '@/lib/response';
import { createPublicClient } from '@/lib/supabase-client';
import type { ApiResponse, Product, Review } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    const rateLimitCheck = rateLimitMiddleware(request, 'public');
    if (rateLimitCheck) return rateLimitCheck;

    const { id } = params;
    const supabase = createPublicClient();

    // Fetch product with merchant and category join
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        merchant:merchant_id (
          id, business_name, slug, description, logo_url, city, locality,
          delivery_radius_km, is_open, opening_time, closing_time
        ),
        category:category_id (
          id, name, slug, description
        )
      `)
      .eq('id', id)
      .single();

    if (productError || !product) {
      throw new NotFoundError('product');
    }

    // Fetch reviews for the product
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (reviewsError) throw reviewsError;

    // Calculate average rating
    const ratingStats = {
      average: 0,
      total: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };

    if (reviews && reviews.length > 0) {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      ratingStats.average = Math.round((totalRating / reviews.length) * 10) / 10;
      ratingStats.total = reviews.length;
      for (const r of reviews) {
        const key = r.rating as 1 | 2 | 3 | 4 | 5;
        ratingStats.distribution[key] = (ratingStats.distribution[key] || 0) + 1;
      }
    }

    return NextResponse.json(
      ok({
        product: product as Product,
        reviews: reviews as Review[],
        ratingStats,
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}
