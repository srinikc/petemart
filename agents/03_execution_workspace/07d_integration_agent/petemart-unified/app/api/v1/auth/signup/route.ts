// =============================================================================
// POST /api/v1/auth/signup
// =============================================================================
// Creates a new user account. Supports BOTH email+password AND phone signup.
// - Email: validates email format + password (min 6 chars)
// - Phone: validates 10-digit Indian format
// - Role: must be one of: customer, merchant, admin
// - For POC/mock: stores in in-memory Map (simulating DB)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { handleError, badRequest, conflict } from '@/lib/api-helpers';

// ── In-memory user store ──────────────────────────────────────────────────────
// Shared across auth routes (singleton pattern)
import { getUserStore } from './store';

// ── Zod Validation Schemas ────────────────────────────────────────────────────
const emailSignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(100),
  role: z.enum(['customer', 'merchant', 'admin']).default('customer'),
});

const phoneSignupSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Phone must be a 10-digit number'),
  name: z.string().min(1, 'Name is required').max(100),
  role: z.enum(['customer', 'merchant', 'admin']).default('customer'),
});

const signupSchema = z.union([emailSignupSchema, phoneSignupSchema]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = signupSchema.safeParse(body);

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

    // Check for existing user
    if ('email' in data && data.email) {
      const existing = Array.from(users.values()).find(u => u.email === data.email);
      if (existing) {
        return conflict('An account with this email already exists');
      }
    }
    if ('phone' in data && data.phone) {
      const existing = Array.from(users.values()).find(u => u.phone === data.phone);
      if (existing) {
        return conflict('An account with this phone number already exists');
      }
    }

    // Create new user
    const id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    const user = {
      id,
      email: 'email' in data ? data.email : null,
      phone: 'phone' in data ? data.phone : null,
      name: data.name,
      role: data.role,
      password: 'password' in data ? data.password : null, // In production, hash this!
      created_at: now,
    };

    users.set(id, user);

    // Return success
    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        message: 'Account created successfully',
      },
    }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
