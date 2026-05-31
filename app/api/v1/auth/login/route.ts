// =============================================================================
// POST /api/v1/auth/login
// =============================================================================
// Authenticates user with email+password OR phone (OTP flow).
// - Email+password: validates credentials against stored users
// - Phone only: generates OTP (mock = "123456" for all, or random)
// - Demo users: 9999999999=customer, 8888888888=merchant, 7777777777=admin
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { handleError, badRequest, unauthorized, ok } from '@/lib/api-helpers';
import { getUserStore, getOtpStore } from '../signup/store';

// ── Zod Validation ────────────────────────────────────────────────────────────
const emailLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const phoneLoginSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Phone must be a 10-digit number'),
});

const loginSchema = z.union([emailLoginSchema, phoneLoginSchema]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      const details: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        if (!details[path]) details[path] = [];
        details[path].push(issue.message);
      }
      return badRequest('Validation failed', details);
    }

    const users = getUserStore();
    const data = result.data;

    // ── Email + Password Login ───────────────────────────────────────────────
    if ('email' in data) {
      const user = Array.from(users.values()).find(
        u => u.email === data.email && u.password === data.password
      );

      if (!user) {
        // Check if user exists with wrong password
        const userExists = Array.from(users.values()).find(u => u.email === data.email);
        if (userExists) {
          return unauthorized('Invalid password');
        }
        return unauthorized('No account found with this email address');
      }

      const token = `mock-jwt-${user.role}-${user.id}-${Date.now()}`;

      return ok({
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          name: user.name,
          role: user.role,
        },
        session: {
          accessToken: token,
          refreshToken: `mock-refresh-${user.id}`,
          expiresAt: Math.floor(Date.now() / 1000) + 86400,
        },
        message: 'Login successful',
      });
    }

    // ── Phone Login (OTP Generation) ─────────────────────────────────────────
    if ('phone' in data) {
      const existingUser = Array.from(users.values()).find(
        u => u.phone === data.phone
      );

      // Generate OTP (mock: "123456" for all POC users)
      const otp = '123456';
      const otpStore = getOtpStore();
      otpStore.set(data.phone, {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`[POC] OTP for ${data.phone}: ${otp}`);
      }

      return ok({
        message: 'OTP sent successfully',
        user_exists: !!existingUser,
        phone: data.phone,
        expires_in: 300,
      });
    }

    return badRequest('Either email or phone is required');
  } catch (error) {
    return handleError(error);
  }
}
