// =============================================================================
// PeteMart — Supabase Client (Browser & Server)
// =============================================================================
// Provides browser client, server client, public client, admin client.
// All clients use environment variables for configuration.
// =============================================================================

import { createBrowserClient } from '@supabase/ssr';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// ── Browser Client (for 'use client' components) ─────────────────────────────
export function createBrowserSupabase() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// ── Server Client (for server components / API routes with cookies) ──────────
export function createServerSupabase(cookieStore: { getAll: () => { name: string; value: string }[] }) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Read-only mode for API routes
      },
    },
  });
}

// ── Public Client (for public read operations, no auth needed) ──────────────
export function createPublicClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'public' },
  });
}

// ── Service Client (admin operations, bypasses RLS) ─────────────────────────
export function createServiceClient() {
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ── Authenticated Client (using user JWT) ────────────────────────────────────
export function createAuthenticatedClient(jwt: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    db: { schema: 'public' },
  });
}
