// =============================================================================
// POST /api/v1/auth/logout
// =============================================================================
// Signs the user out by revoking their session.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { handleApiError } from '@/lib/error-handler';
import { authenticateRequest } from '@/lib/auth-middleware';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { ok, unauthorizedResponse } from '@/lib/response';
import type { ApiResponse } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const rateLimitCheck = rateLimitMiddleware(request, 'auth');
    if (rateLimitCheck) return rateLimitCheck;

    // Authenticate
    const { user, error } = await authenticateRequest(request);
    if (error || !user) {
      return error || NextResponse.json(unauthorizedResponse(), { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Sign out
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      return NextResponse.json(
        ok({ message: 'Session ended.' }) // Even if server sign-out fails
      );
    }

    return NextResponse.json(
      ok({ message: 'Logged out successfully.' })
    );
  } catch (error) {
    return handleApiError(error);
  }
}
