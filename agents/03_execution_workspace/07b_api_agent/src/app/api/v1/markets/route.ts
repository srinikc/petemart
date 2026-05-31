// =============================================================================
// GET /api/v1/markets
// =============================================================================
// Lists all markets (localities). Public endpoint.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/error-handler';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { ok } from '@/lib/response';
import { createPublicClient } from '@/lib/supabase-client';
import type { ApiResponse } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const rateLimitCheck = rateLimitMiddleware(request, 'public');
    if (rateLimitCheck) return rateLimitCheck;

    const supabase = createPublicClient();

    // Get unique markets (localities) from merchants table
    const { data, error } = await supabase
      .from('merchants')
      .select('city, locality, count: id', { count: 'exact' })
      .eq('status', 'active')
      .not('locality', 'is', null)
      .order('city')
      .order('locality');

    if (error) {
      throw error;
    }

    // Group by city and aggregate merchant counts per locality
    const marketsMap = new Map<string, { city: string; localities: { name: string; merchantCount: number }[] }>();

    for (const row of data || []) {
      const city = row.city;
      if (!marketsMap.has(city)) {
        marketsMap.set(city, { city, localities: [] });
      }
      const market = marketsMap.get(city)!;
      market.localities.push({
        name: row.locality!,
        merchantCount: row.count as number,
      });
    }

    const markets = Array.from(marketsMap.values());

    return NextResponse.json(ok(markets));
  } catch (error) {
    return handleApiError(error);
  }
}
