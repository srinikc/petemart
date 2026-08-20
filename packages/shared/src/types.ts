// =============================================================================
// PeteMart — Shared TypeScript Types (UI + API + DB)
// =============================================================================
// These types are shared across frontend pages, API routes, and DB operations.
// =============================================================================

// ── User Roles ───────────────────────────────────────────────────────────────
export type UserRole = 'customer' | 'merchant' | 'admin' | 'delivery_partner';

// ── Merchant Status ──────────────────────────────────────────────────────────
export type MerchantStatus = 'pending' | 'active' | 'suspended' | 'inactive';

// ── Order Status ─────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'in_transit'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded';

// ── Payment ──────────────────────────────────────────────────────────────────
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'card' | 'upi' | 'cod' | 'wallet';

// ── Interaction Modes ────────────────────────────────────────────────────────
export type InteractionMode = 'A' | 'B' | 'C';

export const MODE_DESCRIPTIONS: Record<InteractionMode, string> = {
  A: 'Buy Now — Full e-commerce checkout with payment',
  B: 'Enquire on WhatsApp — Connect with merchant via WhatsApp',
  C: 'Visit Store — Get directions to the physical store',
};

// ── API Response Envelope ────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ── Auth Types ───────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  phone: string;
  email?: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  phone?: string;
  role: UserRole;
  fullName?: string;
  avatarUrl?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// ── Profile ──────────────────────────────────────────────────────────────────
export interface Profile {
  id: string;
  email: string;
  phone?: string;
  full_name?: string;
  avatar_url?: string;
  role: UserRole;
  preferred_language: string;
  created_at: string;
  updated_at: string;
}

// ── Market ───────────────────────────────────────────────────────────────────
export interface Market {
  id: string;
  name: string;
  slug: string;
  description: string;
  specialization: string;
  historical_summary: string;
  image_url: string;
  merchant_count: number;
}

// ── Merchant ─────────────────────────────────────────────────────────────────
export interface Merchant {
  id: string;
  user_id: string;
  store_name: string;
  slug: string;
  market_id: string;
  category: string;
  description: string;
  logo_url?: string | null;
  banner_url?: string | null;
  business_hours?: Record<string, string>;
  modes_enabled: string[];
  status: MerchantStatus;
  rating: number;
  distance?: number;
  digital_readiness?: string;
  phone?: string;
  address?: string;
  years_in_business?: number;
  gst_registered?: boolean;
  delivery_radius_km?: number;
  product_catalog_count?: number;
}

// ── Category ─────────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

// ── Product ──────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  merchant_id: string;
  merchant_name?: string;
  name: string;
  description: string;
  price: number;
  mrp?: number;
  stock_count: number;
  images: string[];
  category: string;
  mode_badges: string[];
  sku: string;
  rating?: number;
  review_count?: number;
  is_active: boolean;
}

// ── Cart ─────────────────────────────────────────────────────────────────────
export interface CartItem {
  id: string;
  product_id: string;
  merchant_id: string;
  merchant_name: string;
  product_name: string;
  price: number;
  quantity: number;
  image: string;
  mode: string;
}

// ── Order ────────────────────────────────────────────────────────────────────
export interface Order {
  id: string;
  order_id: string;
  user_id: string;
  status: OrderStatus;
  total: number;
  delivery_fee: number;
  subtotal: number;
  items: OrderItem[];
  created_at: string;
  delivery_address: Address;
  merchant_name?: string;
}

export interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

// ── Address ──────────────────────────────────────────────────────────────────
export interface Address {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  pincode: string;
  landmark?: string;
  is_default: boolean;
}

// ── Review ───────────────────────────────────────────────────────────────────
export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  order_id?: string;
  rating: number;
  title?: string;
  body?: string;
  images: string[];
  is_verified: boolean;
  created_at: string;
}

// ── Dashboard Types ──────────────────────────────────────────────────────────
export interface MerchantDashboard {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  revenueToday: number;
  revenueThisMonth: number;
  averageRating: number;
  totalReviews: number;
}

export interface AdminDashboard {
  totalMerchants: number;
  activeMerchants: number;
  pendingApprovals: number;
  totalCustomers: number;
  totalOrders: number;
  revenueToday: number;
  revenueThisMonth: number;
  platformFeeCollected: number;
}

export interface AdminAnalytics {
  ordersByDay: { date: string; count: number; revenue: number }[];
  topMerchants: { merchantId: string; businessName: string; orderCount: number; revenue: number }[];
  revenueByMarket: { market: string; revenue: number }[];
  userGrowth: { date: string; signups: number }[];
}

// ── Order Status Transition Map ──────────────────────────────────────────────
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['in_transit', 'cancelled'],
  in_transit: ['delivered'],
  ready_for_pickup: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: ['completed'],
  completed: [],
  cancelled: [],
  refunded: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

// ── Pagination Params ────────────────────────────────────────────────────────
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// ── Auth Payloads ─────────────────────────────────────────────────────────────
export interface SignupPayload {
  email?: string;
  phone?: string;
  password?: string;
  name: string;
  role?: UserRole;
}

export interface LoginPayload {
  email?: string;
  phone?: string;
  password?: string;
}

export interface VerifyOtpPayload {
  phone: string;
  otp: string;
}

export interface AuthResponse {
  token?: string;
  user: UserProfile;
  session?: AuthSession;
  redirect?: string;
  message?: string;
  user_exists?: boolean;
}

// ── Checkout Types ────────────────────────────────────────────────────────────
export interface CheckoutItem {
  productId: string;
  merchantId: string;
  quantity: number;
  notes?: string;
}

export interface CheckoutPayload {
  items: CheckoutItem[];
  deliveryAddress: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    pincode: string;
    latitude?: number;
    longitude?: number;
  };
  deliveryNotes?: string;
  contactPhone: string;
  paymentMethod: PaymentMethod;
}

// ── Data Summary ──────────────────────────────────────────────────────────────
export interface DataSummary {
  totalMarkets: number;
  totalMerchants: number;
  totalProducts: number;
  totalOrders: number;
}
