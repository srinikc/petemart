// =============================================================================
// PeteMart — Route Handler Unit Tests (in-process)
// =============================================================================
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as healthGet } from '@/app/api/v1/health/route';
import { GET as marketsGet } from '@/app/api/v1/markets/route';
import { GET as merchantsGet } from '@/app/api/v1/merchants/route';
import { GET as productsGet } from '@/app/api/v1/products/route';
import { GET as ordersGet } from '@/app/api/v1/orders/route';
import { MARKETS, MERCHANTS, PRODUCTS } from '@/lib/data';

function mockRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(url, init as any);
}

describe('Route Handlers (in-process)', () => {
  it('GET /health returns 200 with status healthy', async () => {
    const req = mockRequest('http://localhost:3000/api/v1/health');
    const res = await healthGet(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('healthy');
    expect(body.data.version).toBeDefined();
  });

  it('GET /markets returns markets array', async () => {
    const res = await marketsGet(mockRequest('http://localhost:3000/api/v1/markets'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(5);
    expect(body.data[0]).toHaveProperty('name');
    expect(body.data[0]).toHaveProperty('slug');
  });

  it('GET /products returns paginated products', async () => {
    const res = await productsGet(mockRequest('http://localhost:3000/api/v1/products?limit=5'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeLessThanOrEqual(5);
    expect(body.meta).toHaveProperty('total');
    expect(body.data[0]).toHaveProperty('name');
    expect(body.data[0]).toHaveProperty('price');
  });

  it('GET /products supports search (q)', async () => {
    const res = await productsGet(mockRequest('http://localhost:3000/api/v1/products?q=silk'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const results = body.data as any[];
    expect(results.length).toBeGreaterThan(0);
  });

  it('GET /products supports category filter', async () => {
    const categories = [...new Set(PRODUCTS.map(p => p.category))];
    const targetCat = categories[0];
    const res = await productsGet(mockRequest(`http://localhost:3000/api/v1/products?category=${encodeURIComponent(targetCat)}`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const results = body.data as any[];
    expect(results.length).toBeGreaterThan(0);
  });

  it('GET /products/[id] returns single product', async () => {
    const firstProductId = PRODUCTS[0].id;
    const { GET: productGet } = await import('@/app/api/v1/products/[id]/route');
    const res = await productGet(
      mockRequest(`http://localhost:3000/api/v1/products/${firstProductId}`),
      { params: Promise.resolve({ id: firstProductId }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(firstProductId);
  });

  it('GET /products/[id] with invalid id returns 404', async () => {
    const { GET: productGet } = await import('@/app/api/v1/products/[id]/route');
    const res = await productGet(
      mockRequest('http://localhost:3000/api/v1/products/nonexistent'),
      { params: Promise.resolve({ id: 'nonexistent' }) }
    );
    expect(res.status).toBe(404);
  });

  it('GET /merchants returns merchants array', async () => {
    const res = await merchantsGet(mockRequest('http://localhost:3000/api/v1/merchants'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(8);
  });

  it('GET /merchants supports market filter', async () => {
    const marketSlug = MARKETS[0].slug;
    const res = await merchantsGet(mockRequest(`http://localhost:3000/api/v1/merchants?market=${marketSlug}`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const results = body.data as any[];
    expect(results.length).toBeGreaterThan(0);
  });

  it('GET /merchants/[slug] returns merchant with products', async () => {
    const firstMerchant = MERCHANTS[0];
    const { GET: merchantGet } = await import('@/app/api/v1/merchants/[slug]/route');
    const res = await merchantGet(
      mockRequest(`http://localhost:3000/api/v1/merchants/${firstMerchant.slug}`),
      { params: Promise.resolve({ slug: firstMerchant.slug }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.merchant.store_name).toBe(firstMerchant.store_name);
    expect(Array.isArray(body.data.products)).toBe(true);
  });

  it('GET /merchants/[slug] with invalid slug returns 404', async () => {
    const { GET: merchantGet } = await import('@/app/api/v1/merchants/[slug]/route');
    const res = await merchantGet(
      mockRequest('http://localhost:3000/api/v1/merchants/unknown-store'),
      { params: Promise.resolve({ slug: 'unknown-store' }) }
    );
    expect(res.status).toBe(404);
  });

  it('GET /orders returns orders', async () => {
    const res = await ordersGet(mockRequest('http://localhost:3000/api/v1/orders'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('GET /orders/[id] returns single order', async () => {
    const { GET: orderGet } = await import('@/app/api/v1/orders/[id]/route');
    const res = await orderGet(
      mockRequest('http://localhost:3000/api/v1/orders/order-1'),
      { params: Promise.resolve({ id: 'order-1' }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
