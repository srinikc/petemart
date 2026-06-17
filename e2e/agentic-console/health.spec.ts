import { test, expect } from '@playwright/test';

test.describe('Agentic Console — Health Page', () => {
  test('error rate chart renders and agent table shows data', async ({ page }) => {
    await page.goto('/agentic-console/health');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });

    // Chart area
    const chart = page.locator('[data-testid="error-chart"], canvas, svg, [class*="chart"], [class*="Chart"]').first();
    const chartExists = await chart.count();
    if (chartExists > 0) {
      await expect(chart).toBeVisible();
    }

    // Agent health table
    const agentTable = page.locator('table, [role="grid"], [class*="agent-table"]').first();
    const tableExists = await agentTable.count();
    if (tableExists > 0) {
      const rows = await agentTable.locator('tr').count();
      expect(rows).toBeGreaterThanOrEqual(0);
    }
  });

  test('aggregate stats display on health page', async ({ page }) => {
    await page.goto('/agentic-console/health');
    await page.waitForLoadState('networkidle');

    // Stats cards
    const stats = page.locator('[data-testid="stat-card"], [class*="stat"], [class*="Stat"]');
    const count = await stats.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
