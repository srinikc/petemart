// =============================================================================
// PeteMart — Merchant Routes Unit Tests
// =============================================================================

import { createMockRequest, createMerchantMockRequest, parseResponse } from './helpers/test-client';

jest.mock('@/lib/auth-middleware', () => ({
  authenticateRequest: jest.fn(),
  requireAuth: jest.fn(),
  requireRole: jest.fn(() => null),
}));

jest.mock('@/lib/rate-limiter', () => ({
  rateLimitMiddleware: jest.fn(() => null),
  rateLimit: jest.fn(() => ({ allowed: true, remaining: 99, resetIn: 0 })),
}));

describe('Merchant Dashboard — GET /api/v1/merchant/dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 for unauthenticated', async () => {
    const authMiddleware = require('@/lib/auth-middleware');
    authMiddleware.authenticateRequest.mockResolvedValueOnce({
      user: null,
      error: new Response(JSON.stringify({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
      }), { status: 401 }),
    });

    const { GET } = await import('@/app/api/v1/merchant/dashboard/route');
    const request = createMockRequest('GET');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('should return dashboard data for merchant', async () => {
    const authMiddleware = require('@/lib/auth-middleware');
    authMiddleware.authenticateRequest.mockResolvedValueOnce({
      user: { id: 'user-1', email: 'merchant@test.com', role: 'merchant' },
      error: null,
    });
    // requireRole returns null for valid role
    authMiddleware.requireRole.mockReturnValueOnce(null);

    const supabaseMock = require('@supabase/supabase-js').createClient();

    // Mock merchant lookup
    supabaseMock.from().select().eq.mockReturnValue({
      single: jest.fn(() => Promise.resolve({
        data: { id: 'm-1', owner_id: 'user-1', business_name: 'Test Merchant' },
        error: null,
      })),
    });

    // Mock all the count queries
    supabaseMock.from().select().eq.mockReturnValue({
      select: jest.fn(() => ({ count: 10 })),
    });

    // Mock orders data
    supabaseMock.from().select().eq().gte.mockResolvedValue({
      data: [{ total: 5000 }, { total: 3000 }],
    });

    const { GET } = await import('@/app/api/v1/merchant/dashboard/route');
    const request = createMockRequest('GET');
    const response = await GET(request);
    const result = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
  });
});

describe('Merchant Products — CRUD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/merchant/products', () => {
    it('should list merchant products', async () => {
      const authMiddleware = require('@/lib/auth-middleware');
      authMiddleware.authenticateRequest.mockResolvedValueOnce({
        user: { id: 'user-1', email: 'merchant@test.com', role: 'merchant' },
        error: null,
      });

      const supabaseMock = require('@supabase/supabase-js').createClient();
      supabaseMock.from().select().eq.mockReturnValue({
        single: jest.fn(() => Promise.resolve({
          data: { id: 'm-1', owner_id: 'user-1' },
          error: null,
        })),
      });
      supabaseMock.from().select().eq().order().range.mockResolvedValueOnce({
        data: [
          { id: 'p-1', name: 'Product 1', price: 100, merchant_id: 'm-1' },
          { id: 'p-2', name: 'Product 2', price: 200, merchant_id: 'm-1' },
        ],
        count: 2,
        error: null,
      });

      const { GET } = await import('@/app/api/v1/merchant/products/route');
      const request = createMockRequest('GET');
      const response = await GET(request);
      const result = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
    });
  });

  describe('POST /api/v1/merchant/products', () => {
    it('should create a new product', async () => {
      const authMiddleware = require('@/lib/auth-middleware');
      authMiddleware.authenticateRequest.mockResolvedValueOnce({
        user: { id: 'user-1', email: 'merchant@test.com', role: 'merchant' },
        error: null,
      });

      const supabaseMock = require('@supabase/supabase-js').createClient();

      // Merchant lookup
      supabaseMock.from().select().eq.mockReturnValue({
        single: jest.fn(() => Promise.resolve({
          data: { id: 'm-1', owner_id: 'user-1' },
          error: null,
        })),
      });

      // Product creation
      supabaseMock.from().insert.mockReturnValue({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { id: 'p-new', name: 'New Product', slug: 'new-product', price: 500 },
            error: null,
          })),
        })),
      });

      const { POST } = await import('@/app/api/v1/merchant/products/route');
      const request = createMockRequest('POST', {
        body: {
          name: 'New Product',
          price: 500,
          stockQuantity: 10,
          categoryId: 'cat-1',
        },
      });
      const response = await POST(request);
      const result = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(result.success).toBe(true);
    });

    it('should validate product data', async () => {
      const authMiddleware = require('@/lib/auth-middleware');
      authMiddleware.authenticateRequest.mockResolvedValueOnce({
        user: { id: 'user-1', email: 'merchant@test.com', role: 'merchant' },
        error: null,
      });

      const { POST } = await import('@/app/api/v1/merchant/products/route');
      const request = createMockRequest('POST', { body: {} });
      const response = await POST(request);
      const result = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
    });
  });
});

describe('Merchant Orders — GET /api/v1/merchant/orders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return merchant orders', async () => {
    const authMiddleware = require('@/lib/auth-middleware');
    authMiddleware.authenticateRequest.mockResolvedValueOnce({
      user: { id: 'user-1', email: 'merchant@test.com', role: 'merchant' },
      error: null,
    });

    const supabaseMock = require('@supabase/supabase-js').createClient();

    // Merchant lookup
    supabaseMock.from().select().eq.mockReturnValue({
      single: jest.fn(() => Promise.resolve({
        data: { id: 'm-1', owner_id: 'user-1' },
        error: null,
      })),
    });

    // Order items lookup
    supabaseMock.from().select().eq.mockResolvedValueOnce({
      data: [{ order_id: 'order-1' }, { order_id: 'order-2' }],
      error: null,
    });

    // Orders with items
    supabaseMock.from().select().in.mockReturnValue({
      order: jest.fn(() => ({
        range: jest.fn(() => Promise.resolve({
          data: [
            { id: 'order-1', order_number: 'PM-001', status: 'confirmed', items: [] },
            { id: 'order-2', order_number: 'PM-002', status: 'pending', items: [] },
          ],
          count: 2,
          error: null,
        })),
      })),
    });

    const { GET } = await import('@/app/api/v1/merchant/orders/route');
    const request = createMockRequest('GET');
    const response = await GET(request);
    const result = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
  });
});

describe('Merchant Order Status — PUT /api/v1/merchant/orders/:id/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update order status', async () => {
    const authMiddleware = require('@/lib/auth-middleware');
    authMiddleware.authenticateRequest.mockResolvedValueOnce({
      user: { id: 'user-1', email: 'merchant@test.com', role: 'merchant' },
      error: null,
    });

    const supabaseMock = require('@/supabase/supabase-js').createClient();

    // Merchant lookup
    supabaseMock.from().select().eq.mockReturnValue({
      single: jest.fn(() => Promise.resolve({
        data: { id: 'm-1', owner_id: 'user-1' },
        error: null,
      })),
    });

    // Order lookup
    supabaseMock.from().select().eq.mockReturnValue({
      single: jest.fn(() => Promise.resolve({
        data: { id: 'order-1', status: 'confirmed', order_number: 'PM-001' },
        error: null,
      })),
    });

    // Merchant items check
    supabaseMock.from().select().eq().eq().limit.mockResolvedValueOnce({
      data: [{ id: 'item-1' }],
      error: null,
    });

    // Status update
    supabaseMock.from().update().eq.mockResolvedValueOnce({ error: null });

    const { PUT } = await import('@/app/api/v1/merchant/orders/[id]/status/route');
    const request = createMockRequest('PUT', {
      body: { status: 'preparing' },
    });
    const response = await PUT(request, { params: { id: 'order-1' } });
    const result = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.data.newStatus).toBe('preparing');
  });

  it('should reject invalid status transitions', async () => {
    const authMiddleware = require('@/lib/auth-middleware');
    authMiddleware.authenticateRequest.mockResolvedValueOnce({
      user: { id: 'user-1', email: 'merchant@test.com', role: 'merchant' },
      error: null,
    });

    const supabaseMock = require('@/supabase/supabase-js').createClient();

    supabaseMock.from().select().eq.mockReturnValue({
      single: jest.fn(() => Promise.resolve({
        data: { id: 'm-1', owner_id: 'user-1' },
        error: null,
      })),
    });

    supabaseMock.from().select().eq.mockReturnValue({
      single: jest.fn(() => Promise.resolve({
        data: { id: 'order-1', status: 'delivered', order_number: 'PM-001' },
        error: null,
      })),
    });

    supabaseMock.from().select().eq().eq().limit.mockResolvedValueOnce({
      data: [{ id: 'item-1' }],
      error: null,
    });

    const { PUT } = await import('@/app/api/v1/merchant/orders/[id]/status/route');
    const request = createMockRequest('PUT', {
      body: { status: 'preparing' },
    });
    const response = await PUT(request, { params: { id: 'order-1' } });
    const result = await parseResponse(response);

    expect(response.status).toBe(400);
    expect(result.success).toBe(false);
  });
});
