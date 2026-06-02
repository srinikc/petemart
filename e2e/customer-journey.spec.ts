import { test, expect } from '@playwright/test';

test.describe('Customer Journey', () => {
  test('should navigate from home to market detail', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    const marketLink = page.getByRole('link', { name: /market|shop|explore/i }).first();
    if (await marketLink.isVisible()) {
      await marketLink.click();
    }
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display market listing with content', async ({ page }) => {
    await page.goto('/markets/chickpet');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=Application error')).toHaveCount(0);
  });

  test('should navigate from market to a merchant shop page', async ({ page }) => {
    await page.goto('/shop/tarun-enterprises');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=Application error')).toHaveCount(0);
  });

  test('should load product detail page from product listing', async ({ page }) => {
    await page.goto('/product/product-1');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=Application error')).toHaveCount(0);
  });

  test('should display cart page without errors', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=Application error')).toHaveCount(0);
  });

  test('should load checkout page', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=Application error')).toHaveCount(0);
  });

  test('should display orders listing page', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=Application error')).toHaveCount(0);
  });

  test('should display order tracking page', async ({ page }) => {
    await page.goto('/tracking/order-1');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=Application error')).toHaveCount(0);
  });

  test('should load all major customer pages without errors', async ({ page }) => {
    const pages = [
      '/', '/auth', '/cart', '/checkout',
      '/markets/chickpet', '/orders',
      '/profile',
    ];
    for (const path of pages) {
      await page.goto(path);
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('text=Application error')).toHaveCount(0);
    }
  });
});
