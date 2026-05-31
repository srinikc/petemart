// =============================================================================
// PeteMart — Unit Tests: Mock Data Integrity
// =============================================================================
import { describe, it, expect } from 'vitest';
import { MARKETS, MERCHANTS, PRODUCTS, ORDERS, CART_ITEMS, ADDRESSES } from '@/lib/data';

describe('Mock Data Integrity', () => {
  // ── Markets ────────────────────────────────────────────────────────────────
  it('MARKETS: has 5 markets with required fields', () => {
    expect(MARKETS.length).toBeGreaterThanOrEqual(5);
    MARKETS.forEach(m => {
      expect(m.id).toBeDefined();
      expect(m.name).toBeDefined();
      expect(m.slug).toBeDefined();
      expect(m.description).toBeDefined();
      expect(m.specialization).toBeDefined();
      expect(m.merchant_count).toBeGreaterThan(0);
    });
  });

  it('MARKETS: slugs are unique', () => {
    const slugs = MARKETS.map(m => m.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  // ── Merchants ──────────────────────────────────────────────────────────────
  it('MERCHANTS: has at least 8 merchants with required fields', () => {
    expect(MERCHANTS.length).toBeGreaterThanOrEqual(8);
    MERCHANTS.forEach(m => {
      expect(m.id).toBeDefined();
      expect(m.store_name).toBeDefined();
      expect(m.slug).toBeDefined();
      expect(m.market_id).toBeDefined();
      expect(m.category).toBeDefined();
      expect(m.modes_enabled).toBeInstanceOf(Array);
      expect(m.status).toBeDefined();
    });
  });

  it('MERCHANTS: all market_ids reference valid markets', () => {
    const marketIds = MARKETS.map(m => m.id);
    MERCHANTS.forEach(m => {
      expect(marketIds).toContain(m.market_id);
    });
  });

  it('MERCHANTS: merchant names include first and last store', () => {
    const names = MERCHANTS.map(m => m.store_name);
    expect(names[0]).toBeDefined();
    expect(names[names.length - 1]).toBeDefined();
  });

  // ── Products ───────────────────────────────────────────────────────────────
  it('PRODUCTS: has products with valid data', () => {
    expect(PRODUCTS.length).toBeGreaterThan(0);
    PRODUCTS.forEach(p => {
      expect(p.id).toBeDefined();
      expect(p.name).toBeDefined();
      expect(p.price).toBeGreaterThan(0);
      expect(p.merchant_id).toBeDefined();
      expect(p.images).toBeInstanceOf(Array);
      expect(p.category).toBeDefined();
      expect(p.mode_badges).toBeInstanceOf(Array);
    });
  });

  it('PRODUCTS: merchant_ids reference valid merchants', () => {
    const merchantIds = MERCHANTS.map(m => m.id);
    PRODUCTS.forEach(p => {
      expect(merchantIds).toContain(p.merchant_id);
    });
  });

  it('PRODUCTS: prices are positive numbers', () => {
    PRODUCTS.forEach(p => {
      expect(p.price).toBeGreaterThan(0);
    });
  });

  // ── Orders ─────────────────────────────────────────────────────────────────
  it('ORDERS: has valid order objects', () => {
    expect(ORDERS.length).toBeGreaterThan(0);
    ORDERS.forEach(o => {
      expect(o.id).toBeDefined();
      expect(o.order_id).toBeDefined();
      expect(o.status).toBeDefined();
      expect(o.total).toBeGreaterThan(0);
      expect(o.items).toBeInstanceOf(Array);
      expect(o.delivery_address).toBeDefined();
    });
  });

  // ── Cart Items ─────────────────────────────────────────────────────────────
  it('CART_ITEMS: has valid cart item objects', () => {
    expect(CART_ITEMS.length).toBeGreaterThan(0);
    CART_ITEMS.forEach(ci => {
      expect(ci.product_id).toBeDefined();
      expect(ci.merchant_id).toBeDefined();
      expect(ci.price).toBeGreaterThan(0);
      expect(ci.quantity).toBeGreaterThan(0);
    });
  });

  // ── Addresses ──────────────────────────────────────────────────────────────
  it('ADDRESSES: has valid address objects', () => {
    expect(ADDRESSES.length).toBeGreaterThan(0);
    ADDRESSES.forEach(a => {
      expect(a.id).toBeDefined();
      expect(a.name).toBeDefined();
      expect(a.line1).toBeDefined();
      expect(a.city).toBeDefined();
      expect(a.pincode).toBeDefined();
    });
  });
});
