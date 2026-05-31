// =============================================================================
// PeteMart — Supabase Server Client (API Route usage)
// =============================================================================
// Uses Service Role for admin operations, anon key for public reads.
// JWT verification is done via Supabase Auth helpers.
// =============================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Creates an anonymous Supabase client for public read operations.
 * Use for endpoints that don't need user context (public product listings, etc.)
 */
export function createPublicClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
  });
}

/**
 * Creates an authenticated Supabase client using the user's JWT.
 * Use for customer-facing authenticated endpoints.
 */
export function createAuthenticatedClient(jwt: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
    db: {
      schema: 'public',
    },
  });
}

/**
 * Creates a Supabase admin client using the service role key.
 * Bypasses RLS — use ONLY for admin-only endpoints and internal operations.
 */
export function createAdminClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
  });
}

/**
 * Creates a Supabase client for server-side operations.
 * Uses service role for write operations that need RLS bypass.
 */
export function getServiceClient() {
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
