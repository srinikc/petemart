// =============================================================================
// GET /api/v1/markets
// =============================================================================
// Lists all markets. Public endpoint.
// =============================================================================

import { NextRequest } from 'next/server';
import { MARKETS } from '@/lib/data';
import { ok, handleError, checkRateLimit, getClientIp } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!checkRateLimit(`markets:${ip}`, 100, 60000)) {
      return ok(MARKETS);
    }
    return ok(MARKETS);
  } catch (error) {
    return handleError(error);
  }
}
