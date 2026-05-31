// =============================================================================
// GET /api/v1/admin/analytics
// =============================================================================
// Platform-wide analytics for admin dashboard.
// =============================================================================

import { NextRequest } from 'next/server';
import { MERCHANTS, ORDERS, PRODUCTS, MARKETS, DATA_SUMMARY } from '@/lib/data';
import { handleError, ok, unauthorized } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer mock-jwt-admin-')) return unauthorized('Admin access required');

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Generate realistic analytics from actual data
    const activeMerchants = MERCHANTS.filter(m => m.status === 'active');
    const revenueByMarket = MARKETS.map(m => ({
      market: m.name,
      merchantCount: MERCHANTS.filter(mr => mr.market_id === m.id).length,
      revenue: Math.round(Math.random() * 500000 + 50000),
    }));

    const topMerchants = activeMerchants
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 10)
      .map(merchant => ({
        merchantId: merchant.id,
        businessName: merchant.store_name,
        category: merchant.category,
        rating: merchant.rating,
        orderCount: Math.floor(Math.random() * 50 + 5),
        revenue: Math.round(Math.random() * 200000 + 10000),
      }));

    // Generate daily data for the lookback period
    const ordersByDay = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      ordersByDay.push({
        date: date.toISOString().slice(0, 10),
        count: Math.floor(Math.random() * 15 + 1),
        revenue: Math.round(Math.random() * 50000 + 5000),
      });
    }

    // User growth
    const userGrowth = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      userGrowth.push({
        date: date.toISOString().slice(0, 10),
        signups: Math.floor(Math.random() * 8 + 1),
      });
    }

    // Category distribution
    const categories: Record<string, number> = {};
    PRODUCTS.forEach(p => {
      categories[p.category] = (categories[p.category] || 0) + 1;
    });

    // Mode distribution
    const modeStats = { A: 45, B: 35, C: 20 };

    return ok({
      overview: {
        totalUsers: 156,
        totalMerchants: MERCHANTS.length,
        activeMerchants: activeMerchants.length,
        pendingApprovals: MERCHANTS.filter(m => m.status === 'pending').length,
        totalProducts: PRODUCTS.length,
        totalMarkets: MARKETS.length,
        totalOrders: ORDERS.length,
        totalRevenue: ORDERS.reduce((s, o) => s + o.total, 0),
      },
      ordersByDay,
      topMerchants,
      revenueByMarket,
      userGrowth,
      categoryDistribution: Object.entries(categories)
        .sort(([, a], [, b]) => b - a)
        .map(([category, count]) => ({ category, count })),
      modeStats,
      monthlyStats: [
        { month: 'Jan', revenue: 85000, orders: 220, merchants: 18 },
        { month: 'Feb', revenue: 92000, orders: 245, merchants: 20 },
        { month: 'Mar', revenue: 98000, orders: 260, merchants: 22 },
        { month: 'Apr', revenue: 105000, orders: 280, merchants: 24 },
        { month: 'May', revenue: 112000, orders: 305, merchants: 28 },
        { month: 'Jun', revenue: ordersByDay.reduce((s, d) => s + d.revenue, 0), orders: ordersByDay.reduce((s, d) => s + d.count, 0), merchants: activeMerchants.length },
      ],
    });
  } catch (error) {
    return handleError(error);
  }
}
