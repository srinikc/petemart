// =============================================================================
// GET /api/v1/admin/dashboard
// =============================================================================
// Admin dashboard KPI data.
// =============================================================================

import { NextRequest } from 'next/server';
import { MERCHANTS, ORDERS, PRODUCTS, DATA_SUMMARY } from '@/lib/data';
import { ok, unauthorized, handleError } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer mock-jwt-admin-')) return unauthorized('Admin access required');

    const merchants = [...MERCHANTS];
    const orders = [...ORDERS];

    const totalMerchants = merchants.length;
    const activeMerchants = merchants.filter(m => m.status === 'active').length;
    const pendingApprovals = merchants.filter(m => m.status === 'pending').length;
    const totalOrders = orders.length;
    const totalProducts = PRODUCTS.length;
    const revenueThisMonth = orders.reduce((sum, o) => sum + o.total, 0);

    return ok({
      totalMerchants,
      activeMerchants,
      pendingApprovals,
      totalCustomers: 156,
      totalOrders,
      totalProducts,
      revenueToday: 12500,
      revenueThisMonth,
      platformFeeCollected: Math.round(revenueThisMonth * 0.02),
      marketsCount: 21,
      totalMarkets: DATA_SUMMARY.totalMarkets,
      totalMerchantsOverall: DATA_SUMMARY.totalMerchants,
      totalProductsOverall: DATA_SUMMARY.totalProducts,
    });
  } catch (error) {
    return handleError(error);
  }
}
