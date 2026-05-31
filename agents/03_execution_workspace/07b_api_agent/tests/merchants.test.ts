// =============================================================================
// PeteMart — Merchants API Unit Tests
// =============================================================================

import { createMockRequest, parseResponse } from './helpers/test-client';

jest.mock('@/lib/rate-limiter', () => ({
  rateLimitMiddleware: jest.fn(() => null),
  rateLimit: jest.fn(() => ({ allowed: true, remaining: 99, resetIn: 0 })),
}));

describe('Markets API — GET /api/v1/markets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return list of markets grouped by city', async () => {
    const mockData = [
      { city: 'Bengaluru', locality: 'Chickpet', count: 3 },
      { city: 'Bengaluru', locality: 'Balepet', count: 5 },
    ];

    const supabaseMock = require('@supabase/supabase-js').createClient();
    supabaseMock.from().select().eq().not.mockReturnValue({
      order: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ data: mockData, error: null })),
      })),
    });

    const { GET } = await import('@/app/api/v1/markets/route');
    const request = createMockRequest('GET');
    const response = await GET(request);
    const result = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });
});

describe('Merchants API — GET /api/v1/merchants', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return paginated merchant list', async () => {
    const mockMerchants = [
      { id: 'm-1', business_name: 'Test Merchant', status: 'active', city: 'Bengaluru' },
    ];

    const supabaseMock = require('@supabase/supabase-js').createClient();
    
    // Mock for count
    const countQuery = supabaseMock.from().select().eq();
    countQuery.or = jest.fn(() => Promise.resolve({ data: mockMerchants, count: 1 }));
    
    // Mock for data
    supabaseMock.from().select.mockReturnValue({
      eq: jest.fn(() => ({
        or: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                range: jest.fn(() => Promise.resolve({ data: mockMerchants, error: null })),
              })),
            })),
          })),
        })),
      })),
    });

    const { GET } = await import('@/app/api/v1/merchants/route');
    const request = createMockRequest('GET');
    const response = await GET(request);
    const result = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
  });

  it('should filter by market/locality', async () => {
    const { GET } = await import('@/app/api/v1/merchants/route');
    const request = createMockRequest('GET', {
      searchParams: { market: 'Bengaluru', locality: 'Chickpet' },
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
  });

  it('should filter open merchants', async () => {
    const { GET } = await import('@/app/api/v1/merchants/route');
    const request = createMockRequest('GET', {
      searchParams: { isOpen: 'true' },
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
  });
});

describe('Merchant Detail API — GET /api/v1/merchants/:slug', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return merchant with products', async () => {
    const mockMerchant = {
      id: 'm-1',
      business_name: 'Test Merchant',
      status: 'active',
      city: 'Bengaluru',
      locality: 'Chickpet',
    };

    const mockProducts = [
      { id: 'p-1', name: 'Product 1', price: 100, is_available: true, merchant_id: 'm-1' },
    ];

    const supabaseMock = require('@supabase/supabase-js').createClient();
    
    // First call: try direct ID/slug match
    supabaseMock.from().select().eq().or.mockReturnValue({
      single: jest.fn(() => Promise.resolve({ data: mockMerchant, error: null })),
    });

    // Products query
    supabaseMock.from().select().eq().eq().order().order.mockReturnValue({
      range: jest.fn(() => Promise.resolve({ data: mockProducts, count: 1, error: null })),
    });

    const { GET } = await import('@/app/api/v1/merchants/[slug]/route');
    const request = createMockRequest('GET');
    const response = await GET(request, { params: { slug: 'test-merchant' } });
    const result = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.data.merchant).toBeDefined();
    expect(result.data.products).toBeDefined();
  });

  it('should return 404 for non-existent merchant', async () => {
    const supabaseMock = require('@supabase/supabase-js').createClient();
    supabaseMock.from().select().eq().or.mockReturnValue({
      single: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Not found' } })),
    });
    supabaseMock.from().select().eq().filter.mockReturnValue({
      limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
    });

    const { GET } = await import('@/app/api/v1/merchants/[slug]/route');
    const request = createMockRequest('GET');
    const response = await GET(request, { params: { slug: 'non-existent' } });

    expect(response.status).toBe(404);
  });
});
