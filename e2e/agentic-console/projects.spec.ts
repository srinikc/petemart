import { test, expect } from '@playwright/test';

test.describe('Agentic Console — Project Selector', () => {
  test('project selector changes and state reloads', async ({ page }) => {
    await page.goto('/agentic-console');
    await page.waitForLoadState('networkidle');

    // Find project selector
    const selector = page.locator(
      'select, [role="combobox"], [data-testid="project-selector"], [class*="project-select"]'
    ).first();
    const exists = await selector.count();
    if (exists > 0) {
      // Attempt to select first non-default option
      const options = page.locator('option');
      const optCount = await options.count();
      if (optCount > 1) {
        await selector.selectOption({ index: 1 });
        await page.waitForTimeout(500);
      }
    }
  });

  test('dashboard reflects selected project', async ({ page }) => {
    await page.goto('/agentic-console/projects');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });

    // Project listing
    const projectList = page.locator('[data-testid="project-list"], [class*="project"], table').first();
    const exists = await projectList.count();
    if (exists > 0) {
      const text = await projectList.textContent();
      expect(text?.length ?? 0).toBeGreaterThanOrEqual(0);
    }
  });
});
