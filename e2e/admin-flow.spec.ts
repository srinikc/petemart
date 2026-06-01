import { test, expect } from '@playwright/test';

test.describe('Admin Flow', () => {
  test('should redirect unauthenticated users from admin dashboard', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should not crash on any admin page (redirects to auth or loads)', async ({ page }) => {
    const pages = [
      '/admin',
      '/admin/analytics',
      '/admin/merchants',
      '/admin/merchants/approvals',
      '/admin/orders',
      '/admin/config',
    ];
    for (const path of pages) {
      await page.goto(path);
      await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Application error')).toHaveCount(0);
    }
  });
});
