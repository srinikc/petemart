// =============================================================================
// GET /api/v1/merchant/orders
// =============================================================================
// Get incoming orders containing the merchant's products.
// Roles: merchant
// =============================================================================

import { NextRequest } from 'next/server';
import { MERCHANTS, ORDERS } from '@/lib/data';
import {
  handleError, ok, unauthorized,
  parsePagination, createPaginationMeta,
} from '@/lib/api-helpers';

function getMerchantInfo(auth: string | null): { merchantName: string } | null {
  if (!auth?.startsWith('Bearer mock-jwt-merchant-')) return null;
  const token = auth.slice(7);
  const parts = token.split('-');
  const userId = parts.slice(3, -1).join('-');
  const merchant = MERCHANTS.find(m => m.user_id === userId);
  if (!merchant) return null;
  return { merchantName: merchant.store_name };
}

export async function GET(request: NextRequest) {
  try {
    const merchantInfo = getMerchantInfo(request.headers.get('authorization'));
    if (!merchantInfo) return unauthorized('Merchant access required');

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const statusFilter = searchParams.get('status');

    let orders = ORDERS.filter(o => o.merchant_name === merchantInfo.merchantName);
    if (statusFilter) orders = orders.filter(o => o.status === statusFilter);

    const total = orders.length;
    const paginated = orders.slice(offset, offset + limit);

    return ok(paginated, createPaginationMeta(page, limit, total));
  } catch (error) {
    return handleError(error);
  }
}
