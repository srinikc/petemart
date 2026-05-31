import { describe, it, expect } from 'vitest';
import {
  cn,
  formatPrice,
  formatDate,
  slugify,
  truncate,
  getInitials,
  getModeLabel,
  getStatusColor,
  getStatusLabel,
} from '@/lib/utils';

describe('Utility Functions', () => {
  describe('cn()', () => {
    it('merges class names correctly', () => {
      expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
      expect(cn('px-4', false && 'hidden')).toBe('px-4');
      expect(cn('text-red', 'text-blue')).toBe('text-blue');
    });
  });

  describe('formatPrice()', () => {
    it('formats Indian currency correctly', () => {
      expect(formatPrice(100)).toBe('₹100');
      expect(formatPrice(1500)).toBe('₹1,500');
      expect(formatPrice(32500)).toBe('₹32,500');
      expect(formatPrice(0)).toBe('₹0');
    });
  });

  describe('formatDate()', () => {
    it('formats date strings correctly', () => {
      const result = formatDate('2026-05-30T10:30:00Z');
      expect(result).toContain('May');
      expect(result).toContain('2026');
    });
  });

  describe('slugify()', () => {
    it('converts text to URL-friendly slugs', () => {
      expect(slugify('Samskruti Silks')).toBe('samskruti-silks');
      expect(slugify('  Hello   World  ')).toBe('hello-world');
      expect(slugify('Chickpet - The Textile Hub')).toBe('chickpet-the-textile-hub');
    });
  });

  describe('truncate()', () => {
    it('truncates text to specified length', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...');
      expect(truncate('Short', 10)).toBe('Short');
    });
  });

  describe('getInitials()', () => {
    it('extracts initials from name', () => {
      expect(getInitials('Priya Sharma')).toBe('PS');
      expect(getInitials('Ramesh Kumar')).toBe('RK');
      expect(getInitials('Ananya')).toBe('AN');
    });
  });

  describe('getModeLabel()', () => {
    it('returns correct mode labels and colors', () => {
      expect(getModeLabel('A')).toEqual({ label: 'Buy Now', color: '#2E7D32' });
      expect(getModeLabel('B')).toEqual({ label: 'Enquire on WhatsApp', color: '#25D366' });
      expect(getModeLabel('C')).toEqual({ label: 'Visit Store', color: '#1976D2' });
      expect(getModeLabel('buy')).toEqual({ label: 'Buy Now', color: '#2E7D32' });
    });
  });

  describe('getStatusColor()', () => {
    it('returns correct status colors', () => {
      expect(getStatusColor('delivered')).toBe('#4CAF50');
      expect(getStatusColor('cancelled')).toBe('#F44336');
      expect(getStatusColor('unknown')).toBe('#666666');
    });
  });

  describe('getStatusLabel()', () => {
    it('returns correct status labels', () => {
      expect(getStatusLabel('in_transit')).toBe('In Transit');
      expect(getStatusLabel('delivered')).toBe('Delivered');
      expect(getStatusLabel('unknown')).toBe('unknown');
    });
  });
});
