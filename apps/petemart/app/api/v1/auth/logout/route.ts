// =============================================================================
// POST /api/v1/auth/logout
// =============================================================================
// Clears the current session. For POC, returns success and clears any
// server-side session state.
// =============================================================================

import { NextRequest } from 'next/server';
import { handleError, ok } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    // In production: invalidate Supabase session
    // For POC: simply return success (client clears token)
    return ok({ message: 'Logged out successfully' });
  } catch (error) {
    return handleError(error);
  }
}
