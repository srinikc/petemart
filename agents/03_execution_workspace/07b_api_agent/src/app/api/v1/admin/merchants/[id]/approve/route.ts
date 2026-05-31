// =============================================================================
// PUT /api/v1/admin/merchants/:id/approve
// =============================================================================
// Approves or rejects a merchant's application. Admin-only.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, ValidationError, AppError, NotFoundError } from '@/lib/error-handler';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { authenticateRequest, requireRole } from '@/lib/auth-middleware';
import { ok, unauthorizedResponse } from '@/lib/response';
import { getServiceClient } from '@/lib/supabase-client';
import { approveMerchantSchema } from '@/lib/validators';
import type { ApiResponse, Merchant } from '@/types';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
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
    const { id } = params;

    // Verify merchant exists
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, business_name, status')
      .eq('id', id)
      .single();

    if (merchantError || !merchant) {
      throw new NotFoundError('merchant');
    }

    // Parse and validate request body
    const body = await request.json();
    const parsed = approveMerchantSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(
        Object.fromEntries(
          parsed.error.issues.map((i) => [i.path.join('.'), [i.message]])
        )
      );
    }

    const { status: newStatus, commissionRate } = parsed.data;

    // Build update
    const updateData: Record<string, any> = { status: newStatus };
    if (commissionRate !== undefined) {
      updateData.commission_rate = commissionRate;
    }

    // Apply update
    const { data: updatedMerchant, error: updateError } = await supabase
      .from('merchants')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new AppError(500, 'MERCHANT_UPDATE_FAILED', 'Failed to update merchant status.');
    }

    return NextResponse.json(
      ok({
        id: updatedMerchant.id,
        businessName: updatedMerchant.business_name,
        status: updatedMerchant.status,
        commissionRate: updatedMerchant.commission_rate,
        updatedAt: updatedMerchant.updated_at,
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}
