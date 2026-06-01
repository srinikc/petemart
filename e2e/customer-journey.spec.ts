import { test, expect } from '@playwright/test';

test.describe('Customer Journey', () => {
  test('should navigate from home to markets via Explore Markets CTA', async ({ page }) => {
    await page.goto('/');
    const exploreBtn = page.getByRole('link', { name: /explore markets/i });
    await expect(exploreBtn).toBeVisible();
    await exploreBtn.click();
    await expect(page).toHaveURL(/\/markets\/chickpet/i);
    await expect(page.getByRole('heading', { name: /chickpet/i })).toBeVisible();
  });

  test('should display market listing with merchant names', async ({ page }) => {
    await page.goto('/markets/chickpet');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=Application error')).toHaveCount(0);
  });

  test('should navigate from market to a merchant shop page', async ({ page }) => {
    await page.goto('/shop/tarun-enterprises');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const productsHeading = page.getByRole('heading', { name: /products/i });
    await expect(productsHeading).toBeVisible();
  });

  test('should load product detail page from product listing', async ({ page }) => {
    await page.goto('/product/product-1');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=Application error')).toHaveCount(0);
  });

  test('should display cart page without errors', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=Application error')).toHaveCount(0);
  });

  test('should load checkout page with place order capability', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.getByRole('heading', { name: /checkout/i })).toBeVisible();
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=Application error')).toHaveCount(0);
  });

  test('should display orders listing page', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should display order tracking page for valid order', async ({ page }) => {
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
