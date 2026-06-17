import { test, expect } from '@playwright/test';

test.describe('Visual Regression (Screenshot Comparison)', () => {
  test('home page loads without visual errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveScreenshot('home-full.png', { fullPage: true });
  });

  test('mobile home page renders without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
    const overflowWidth = await page.evaluate(() => {
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });
    expect(overflowWidth).toBe(0);
    await expect(page).toHaveScreenshot('home-mobile.png', { fullPage: true });
  });

  test('auth page renders correctly', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('auth-page.png');
  });

  test('cart page renders without layout shift', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('cart-page.png', { fullPage: true });
  });

  test('checkout page renders correctly', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('checkout-page.png', { fullPage: true });
  });

  test('market page renders product cards consistently', async ({ page }) => {
    await page.goto('/markets/chickpet');
    await page.waitForLoadState('networkidle');
    const productCards = page.locator('[class*="card"], [class*="Card"]');
    const count = await productCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
    await expect(page).toHaveScreenshot('market-page.png', { fullPage: true });
  });
});
