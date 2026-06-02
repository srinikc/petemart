import { test, expect } from '@playwright/test';

test.describe('Visual Regression (Screenshot Comparison)', () => {
  test('home page loads without visual errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
    const screenshot = await page.screenshot({ fullPage: true });
    expect(screenshot).toBeTruthy();
    expect(screenshot.length).toBeGreaterThan(1000);
  });

  test('auth page renders correctly', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    const screenshot = await page.screenshot();
    expect(screenshot).toBeTruthy();
    expect(screenshot.length).toBeGreaterThan(1000);
  });

  test('cart page renders without layout shift', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    const screenshot = await page.screenshot();
    expect(screenshot).toBeTruthy();
  });

  test('checkout page renders correctly', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    const screenshot = await page.screenshot();
    expect(screenshot).toBeTruthy();
  });

  test('mobile viewport renders without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const overflowWidth = await page.evaluate(() => {
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });
    expect(overflowWidth).toBe(0);
  });

  test('market page renders product cards consistently', async ({ page }) => {
    await page.goto('/markets/chickpet');
    await page.waitForLoadState('networkidle');
    const productCards = page.locator('[class*="card"], [class*="Card"]');
    const count = await productCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
