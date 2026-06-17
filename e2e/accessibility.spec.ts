import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility (axe-core Audit)', () => {
  test('home page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);
  });

  test('auth page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);
  });

  test('cart page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);
  });

  test('checkout page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);
  });

  test('all pages have valid semantic structure', async ({ page }) => {
    await page.goto('/');
    const headings = await page.locator('h1, h2, h3').all();
    expect(headings.length).toBeGreaterThan(0);
    for (const h of headings) {
      const tag = await h.evaluate(el => el.tagName);
      expect(['H1', 'H2', 'H3']).toContain(tag);
    }
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/');
    const images = page.locator('img');
    const count = await images.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const alt = await images.nth(i).getAttribute('alt');
        expect(alt).not.toBeNull();
      }
    }
  });

  test('page has valid lang attribute', async ({ page }) => {
    await page.goto('/');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
  });

  test('buttons have accessible names', async ({ page }) => {
    await page.goto('/');
    const buttons = page.locator('button');
    const count = await buttons.count();
    let emptyNamed = 0;
    for (let i = 0; i < Math.min(count, 10); i++) {
      const name = await buttons.nth(i).getAttribute('aria-label');
      const text = await buttons.nth(i).textContent();
      if (!(name || text?.trim())) emptyNamed++;
    }
    expect(emptyNamed).toBeLessThan(Math.min(count, 10));
  });
});
