// =============================================================================
// GET, POST /api/v1/merchant/products
// =============================================================================
// List all products for the authenticated merchant, or create a new one.
// Roles: merchant
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MERCHANTS, PRODUCTS } from '@/lib/data';
import {
  handleError, ok, created, unauthorized, badRequest, forbidden, notFound,
  parsePagination, createPaginationMeta,
} from '@/lib/api-helpers';

function getMerchantFromToken(auth: string | null): { userId: string; merchantId: string } | null {
  if (!auth?.startsWith('Bearer mock-jwt-merchant-')) return null;
  const token = auth.slice(7);
  const parts = token.split('-');
  const userId = parts.slice(3, -1).join('-');
  const merchant = MERCHANTS.find(m => m.user_id === userId);
  if (!merchant) return null;
  return { userId, merchantId: merchant.id };
}

const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().default(''),
  price: z.number().positive('Price must be positive'),
  compareAtPrice: z.number().positive().optional(),
  unit: z.enum(['piece', 'kg', 'g', 'dozen', 'liter']).default('piece'),
  stockQuantity: z.number().int().min(0).default(0),
  categoryId: z.string().optional(),
  images: z.array(z.string().url()).default([]),
  tags: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  preparationTimeMinutes: z.number().int().positive().nullable().default(null),
});

// GET /api/v1/merchant/products
export async function GET(request: NextRequest) {
  try {
    const merchantInfo = getMerchantFromToken(request.headers.get('authorization'));
    if (!merchantInfo) return unauthorized('Merchant access required');

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);

    let products = PRODUCTS.filter(p => p.merchant_id === merchantInfo.merchantId);
    const total = products.length;
    const paginated = products.slice(offset, offset + limit);

    return ok(paginated, createPaginationMeta(page, limit, total));
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/v1/merchant/products
export async function POST(request: NextRequest) {
  try {
    const merchantInfo = getMerchantFromToken(request.headers.get('authorization'));
    if (!merchantInfo) return unauthorized('Merchant access required');

    const body = await request.json();
    const result = createProductSchema.safeParse(body);

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
    const merchant = MERCHANTS.find(m => m.id === merchantInfo.merchantId);
    if (!merchant) return notFound('Merchant not found');

    const newProduct = {
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      merchant_id: merchantInfo.merchantId,
      merchant_name: merchant.store_name,
      name: data.name,
      description: data.description || '',
      price: data.price,
      mrp: data.compareAtPrice || data.price,
      stock_count: data.stockQuantity,
      images: data.images,
      category: merchant.category,
      mode_badges: ['A', 'B', 'C'],
      sku: `PM-MANUAL-${Date.now().toString(36).toUpperCase()}`,
      rating: 0,
      review_count: 0,
      is_active: true,
    };

    return created(newProduct);
  } catch (error) {
    return handleError(error);
  }
}
