// =============================================================================
// GET /api/v1/auth/me
// =============================================================================
// Returns the currently authenticated user's profile.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/error-handler';
import { authenticateRequest } from '@/lib/auth-middleware';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { ok } from '@/lib/response';
import { getServiceClient } from '@/lib/supabase-client';
import type { ApiResponse } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const rateLimitCheck = rateLimitMiddleware(request, 'auth');
    if (rateLimitCheck) return rateLimitCheck;

    const { user, error } = await authenticateRequest(request);
    if (error || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    // Fetch full profile with merchant info if applicable
    const supabase = getServiceClient();

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        ok({
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
        })
      );
    }

    // If merchant, also fetch merchant record
    let merchant = null;
    if (user.role === 'merchant') {
      const { data: merchantData } = await supabase
        .from('merchants')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      merchant = merchantData;
    }

    return NextResponse.json(
      ok({
        ...profile,
        merchant,
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}
