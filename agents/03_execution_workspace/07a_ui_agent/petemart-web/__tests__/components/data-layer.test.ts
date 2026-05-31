import { describe, it, expect } from 'vitest';
import {
  MARKETS,
  MERCHANTS,
  PRODUCTS,
  ORDERS,
  getMerchantsByMarket,
  getProductsByMerchant,
  getMerchant,
  getProduct,
  getMerchantBySlug,
  getProductById,
} from '@/lib/data';

describe('Data Layer', () => {
  describe('MARKETS', () => {
    it('contains all Pete markets', () => {
      expect(MARKETS.length).toBeGreaterThanOrEqual(3);
      expect(MARKETS.map(m => m.name)).toContain('Chickpet');
      expect(MARKETS.map(m => m.name)).toContain('Balepet');
    });

    it('each market has required fields', () => {
      MARKETS.forEach(market => {
        expect(market.id).toBeTruthy();
        expect(market.name).toBeTruthy();
        expect(market.slug).toBeTruthy();
        expect(market.merchant_count).toBeGreaterThan(0);
      });
    });
  });

  describe('MERCHANTS', () => {
    it('has pilot merchants loaded', () => {
      expect(MERCHANTS.length).toBeGreaterThanOrEqual(8);
      const names = MERCHANTS.map(m => m.store_name);
      expect(names).toContain('Samskruti Silks');
      expect(names).toContain('The Pastry Cafe');
    });

    it('each merchant has valid modes_enabled', () => {
      MERCHANTS.forEach(merchant => {
        expect(merchant.modes_enabled.length).toBeGreaterThan(0);
        merchant.modes_enabled.forEach(mode => {
          expect(['A', 'B', 'C']).toContain(mode);
        });
      });
    });
  });

  describe('PRODUCTS', () => {
    it('has products for pilot merchants', () => {
      expect(PRODUCTS.length).toBeGreaterThanOrEqual(10);
    });

    it('each product has required fields', () => {
      PRODUCTS.forEach(product => {
        expect(product.id).toBeTruthy();
        expect(product.name).toBeTruthy();
        expect(product.price).toBeGreaterThan(0);
        expect(product.mode_badges.length).toBeGreaterThan(0);
      });
    });
  });

  describe('ORDERS', () => {
    it('has sample orders', () => {
      expect(ORDERS.length).toBeGreaterThan(0);
    });

    it('each order has valid status', () => {
      const validStatuses = ['pending', 'confirmed', 'packing', 'picked_up', 'consolidated', 'in_transit', 'delivered', 'completed', 'cancelled'];
      ORDERS.forEach(order => {
        expect(validStatuses).toContain(order.status);
      });
    });
  });

  describe('getMerchantsByMarket()', () => {
    it('returns merchants for valid market slug', () => {
      const merchants = getMerchantsByMarket('chickpet');
      expect(merchants.length).toBeGreaterThan(0);
    });

    it('returns empty array for invalid market slug', () => {
      const merchants = getMerchantsByMarket('invalid-market');
      expect(merchants).toEqual([]);
    });
  });

  describe('getProductsByMerchant()', () => {
    it('returns products for valid merchant ID', () => {
      const products = getProductsByMerchant('merchant-1');
      expect(products.length).toBeGreaterThan(0);
    });
  });

  describe('getMerchantBySlug()', () => {
    it('finds merchant by slug', () => {
      const merchant = getMerchantBySlug('samskruti-silks');
      expect(merchant).toBeTruthy();
      expect(merchant?.store_name).toBe('Samskruti Silks');
    });

    it('returns undefined for unknown slug', () => {
      expect(getMerchantBySlug('unknown-store')).toBeUndefined();
    });
  });

  describe('getProductById()', () => {
    it('finds product by ID', () => {
      const product = getProductById('prod-001');
      expect(product).toBeTruthy();
      expect(product?.name).toContain('Kanjivaram');
    });

    it('returns undefined for unknown ID', () => {
      expect(getProductById('invalid-id')).toBeUndefined();
    });
  });
});
