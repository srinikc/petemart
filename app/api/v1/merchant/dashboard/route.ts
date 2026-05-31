// =============================================================================
// GET /api/v1/merchant/dashboard
// =============================================================================
// Returns KPI data for the authenticated merchant's dashboard.
// Roles: merchant, admin
// =============================================================================

import { NextRequest } from 'next/server';
import { MERCHANTS, PRODUCTS, ORDERS } from '@/lib/data';
import { handleError, ok, unauthorized } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer mock-jwt-merchant-') && !auth?.startsWith('Bearer mock-jwt-admin-')) {
      return unauthorized('Merchant or admin access required');
    }

    // Extract merchant info from token
    const token = auth.slice(7);
    const parts = token.split('-');
    const userId = parts.slice(3, -1).join('-');

    const merchant = MERCHANTS.find(m => m.user_id === userId);
    if (!merchant) {
      return unauthorized('Merchant profile not found');
    }

    const merchantProducts = PRODUCTS.filter(p => p.merchant_id === merchant.id);
    const activeProducts = merchantProducts.filter(p => p.is_active).length;
    const merchantOrders = ORDERS.filter(o => o.merchant_name === merchant.store_name);
    const pendingOrders = merchantOrders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;

    const revenueThisMonth = merchantOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0);

    const avgRating = merchantProducts.length > 0
      ? Math.round((merchantProducts.reduce((s, p) => s + (p.rating || 0), 0) / merchantProducts.length) * 10) / 10
      : 0;

    return ok({
      totalProducts: merchantProducts.length,
      activeProducts,
      totalOrders: merchantOrders.length,
      pendingOrders,
      revenueToday: Math.round(revenueThisMonth * 0.05),
      revenueThisMonth,
      averageRating: avgRating,
      totalReviews: merchantProducts.reduce((s, p) => s + (p.review_count || 0), 0),
    });
  } catch (error) {
    return handleError(error);
  }
}
