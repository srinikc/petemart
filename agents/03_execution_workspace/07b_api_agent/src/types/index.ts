// =============================================================================
// PeteMart — Shared TypeScript Types
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
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

// ── Payment Status ───────────────────────────────────────────────────────────
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'card' | 'upi' | 'cod' | 'wallet';

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
export interface JwtPayload {
  sub: string;
  aud: string;
  role: string;
  email: string;
  phone?: string;
  app_metadata: {
    provider?: string;
    role?: UserRole;
  };
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    role?: UserRole;
  };
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  phone?: string;
  role: UserRole;
  fullName?: string;
  avatarUrl?: string;
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

// ── Merchant ─────────────────────────────────────────────────────────────────
export interface Merchant {
  id: string;
  owner_id: string;
  business_name: string;
  business_type?: string;
  description?: string;
  logo_url?: string;
  cover_image_url?: string;
  status: MerchantStatus;
  digital_readiness?: string;
  address_line1?: string;
  address_line2?: string;
  city: string;
  locality?: string;
  state: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  delivery_radius_km: number;
  commission_rate: number;
  opening_time: string;
  closing_time: string;
  is_open: boolean;
  created_at: string;
  updated_at: string;
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
  category_id?: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  unit: string;
  stock_quantity: number;
  is_available: boolean;
  images: string[];
  tags: string[];
  attributes: Record<string, unknown>;
  is_featured: boolean;
  preparation_time_minutes?: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  merchant?: Pick<Merchant, 'id' | 'business_name' | 'slug' | 'locality' | 'city'>;
  category?: Pick<Category, 'id' | 'name' | 'slug'>;
}

// ── Cart ─────────────────────────────────────────────────────────────────────
export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  merchant_id: string;
  quantity: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  product?: Product;
  merchant?: Pick<Merchant, 'id' | 'business_name' | 'slug'>;
}

// ── Order ────────────────────────────────────────────────────────────────────
export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  merchant_id?: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  platform_fee: number;
  discount: number;
  total: number;
  delivery_address?: Record<string, unknown>;
  delivery_notes?: string;
  contact_phone?: string;
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  is_multi_merchant: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  items?: OrderItem[];
  merchant?: Pick<Merchant, 'id' | 'business_name'>;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  merchant_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  created_at: string;
  product?: Pick<Product, 'id' | 'name' | 'slug' | 'images'>;
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

// ── Request Types ────────────────────────────────────────────────────────────
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface ProductSearchParams extends PaginationParams {
  q?: string;
  category?: string;
  merchant?: string;
  market?: string;
  minPrice?: number;
  maxPrice?: number;
  mode?: 'a' | 'b' | 'c';
  isAvailable?: boolean;
}

export interface MerchantSearchParams extends PaginationParams {
  q?: string;
  market?: string;
  locality?: string;
  category?: string;
  status?: MerchantStatus;
  isOpen?: boolean;
}

// ── Order Status Transition Map ──────────────────────────────────────────────
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready_for_pickup', 'cancelled'],
  ready_for_pickup: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
  refunded: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

// ── Interaction Modes ────────────────────────────────────────────────────────
export type InteractionMode = 'A' | 'B' | 'C';

export const MODE_DESCRIPTIONS: Record<InteractionMode, string> = {
  A: 'Buy Now — Full e-commerce checkout with payment',
  B: 'Enquire on WhatsApp — Connect with merchant via WhatsApp',
  C: 'Visit Store — Get directions to the physical store',
};
