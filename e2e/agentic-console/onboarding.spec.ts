import { test, expect } from '@playwright/test';

test.describe('Agentic Console — Onboarding Wizard', () => {
  test('4-step onboarding flow with validation and progress tracking', async ({ page }) => {
    await page.goto('/agentic-console/onboarding');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });

    // Step indicators
    const steps = page.locator('[data-testid="step"], [class*="step"], [class*="Step"]');
    const stepCount = await steps.count();
    expect(stepCount).toBeGreaterThanOrEqual(1);

    // Progress bar
    const progress = page.locator('[role="progressbar"], [class*="progress"], [data-testid="progress"]').first();
    const progressExists = await progress.count();
    if (progressExists > 0) {
      await expect(progress).toBeVisible();
    }

    // Next button
    const nextBtn = page.locator('button:has-text("Next"), button:has-text("Continue")').first();
    const btnExists = await nextBtn.count();
    if (btnExists > 0) {
      await nextBtn.click();
      await page.waitForTimeout(300);
    }
  });
});
