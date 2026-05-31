// =============================================================================
// GET /api/v1/merchant/dashboard
// =============================================================================
// Returns KPI data for the authenticated merchant's dashboard.
// Merchant-only endpoint.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, AppError } from '@/lib/error-handler';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { authenticateRequest, requireRole } from '@/lib/auth-middleware';
import { ok, unauthorizedResponse, notFoundResponse } from '@/lib/response';
import { getServiceClient } from '@/lib/supabase-client';
import type { ApiResponse, MerchantDashboard } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const rateLimitCheck = rateLimitMiddleware(request, 'merchant');
    if (rateLimitCheck) return rateLimitCheck;

    const { user, error } = await authenticateRequest(request);
    if (error || !user) {
      return error || NextResponse.json(unauthorizedResponse(), { status: 401 });
    }

    // Role check
    const roleError = requireRole(user, ['merchant', 'admin']);
    if (roleError) return roleError;

    const supabase = getServiceClient();

    // Find merchant record
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('*')
      .eq('owner_id', user.id)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        notFoundResponse('Merchant profile not found. Please complete onboarding first.'),
        { status: 404 }
      );
    }

    const merchantId = merchant.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Fetch all KPIs in parallel
    const [
      { count: totalProducts },
      { count: activeProducts },
      { count: totalOrders },
      { count: pendingOrders },
      { data: todayOrders },
      { data: monthOrders },
      { data: reviews },
    ] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId).eq('is_available', true),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId).in('status', ['pending', 'confirmed', 'preparing']),
      supabase.from('orders').select('total').eq('merchant_id', merchantId).gte('created_at', today.toISOString()),
      supabase.from('orders').select('total').eq('merchant_id', merchantId).gte('created_at', firstOfMonth.toISOString()),
      supabase.from('reviews').select('rating').in('product_id',
        supabase.from('products').select('id').eq('merchant_id', merchantId) as any
      ),
    ]);

    // Calculate revenue
    const revenueToday = (todayOrders || []).reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
    const revenueThisMonth = (monthOrders || []).reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);

    // Calculate average rating
    let averageRating = 0;
    if (reviews && reviews.length > 0) {
      averageRating = Math.round(
        (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length) * 10
      ) / 10;
    }

    const dashboard: MerchantDashboard = {
      totalProducts: totalProducts || 0,
      activeProducts: activeProducts || 0,
      totalOrders: totalOrders || 0,
      pendingOrders: pendingOrders || 0,
      revenueToday,
      revenueThisMonth,
      averageRating,
      totalReviews: reviews?.length || 0,
    };

    return NextResponse.json(ok(dashboard));
  } catch (error) {
    return handleApiError(error);
  }
}
