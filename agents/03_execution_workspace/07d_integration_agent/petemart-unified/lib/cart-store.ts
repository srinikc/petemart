// =============================================================================
// PeteMart — Shared Cart Store (POC in-memory)
// =============================================================================
// Single source of truth for cart data shared across route handlers.
// In production, replace with database-backed cart storage.
// =============================================================================

export interface CartEntry {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  merchant_id: string;
  merchant_name: string;
  mode: 'A' | 'B' | 'C';
}

export const carts = new Map<string, CartEntry[]>();

export function getUserIdFromAuth(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer mock-jwt-')) return null;
  // Extract everything after 'Bearer '
  return authHeader.slice(7);
}
