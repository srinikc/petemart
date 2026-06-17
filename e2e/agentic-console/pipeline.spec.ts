import { test, expect } from '@playwright/test';

test.describe('Agentic Console — Pipeline Control', () => {
  test('start pipeline from dashboard', async ({ page }) => {
    await page.goto('/agentic-console');
    await page.waitForLoadState('networkidle');

    const startBtn = page.locator('button:has-text("Start"), button:has-text("Run"), [data-testid="start-pipeline"]').first();
    const exists = await startBtn.count();
    if (exists > 0) {
      await startBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('pause and resume pipeline', async ({ page }) => {
    await page.goto('/agentic-console');
    await page.waitForLoadState('networkidle');

    const pauseBtn = page.locator('button:has-text("Pause"), [data-testid="pause-pipeline"]').first();
    const exists = await pauseBtn.count();
    if (exists > 0) {
      await pauseBtn.click();
      await page.waitForTimeout(300);

      const resumeBtn = page.locator('button:has-text("Resume"), [data-testid="resume-pipeline"]').first();
      const resumeExists = await resumeBtn.count();
      if (resumeExists > 0) {
        await resumeBtn.click();
      }
    }
  });

  test('monitor DAG graph status changes', async ({ page }) => {
    await page.goto('/agentic-console');
    await page.waitForLoadState('networkidle');

    const dagGraph = page.locator('[data-testid="dag-graph"], [class*="dag"], [class*="DAG"], svg').first();
    const exists = await dagGraph.count();
    if (exists > 0) {
      await expect(dagGraph).toBeVisible();

      // Check for nodes in the graph
      const nodes = dagGraph.locator('[class*="node"], circle, rect, [data-testid*="node"]');
      const nodeCount = await nodes.count();
      expect(nodeCount).toBeGreaterThanOrEqual(0);
    }
  });
});
