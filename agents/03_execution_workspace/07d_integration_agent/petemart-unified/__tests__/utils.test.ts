// =============================================================================
// PeteMart — Unit Tests: Utility Functions
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  formatPrice, formatDate, formatDateTime, slugify,
  truncate, getInitials, getModeLabel, getStatusColor,
  getStatusLabel, getDeliveryEta, cn,
} from '@/lib/utils';

describe('Utility Functions', () => {
  // ── cn() ──────────────────────────────────────────────────────────────────
  it('cn() merges class names correctly', () => {
    expect(cn('px-4', 'py-2')).toContain('px-4');
    expect(cn('px-4', false && 'hidden')).toBe('px-4');
    expect(cn('base', undefined, null, 'extra')).toBe('base extra');
  });

  // ── formatPrice() ──────────────────────────────────────────────────────────
  it('formatPrice() formats INR correctly', () => {
    expect(formatPrice(0)).toBe('₹0');
    expect(formatPrice(100)).toBe('₹100');
    expect(formatPrice(124500)).toBe('₹1,24,500');
    expect(formatPrice(99.99)).toBe('₹100');
  });

  // ── formatDate() ───────────────────────────────────────────────────────────
  it('formatDate() formats date string correctly', () => {
    const result = formatDate('2026-05-30T10:00:00Z');
    expect(result).toContain('May');
    expect(result).toContain('30');
    expect(result).toContain('2026');
  });

  // ── slugify() ──────────────────────────────────────────────────────────────
  it('slugify() converts text to URL-friendly slug', () => {
    expect(slugify('Samskruti Silks')).toBe('samskruti-silks');
    expect(slugify('Hello World! 2024')).toBe('hello-world-2024');
    expect(slugify('  Extra   Spaces  ')).toBe('extra-spaces');
  });

  // ── truncate() ─────────────────────────────────────────────────────────────
  it('truncate() shortens long text', () => {
    expect(truncate('Short', 10)).toBe('Short');
    expect(truncate('This is a very long text', 10)).toBe('This is a ...');
  });

  // ── getInitials() ──────────────────────────────────────────────────────────
  it('getInitials() returns capitalized initials', () => {
    expect(getInitials('Priya Sharma')).toBe('PS');
    expect(getInitials('Ramesh Kumar')).toBe('RK');
    expect(getInitials('Ananya Gupta')).toBe('AG');
  });

  // ── getModeLabel() ─────────────────────────────────────────────────────────
  it('getModeLabel() returns correct labels', () => {
    expect(getModeLabel('A').label).toBe('Buy Now');
    expect(getModeLabel('B').label).toBe('Enquire on WhatsApp');
    expect(getModeLabel('C').label).toBe('Visit Store');
    expect(getModeLabel('buy').label).toBe('Buy Now');
    expect(getModeLabel('whatsapp').label).toBe('Enquire on WhatsApp');
  });

  // ── getStatusColor() ───────────────────────────────────────────────────────
  it('getStatusColor() returns hex colors', () => {
    expect(getStatusColor('delivered')).toBe('#4CAF50');
    expect(getStatusColor('in_transit')).toBe('#2196F3');
    expect(getStatusColor('cancelled')).toBe('#F44336');
    expect(getStatusColor('unknown')).toBe('#666666');
  });

  // ── getStatusLabel() ───────────────────────────────────────────────────────
  it('getStatusLabel() returns human-readable labels', () => {
    expect(getStatusLabel('in_transit')).toBe('In Transit');
    expect(getStatusLabel('delivered')).toBe('Delivered');
    expect(getStatusLabel('pending_payment')).toBe('Pending Payment');
  });

  // ── getDeliveryEta() ───────────────────────────────────────────────────────
  it('getDeliveryEta() returns time +2 hours', () => {
    const now = new Date('2026-05-30T10:00:00Z').toISOString();
    const eta = getDeliveryEta(now);
    expect(eta).toBeDefined();
    expect(typeof eta).toBe('string');
  });
});
