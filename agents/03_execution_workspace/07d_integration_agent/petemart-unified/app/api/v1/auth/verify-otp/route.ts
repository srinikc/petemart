// =============================================================================
// POST /api/v1/auth/verify-otp
// =============================================================================
// Verifies OTP and returns user profile + session token.
// For POC: any 6-digit OTP with matching phone = success.
// Returns: { success, data: { token, user, redirect }, error }
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { handleError, badRequest, unauthorized, ok } from '@/lib/api-helpers';
import { getUserStore, getOtpStore } from '../signup/store';

const verifyOtpSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Phone must be a 10-digit number'),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be a 6-digit number'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = verifyOtpSchema.safeParse(body);

    if (!result.success) {
      const details: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        if (!details[path]) details[path] = [];
        details[path].push(issue.message);
      }
      return badRequest('Validation failed', details);
    }

    const { phone, otp } = result.data;
    const otpStore = getOtpStore();
    const otpRecord = otpStore.get(phone);

    // POC: Accept "123456" universally OR validate against stored OTP
    const isValidOtp = otp === '123456' || (otpRecord && otpRecord.otp === otp && Date.now() < otpRecord.expiresAt);

    if (!isValidOtp) {
      return unauthorized('Invalid or expired OTP. Try 123456');
    }

    // Clear used OTP
    otpStore.delete(phone);

    // Find or create user
    const users = getUserStore();
    let user = Array.from(users.values()).find(u => u.phone === phone);

    // If user doesn't exist, auto-create (for new phone signup via OTP)
    if (!user) {
      const id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const now = new Date().toISOString();
      user = {
        id,
        email: null,
        phone,
        name: 'User',
        role: 'customer',
        password: null,
        created_at: now,
      };
      users.set(id, user);
    }

    // Determine redirect based on role
    const redirectMap: Record<string, string> = {
      customer: '/',
      merchant: '/merchant/dashboard',
      admin: '/admin',
    };

    const token = `mock-jwt-${user.role}-${user.id}-${Date.now()}`;

    return ok({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
      session: {
        accessToken: token,
        refreshToken: `mock-refresh-${user.id}`,
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
      },
      redirect: redirectMap[user.role] || '/',
    });
  } catch (error) {
    return handleError(error);
  }
}
