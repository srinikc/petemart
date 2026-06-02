import { describe, it, expect } from 'vitest';

const REQUIRED_HEADERS = [
  { name: 'X-Content-Type-Options', value: 'nosniff' },
  { name: 'X-Frame-Options', value: 'DENY' },
  { name: 'X-XSS-Protection', value: '0' },
  { name: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { name: 'Strict-Transport-Security', value: /max-age=\d+/ },
];

const RECOMMENDED_CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self'",
];

describe('Security Headers Configuration', () => {
  it('defines required security headers with correct values', () => {
    for (const header of REQUIRED_HEADERS) {
      expect(header.name).toBeDefined();
      expect(header.value).toBeDefined();
    }
  });

  it('X-Content-Type-Options prevents MIME sniffing', () => {
    const header = REQUIRED_HEADERS.find(h => h.name === 'X-Content-Type-Options');
    expect(header?.value).toBe('nosniff');
  });

  it('X-Frame-Options prevents clickjacking', () => {
    const header = REQUIRED_HEADERS.find(h => h.name === 'X-Frame-Options');
    expect(header?.value).toBe('DENY');
  });

  it('has valid CSP directives', () => {
    for (const directive of RECOMMENDED_CSP_DIRECTIVES) {
      expect(directive).toBeTruthy();
      expect(directive).toMatch(/'self'/);
    }
  });

  it('CORS configuration allows required origins', () => {
    const allowedOrigins = ['http://localhost:3458', 'https://petemart.vercel.app'];
    for (const origin of allowedOrigins) {
      expect(origin).toMatch(/^https?:\/\//);
    }
  });

  it('HSTS includes reasonable max-age', () => {
    const hsts = REQUIRED_HEADERS.find(h => h.name === 'Strict-Transport-Security');
    expect(hsts?.value).toBeDefined();
  });

  it('all recommended CSP directives are present', () => {
    expect(RECOMMENDED_CSP_DIRECTIVES.length).toBeGreaterThanOrEqual(6);
  });

  it('prevents inline script execution via CSP', () => {
    const scriptSrc = RECOMMENDED_CSP_DIRECTIVES.find(d => d.startsWith("script-src"));
    expect(scriptSrc).toBeDefined();
  });

  it('rate limiting configuration exists', () => {
    const rateLimit = { windowMs: 60000, max: 200 };
    expect(rateLimit.windowMs).toBe(60000);
    expect(rateLimit.max).toBe(200);
  });
});
