// =============================================================================
// GET /api/v1/admin/analytics
// =============================================================================
// Returns platform analytics data. Admin-only endpoint.
// Includes orders by day, top merchants, revenue by market, user growth.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/error-handler';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { authenticateRequest, requireRole } from '@/lib/auth-middleware';
import { ok, unauthorizedResponse } from '@/lib/response';
import { getServiceClient } from '@/lib/supabase-client';
import type { ApiResponse, AdminAnalytics } from '@/types';

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

    const days = parseInt(searchParams.get('days') || '30', 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // ── Orders by day ──────────────────────────────────────────────────────
    const { data: ordersByDay } = await supabase
      .from('orders')
      .select('created_at, total')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    // Aggregate orders by day
    const ordersByDayMap = new Map<string, { count: number; revenue: number }>();
    for (const order of ordersByDay || []) {
      const day = order.created_at.slice(0, 10);
      const existing = ordersByDayMap.get(day) || { count: 0, revenue: 0 };
      existing.count += 1;
      existing.revenue += Number(order.total || 0);
      ordersByDayMap.set(day, existing);
    }

    const ordersByDayData = Array.from(ordersByDayMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ── Top Merchants ──────────────────────────────────────────────────────
    const { data: topMerchantsRaw } = await supabase
      .from('orders')
      .select('merchant_id, total')
      .not('merchant_id', 'is', null)
      .gte('created_at', startDate.toISOString());

    const merchantRevenueMap = new Map<string, { orderCount: number; revenue: number }>();
    for (const order of topMerchantsRaw || []) {
      if (!order.merchant_id) continue;
      const existing = merchantRevenueMap.get(order.merchant_id) || { orderCount: 0, revenue: 0 };
      existing.orderCount += 1;
      existing.revenue += Number(order.total || 0);
      merchantRevenueMap.set(order.merchant_id, existing);
    }

    // Fetch merchant names
    const merchantIds = Array.from(merchantRevenueMap.keys());
    const { data: merchants } = await supabase
      .from('merchants')
      .select('id, business_name')
      .in('id', merchantIds.length > 0 ? merchantIds : ['none']);

    const merchantNameMap = new Map((merchants || []).map((m: any) => [m.id, m.business_name]));

    const topMerchants = Array.from(merchantRevenueMap.entries())
      .map(([merchantId, data]) => ({
        merchantId,
        businessName: merchantNameMap.get(merchantId) || 'Unknown',
        orderCount: data.orderCount,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // ── Revenue by Market ──────────────────────────────────────────────────
    const { data: merchantsWithCity } = await supabase
      .from('merchants')
      .select('id, city, locality');

    const merchantCityMap = new Map(
      (merchantsWithCity || []).map((m: any) => [m.id, m.locality || m.city])
    );

    const revenueByMarketMap = new Map<string, number>();
    for (const order of topMerchantsRaw || []) {
      if (!order.merchant_id) continue;
      const market = merchantCityMap.get(order.merchant_id) || 'Unknown';
      const current = revenueByMarketMap.get(market) || 0;
      revenueByMarketMap.set(market, current + Number(order.total || 0));
    }

    const revenueByMarket = Array.from(revenueByMarketMap.entries())
      .map(([market, revenue]) => ({ market, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    // ── User Growth ────────────────────────────────────────────────────────
    const { data: profiles } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    const signupsByDayMap = new Map<string, number>();
    for (const profile of profiles || []) {
      const day = profile.created_at.slice(0, 10);
      signupsByDayMap.set(day, (signupsByDayMap.get(day) || 0) + 1);
    }

    const userGrowth = Array.from(signupsByDayMap.entries())
      .map(([date, signups]) => ({ date, signups }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const analytics: AdminAnalytics = {
      ordersByDay: ordersByDayData,
      topMerchants,
      revenueByMarket,
      userGrowth,
    };

    return NextResponse.json(ok(analytics));
  } catch (error) {
    return handleApiError(error);
  }
}
