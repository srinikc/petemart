// =============================================================================
// GET /api/v1/admin/merchants
// =============================================================================
// Lists all merchants with filtering. Admin-only endpoint.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/error-handler';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { authenticateRequest, requireRole } from '@/lib/auth-middleware';
import { ok, unauthorizedResponse, createPaginationMeta, parsePaginationParams } from '@/lib/response';
import { getServiceClient } from '@/lib/supabase-client';
import type { ApiResponse, Merchant } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const rateLimitCheck = rateLimitMiddleware(request, 'admin');
    if (rateLimitCheck) return rateLimitCheck;

    const { user, error } = await authenticateRequest(request);
    if (error || !user) {
      return error || NextResponse.json(unauthorizedResponse(), { status: 401 });
    }

    const roleError = requireRole(user, ['admin']);
    if (roleError) return roleError;

    const supabase = getServiceClient();
    const { searchParams } = new URL(request.url);
    const { page, limit, offset, sort, order } = parsePaginationParams(searchParams);

    // Filters
    const status = searchParams.get('status');
    const q = searchParams.get('q');
    const city = searchParams.get('city');

    let query = supabase
      .from('merchants')
      .select('*, owner:owner_id (id, email, phone, full_name)', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (q) {
      query = query.or(`business_name.ilike.%${q}%,description.ilike.%${q}%`);
    }

    if (city) {
      query = query.eq('city', city);
    }

    // Get count
    const { count: total } = await query;
    const totalCount = total || 0;

    // Apply pagination
    query = query
      .order(sort as any, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    const { data: merchants, error: merchantsError } = await query;

    if (merchantsError) throw merchantsError;

    return NextResponse.json(
      ok(merchants, createPaginationMeta(page, limit, totalCount))
    );
  } catch (error) {
    return handleApiError(error);
  }
}
