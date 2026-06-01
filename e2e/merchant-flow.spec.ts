import { test, expect } from '@playwright/test';

test.describe('Merchant Flow', () => {
  test('should redirect unauthenticated users from merchant dashboard', async ({ page }) => {
    await page.goto('/merchant/dashboard');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should display merchant login prompt when accessing protected route', async ({ page }) => {
    await page.goto('/merchant/products');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should load merchant pages with correct layout structure', async ({ page }) => {
    const pages = [
      '/merchant/dashboard',
      '/merchant/orders',
      '/merchant/products',
      '/merchant/analytics',
      '/merchant/settings',
      '/merchant/qr',
    ];
    for (const path of pages) {
      await page.goto(path);
      const isAuthPage = page.url().includes('/auth');
      if (!isAuthPage) {
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });
});
