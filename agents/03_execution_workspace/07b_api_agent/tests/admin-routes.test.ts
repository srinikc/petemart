// =============================================================================
// PeteMart — Admin Routes Unit Tests
// =============================================================================

import { createMockRequest, createAdminMockRequest, parseResponse } from './helpers/test-client';

jest.mock('@/lib/auth-middleware', () => ({
  authenticateRequest: jest.fn(),
  requireAuth: jest.fn(),
  requireRole: jest.fn(() => null),
}));

jest.mock('@/lib/rate-limiter', () => ({
  rateLimitMiddleware: jest.fn(() => null),
  rateLimit: jest.fn(() => ({ allowed: true, remaining: 99, resetIn: 0 })),
}));

describe('Admin Merchants — GET /api/v1/admin/merchants', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should require admin role', async () => {
    const authMiddleware = require('@/lib/auth-middleware');
    authMiddleware.authenticateRequest.mockResolvedValueOnce({
      user: null,
      error: new Response(JSON.stringify({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
      }), { status: 401 }),
    });

    const { GET } = await import('@/app/api/v1/admin/merchants/route');
    const request = createMockRequest('GET');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('should list all merchants for admin', async () => {
    const authMiddleware = require('@/lib/auth-middleware');
    authMiddleware.authenticateRequest.mockResolvedValueOnce({
      user: { id: 'admin-1', email: 'admin@petemart.com', role: 'admin' },
      error: null,
    });

    const mockMerchants = [
      { id: 'm-1', business_name: 'Merchant 1', status: 'active', city: 'Bengaluru' },
      { id: 'm-2', business_name: 'Merchant 2', status: 'pending', city: 'Bengaluru' },
    ];

    const supabaseMock = require('@supabase/supabase-js').createClient();
    supabaseMock.from().select().eq.mockReturnValue({
      or: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({ data: mockMerchants, count: 2, error: null })),
          })),
        })),
      })),
    });

    const { GET } = await import('@/app/api/v1/admin/merchants/route');
    const request = createMockRequest('GET');
    const response = await GET(request);
    const result = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('should filter merchants by status', async () => {
    const authMiddleware = require('@/lib/auth-middleware');
    authMiddleware.authenticateRequest.mockResolvedValueOnce({
      user: { id: 'admin-1', email: 'admin@petemart.com', role: 'admin' },
      error: null,
    });

    const { GET } = await import('@/app/api/v1/admin/merchants/route');
    const request = createMockRequest('GET', {
      searchParams: { status: 'pending' },
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
  });
});

describe('Admin Merchant Approval — PUT /api/v1/admin/merchants/:id/approve', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should approve a merchant', async () => {
    const authMiddleware = require('@/lib/auth-middleware');
    authMiddleware.authenticateRequest.mockResolvedValueOnce({
      user: { id: 'admin-1', email: 'admin@petemart.com', role: 'admin' },
      error: null,
    });

    const supabaseMock = require('@/supabase/supabase-js').createClient();

    // Merchant lookup
    supabaseMock.from().select().eq.mockReturnValue({
      single: jest.fn(() => Promise.resolve({
        data: { id: 'm-1', business_name: 'Test Merchant', status: 'pending' },
        error: null,
      })),
    });

    // Update merchant
    supabaseMock.from().update().eq.mockReturnValue({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({
          data: {
            id: 'm-1',
            business_name: 'Test Merchant',
            status: 'active',
            commission_rate: 5.00,
            updated_at: new Date().toISOString(),
          },
          error: null,
        })),
      })),
    });

    const { PUT } = await import('@/app/api/v1/admin/merchants/[id]/approve/route');
    const request = createMockRequest('PUT', {
      body: { status: 'active' },
    });
    const response = await PUT(request, { params: { id: 'm-1' } });
    const result = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.data.status).toBe('active');
  });

  it('should set commission rate when approving', async () => {
    const authMiddleware = require('@/lib/auth-middleware');
    authMiddleware.authenticateRequest.mockResolvedValueOnce({
      user: { id: 'admin-1', email: 'admin@petemart.com', role: 'admin' },
      error: null,
    });

    const supabaseMock = require('@/supabase/supabase-js').createClient();
    supabaseMock.from().select().eq.mockReturnValue({
      single: jest.fn(() => Promise.resolve({
        data: { id: 'm-1', business_name: 'Test Merchant', status: 'pending' },
        error: null,
      })),
    });

    supabaseMock.from().update().eq.mockReturnValue({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({
          data: {
            id: 'm-1',
            business_name: 'Test Merchant',
            status: 'active',
            commission_rate: 3.50,
            updated_at: new Date().toISOString(),
          },
          error: null,
        })),
      })),
    });

    const { PUT } = await import('@/app/api/v1/admin/merchants/[id]/approve/route');
    const request = createMockRequest('PUT', {
      body: { status: 'active', commissionRate: 3.5 },
    });
    const response = await PUT(request, { params: { id: 'm-1' } });
    const result = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(result.data.commissionRate).toBe(3.5);
  });
});

describe('Admin Dashboard — GET /api/v1/admin/dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return platform KPIs', async () => {
    const authMiddleware = require('@/lib/auth-middleware');
    authMiddleware.authenticateRequest.mockResolvedValueOnce({
      user: { id: 'admin-1', email: 'admin@petemart.com', role: 'admin' },
      error: null,
    });

    // Mock all count queries
    const supabaseMock = require('@/supabase/supabase-js').createClient();

    // We'll just verify the endpoint returns 200
    supabaseMock.from().select = jest.fn(() => ({
      select: jest.fn(() => ({})),
      eq: jest.fn(() => ({
        select: jest.fn(() => ({})),
      })),
      gte: jest.fn(() => Promise.resolve({ data: [] })),
    }));

    const { GET } = await import('@/app/api/v1/admin/dashboard/route');
    const request = createMockRequest('GET');
    const response = await GET(request);

    expect(response.status).toBe(200);
  });
});

describe('Admin Analytics — GET /api/v1/admin/analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return analytics data', async () => {
    const authMiddleware = require('@/lib/auth-middleware');
    authMiddleware.authenticateRequest.mockResolvedValueOnce({
      user: { id: 'admin-1', email: 'admin@petemart.com', role: 'admin' },
      error: null,
    });

    const { GET } = await import('@/app/api/v1/admin/analytics/route');
    const request = createMockRequest('GET');
    const response = await GET(request);

    expect(response.status).toBe(200);
  });

  it('should support custom date range', async () => {
    const authMiddleware = require('@/lib/auth-middleware');
    authMiddleware.authenticateRequest.mockResolvedValueOnce({
      user: { id: 'admin-1', email: 'admin@petemart.com', role: 'admin' },
      error: null,
    });

    const { GET } = await import('@/app/api/v1/admin/analytics/route');
    const request = createMockRequest('GET', {
      searchParams: { days: '7' },
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
  });
});
