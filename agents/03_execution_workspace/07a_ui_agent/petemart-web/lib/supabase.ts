import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Types for our application
export type UserRole = 'customer' | 'merchant' | 'admin' | 'courier';

export interface UserProfile {
  id: string;
  phone: string;
  email?: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export interface Merchant {
  id: string;
  user_id: string;
  store_name: string;
  slug: string;
  market_id: string;
  category: string;
  description: string;
  logo_url?: string;
  banner_url?: string;
  business_hours?: Record<string, string>;
  modes_enabled: string[];
  status: 'pending' | 'active' | 'suspended';
  rating: number;
  distance?: number;
  digital_readiness?: string;
}

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

export interface Order {
  id: string;
  order_id: string;
  user_id: string;
  status: string;
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
