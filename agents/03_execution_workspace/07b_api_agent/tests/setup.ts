// =============================================================================
// PeteMart — Jest Test Setup
// =============================================================================
// Global test configuration and mock setup for API tests.
// =============================================================================

import { TextEncoder, TextDecoder } from 'util';

// Polyfill for Next.js edge runtime
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';

// Supabase client mock
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signInWithOtp: jest.fn(),
      verifyOtp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          in: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(),
              order: jest.fn(() => ({
                range: jest.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
          })),
          order: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
        not: jest.fn(() => ({
          is: jest.fn(() => ({
            // chain continues
          })),
        })),
        in: jest.fn(() => ({
          gte: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
        or: jest.fn(() => ({
          eq: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
        lte: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        textSearch: jest.fn(() => ({
          or: jest.fn(() => ({
            eq: jest.fn(() => ({
              range: jest.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
        order: jest.fn(() => ({
          range: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        range: jest.fn(() => Promise.resolve({ data: [], error: null })),
        limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
        single: jest.fn(),
        maybeSingle: jest.fn(),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          })),
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null })),
          in: jest.fn(() => Promise.resolve({ error: null })),
        })),
      })),
      rpc: jest.fn(),
      storage: {
        from: jest.fn(() => ({
          upload: jest.fn(),
          getPublicUrl: jest.fn(),
        })),
      },
    })),
  })),
}));

// Mock @supabase/ssr
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  })),
}));
