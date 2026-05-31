// =============================================================================
// GET /api/v1/merchant/products (list merchant's products)
// POST /api/v1/merchant/products (create a new product)
// =============================================================================
// Merchant-only endpoints for managing their product catalog.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, ValidationError, AppError, NotFoundError } from '@/lib/error-handler';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { authenticateRequest, requireRole } from '@/lib/auth-middleware';
import { ok, created, unauthorizedResponse, notFoundResponse, createPaginationMeta, parsePaginationParams } from '@/lib/response';
import { getServiceClient } from '@/lib/supabase-client';
import { createProductSchema } from '@/lib/validators';
import type { ApiResponse, Product } from '@/types';

/**
 * GET — List all products for the authenticated merchant.
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const rateLimitCheck = rateLimitMiddleware(request, 'merchant');
    if (rateLimitCheck) return rateLimitCheck;

    const { user, error } = await authenticateRequest(request);
    if (error || !user) {
      return error || NextResponse.json(unauthorizedResponse(), { status: 401 });
    }

    const roleError = requireRole(user, ['merchant', 'admin']);
    if (roleError) return roleError;

    const supabase = getServiceClient();
    const { page, limit, offset, sort, order } = parsePaginationParams(new URL(request.url).searchParams);

    // Find merchant
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(notFoundResponse('Merchant profile not found.'), { status: 404 });
    }

    // Fetch products
    const { data: products, count, error: productsError } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('merchant_id', merchant.id)
      .order(sort as any, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    if (productsError) throw productsError;

    return NextResponse.json(
      ok(products as Product[], createPaginationMeta(page, limit, count || 0))
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST — Create a new product for the authenticated merchant.
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const rateLimitCheck = rateLimitMiddleware(request, 'merchant');
    if (rateLimitCheck) return rateLimitCheck;

    const { user, error } = await authenticateRequest(request);
    if (error || !user) {
      return error || NextResponse.json(unauthorizedResponse(), { status: 401 });
    }

    const roleError = requireRole(user, ['merchant']);
    if (roleError) return roleError;

    const supabase = getServiceClient();

    // Find merchant
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(notFoundResponse('Merchant profile not found.'), { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(
        Object.fromEntries(
          parsed.error.issues.map((i) => [i.path.join('.'), [i.message]])
        )
      );
    }

    const { name, description, price, compareAtPrice, unit, stockQuantity, categoryId, images, tags, attributes, isFeatured, preparationTimeMinutes } = parsed.data;

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);

    // Check slug uniqueness within merchant
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('merchant_id', merchant.id)
      .eq('slug', slug)
      .maybeSingle();

    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    // Create product
    const { data: product, error: createError } = await supabase
      .from('products')
      .insert({
        merchant_id: merchant.id,
        category_id: categoryId || null,
        name,
        slug: finalSlug,
        description: description || null,
        price,
        compare_at_price: compareAtPrice || null,
        unit,
        stock_quantity: stockQuantity,
        is_available: true,
        images,
        tags,
        attributes,
        is_featured: isFeatured,
        preparation_time_minutes: preparationTimeMinutes || null,
      })
      .select()
      .single();

    if (createError) {
      throw new AppError(500, 'PRODUCT_CREATE_FAILED', 'Failed to create product. Please try again.');
    }

    return NextResponse.json(created(product as Product));
  } catch (error) {
    return handleApiError(error);
  }
}
