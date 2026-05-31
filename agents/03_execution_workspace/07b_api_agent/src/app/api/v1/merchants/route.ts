// =============================================================================
// GET /api/v1/merchants
// =============================================================================
// Lists/filters/searches active merchants. Public read endpoint.
// Supports: q (search), market, locality, category, isOpen, pagination.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/error-handler';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { ok, createPaginationMeta, parsePaginationParams } from '@/lib/response';
import { createPublicClient } from '@/lib/supabase-client';
import type { ApiResponse, Merchant } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const rateLimitCheck = rateLimitMiddleware(request, 'public');
    if (rateLimitCheck) return rateLimitCheck;

    const supabase = createPublicClient();
    const { searchParams } = new URL(request.url);
    const { page, limit, offset, sort, order } = parsePaginationParams(searchParams);

    const q = searchParams.get('q');
    const market = searchParams.get('market');
    const locality = searchParams.get('locality');
    const category = searchParams.get('category');
    const isOpen = searchParams.get('isOpen');

    // Build query
    let query = supabase
      .from('merchants')
      .select('*', { count: 'exact' })
      .eq('status', 'active');

    // Full-text search on business_name and description
    if (q) {
      query = query.or(`business_name.ilike.%${q}%,description.ilike.%${q}%`);
    }

    if (market) {
      query = query.eq('city', market);
    }

    if (locality) {
      query = query.eq('locality', locality);
    }

    if (isOpen === 'true') {
      query = query.eq('is_open', true);
    }

    // Get total count for pagination
    const { count: total } = await query;
    const totalCount = total || 0;

    // Apply sorting and pagination
    query = query
      .order(sort as any, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    const { data: merchants, error } = await query;

    if (error) throw error;

    return NextResponse.json(
      ok(merchants as Merchant[], createPaginationMeta(page, limit, totalCount))
    );
  } catch (error) {
    return handleApiError(error);
  }
}
