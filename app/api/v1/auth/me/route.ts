// =============================================================================
// GET /api/v1/auth/me
// =============================================================================
// Returns the current authenticated user's profile from the token.
// Token format: mock-jwt-{role}-{userId}-{timestamp}
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { handleError, ok, unauthorized } from '@/lib/api-helpers';
import { getUserStore } from '../signup/store';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer mock-jwt-')) {
      // Also check for cookie-based auth
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader?.includes('petemart_token=')) {
        // Extract token from cookie
        const cookies = cookieHeader.split(';').map(c => c.trim());
        const tokenCookie = cookies.find(c => c.startsWith('petemart_token='));
        if (tokenCookie) {
          const tokenValue = tokenCookie.split('=')[1];
          if (tokenValue.startsWith('mock-jwt-')) {
            const parts = tokenValue.split('-');
            if (parts.length >= 4) {
              const role = parts[2];
              const userId = parts.slice(3, -1).join('-');
              return getUserProfile(userId, role);
            }
          }
        }
      }
      return unauthorized();
    }

    // Extract user info from Bearer token
    const token = authHeader.slice(7); // Remove 'Bearer '
    const parts = token.split('-');
    if (parts.length < 4) {
      return unauthorized('Invalid token format');
    }

    const role = parts[2]; // mock-jwt-{role}-...
    const userId = parts.slice(3, -1).join('-'); // remove timestamp at end

    return getUserProfile(userId, role);
  } catch (error) {
    return handleError(error);
  }
}

function getUserProfile(userId: string, role: string) {
  const users = getUserStore();
  const user = users.get(userId);

  if (user) {
    return ok({
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: user.role,
      preferred_language: 'en',
      created_at: user.created_at,
    });
  }

  // Fallback: return role-based default profile if user not in store
  // This handles demo users from the previous POC
  const nameMap: Record<string, string> = {
    customer: 'Priya Sharma',
    merchant: 'Ramesh Kumar',
    admin: 'Ananya Gupta',
  };

  const phoneMap: Record<string, string> = {
    'cust-001': '9999999999',
    'merch-001': '8888888888',
    'admin-001': '7777777777',
  };

  return ok({
    id: userId,
    email: role === 'admin' ? 'ananya@petemart.com' : null,
    phone: phoneMap[userId] || '',
    name: nameMap[role] || 'User',
    role,
    preferred_language: 'en',
    created_at: '2026-05-01T00:00:00Z',
  });
}
