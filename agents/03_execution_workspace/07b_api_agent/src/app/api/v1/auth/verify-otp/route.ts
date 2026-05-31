// =============================================================================
// POST /api/v1/auth/verify-otp
// =============================================================================
// Verifies phone OTP for login/signup.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOtpSchema, verifyOtpSchema } from '@/lib/validators';
import { handleApiError, ValidationError } from '@/lib/error-handler';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { ok, badRequestResponse } from '@/lib/response';
import type { ApiResponse } from '@/types';

/**
 * POST /api/v1/auth/send-otp
 * Sends OTP to the given phone number.
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const rateLimitCheck = rateLimitMiddleware(request, 'otp');
    if (rateLimitCheck) return rateLimitCheck;

    const body = await request.json();

    // If type is 'signup' or verification, handle verify-otp flow
    if (body.type === 'signup' || body.token) {
      return handleVerifyOtp(body);
    }

    // Otherwise, send OTP
    const parsed = sendOtpSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        Object.fromEntries(
          parsed.error.issues.map((i) => [i.path.join('.'), [i.message]])
        )
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { error } = await supabase.auth.signInWithOtp({
      phone: parsed.data.phone,
    });

    if (error) {
      return NextResponse.json(
        badRequestResponse(error.message),
        { status: 400 }
      );
    }

    return NextResponse.json(
      ok({
        message: 'OTP sent successfully.',
        expiresIn: 300, // 5 minutes
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Handles OTP verification (used internally or as separate API call).
 */
async function handleVerifyOtp(body: any): Promise<NextResponse<ApiResponse>> {
  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(
      Object.fromEntries(
        parsed.error.issues.map((i) => [i.path.join('.'), [i.message]])
      )
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase.auth.verifyOtp({
    phone: parsed.data.phone,
    token: parsed.data.token,
    type: parsed.data.type,
  });

  if (error) {
    if (error.message.includes('expired')) {
      return NextResponse.json(
        badRequestResponse('OTP has expired. Please request a new one.'),
        { status: 410 }
      );
    }
    return NextResponse.json(
      badRequestResponse(error.message),
      { status: 400 }
    );
  }

  if (!data.user) {
    return NextResponse.json(
      badRequestResponse('Verification failed.'),
      { status: 400 }
    );
  }

  return NextResponse.json(
    ok({
      user: {
        id: data.user.id,
        email: data.user.email,
        phone: data.user.phone,
      },
      session: {
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
        expiresAt: data.session?.expires_at,
      },
    })
  );
}
