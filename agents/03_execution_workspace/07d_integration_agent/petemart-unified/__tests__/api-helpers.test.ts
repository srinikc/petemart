// =============================================================================
// PeteMart — Unit Tests: API Helper Functions
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  ok, created, badRequest, unauthorized, forbidden, notFound, serverError,
  parsePagination, createPaginationMeta
} from '@/lib/api-helpers';

describe('API Helper Functions', () => {
  // ── Response Envelopes ─────────────────────────────────────────────────────
  it('ok() returns 200 with success payload', () => {
    const res = ok({ message: 'test' });
    expect(res.status).toBe(200);
  });

  it('created() returns 201 with success payload', () => {
    const res = created({ id: 'new-1' });
    expect(res.status).toBe(201);
  });

  it('badRequest() returns 400 with error code', () => {
    const res = badRequest('Invalid input');
    expect(res.status).toBe(400);
  });

  it('unauthorized() returns 401', () => {
    const res = unauthorized();
    expect(res.status).toBe(401);
  });

  it('forbidden() returns 403', () => {
    const res = forbidden();
    expect(res.status).toBe(403);
  });

  it('notFound() returns 404', () => {
    const res = notFound();
    expect(res.status).toBe(404);
  });

  it('serverError() returns 500', () => {
    const res = serverError();
    expect(res.status).toBe(500);
  });

  // ── Pagination ─────────────────────────────────────────────────────────────
  it('parsePagination() defaults to page 1, limit 20', () => {
    const url = new URL('http://localhost:3000/api/v1/products');
    const result = parsePagination(url.searchParams);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
  });

  it('parsePagination() parses custom values', () => {
    const url = new URL('http://localhost:3000/api/v1/products?page=3&limit=10');
    const result = parsePagination(url.searchParams);
    expect(result.page).toBe(3);
    expect(result.limit).toBe(10);
    expect(result.offset).toBe(20);
  });

  it('parsePagination() enforces max limit of 100', () => {
    const url = new URL('http://localhost:3000/api/v1/products?limit=500');
    const result = parsePagination(url.searchParams);
    expect(result.limit).toBe(100);
  });

  it('parsePagination() enforces min page of 1 and min limit of 1', () => {
    const url = new URL('http://localhost:3000/api/v1/products?page=0&limit=-5');
    const result = parsePagination(url.searchParams);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(1);
  });
});
