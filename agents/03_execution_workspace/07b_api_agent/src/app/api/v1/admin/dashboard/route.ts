// =============================================================================
// GET /api/v1/admin/dashboard
// =============================================================================
// Returns platform-wide KPI data for the admin dashboard.
// Admin-only endpoint.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/error-handler';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { authenticateRequest, requireRole } from '@/lib/auth-middleware';
import { ok, unauthorizedResponse } from '@/lib/response';
import { getServiceClient } from '@/lib/supabase-client';
import type { ApiResponse, AdminDashboard } from '@/types';

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Fetch all KPIs in parallel
    const [
      { count: totalMerchants },
      { count: activeMerchants },
      { count: pendingApprovals },
      { count: totalCustomers },
      { count: totalOrders },
      { data: todayOrders },
      { data: monthOrders },
      { data: monthFees },
    ] = await Promise.all([
      supabase.from('merchants').select('*', { count: 'exact', head: true }),
      supabase.from('merchants').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('merchants').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('total').gte('created_at', today.toISOString()),
      supabase.from('orders').select('total, platform_fee').gte('created_at', firstOfMonth.toISOString()),
      supabase.from('orders').select('platform_fee').gte('created_at', firstOfMonth.toISOString()),
    ]);

    // Calculate revenue
    const revenueToday = (todayOrders || []).reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
    const revenueThisMonth = (monthOrders || []).reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
    const platformFeeCollected = (monthFees || []).reduce((sum: number, o: any) => sum + Number(o.platform_fee || 0), 0);

    const dashboard: AdminDashboard = {
      totalMerchants: totalMerchants || 0,
      activeMerchants: activeMerchants || 0,
      pendingApprovals: pendingApprovals || 0,
      totalCustomers: totalCustomers || 0,
      totalOrders: totalOrders || 0,
      revenueToday,
      revenueThisMonth,
      platformFeeCollected,
    };

    return NextResponse.json(ok(dashboard));
  } catch (error) {
    return handleApiError(error);
  }
}
