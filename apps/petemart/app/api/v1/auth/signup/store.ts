// =============================================================================
// In-Memory User Store (POC Mock Database)
// =============================================================================
// Shared across auth routes. In production, this would be Supabase Auth + DB.
// =============================================================================

export interface StoredUser {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  role: string;
  password: string | null;
  created_at: string;
}

// Global singleton user store
const globalForUsers = globalThis as typeof globalThis & {
  __petemart_users?: Map<string, StoredUser>;
};

// Initialize with demo users
function createInitialStore(): Map<string, StoredUser> {
  const store = new Map<string, StoredUser>();

  const demoUsers: StoredUser[] = [
    {
      id: 'cust-001', email: 'priya@example.com', phone: '9999999999',
      name: 'Priya Sharma', role: 'customer', password: 'password123',
      created_at: '2026-05-01T00:00:00Z',
    },
    {
      id: 'merch-001', email: 'ramesh@example.com', phone: '8888888888',
      name: 'Ramesh Kumar', role: 'merchant', password: 'password123',
      created_at: '2026-05-01T00:00:00Z',
    },
    {
      id: 'admin-001', email: 'ananya@petemart.com', phone: '7777777777',
      name: 'Ananya Gupta', role: 'admin', password: 'admin123',
      created_at: '2026-05-01T00:00:00Z',
    },
  ];

  for (const u of demoUsers) {
    store.set(u.id, u);
  }

  return store;
}

export function getUserStore(): Map<string, StoredUser> {
  if (!globalForUsers.__petemart_users) {
    globalForUsers.__petemart_users = createInitialStore();
  }
  return globalForUsers.__petemart_users;
}

// ── OTP Store ─────────────────────────────────────────────────────────────────
const globalForOTP = globalThis as typeof globalThis & {
  __petemart_otps?: Map<string, { otp: string; expiresAt: number }>;
};

export function getOtpStore(): Map<string, { otp: string; expiresAt: number }> {
  if (!globalForOTP.__petemart_otps) {
    globalForOTP.__petemart_otps = new Map();
  }
  return globalForOTP.__petemart_otps;
}
