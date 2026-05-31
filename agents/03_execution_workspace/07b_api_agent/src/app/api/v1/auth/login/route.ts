// =============================================================================
// POST /api/v1/auth/login
// =============================================================================
// Authenticates user with email/phone + password.
// Returns JWT session tokens on success.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { loginSchema } from '@/lib/validators';
import { handleApiError, ValidationError } from '@/lib/error-handler';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { ok, badRequestResponse } from '@/lib/response';
import type { ApiResponse } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const rateLimitCheck = rateLimitMiddleware(request, 'auth');
    if (rateLimitCheck) return rateLimitCheck;

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(
        Object.fromEntries(
          parsed.error.issues.map((i) => [i.path.join('.'), [i.message]])
        )
      );
    }

    const { email, phone, password } = parsed.data;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email || undefined,
      phone: phone || undefined,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          badRequestResponse('Invalid email/phone or password.'),
          { status: 401 }
        );
      }
      return NextResponse.json(
        badRequestResponse(error.message),
        { status: 400 }
      );
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        badRequestResponse('Login failed. Please try again.'),
        { status: 500 }
      );
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, phone, full_name, avatar_url, role')
      .eq('id', data.user.id)
      .single();

    return NextResponse.json(
      ok({
        user: {
          id: data.user.id,
          email: data.user.email,
          phone: data.user.phone,
          role: profile?.role || 'customer',
          fullName: profile?.full_name,
          avatarUrl: profile?.avatar_url,
        },
        session: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: data.session.expires_at,
        },
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}
