// =============================================================================
// PeteMart — Mock Data Layer (Development & Testing)
// =============================================================================
// Provides realistic mock data for all screens across Customer, Merchant,
// and Admin personas. In production, data comes from API routes which
// query Supabase. This mock layer serves as the fallback for development.
//
// This file re-exports from the generated data layer (generated-data.ts)
// which is auto-built from the 406-store merchant dataset.
// =============================================================================

export {
  MARKETS,
  MERCHANTS,
  PRODUCTS,
  ORDERS,
  CART_ITEMS,
  ADDRESSES,
  ORDER_STATUSES,
  getMerchantsByMarket,
  getProductsByMerchant,
  getMerchant,
  getProduct,
  getMerchantBySlug,
  getProductById,
  DATA_SUMMARY,
} from './generated-data';
