// =============================================================================
// GET /api/v1/health
// =============================================================================
// Health check endpoint. Returns server status, uptime, and data summary.
// =============================================================================

import { NextRequest } from 'next/server';
import { DATA_SUMMARY } from '@/lib/data';

const startTime = Date.now();

export async function GET(request: NextRequest) {
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  return new Response(JSON.stringify({
    success: true,
    data: {
      status: 'healthy',
      version: '2.0.0-production-ready',
      uptime: `${uptime}s`,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      dataSummary: DATA_SUMMARY,
      apiVersion: 'v1',
      endpoints: {
        auth: ['signup', 'login', 'verify-otp', 'logout', 'me'],
        public: ['markets', 'merchants', 'products'],
        protected: ['cart', 'orders', 'checkout'],
        merchant: ['dashboard', 'products', 'orders'],
        admin: ['dashboard', 'analytics', 'merchants'],
      },
    },
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
