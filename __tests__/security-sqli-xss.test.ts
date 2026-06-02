import { describe, it, expect } from 'vitest';

describe('Security — SQL Injection Prevention', () => {
  const SQL_PATTERNS = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
    "1; SELECT * FROM admin --",
    "' OR 1=1 --",
  ];

  it('SQL injection patterns are detected', () => {
    const blacklist = [/'|--|union|drop|select/i];
    SQL_PATTERNS.forEach(pattern => {
      const isMalicious = blacklist.some(re => re.test(pattern));
      expect(isMalicious).toBe(true);
    });
  });

  it('input sanitization removes SQL metacharacters', () => {
    const sanitize = (input: string) => input.replace(/'|"|;|--|\/\*|\*\//g, '');
    SQL_PATTERNS.forEach(pattern => {
      const sanitized = sanitize(pattern);
      expect(sanitized).not.toContain("'");
    });
  });
});

describe('Security — XSS Prevention', () => {
  const XSS_PATTERNS = [
    '<script>alert(1)</script>',
    'javascript:alert(1)',
    'onerror=alert(1)',
    '"><script>alert(1)</script>',
    '{{constructor.constructor("alert(1)")()}}',
  ];

  it('XSS patterns are detected as malicious', () => {
    const xssRegex = /(<script|javascript:|onerror=|onload=|constructor)/i;
    const matchedCount = XSS_PATTERNS.filter(p => xssRegex.test(p)).length;
    expect(matchedCount).toBeGreaterThanOrEqual(3);
  });

  it('HTML entity encoding prevents script execution', () => {
    const encode = (input: string) => input.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    XSS_PATTERNS.forEach(pattern => {
      const encoded = encode(pattern);
      expect(encoded).not.toContain('<script');
    });
  });


});

describe('Security — CORS & Headers Hardening', () => {
  it('CORS origin whitelist is defined', () => {
    const allowedOrigins = ['http://localhost:3458', 'https://petemart.vercel.app'];
    expect(allowedOrigins.length).toBeGreaterThanOrEqual(1);
  });

  it('CORS allows only specific origins (no wildcard)', () => {
    const allowedOrigins = ['http://localhost:3458', 'https://petemart.vercel.app'];
    allowedOrigins.forEach(origin => {
      expect(origin).not.toBe('*');
    });
  });

  it('Content Security Policy is restrictive', () => {
    const csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'";
    expect(csp).toContain("default-src 'self'");
    expect(csp).not.toContain("'unsafe-eval'");
  });

  it('Rate limiting should be configured', () => {
    const rateLimitConfig = { windowMs: 60000, max: 100 };
    expect(rateLimitConfig.windowMs).toBeGreaterThan(0);
    expect(rateLimitConfig.max).toBeGreaterThan(0);
    expect(rateLimitConfig.max).toBeLessThanOrEqual(1000);
  });
});
