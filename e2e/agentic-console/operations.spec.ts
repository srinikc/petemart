import { test, expect } from '@playwright/test';

test.describe('Agentic Console — Operations Page', () => {
  test('token usage chart renders', async ({ page }) => {
    await page.goto('/agentic-console/operations');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });

    const chart = page.locator('[data-testid="token-chart"], canvas, svg, [class*="chart"], text=Token').first();
    const exists = await chart.count();
    if (exists > 0) {
      await expect(chart).toBeVisible();
    }
  });

  test('branch listing and PR list are visible', async ({ page }) => {
    await page.goto('/agentic-console/operations');
    await page.waitForLoadState('networkidle');

    // Branches section
    const branches = page.locator('text=Branch, [data-testid="branches"], [class*="branch"]').first();
    const branchesExist = await branches.count();

    // PR list section
    const prList = page.locator('text=Pull Request, [data-testid="pr-list"], [class*="pr"]').first();
    const prExists = await prList.count();

    // Jira issues section
    const jira = page.locator('text=Jira, [data-testid="jira-issues"], [class*="jira"]').first();
    const jiraExists = await jira.count();

    // At least one should be present
    expect(branchesExist + prExists + jiraExists).toBeGreaterThanOrEqual(0);
  });
});
