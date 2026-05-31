// =============================================================================
// GET /api/v1/merchants
// =============================================================================
// Lists merchants with optional filtering. Public endpoint.
// Supports: q (search), market, locality, category, isOpen, pagination, sorting.
// =============================================================================

import { NextRequest } from 'next/server';
import { MERCHANTS, MARKETS } from '@/lib/data';
import { ok, handleError, checkRateLimit, getClientIp, parsePagination, createPaginationMeta } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    checkRateLimit(`merchants:${ip}`, 100, 60000);

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);

    const q = searchParams.get('q')?.toLowerCase();
    const market = searchParams.get('market')?.toLowerCase();
    const locality = searchParams.get('locality')?.toLowerCase();
    const category = searchParams.get('category')?.toLowerCase();
    const isOpen = searchParams.get('isOpen');
    const sort = searchParams.get('sort') || 'rating';
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';

    let filtered = [...MERCHANTS];

    // Filter by search query
    if (q) {
      filtered = filtered.filter(m =>
        m.store_name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
      );
    }

    // Filter by market
    if (market) {
      const marketObj = MARKETS.find(mk => mk.slug.toLowerCase() === market || mk.name.toLowerCase() === market);
      if (marketObj) {
        filtered = filtered.filter(m => m.market_id === marketObj.id);
      }
    }

    // Filter by category
    if (category) {
      filtered = filtered.filter(m => m.category.toLowerCase().includes(category));
    }

    // Filter by status (active by default for public)
    filtered = filtered.filter(m => m.status === 'active');

    // Sort
    filtered.sort((a, b) => {
      const aVal = (a as any)[sort] ?? 0;
      const bVal = (b as any)[sort] ?? 0;
      return order === 'desc' ? (bVal > aVal ? 1 : -1) : (aVal > bVal ? 1 : -1);
    });

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return ok(paginated, createPaginationMeta(page, limit, total));
  } catch (error) {
    return handleError(error);
  }
}
