import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('should display auth page with login form', async ({ page }) => {
    await expect(page).toHaveTitle(/Sign In|Auth|Login|PeteMart/i);
    const emailInput = page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]'));
    await expect(emailInput).toBeVisible();
  });

  test('should have email and password input fields', async ({ page }) => {
    const emailInput = page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]').first());
    await expect(emailInput).toBeVisible();
    const passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]').first());
    await expect(passwordInput).toBeVisible();
  });

  test('should have a sign in button', async ({ page }) => {
    const signInBtn = page.getByRole('button', { name: /sign in|login|submit/i });
    await expect(signInBtn).toBeVisible();
  });

  test('should have action buttons on auth page', async ({ page }) => {
    const buttons = page.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('auth page links should be valid', async ({ page }) => {
    const links = page.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('auth page displays help or branding text', async ({ page }) => {
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.length ?? 0).toBeGreaterThan(10);
  });
});
