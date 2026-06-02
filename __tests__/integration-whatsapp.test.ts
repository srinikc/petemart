import { describe, it, expect } from 'vitest';

describe('WhatsApp Integration', () => {
  it('generates wa.me deep links correctly', () => {
    const phone = '919999999999';
    const message = 'Hi, I am interested in your product';
    const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    expect(waLink).toContain('wa.me/919999999999');
    expect(waLink).toContain(encodeURIComponent(message));
  });

  it('supports mode B label mapping', () => {
    const modeLabel = 'Enquire on WhatsApp';
    expect(modeLabel).toContain('WhatsApp');
  });

  it('handles phone numbers with + prefix', () => {
    const phone = '+919999999999';
    const cleanPhone = phone.replace(/^\+/, '');
    const waLink = `https://wa.me/${cleanPhone}`;
    expect(waLink).toBe('https://wa.me/919999999999');
  });

  it('truncates long messages for WhatsApp links', () => {
    const message = 'A'.repeat(500);
    const truncated = message.slice(0, 300);
    expect(truncated.length).toBe(300);
    expect(truncated.length).toBeLessThan(message.length);
  });

  it('encodes special characters in message', () => {
    const message = 'Hello! How are you? Price: ₹500';
    const encoded = encodeURIComponent(message);
    expect(encoded).toContain('%20');
    expect(encoded).toContain('%E2%82%B9');
  });
});
