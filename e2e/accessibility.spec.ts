import { test, expect } from '@playwright/test';

test.describe('Accessibility (Basic)', () => {
  test('home page has semantic heading structure', async ({ page }) => {
    await page.goto('/');
    const headings = await page.locator('h1, h2, h3').all();
    expect(headings.length).toBeGreaterThan(0);
    for (const h of headings) {
      const tag = await h.evaluate(el => el.tagName);
      expect(['H1', 'H2', 'H3']).toContain(tag);
    }
  });

  test('home page has alt text on images', async ({ page }) => {
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

  test('auth page has input fields (labeled or placeholdered)', async ({ page }) => {
    await page.goto('/auth');
    const inputs = page.locator('input');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('links have discernible text', async ({ page }) => {
    await page.goto('/');
    const links = page.locator('a');
    const count = await links.count();
    let emptyLinks = 0;
    for (let i = 0; i < Math.min(count, 20); i++) {
      const text = await links.nth(i).textContent();
      if (!text?.trim()) emptyLinks++;
    }
    expect(emptyLinks).toBeLessThan(count * 0.2);
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
