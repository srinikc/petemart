// =============================================================================
// POST /api/v1/auth/signup
// =============================================================================
// Creates a new user account with email/phone + password.
// On success, auto-creates profile via DB trigger and returns session.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { signupSchema } from '@/lib/validators';
import { handleApiError } from '@/lib/error-handler';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { created, badRequestResponse, serverErrorResponse } from '@/lib/response';
import type { ApiResponse } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Rate limit: auth endpoints
    const rateLimitCheck = rateLimitMiddleware(request, 'auth');
    if (rateLimitCheck) return rateLimitCheck;

    // Parse and validate request body
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        badRequestResponse('Validation failed', 
          Object.fromEntries(
            parsed.error.issues.map((issue) => [
              issue.path.join('.'),
              [issue.message],
            ])
          )
        ),
        { status: 400 }
      );
    }

    const { email, phone, password, fullName, role } = parsed.data;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Create user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email || undefined,
      phone: phone || undefined,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });

    if (authError) {
      // Handle duplicate email/phone
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        return NextResponse.json(
          badRequestResponse('An account with this email or phone already exists.'),
          { status: 409 }
        );
      }
      return NextResponse.json(
        badRequestResponse(authError.message),
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        serverErrorResponse('Failed to create user. Please try again.'),
        { status: 500 }
      );
    }

    // Profile is auto-created via DB trigger (003_auth_triggers.sql)
    // Return the session for immediate login
    return NextResponse.json(
      created({
        user: {
          id: authData.user.id,
          email: authData.user.email,
          phone: authData.user.phone,
          role,
          fullName,
        },
        session: authData.session
          ? {
              accessToken: authData.session.access_token,
              refreshToken: authData.session.refresh_token,
              expiresAt: authData.session.expires_at,
            }
          : null,
        message: email
          ? 'Account created. Please check your email to confirm your account.'
          : 'Account created successfully.',
      }),
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
