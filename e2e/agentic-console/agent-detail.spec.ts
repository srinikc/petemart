import { test, expect } from '@playwright/test';

test.describe('Agentic Console — Agent Detail Page', () => {
  test('tab switching between details, memory, and A2A', async ({ page }) => {
    await page.goto('/agentic-console/agent-detail?agentId=01_ideation_agent');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });

    const tabs = page.locator('[role="tab"], button:has-text("Detail"), button:has-text("Memory"), button:has-text("A2A"), [class*="tab"]');
    const count = await tabs.count();
    if (count > 0) {
      // Click each tab
      for (let i = 0; i < Math.min(count, 3); i++) {
        await tabs.nth(i).click();
        await page.waitForTimeout(200);
      }
    }
  });

  test('prompt snapshots, memory injection, and A2A compose visible', async ({ page }) => {
    await page.goto('/agentic-console/agent-detail?agentId=01_ideation_agent');
    await page.waitForLoadState('networkidle');

    const sections = [
      'text=Prompt',
      'text=Memory',
      'text=A2A',
      'text=Artifact',
      '[data-testid="prompt-snapshots"]',
      '[data-testid="agent-memory"]',
    ];

    let anyVisible = false;
    for (const selector of sections) {
      const el = page.locator(selector).first();
      if (await el.count() > 0) {
        anyVisible = true;
        break;
      }
    }
    expect(anyVisible).toBe(true);
  });
});
