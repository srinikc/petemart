// =============================================================================
// PeteMart — Orders API Unit Tests
// =============================================================================

import { createMockRequest, createAuthMockRequest, parseResponse } from './helpers/test-client';

jest.mock('@/lib/auth-middleware', () => ({
  authenticateRequest: jest.fn(),
  requireAuth: jest.fn(),
  requireRole: jest.fn(() => null),
}));

jest.mock('@/lib/rate-limiter', () => ({
  rateLimitMiddleware: jest.fn(() => null),
  rateLimit: jest.fn(() => ({ allowed: true, remaining: 99, resetIn: 0 })),
}));

describe('Orders API — GET /api/v1/orders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 for unauthenticated requests', async () => {
    const authMiddleware = require('@/lib/auth-middleware');
    authMiddleware.authenticateRequest.mockResolvedValueOnce({
      user: null,
      error: new Response(JSON.stringify({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
      }), { status: 401 }),
    });

    const { GET } = await import('@/app/api/v1/orders/route');
    const request = createMockRequest('GET');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('should return orders for authenticated customer', async () => {
    const authMiddleware = require('@/lib/auth-middleware');
    authMiddleware.authenticateRequest.mockResolvedValueOnce({
      user: { id: 'user-1', email: 'test@example.com', role: 'customer' },
      error: null,
    });

    const mockOrders = [
      {
        id: 'order-1',
        order_number: 'PM-20260530-ABC123',
        status: 'pending',
        total: 1500,
        items: [],
      },
    ];

    const supabaseMock = require('@supabase/supabase-js').createClient();
    supabaseMock.from().select().eq.mockReturnValue({
      order: jest.fn(() => ({
        range: jest.fn(() => Promise.resolve({ data: mockOrders, count: 1, error: null })),
      })),
    });

    const { GET } = await import('@/app/api/v1/orders/route');
    const request = createMockRequest('GET');
    const response = await GET(request);
    const result = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
  });

  it('should filter orders by status', async () => {
    const authMiddleware = require('@/lib/auth-middleware');
    authMiddleware.authenticateRequest.mockResolvedValueOnce({
      user: { id: 'user-1', email: 'test@example.com', role: 'customer' },
      error: null,
    });

    const { GET } = await import('@/app/api/v1/orders/route');
    const request = createMockRequest('GET', {
      searchParams: { status: 'pending' },
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
  });
});

describe('Order Detail API — GET /api/v1/orders/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return order details for owner', async () => {
    const authMiddleware = require('@/lib/auth-middleware');
    authMiddleware.authenticateRequest.mockResolvedValueOnce({
      user: { id: 'user-1', email: 'test@example.com', role: 'customer' },
      error: null,
    });

    const mockOrder = {
      id: 'order-1',
      order_number: 'PM-20260530-ABC123',
      user_id: 'user-1',
      status: 'confirmed',
      subtotal: 1000,
      total: 1050,
      items: [
        { id: 'item-1', product_id: 'prod-1', quantity: 2, unit_price: 500, total_price: 1000 },
      ],
    };

    const supabaseMock = require('@supabase/supabase-js').createClient();
    supabaseMock.from().select().eq.mockReturnValue({
      single: jest.fn(() => Promise.resolve({ data: mockOrder, error: null })),
    });

    const { GET } = await import('@/app/api/v1/orders/[id]/route');
    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'order-1' } });
    const result = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.data.order_number).toBe('PM-20260530-ABC123');
  });

  it('should deny access to non-owner non-admin', async () => {
    const authMiddleware = require('@/lib/auth-middleware');
    authMiddleware.authenticateRequest.mockResolvedValueOnce({
      user: { id: 'user-2', email: 'other@example.com', role: 'customer' },
      error: null,
    });

    const mockOrder = {
      id: 'order-1',
      order_number: 'PM-20260530-ABC123',
      user_id: 'user-1', // Different user
      status: 'confirmed',
      items: [],
    };

    const supabaseMock = require('@supabase/supabase-js').createClient();
    supabaseMock.from().select().eq.mockReturnValue({
      single: jest.fn(() => Promise.resolve({ data: mockOrder, error: null })),
    });

    const { GET } = await import('@/app/api/v1/orders/[id]/route');
    const request = createMockRequest('GET');
    const response = await GET(request, { params: { id: 'order-1' } });

    expect(response.status).toBe(403);
  });
});

describe('Cart/Checkout API — POST /api/v1/cart/checkout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should require authentication', async () => {
    const authMiddleware = require('@/lib/auth-middleware');
    authMiddleware.authenticateRequest.mockResolvedValueOnce({
      user: null,
      error: new Response(JSON.stringify({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
      }), { status: 401 }),
    });

    const { POST } = await import('@/app/api/v1/cart/checkout/route');
    const request = createMockRequest('POST', {
      body: {
        items: [{ productId: 'prod-1', merchantId: 'm-1', quantity: 1 }],
        deliveryAddress: { line1: 'Test', city: 'Bengaluru', state: 'KA', pincode: '560001' },
        contactPhone: '+919876543210',
      },
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('should validate checkout request body', async () => {
    const authMiddleware = require('@/lib/auth-middleware');
    authMiddleware.authenticateRequest.mockResolvedValueOnce({
      user: { id: 'user-1', email: 'test@example.com', role: 'customer' },
      error: null,
    });

    const { POST } = await import('@/app/api/v1/cart/checkout/route');
    const request = createMockRequest('POST', { body: {} });
    const response = await POST(request);
    const result = await parseResponse(response);

    expect(response.status).toBe(400);
    expect(result.success).toBe(false);
  });

  it('should create order with valid checkout data', async () => {
    const authMiddleware = require('@/lib/auth-middleware');
    authMiddleware.authenticateRequest.mockResolvedValueOnce({
      user: { id: 'user-1', email: 'test@example.com', role: 'customer', fullName: 'Test' },
      error: null,
    });

    // Mock product validation
    const supabaseMock = require('@supabase/supabase-js').createClient();
    supabaseMock.from().select().in.mockResolvedValueOnce({
      data: [
        { id: 'prod-1', merchant_id: 'm-1', name: 'Test Product', price: 500, stock_quantity: 10, is_available: true, unit: 'piece' },
      ],
      error: null,
    });

    // Mock order creation
    supabaseMock.from().insert.mockReturnValue({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({
          data: {
            id: 'order-1',
            order_number: 'PM-20260530-TEST123',
            status: 'pending',
            subtotal: 500,
            delivery_fee: 15,
            platform_fee: 10,
            total: 525,
          },
          error: null,
        })),
      })),
    });

    // Mock order items creation
    supabaseMock.from().insert.mockResolvedValueOnce({ error: null });

    // Mock stock decrement
    supabaseMock.from().update().eq.mockResolvedValueOnce({ error: null });

    // Mock cart clear
    supabaseMock.from().delete().eq.mockResolvedValueOnce({ error: null });

    const { POST } = await import('@/app/api/v1/cart/checkout/route');
    const request = createMockRequest('POST', {
      body: {
        items: [{ productId: 'prod-1', merchantId: 'm-1', quantity: 1 }],
        deliveryAddress: {
          line1: '123 Test St',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
        },
        contactPhone: '+919876543210',
        paymentMethod: 'upi',
      },
    });
    const response = await POST(request);
    const result = await parseResponse(response);

    expect(response.status).toBe(201);
    expect(result.success).toBe(true);
    expect(result.data.order.orderNumber).toContain('PM-');
  });
});
