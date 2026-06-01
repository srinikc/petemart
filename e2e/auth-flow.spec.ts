import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('should display auth page with login/signup toggle', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    const signInTab = page.getByRole('tab', { name: /sign in/i });
    await expect(signInTab).toBeVisible();
  });

  test('should switch between email and phone login tabs', async ({ page }) => {
    const emailTab = page.getByRole('tab', { name: /email/i });
    const phoneTab = page.getByRole('tab', { name: /phone/i });

    await expect(emailTab).toBeVisible();
    await expect(phoneTab).toBeVisible();

    await emailTab.click();

    const emailInput = page.getByPlaceholder(/you@example.com/);
    await expect(emailInput).toBeVisible();
  });

  test('should show phone login form when switching to phone tab', async ({ page }) => {
    const phoneTab = page.getByRole('tab', { name: /phone/i });
    await phoneTab.click();

    const phoneInput = page.getByPlaceholder(/phone number/i);
    await expect(phoneInput).toBeVisible();

    const sendOtpBtn = page.getByRole('button', { name: /send otp/i });
    await expect(sendOtpBtn).toBeVisible();
  });

  test('should have working signup mode toggle', async ({ page }) => {
    const signUpTab = page.getByRole('tab', { name: /sign up/i });
    await signUpTab.click();

    const nameInput = page.getByPlaceholder(/full name/i);
    await expect(nameInput).toBeVisible();
  });

  test('should have persona selection in signup', async ({ page }) => {
    const signUpTab = page.getByRole('tab', { name: /sign up/i });
    await signUpTab.click();

    const customerOption = page.locator('text=Customer');
    const merchantOption = page.locator('text=Merchant');

    await expect(customerOption).toBeVisible();
    await expect(merchantOption).toBeVisible();
  });

  test('email login form disables submit when fields empty', async ({ page }) => {
    const signInBtn = page.getByRole('button', { name: /sign in/i });
    await expect(signInBtn).toBeDisabled();
  });

  test('email login button enables when both fields filled', async ({ page }) => {
    const emailInput = page.getByPlaceholder(/you@example.com/);
    const passwordInput = page.getByPlaceholder(/enter your password/i);

    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');

    const signInBtn = page.getByRole('button', { name: /sign in/i });
    await expect(signInBtn).toBeEnabled();
  });

  test('phone login validates 10-digit number', async ({ page }) => {
    const phoneTab = page.getByRole('tab', { name: /phone/i });
    await phoneTab.click();

    const sendOtpBtn = page.getByRole('button', { name: /send otp/i });
    await expect(sendOtpBtn).toBeDisabled();
  });

  test('auth page displays help texts', async ({ page }) => {
    await expect(page.locator('text=Sign in with your registered email')).toBeVisible();
  });
});
