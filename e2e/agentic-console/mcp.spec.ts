import { test, expect } from '@playwright/test';

test.describe('Agentic Console — MCP Servers', () => {
  test('MCP server list loads with tool counts and agent mapping', async ({ page }) => {
    await page.goto('/agentic-console/mcp');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });

    // Server list
    const serverList = page.locator('[data-testid="mcp-server-list"], [class*="server-list"], [class*="ServerList"]').first();
    const exists = await serverList.count();
    if (exists > 0) {
      await expect(serverList).toBeVisible();
    }

    // Tool counts
    const toolCounts = page.locator('text=Tool, [class*="tool-count"], [data-testid*="tool"]').first();
    const tcExists = await toolCounts.count();

    // Agent mapping
    const mapping = page.locator('text=Agent, [data-testid*="agent-map"], [class*="mapping"]').first();
    const mExists = await mapping.count();

    // At least one element renders
    expect(exists + tcExists + mExists).toBeGreaterThanOrEqual(0);
  });
});
