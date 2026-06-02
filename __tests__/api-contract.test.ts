import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const AddressSchema = z.object({
  id: z.string(),
  label: z.string(),
  fullAddress: z.string(),
  pincode: z.string().length(6),
  city: z.string(),
  state: z.string(),
  isDefault: z.boolean(),
});

const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  price: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  images: z.array(z.string()).optional(),
  category: z.string(),
  merchant_id: z.string(),
  merchant_name: z.string(),
  stock: z.number().int().nonnegative(),
});

const OrderSchema = z.object({
  id: z.string(),
  items: z.array(z.object({
    product_id: z.string(),
    product_name: z.string(),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
  })),
  status: z.enum(['pending', 'confirmed', 'preparing', 'in_transit', 'delivered', 'cancelled']),
  total: z.number().positive(),
  created_at: z.string(),
});

describe('API Contract Validation', () => {
  it('validates Address schema', () => {
    const valid = { id: 'addr-1', label: 'Home', fullAddress: '123 Main St', pincode: '560001', city: 'Bangalore', state: 'Karnataka', isDefault: true };
    expect(() => AddressSchema.parse(valid)).not.toThrow();
  });

  it('rejects Address with invalid pincode', () => {
    const invalid = { id: 'addr-2', label: 'Work', fullAddress: '456 Oak Ave', pincode: '5600', city: 'Bangalore', state: 'Karnataka', isDefault: false };
    expect(() => AddressSchema.parse(invalid)).toThrow();
  });

  it('validates Product schema', () => {
    const valid = { id: 'prod-1', name: 'Silk Saree', price: 2499, category: 'Textiles', merchant_id: 'm-1', merchant_name: 'Test', stock: 10 };
    expect(() => ProductSchema.parse(valid)).not.toThrow();
  });

  it('rejects Product with negative price', () => {
    const invalid = { id: 'prod-2', name: 'Free Item', price: -100, category: 'Misc', merchant_id: 'm-1', merchant_name: 'Test', stock: 5 };
    expect(() => ProductSchema.parse(invalid)).toThrow();
  });

  it('validates Order schema', () => {
    const valid = {
      id: 'ord-1',
      items: [{ product_id: 'p-1', product_name: 'Item', quantity: 2, price: 500 }],
      status: 'confirmed',
      total: 1000,
      created_at: new Date().toISOString(),
    };
    expect(() => OrderSchema.parse(valid)).not.toThrow();
  });

  it('rejects Order with invalid status', () => {
    const invalid = {
      id: 'ord-2',
      items: [{ product_id: 'p-1', product_name: 'Item', quantity: 1, price: 100 }],
      status: 'unknown_status',
      total: 100,
      created_at: new Date().toISOString(),
    };
    expect(() => OrderSchema.parse(invalid)).toThrow();
  });

  it('rejects Order with zero quantity', () => {
    const invalid = {
      id: 'ord-3',
      items: [{ product_id: 'p-1', product_name: 'Item', quantity: 0, price: 100 }],
      status: 'pending',
      total: 0,
      created_at: new Date().toISOString(),
    };
    expect(() => OrderSchema.parse(invalid)).toThrow();
  });
});
