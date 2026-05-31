// =============================================================================
// GET /api/v1/merchant-products
// =============================================================================
// Returns products for a specific merchant (authenticated).
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { PRODUCTS, MERCHANTS } from '@/lib/data';
import { handleError, ok, unauthorized, notFound } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer mock-jwt-')) return unauthorized();

    const { searchParams } = new URL(request.url);
    const merchantSlug = searchParams.get('merchant');

    const merchant = MERCHANTS.find(m => m.slug === merchantSlug);
    if (!merchant) return notFound('Merchant not found');

    const products = PRODUCTS.filter(p => p.merchant_id === merchant.id);
    return ok(products);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer mock-jwt-')) return unauthorized();

    const body = await request.json();
    const { name, price, category, description, image_url, merchant_id } = body;

    if (!name || !price || !merchant_id) {
      return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'name, price, and merchant_id are required' } }, { status: 400 });
    }

    const newProduct = {
      id: `prod-${Date.now()}`,
      name,
      price,
      category: category || 'General',
      description: description || '',
      image_url: image_url || '/placeholder.svg',
      merchant_id,
      merchant_name: MERCHANTS.find(m => m.id === merchant_id)?.store_name || '',
      is_active: true,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: newProduct }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
