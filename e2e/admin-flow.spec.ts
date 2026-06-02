import { test, expect } from '@playwright/test';

test.describe('Admin Flow', () => {
  test('admin page loads without crashing (unauthenticated)', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
  });

  test('admin sub-pages load without crashing', async ({ page }) => {
    const pages = [
      '/admin',
      '/admin/merchants',
      '/admin/merchants/approvals',
      '/admin/orders',
    ];
    for (const path of pages) {
      await page.goto(path);
      await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    }
  });
});
