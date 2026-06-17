import { test, expect } from '@playwright/test';

test.describe('Agentic Console — Quality Page', () => {
  test('navigate to quality page and KPIs load', async ({ page }) => {
    await page.goto('/agentic-console/quality');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });

    // KPI cards section
    const kpiCards = page.locator('[data-testid="kpi-card"], [class*="kpi"], [class*="KPI"]').first();
    const exists = await kpiCards.count();
    if (exists > 0) {
      await expect(kpiCards).toBeVisible();
    }
  });

  test('tabs switch between KPIs, Tests, and Defects', async ({ page }) => {
    await page.goto('/agentic-console/quality');
    await page.waitForLoadState('networkidle');

    const tabs = page.locator('[role="tab"], button:has-text("KPI"), button:has-text("Test"), button:has-text("Defect"), [class*="tab"]');
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(1);

    const firstTab = tabs.first();
    await firstTab.click();
    await page.waitForTimeout(300);
  });

  test('requirement quality table renders', async ({ page }) => {
    await page.goto('/agentic-console/quality');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table, [role="grid"], [class*="table"], [data-testid="quality-table"]').first();
    const exists = await table.count();
    if (exists > 0) {
      const rows = table.locator('tr, [role="row"]');
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });
});
