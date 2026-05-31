// =============================================================================
// GET, PATCH /api/v1/admin/merchants
// =============================================================================
// Admin management of merchants.
// =============================================================================

import { NextRequest } from 'next/server';
import { MERCHANTS, MARKETS, DATA_SUMMARY } from '@/lib/data';
import { handleError, ok, unauthorized, badRequest, parsePagination, createPaginationMeta } from '@/lib/api-helpers';

function isAdmin(request: NextRequest): boolean {
  const auth = request.headers.get('authorization');
  return !!auth?.startsWith('Bearer mock-jwt-admin-');
}

export async function GET(request: NextRequest) {
  try {
    if (!isAdmin(request)) return unauthorized('Admin access required');

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const status = searchParams.get('status');
    const q = searchParams.get('q');

    let result = [...MERCHANTS];
    if (status) result = result.filter(m => m.status === status);
    if (q) result = result.filter(m => m.store_name.toLowerCase().includes(q.toLowerCase()));

    const total = result.length;
    const paginated = result.slice(offset, offset + limit);

    return ok(paginated, createPaginationMeta(page, limit, total));
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!isAdmin(request)) return unauthorized('Admin access required');

    const body = await request.json();
    const { merchant_id, status } = body;

    if (!merchant_id || !status) {
      return badRequest('merchant_id and status are required');
    }

    const validStatuses = ['pending', 'active', 'suspended', 'rejected'];
    if (!validStatuses.includes(status)) {
      return badRequest(`Invalid status. Must be: ${validStatuses.join(', ')}`);
    }

    return ok({ merchant_id, status, updated_at: new Date().toISOString(), message: 'Merchant status updated' });
  } catch (error) {
    return handleError(error);
  }
}
