import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load with correct title and key elements', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/PeteMart/);

    const hero = page.getByRole('heading', { level: 1 });
    await expect(hero).toBeVisible();
    await expect(hero).toContainText('Old Bangalore');

    const exploreMarketsBtn = page.getByRole('link', { name: /explore markets/i });
    await expect(exploreMarketsBtn).toBeVisible();

    const joinBtn = page.getByRole('link', { name: /join/i });
    await expect(joinBtn).toBeVisible();
  });

  test('should display market content on home page', async ({ page }) => {
    await page.goto('/');
    const content = page.locator('body');
    await expect(content).toBeVisible();
    const text = await content.textContent();
    expect(text.length).toBeGreaterThan(50);
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/');
    const authLink = page.getByRole('link', { name: /sign in/i });
    if (await authLink.isVisible()) {
      await authLink.click();
      await expect(page).toHaveURL(/\/auth/);
    }
  });

  test('should display how-it-works section', async ({ page }) => {
    await page.goto('/');
    const howItWorks = page.locator('text=How It Works').first();
    await expect(howItWorks).toBeVisible();
  });
});
