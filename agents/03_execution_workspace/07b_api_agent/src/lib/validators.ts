// =============================================================================
// PeteMart — Zod Validation Schemas
// =============================================================================
// All POST/PUT/PATCH request bodies must be validated against these schemas.
// =============================================================================

import { z } from 'zod';

// ── Auth Schemas ─────────────────────────────────────────────────────────────

export const signupSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{9,14}$/, 'Phone must be in international format (e.g., +919876543210)')
    .optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(1, 'Full name is required').max(100),
  role: z.enum(['customer', 'merchant']).default('customer'),
}).refine(
  (data) => data.email || data.phone,
  { message: 'Either email or phone is required', path: ['email'] }
);

export const verifyOtpSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'),
  token: z.string().length(6, 'OTP must be 6 digits'),
  type: z.enum(['signup', 'login']).default('login'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{9,14}$/, 'Phone must be in international format')
    .optional(),
  password: z.string().min(1, 'Password is required'),
}).refine(
  (data) => data.email || data.phone,
  { message: 'Either email or phone is required', path: ['email'] }
);

export const sendOtpSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'),
});

// ── Product Schemas ──────────────────────────────────────────────────────────

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().max(2000).optional(),
  price: z.number().positive('Price must be positive'),
  compareAtPrice: z.number().positive().optional(),
  unit: z.string().default('piece'),
  stockQuantity: z.number().int().min(0).default(0),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  images: z.array(z.string().url()).max(10).default([]),
  tags: z.array(z.string()).max(20).default([]),
  attributes: z.record(z.unknown()).default({}),
  isFeatured: z.boolean().default(false),
  preparationTimeMinutes: z.number().int().positive().optional(),
});

export const updateProductSchema = createProductSchema.partial();

// ── Merchant Schemas ─────────────────────────────────────────────────────────

export const createMerchantSchema = z.object({
  businessName: z.string().min(1, 'Business name is required').max(200),
  businessType: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  addressLine1: z.string().max(200).optional(),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(1, 'City is required').max(100),
  locality: z.string().max(100).optional(),
  state: z.string().default('Karnataka'),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode').optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  deliveryRadiusKm: z.number().int().min(0).max(50).default(5),
  openingTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)').optional(),
  closingTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)').optional(),
});

export const updateMerchantSchema = createMerchantSchema.partial();

// ── Checkout Schema ──────────────────────────────────────────────────────────

export const checkoutItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  merchantId: z.string().uuid('Invalid merchant ID'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  notes: z.string().max(500).optional(),
});

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, 'At least one item is required').max(50, 'Maximum 50 items per order'),
  deliveryAddress: z.object({
    line1: z.string().min(1, 'Address line 1 is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
  deliveryNotes: z.string().max(500).optional(),
  contactPhone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'),
  paymentMethod: z.enum(['card', 'upi', 'cod', 'wallet']).default('upi'),
});

// ── Order Status Update Schema ───────────────────────────────────────────────

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'confirmed',
    'preparing',
    'ready_for_pickup',
    'out_for_delivery',
    'delivered',
    'cancelled',
  ]),
  reason: z.string().max(500).optional(), // Required for cancellations
});

// ── Admin Schemas ────────────────────────────────────────────────────────────

export const approveMerchantSchema = z.object({
  status: z.enum(['active', 'suspended']),
  commissionRate: z.number().min(0).max(100).optional(),
  notes: z.string().max(500).optional(),
});

// ── Search / Query Parameter Schemas ─────────────────────────────────────────

export const productQuerySchema = z.object({
  q: z.string().max(200).optional(),
  category: z.string().optional(),
  merchant: z.string().optional(),
  market: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  mode: z.enum(['a', 'b', 'c']).optional(),
  isAvailable: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const merchantQuerySchema = z.object({
  q: z.string().max(200).optional(),
  market: z.string().optional(),
  locality: z.string().optional(),
  category: z.string().optional(),
  isOpen: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// ── Review Schema ────────────────────────────────────────────────────────────

export const createReviewSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  orderId: z.string().uuid('Invalid order ID'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  title: z.string().max(200).optional(),
  body: z.string().max(2000).optional(),
  images: z.array(z.string().url()).max(5).default([]),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(200).optional(),
  body: z.string().max(2000).optional(),
  images: z.array(z.string().url()).max(5).optional(),
});

// ── Type Exports ─────────────────────────────────────────────────────────────
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateMerchantInput = z.infer<typeof createMerchantSchema>;
export type UpdateMerchantInput = z.infer<typeof updateMerchantSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type ApproveMerchantInput = z.infer<typeof approveMerchantSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
