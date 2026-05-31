// =============================================================================
// GET /api/v1/products
// =============================================================================
// Lists/searches/filters available products. Public read endpoint.
// Supports: q (search), category, merchant, minPrice, maxPrice, pagination.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { PRODUCTS, MERCHANTS } from '@/lib/data';
import { ok, handleError, checkRateLimit, getClientIp, parsePagination, createPaginationMeta } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    if (!checkRateLimit(`products:${ip}`, 100, 60000)) {
      return NextResponse.json({ success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);

    const q = searchParams.get('q')?.toLowerCase();
    const category = searchParams.get('category')?.toLowerCase();
    const merchant = searchParams.get('merchant');
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
    const isAvailable = searchParams.get('isAvailable') !== 'false';

    // Filter products
    let filtered = [...PRODUCTS];

    if (isAvailable) filtered = filtered.filter(p => p.is_active);
    if (q) filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    if (category) filtered = filtered.filter(p => p.category.toLowerCase().includes(category));
    if (merchant) filtered = filtered.filter(p => p.merchant_id === merchant);
    if (minPrice !== undefined) filtered = filtered.filter(p => p.price >= minPrice);
    if (maxPrice !== undefined) filtered = filtered.filter(p => p.price <= maxPrice);

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    // Attach merchant names
    const productsWithMerchants = paginated.map(p => ({
      ...p,
      merchant_name: MERCHANTS.find(m => m.id === p.merchant_id)?.store_name || 'Unknown',
    }));

    return ok(productsWithMerchants, createPaginationMeta(page, limit, total));
  } catch (error) {
    return handleError(error);
  }
}
