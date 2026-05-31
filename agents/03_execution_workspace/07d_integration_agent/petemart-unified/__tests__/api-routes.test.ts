// =============================================================================
// PeteMart — API Route Integration Tests
// =============================================================================
// Tests all 22+ API endpoints to ensure proper responses.
// =============================================================================

import { describe, it, expect } from 'vitest';

const PORT = process.env.TEST_PORT || '3458';
const BASE = `http://localhost:${PORT}/api/v1`;

async function fetchApi(path: string, options?: RequestInit) {
  const url = `${BASE}${path}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, body, headers: response.headers };
}

// ── Health Check ─────────────────────────────────────────────────────────────
describe('Health', () => {
  it('GET /health returns 200 with status healthy', async () => {
    const { status, body } = await fetchApi('/health');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('healthy');
    expect(body.data.version).toBeDefined();
  });
});

// ── Public Endpoints ─────────────────────────────────────────────────────────
describe('Public API Endpoints', () => {
  it('GET /markets returns markets array', async () => {
    const { status, body } = await fetchApi('/markets');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(5);
    expect(body.data[0]).toHaveProperty('name');
    expect(body.data[0]).toHaveProperty('slug');
  });

  it('GET /products returns paginated products', async () => {
    const { status, body } = await fetchApi('/products?limit=5');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeLessThanOrEqual(5);
    expect(body.meta).toHaveProperty('page');
    expect(body.meta).toHaveProperty('total');
    expect(body.data[0]).toHaveProperty('name');
    expect(body.data[0]).toHaveProperty('price');
  });

  it('GET /products supports search (q)', async () => {
    const { status, body } = await fetchApi('/products?q=silk');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    const results = body.data as any[];
    expect(results.length).toBeGreaterThan(0);
    results.forEach((p: any) => {
      expect(p.name.toLowerCase()).toContain('silk');
    });
  });

  it('GET /products supports category filter', async () => {
    const { status, body } = await fetchApi('/products?category=pastries');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    const results = body.data as any[];
    expect(results.length).toBeGreaterThan(0);
    results.forEach((p: any) => {
      expect(p.category.toLowerCase()).toContain('pastries');
    });
  });

  it('GET /products/[id] returns single product', async () => {
    const { status, body } = await fetchApi('/products/prod-001');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('prod-001');
    expect(body.data.name).toBeDefined();
  });

  it('GET /products/[id] with invalid id returns 404', async () => {
    const { status } = await fetchApi('/products/nonexistent');
    expect(status).toBe(404);
  });

  it('GET /merchants returns merchants array', async () => {
    const { status, body } = await fetchApi('/merchants');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(8);
  });

  it('GET /merchants supports market filter', async () => {
    const { status, body } = await fetchApi('/merchants?market=chickpet');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    const results = body.data as any[];
    expect(results.length).toBeGreaterThan(0);
  });

  it('GET /merchants/[slug] returns merchant with products', async () => {
    const { status, body } = await fetchApi('/merchants/samskruti-silks');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.store_name).toBe('Samskruti Silks');
    expect(Array.isArray(body.data.products)).toBe(true);
  });

  it('GET /merchants/[slug] with invalid slug returns 404', async () => {
    const { status } = await fetchApi('/merchants/unknown-store');
    expect(status).toBe(404);
  });
});

// ── Auth Endpoints ───────────────────────────────────────────────────────────
describe('Auth Endpoints', () => {
  it('POST /auth/send-otp returns success message', async () => {
    const { status, body } = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone: '9999999999' }),
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.message).toContain('OTP');
  });

  it('POST /auth/send-otp with invalid phone returns 400', async () => {
    const { status } = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    expect(status).toBe(400);
  });

  it('POST /auth/signup returns new user', async () => {
    const { status, body } = await fetchApi('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ phone: '9999999999', password: 'test123', fullName: 'Test User' }),
    });
    expect(status).toBe(201);
    expect(body.success).toBe(true);
  });

  it('GET /auth/me returns unauthorized without token', async () => {
    const { status } = await fetchApi('/auth/me');
    expect(status).toBe(401);
  });

  it('GET /auth/me with bearer token returns profile', async () => {
    const { status, body } = await fetchApi('/auth/me', {
      headers: { 'Authorization': 'Bearer mock-jwt-customer-token' },
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });
});

// ── Cart & Checkout ──────────────────────────────────────────────────────────
describe('Cart & Checkout', () => {
  const AUTH_HEADERS = { 'Authorization': 'Bearer mock-jwt-cust-001' };

  it('POST /cart requires auth', async () => {
    const { status } = await fetchApi('/cart', { method: 'POST', body: JSON.stringify({}) });
    expect(status).toBe(401);
  });

  it('GET /cart without auth returns 401', async () => {
    const { status } = await fetchApi('/cart');
    expect(status).toBe(401);
  });

  it('sequential cart-to-checkout flow works', async () => {
    // Step 1: Add item to cart
    const { status: s1, body: b1 } = await fetchApi('/cart', {
      method: 'POST',
      headers: AUTH_HEADERS,
      body: JSON.stringify({ product_id: 'prod-001', quantity: 2, mode: 'A' }),
    });
    expect(s1).toBe(201);
    expect(b1.success).toBe(true);
    expect(b1.data.itemCount).toBe(2);

    // Step 2: Verify cart looks correct
    const { status: s2, body: b2 } = await fetchApi('/cart', { headers: AUTH_HEADERS });
    expect(s2).toBe(200);
    expect(b2.success).toBe(true);
    expect(b2.data.items.length).toBe(1);
    expect(b2.data.subtotal).toBeGreaterThan(0);

    // Step 3: Checkout
    const { status: s3, body: b3 } = await fetchApi('/checkout', {
      method: 'POST',
      headers: AUTH_HEADERS,
      body: JSON.stringify({ address_id: 'addr-1', payment_method: 'UPI' }),
    });
    expect(s3).toBe(201);
    expect(b3.success).toBe(true);
    expect(b3.data).toHaveProperty('id');
    expect(b3.data).toHaveProperty('total');
    expect(b3.data.status).toBe('confirmed');
  });
});

// ── Orders ───────────────────────────────────────────────────────────────────
describe('Orders', () => {
  it('GET /orders returns orders', async () => {
    const { status, body } = await fetchApi('/orders');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('GET /orders/[id] returns single order', async () => {
    const { status, body } = await fetchApi('/orders/order-1');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });
});

// ── Tracking ─────────────────────────────────────────────────────────────────
describe('Tracking', () => {
  it('GET /tracking/[id] returns tracking info', async () => {
    const { status, body } = await fetchApi('/tracking/ORD-1');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('status');
    expect(body.data).toHaveProperty('currentLocation');
  });

  it('GET /tracking/[id] with invalid id returns 404', async () => {
    const { status } = await fetchApi('/tracking/INVALID');
    expect(status).toBe(404);
  });
});

// ── Admin Endpoints ──────────────────────────────────────────────────────────
describe('Admin Endpoints', () => {
  const ADMIN_AUTH = { 'Authorization': 'Bearer mock-jwt-admin-token' };

  it('GET /admin/dashboard requires admin auth', async () => {
    const { status } = await fetchApi('/admin/dashboard');
    expect(status).toBe(401);
  });

  it('GET /admin/dashboard with admin auth returns dashboard', async () => {
    const { status, body } = await fetchApi('/admin/dashboard', { headers: ADMIN_AUTH });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('GET /admin/analytics returns analytics', async () => {
    const { status, body } = await fetchApi('/admin/analytics', { headers: ADMIN_AUTH });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('GET /admin/merchants returns all merchants', async () => {
    const { status, body } = await fetchApi('/admin/merchants', { headers: ADMIN_AUTH });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});

// ── Merchant Endpoints ───────────────────────────────────────────────────────
describe('Merchant Endpoints', () => {
  const MERCHANT_AUTH = { 'Authorization': 'Bearer mock-jwt-merch-001' };

  // Note: The actual merchant endpoint structure uses:
  // /api/v1/merchant-products, /api/v1/merchant-orders
  // The api-client uses /merchant/products but routes exist at /merchant-products

  it('GET /merchant-products returns products', async () => {
    const { status, body } = await fetchApi('/merchant-products?merchant=samskruti-silks', {
      headers: MERCHANT_AUTH,
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('GET /merchant-orders returns orders', async () => {
    const { status, body } = await fetchApi('/merchant-orders', {
      headers: MERCHANT_AUTH,
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('PATCH /merchant-orders updates order status', async () => {
    const { status, body } = await fetchApi('/merchant-orders', {
      method: 'PATCH',
      headers: MERCHANT_AUTH,
      body: JSON.stringify({ order_id: 'order-1', status: 'preparing' }),
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('preparing');
  });
});

// ── Security & Rate Limiting ─────────────────────────────────────────────────
describe('Security', () => {
  it('API returns security headers', async () => {
    const { headers } = await fetchApi('/health');
    expect(headers.get('x-content-type-options')).toBe('nosniff');
    expect(headers.get('x-frame-options')).toBe('DENY');
  });

  it('Admin endpoint blocks non-admin tokens', async () => {
    const { status } = await fetchApi('/admin/merchants', {
      headers: { 'Authorization': 'Bearer mock-jwt-customer-token' },
    });
    expect(status).toBe(401);
  });
});
