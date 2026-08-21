// =============================================================================
// GET /api/v1/merchant-analytics
// =============================================================================
// Returns analytics for a merchant dashboard.
// =============================================================================

import { NextRequest } from 'next/server';
import { handleError, ok, unauthorized } from '@/lib/api-helpers';

const mockAnalytics = {
  overview: {
    total_orders: 127,
    total_revenue: 84500,
    avg_order_value: 665,
    pending_orders: 3,
    preparing_orders: 2,
    out_for_delivery: 1,
    monthly_growth: 12.5,
  },
  recent_orders: 7,
  popular_products: [
    { name: 'Mysore Silk Saree', units: 24, revenue: 72000 },
    { name: 'Bangalore Cotton', units: 18, revenue: 27000 },
    { name: 'Kanchipuram Silk', units: 12, revenue: 84000 },
  ],
  daily_sales: [
    { date: '2026-05-24', revenue: 3200, orders: 5 },
    { date: '2026-05-25', revenue: 4600, orders: 7 },
    { date: '2026-05-26', revenue: 2800, orders: 4 },
    { date: '2026-05-27', revenue: 5100, orders: 8 },
    { date: '2026-05-28', revenue: 3900, orders: 6 },
    { date: '2026-05-29', revenue: 4200, orders: 7 },
    { date: '2026-05-30', revenue: 5400, orders: 9 },
  ],
  mode_distribution: { A: 45, B: 35, C: 20 },
};

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer mock-jwt-')) return unauthorized();

    return ok(mockAnalytics);
  } catch (error) {
    return handleError(error);
  }
}
