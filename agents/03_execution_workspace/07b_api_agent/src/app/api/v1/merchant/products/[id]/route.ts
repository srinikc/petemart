// =============================================================================
// PUT /api/v1/merchant/products/:id (update a product)
// DELETE /api/v1/merchant/products/:id (delete a product)
// =============================================================================
// Merchant-only endpoints for managing individual products.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, ValidationError, AppError, NotFoundError } from '@/lib/error-handler';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { authenticateRequest, requireRole } from '@/lib/auth-middleware';
import { ok, noContent, unauthorizedResponse, notFoundResponse } from '@/lib/response';
import { getServiceClient } from '@/lib/supabase-client';
import { updateProductSchema } from '@/lib/validators';
import type { ApiResponse, Product } from '@/types';

/**
 * PUT — Update an existing product.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
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
    const { id } = params;

    // Find merchant
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(notFoundResponse('Merchant profile not found.'), { status: 404 });
    }

    // Verify product belongs to merchant
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('merchant_id', merchant.id)
      .single();

    if (productError || !product) {
      throw new NotFoundError('product');
    }

    // Parse and validate update body
    const body = await request.json();
    const parsed = updateProductSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(
        Object.fromEntries(
          parsed.error.issues.map((i) => [i.path.join('.'), [i.message]])
        )
      );
    }

    const updates = parsed.data;

    // Build update object (camelCase to snake_case mapping)
    const updateData: Record<string, any> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.compareAtPrice !== undefined) updateData.compare_at_price = updates.compareAtPrice;
    if (updates.unit !== undefined) updateData.unit = updates.unit;
    if (updates.stockQuantity !== undefined) updateData.stock_quantity = updates.stockQuantity;
    if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId;
    if (updates.images !== undefined) updateData.images = updates.images;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.attributes !== undefined) updateData.attributes = updates.attributes;
    if (updates.isFeatured !== undefined) updateData.is_featured = updates.isFeatured;
    if (updates.preparationTimeMinutes !== undefined) updateData.preparation_time_minutes = updates.preparationTimeMinutes;

    // Regenerate slug if name changed
    if (updates.name) {
      const slug = updates.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 100);

      // Ensure slug uniqueness
      const { data: slugConflict } = await supabase
        .from('products')
        .select('id')
        .eq('merchant_id', merchant.id)
        .eq('slug', slug)
        .neq('id', id)
        .maybeSingle();

      updateData.slug = slugConflict ? `${slug}-${Date.now()}` : slug;
    }

    // Apply update
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new AppError(500, 'PRODUCT_UPDATE_FAILED', 'Failed to update product.');
    }

    return NextResponse.json(ok(updatedProduct as Product));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE — Remove a product (soft-delete by setting is_available to false).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<null>> {
  try {
    const rateLimitCheck = rateLimitMiddleware(request, 'merchant');
    if (rateLimitCheck) return rateLimitCheck as any;

    const { user, error } = await authenticateRequest(request);
    if (error || !user) {
      return (error || NextResponse.json(unauthorizedResponse(), { status: 401 })) as any;
    }

    const roleError = requireRole(user, ['merchant']);
    if (roleError) return roleError as any;

    const supabase = getServiceClient();
    const { id } = params;

    // Find merchant
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(notFoundResponse('Merchant profile not found.'), { status: 404 }) as any;
    }

    // Verify ownership and soft-delete
    const { error: deleteError } = await supabase
      .from('products')
      .update({ is_available: false, stock_quantity: 0 })
      .eq('id', id)
      .eq('merchant_id', merchant.id);

    if (deleteError) {
      if (deleteError.message.includes('row')) {
        return NextResponse.json(notFoundResponse('Product not found.'), { status: 404 }) as any;
      }
      throw new AppError(500, 'PRODUCT_DELETE_FAILED', 'Failed to delete product.');
    }

    return noContent();
  } catch (error) {
    return handleApiError(error) as any;
  }
}
