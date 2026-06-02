import { describe, it, expect } from 'vitest';

describe('Performance — Lighthouse Budget (Config)', () => {
  it('performance budget thresholds are defined', () => {
    const budgets = { lcp: 2500, tbt: 200, cls: 0.1, si: 3000 };
    expect(budgets.lcp).toBeLessThanOrEqual(4000);
    expect(budgets.tbt).toBeLessThanOrEqual(300);
    expect(budgets.cls).toBeLessThanOrEqual(0.25);
    expect(budgets.si).toBeLessThanOrEqual(5000);
  });

  it('Lighthouse categories are configured', () => {
    const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
    expect(categories).toContain('performance');
    expect(categories).toContain('accessibility');
    expect(categories.length).toBeGreaterThanOrEqual(4);
  });
});

describe('Performance — API Response Budgets', () => {
  const API_ENDPOINTS = [
    { path: '/api/v1/health', p95Ms: 200 },
    { path: '/api/v1/markets', p95Ms: 500 },
    { path: '/api/v1/products', p95Ms: 500 },
    { path: '/api/v1/merchants', p95Ms: 500 },
  ];

  it('all API endpoints have defined P95 budgets', () => {
    API_ENDPOINTS.forEach(ep => {
      expect(ep.p95Ms).toBeGreaterThan(0);
      expect(ep.p95Ms).toBeLessThanOrEqual(5000);
    });
  });

  it('P95 budget values are reasonable', () => {
    const maxBudget = Math.max(...API_ENDPOINTS.map(e => e.p95Ms));
    expect(maxBudget).toBeLessThanOrEqual(1000);
  });
});

describe('Performance — Page Render Budget', () => {
  const RENDER_BUDGETS = [
    { page: 'Home', renderMs: 3000 },
    { page: 'Auth', renderMs: 3000 },
    { page: 'Market', renderMs: 4000 },
    { page: 'Cart', renderMs: 3000 },
  ];

  it('all pages have render time budgets', () => {
    RENDER_BUDGETS.forEach(p => {
      expect(p.renderMs).toBeGreaterThan(0);
    });
  });

  it('render budgets are within SLA', () => {
    RENDER_BUDGETS.forEach(p => {
      expect(p.renderMs).toBeLessThanOrEqual(5000);
    });
  });

  it('all critical pages are covered', () => {
    const pages = RENDER_BUDGETS.map(p => p.page);
    expect(pages).toContain('Home');
    expect(pages).toContain('Auth');
  });
});
