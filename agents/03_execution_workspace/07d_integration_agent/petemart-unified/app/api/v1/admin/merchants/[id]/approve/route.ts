// =============================================================================
// PUT /api/v1/admin/merchants/:id/approve
// =============================================================================
// Approve or reject a merchant application. Admin-only.
// =============================================================================

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { MERCHANTS } from '@/lib/data';
import {
  handleError, ok, badRequest, unauthorized, notFound, forbidden,
} from '@/lib/api-helpers';

const approveSchema = z.object({
  status: z.enum(['active', 'suspended', 'rejected'], {
    errorMap: () => ({ message: 'Status must be: active, suspended, or rejected' }),
  }),
  commissionRate: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer mock-jwt-admin-')) {
      return unauthorized('Admin access required');
    }

    const { id } = await params;
    const merchant = MERCHANTS.find(m => m.id === id);
    if (!merchant) return notFound('Merchant not found');

    const body = await request.json();
    const result = approveSchema.safeParse(body);
    if (!result.success) {
      const details: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        if (!details[path]) details[path] = [];
        details[path].push(issue.message);
      }
      return badRequest('Validation failed', details);
    }

    const { status, commissionRate, notes } = result.data;

    return ok({
      id: merchant.id,
      businessName: merchant.store_name,
      status,
      commissionRate: commissionRate || 5.00,
      notes: notes || null,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return handleError(error);
  }
}
