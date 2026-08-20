// =============================================================================
// GET /api/v1/tracking/:orderId
// =============================================================================
// Returns real-time tracking info for an order.
// =============================================================================

import { NextRequest } from 'next/server';
import { ok, notFound, handleError } from '@/lib/api-helpers';

interface TrackingInfo {
  status: string;
  currentLocation: string;
  estimatedDelivery: string;
  driver: { name: string; phone: string };
  timeline: { time: string; event: string }[];
}

const TRACKING: Record<string, TrackingInfo> = {
  'ORD-1': {
    status: 'out_for_delivery',
    currentLocation: 'Chickpet Main Road, near Balepet Junction',
    estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    driver: { name: 'Karthik M.', phone: '+91 9876543210' },
    timeline: [
      { time: new Date(Date.now() - 30 * 60 * 1000).toISOString(), event: 'Order picked up from merchant' },
      { time: new Date(Date.now() - 60 * 60 * 1000).toISOString(), event: 'Order confirmed' },
    ],
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const tracking = TRACKING[orderId];
    if (!tracking) return notFound('Tracking not found for this order');

    return ok({
      order_id: orderId,
      ...tracking,
    });
  } catch (error) {
    return handleError(error);
  }
}
