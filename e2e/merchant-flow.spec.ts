import { test, expect } from '@playwright/test';

test.describe('Merchant Flow', () => {
  test('merchant dashboard loads without crashing (unauthenticated)', async ({ page }) => {
    await page.goto('/merchant/dashboard');
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Application error')).toHaveCount(0);
  });

  test('merchant pages load without crashes', async ({ page }) => {
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
      await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Application error')).toHaveCount(0);
    }
  });
});
