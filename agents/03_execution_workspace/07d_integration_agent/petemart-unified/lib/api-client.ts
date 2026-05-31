// =============================================================================
// PeteMart — API Client (Frontend → Backend Bridge)
// =============================================================================
// This is the integration layer between UI pages and API routes.
// All frontend data fetching goes through this client.
//
// Architecture:
//   UI Pages → API Client → fetch() → Next.js API Routes → Supabase
//                                    ↘ Mock Data (dev fallback)
//
// The client automatically:
//   - Attaches auth headers (Bearer token from session)
//   - Handles error responses uniformly
//   - Supports request cancellation
//   - Provides typed response helpers
// =============================================================================

import type { ApiResponse, PaginationParams } from '@/types';

// ── Configuration ────────────────────────────────────────────────────────────
const API_BASE = '/api/v1';
const DEFAULT_TIMEOUT = 15000; // 15 seconds

// ── Request Options ──────────────────────────────────────────────────────────
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
  /** If true, don't include auth headers (for public endpoints) */
  public?: boolean;
}

// ── API Error ────────────────────────────────────────────────────────────────
export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

// ── Auth Token Management ────────────────────────────────────────────────────
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem('petemart_api_token', token);
    } else {
      sessionStorage.removeItem('petemart_api_token');
    }
  }
}

export function getAuthToken(): string | null {
  if (authToken) return authToken;
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('petemart_api_token');
    if (stored) {
      authToken = stored;
      return stored;
    }
  }
  return null;
}

// ── Core Request Function ────────────────────────────────────────────────────

async function request<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    body,
    params,
    headers: extraHeaders = {},
    timeout = DEFAULT_TIMEOUT,
    signal: externalSignal,
    public: isPublic = false,
  } = options;

  // Build URL with query parameters
  const url = new URL(`${API_BASE}${endpoint}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  // Add auth token for protected endpoints
  if (!isPublic) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // Combine external signal with our timeout
  const signal = externalSignal
    ? combineAbortSignals(externalSignal, controller.signal)
    : controller.signal;

  try {
    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal,
      credentials: 'include',
    });

    clearTimeout(timeoutId);

    // Parse response
    let data: ApiResponse<T>;
    try {
      data = await response.json();
    } catch {
      data = {
        success: false,
        error: { code: 'PARSE_ERROR', message: 'Failed to parse response' },
      };
    }

    if (!response.ok) {
      throw new ApiRequestError(
        response.status,
        data.error?.code || 'UNKNOWN_ERROR',
        data.error?.message || `Request failed with status ${response.status}`,
        data.error?.details
      );
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiRequestError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiRequestError(408, 'TIMEOUT', 'Request timed out');
    }
    throw new ApiRequestError(
      0,
      'NETWORK_ERROR',
      error instanceof Error ? error.message : 'Network request failed'
    );
  }
}

// ── Helper: Combine multiple AbortSignals ────────────────────────────────────
function combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
    signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
}

// ── Public API Methods ───────────────────────────────────────────────────────

export const api = {
  get<T = unknown>(endpoint: string, options?: RequestOptions) {
    return request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return request<T>(endpoint, { ...options, method: 'POST', body });
  },

  put<T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return request<T>(endpoint, { ...options, method: 'PUT', body });
  },

  patch<T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return request<T>(endpoint, { ...options, method: 'PATCH', body });
  },

  delete<T = unknown>(endpoint: string, options?: RequestOptions) {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
  },
};

// ── Typed API Service Methods ────────────────────────────────────────────────
// These mirror the API routes in app/api/v1/

import type {
  UserProfile, Market, Merchant, Product, CartItem,
  Order, Address, MerchantDashboard, AdminDashboard, AdminAnalytics,
  AuthResponse, CheckoutPayload, DataSummary,
} from '@/types';

export const apiService = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: {
    signup(data: { email?: string; phone?: string; password?: string; fullName: string; role?: string }) {
      return api.post<AuthResponse>('/auth/signup', data, { public: true });
    },
    login(data: { email?: string; phone?: string; password?: string }) {
      return api.post<AuthResponse>('/auth/login', data, { public: true });
    },
    sendOtp(phone: string) {
      return api.post<{ message: string; user_exists?: boolean; expires_in?: number }>('/auth/login', { phone }, { public: true });
    },
    verifyOtp(phone: string, token: string) {
      return api.post<AuthResponse>('/auth/verify-otp', { phone, otp: token }, { public: true });
    },
    me() {
      return api.get<UserProfile>('/auth/me');
    },
    logout() {
      return api.post<void>('/auth/logout');
    },
  },

  // ── Markets ───────────────────────────────────────────────────────────────
  markets: {
    list() {
      return api.get<Market[]>('/markets', { public: true });
    },
  },

  // ── Merchants (public) ────────────────────────────────────────────────────
  merchants: {
    list(params?: { market?: string; locality?: string; category?: string } & PaginationParams) {
      return api.get<Merchant[]>('/merchants', { params, public: true });
    },
    getBySlug(slug: string) {
      return api.get<Merchant>(`/merchants/${slug}`, { public: true });
    },
  },

  // ── Products ──────────────────────────────────────────────────────────────
  products: {
    list(params?: {
      q?: string; category?: string; merchant?: string; market?: string;
      minPrice?: number; maxPrice?: number; isAvailable?: boolean;
    } & PaginationParams) {
      return api.get<Product[]>('/products', { params, public: true });
    },
    get(id: string) {
      return api.get<Product>(`/products/${id}`, { public: true });
    },
  },

  // ── Cart & Checkout ──────────────────────────────────────────────────────
  cart: {
    list() {
      return api.get<{ items: any[]; subtotal: number; itemCount: number }>('/cart');
    },
    addItem(data: { product_id: string; quantity?: number; mode?: string }) {
      return api.post<{ items: any[]; itemCount: number }>('/cart', data);
    },
    clear() {
      return api.delete<void>('/cart');
    },
    checkout(data: CheckoutPayload) {
      return api.post<{ order: any; message: string }>('/cart/checkout', data);
    },
  },

  // ── Orders (Customer) ─────────────────────────────────────────────────────
  orders: {
    list(params?: { status?: string } & PaginationParams) {
      return api.get<Order[]>('/orders', { params });
    },
    get(id: string) {
      return api.get<Order>(`/orders/${id}`);
    },
  },

  // ── Merchant Endpoints ────────────────────────────────────────────────────
  merchant: {
    dashboard() {
      return api.get<MerchantDashboard>('/merchant/dashboard');
    },
    products: {
      list(params?: PaginationParams) {
        return api.get<Product[]>('/merchant/products', { params });
      },
      create(data: any) {
        return api.post<Product>('/merchant/products', data);
      },
      update(id: string, data: any) {
        return api.put<Product>(`/merchant/products/${id}`, data);
      },
      delete(id: string) {
        return api.delete<void>(`/merchant/products/${id}`);
      },
    },
    orders: {
      list(params?: { status?: string } & PaginationParams) {
        return api.get<Order[]>('/merchant/orders', { params });
      },
      updateStatus(id: string, status: string, reason?: string) {
        return api.put<Order>(`/merchant/orders/${id}/status`, { status, reason });
      },
    },
  },

  // ── Admin Endpoints ───────────────────────────────────────────────────────
  admin: {
    dashboard() {
      return api.get<AdminDashboard>('/admin/dashboard');
    },
    analytics(params?: { days?: number }) {
      return api.get<any>('/admin/analytics', { params });
    },
    merchants: {
      list(params?: { status?: string; q?: string } & PaginationParams) {
        return api.get<Merchant[]>('/admin/merchants', { params });
      },
      updateStatus(merchantId: string, data: { status: string }) {
        return api.patch<any>('/admin/merchants', { merchant_id: merchantId, ...data });
      },
      approve(id: string, data: { status: string; commissionRate?: number; notes?: string }) {
        return api.put<any>(`/admin/merchants/${id}/approve`, data);
      },
    },
  },

  // ── Utility ───────────────────────────────────────────────────────────────
  getDataSummary() {
    return api.get<DataSummary>('/health');
  },
};

// ── Error Helper ─────────────────────────────────────────────────────────────
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
