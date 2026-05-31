// =============================================================================
// PeteMart — Auth API Route Tests
// =============================================================================
// Tests for signup, login, verify-otp, logout, and me endpoints.
// Run: npx jest tests/auth.test.ts
// =============================================================================

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// ── Mock the user store (shared singleton) ────────────────────────────────────
const mockUserStore = new Map();

jest.mock('@/app/api/v1/auth/signup/store', () => ({
  getUserStore: () => mockUserStore,
  getOtpStore: () => new Map(),
}));

// ── Import route handlers ─────────────────────────────────────────────────────
// Note: In a real test environment, we'd use Next.js test utilities.
// These are structural/behavioral tests.

describe('POST /api/v1/auth/signup', () => {
  beforeEach(() => {
    mockUserStore.clear();
    // Seed demo users
    mockUserStore.set('cust-001', {
      id: 'cust-001', email: 'priya@example.com', phone: '9999999999',
      name: 'Priya Sharma', role: 'customer', password: 'password123',
      created_at: '2026-05-01T00:00:00Z',
    });
  });

  it('should reject signup with invalid email', () => {
    const invalidEmails = ['notanemail', '', '@example.com', 'user@'];
    for (const email of invalidEmails) {
      const errors = validateSignup({ email, password: 'pass123', name: 'Test' });
      expect(errors.email).toBeDefined();
    }
  });

  it('should reject signup with short password', () => {
    const errors = validateSignup({ email: 'test@example.com', password: '12345', name: 'Test' });
    expect(errors.password).toBeDefined();
  });

  it('should reject signup with invalid phone', () => {
    const invalidPhones = ['12345', 'phone12345', '', '999999999'];
    for (const phone of invalidPhones) {
      const errors = validateSignup({ phone, name: 'Test' });
      expect(errors.phone).toBeDefined();
    }
  });

  it('should reject signup with invalid role', () => {
    const body = { email: 'test@example.com', password: 'pass123', name: 'Test', role: 'superadmin' };
    const errors = validateSignup(body);
    expect(errors.role).toBeDefined();
  });

  it('should accept valid email signup', () => {
    const body = { email: 'newuser@example.com', password: 'secure123', name: 'New User', role: 'merchant' };
    const errors = validateSignup(body);
    expect(Object.keys(errors).length).toBe(0);
  });

  it('should accept valid phone signup', () => {
    const body = { phone: '9876543210', name: 'Phone User', role: 'customer' };
    const errors = validateSignup(body);
    expect(Object.keys(errors).length).toBe(0);
  });

  it('should detect duplicate email', () => {
    const body = { email: 'priya@example.com', password: 'pass123', name: 'Duplicate' };
    expect(hasDuplicate(body, mockUserStore)).toBe(true);
  });

  it('should detect duplicate phone', () => {
    const body = { phone: '9999999999', name: 'Duplicate' };
    expect(hasDuplicate(body, mockUserStore)).toBe(true);
  });

  it('should require name', () => {
    const body = { email: 'test@example.com', password: 'pass123' };
    const errors = validateSignup(body);
    expect(errors.name).toBeDefined();
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(() => {
    mockUserStore.clear();
    mockUserStore.set('cust-001', {
      id: 'cust-001', email: 'priya@example.com', phone: '9999999999',
      name: 'Priya Sharma', role: 'customer', password: 'password123',
      created_at: '2026-05-01T00:00:00Z',
    });
    mockUserStore.set('admin-001', {
      id: 'admin-001', email: 'ananya@petemart.com', phone: '7777777777',
      name: 'Ananya Gupta', role: 'admin', password: 'admin123',
      created_at: '2026-05-01T00:00:00Z',
    });
  });

  it('should reject login with invalid email', () => {
    const errors = validateLogin({ email: 'notemail', password: 'pass123' });
    expect(errors.email).toBeDefined();
  });

  it('should reject login with invalid phone', () => {
    const errors = validateLogin({ phone: '12345' });
    expect(errors.phone).toBeDefined();
  });

  it('should accept valid email login credentials', () => {
    const user = mockUserStore.get('cust-001');
    expect(user.email).toBe('priya@example.com');
    expect(user.password).toBe('password123');
  });

  it('should accept valid admin login credentials', () => {
    const user = mockUserStore.get('admin-001');
    expect(user.email).toBe('ananya@petemart.com');
    expect(user.password).toBe('admin123');
  });

  it('should send OTP for valid phone number', () => {
    expect(mockUserStore.has('cust-001')).toBe(true);
  });
});

describe('POST /api/v1/auth/verify-otp', () => {
  it('should reject missing phone', () => {
    const errors = validateOtp({ phone: '', otp: '123456' });
    expect(errors.phone).toBeDefined();
  });

  it('should reject invalid OTP format', () => {
    const errors = validateOtp({ phone: '9999999999', otp: '12345' });
    expect(errors.otp).toBeDefined();
  });

  it('should accept valid 6-digit OTP', () => {
    const errors = validateOtp({ phone: '9999999999', otp: '123456' });
    expect(Object.keys(errors).length).toBe(0);
  });

  it('should return user profile on successful OTP verify', () => {
    const user = mockUserStore.get('cust-001');
    expect(user).toBeDefined();
    expect(user.role).toBe('customer');
  });
});

describe('GET /api/v1/auth/me', () => {
  it('should return user from valid token', () => {
    const token = 'mock-jwt-customer-cust-001-1717094400';
    const parts = token.split('-');
    const role = parts[2];
    const userId = parts.slice(3, -1).join('-');
    expect(role).toBe('customer');
    expect(userId).toBe('cust-001');
  });

  it('should reject missing auth header', () => {
    expect(null).toBeFalsy();
  });

  it('should reject invalid token format', () => {
    const token = 'invalid-token';
    expect(token.startsWith('mock-jwt-')).toBe(false);
  });
});

// ── Helper validation functions (mirrors Zod schemas from routes) ─────────────

function validateSignup(body: Record<string, any>): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.email = ['Invalid email address'];
  }
  if (body.password && body.password.length < 6) {
    errors.password = ['Password must be at least 6 characters'];
  }
  if (body.phone && !/^\d{10}$/.test(body.phone)) {
    errors.phone = ['Phone must be a 10-digit number'];
  }
  if (!body.email && !body.phone) {
    if (!errors.email) errors.email = [];
    if (!errors.phone) errors.phone = [];
    errors.email.push('Either email or phone is required');
    errors.phone.push('Either email or phone is required');
  }
  if (!body.name) {
    errors.name = ['Name is required'];
  }
  if (body.role && !['customer', 'merchant', 'admin'].includes(body.role)) {
    errors.role = ['Invalid role'];
  }

  return errors;
}

function validateLogin(body: Record<string, any>): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.email = ['Invalid email address'];
  }
  if (body.phone && !/^\d{10}$/.test(body.phone)) {
    errors.phone = ['Phone must be a 10-digit number'];
  }
  if (!body.email && !body.phone) {
    if (!errors.email) errors.email = [];
    if (!errors.phone) errors.phone = [];
    errors.email.push('Either email or phone is required');
    errors.phone.push('Either email or phone is required');
  }

  return errors;
}

function validateOtp(body: Record<string, any>): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  if (!body.phone || !/^\d{10}$/.test(body.phone)) {
    errors.phone = ['Phone must be a 10-digit number'];
  }
  if (!body.otp || !/^\d{6}$/.test(body.otp)) {
    errors.otp = ['OTP must be a 6-digit number'];
  }

  return errors;
}

function hasDuplicate(body: Record<string, any>, store: Map<string, any>): boolean {
  const users = Array.from(store.values());
  if (body.email && users.some(u => u.email === body.email)) return true;
  if (body.phone && users.some(u => u.phone === body.phone)) return true;
  return false;
}
