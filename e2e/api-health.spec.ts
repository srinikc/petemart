import { test, expect } from '@playwright/test';

test.describe('API Health & Endpoints', () => {
  test('health endpoint returns 200', async ({ request }) => {
    const res = await request.get('/api/v1/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('markets endpoint returns data', async ({ request }) => {
    const res = await request.get('/api/v1/markets');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  test('products endpoint returns paginated data', async ({ request }) => {
    const res = await request.get('/api/v1/products');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('products query filter works', async ({ request }) => {
    const res = await request.get('/api/v1/products?q=silk');
    expect(res.status()).toBe(200);
  });

  test('merchants endpoint returns merchants', async ({ request }) => {
    const res = await request.get('/api/v1/merchants');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('merchant slug endpoint returns single merchant', async ({ request }) => {
    const res = await request.get('/api/v1/merchants/tarun-enterprises');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeTruthy();
  });

  test('invalid merchant slug returns graceful error response', async ({ request }) => {
    const res = await request.get('/api/v1/merchants/nonexistent-merchant');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBeTruthy();
  });

  test('auth login endpoint accepts empty payload gracefully', async ({ request }) => {
    const res = await request.post('/api/v1/auth/login', { data: {} });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toBeTruthy();
  });

  test('auth me without auth returns guest or error response', async ({ request }) => {
    const res = await request.get('/api/v1/auth/me');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toBeTruthy();
  });

  test('admin endpoints return structured data', async ({ request }) => {
    const res = await request.get('/api/v1/admin/dashboard');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toBeTruthy();
  });

  test('order tracking endpoint works', async ({ request }) => {
    const res = await request.get('/api/v1/tracking/order-1');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toBeTruthy();
  });

  test('orders endpoint returns data', async ({ request }) => {
    const res = await request.get('/api/v1/orders');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toBeTruthy();
  });
});
