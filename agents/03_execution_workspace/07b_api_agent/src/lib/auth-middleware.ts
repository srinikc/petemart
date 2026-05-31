// =============================================================================
// PeteMart — Authentication & Authorization Middleware
// =============================================================================
// Provides JWT verification, user extraction, and RBAC enforcement
// for API route handlers (Next.js App Router).
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { AuthenticatedUser, UserRole, ApiResponse } from '@/types';
import { errorResponse, unauthorizedResponse, forbiddenResponse } from './response';

// ── Extract Session from Request ─────────────────────────────────────────────
/**
 * Extracts the authenticated user from the request using Supabase SSR cookies.
 * Returns null if not authenticated.
 */
export async function getSessionUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // Read-only mode for API routes
        },
      },
    });

    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) return null;

    // Fetch profile from our profiles table for role info
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, phone, full_name, avatar_url, role')
      .eq('id', session.user.id)
      .single();

    if (!profile) return null;

    return {
      id: profile.id,
      email: profile.email,
      phone: profile.phone,
      role: profile.role as UserRole,
      fullName: profile.full_name,
      avatarUrl: profile.avatar_url,
    };
  } catch {
    return null;
  }
}

/**
 * Extracts a Bearer token from the Authorization header.
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

/**
 * Gets user from JWT token (used for mobile clients that send Bearer tokens).
 */
export async function getUserFromToken(token: string): Promise<AuthenticatedUser | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, phone, full_name, avatar_url, role')
      .eq('id', user.id)
      .single();

    if (!profile) return null;

    return {
      id: profile.id,
      email: profile.email,
      phone: profile.phone,
      role: profile.role as UserRole,
      fullName: profile.full_name,
      avatarUrl: profile.avatar_url,
    };
  } catch {
    return null;
  }
}

// ── Middleware Factories ──────────────────────────────────────────────────────

/**
 * Requires a valid authentication session. Returns 401 if not authenticated.
 */
export async function requireAuth(request: NextRequest): Promise<
  { user: AuthenticatedUser; response: null } | { user: null; response: NextResponse<ApiResponse> }
> {
  // Try cookie-based auth first (web)
  let user = await getSessionUser(request);

  // Fall back to Bearer token (mobile)
  if (!user) {
    const token = extractBearerToken(request);
    if (token) {
      user = await getUserFromToken(token);
    }
  }

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        unauthorizedResponse('Authentication required. Please provide a valid session or Bearer token.'),
        { status: 401 }
      ),
    };
  }

  return { user, response: null };
}

/**
 * Requires the authenticated user to have one of the specified roles.
 * Must be called after requireAuth.
 */
export function requireRole(user: AuthenticatedUser, allowedRoles: UserRole[]): NextResponse<ApiResponse> | null {
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      forbiddenResponse(`Access denied. Required role(s): ${allowedRoles.join(', ')}`),
      { status: 403 }
    );
  }
  return null;
}

/**
 * Helper to extract and validate authenticated user from request.
 * Combines cookie and Bearer token auth strategies.
 */
export async function authenticateRequest(request: NextRequest): Promise<{
  user: AuthenticatedUser | null;
  error: NextResponse<ApiResponse> | null;
}> {
  const auth = await requireAuth(request);
  return { user: auth.user, error: auth.response };
}

// Local import for createClient
import { createClient } from '@supabase/supabase-js';
