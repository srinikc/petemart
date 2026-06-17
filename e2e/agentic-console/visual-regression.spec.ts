import { test, expect } from '@playwright/test';

test.describe('Agentic Console — Visual Regression', () => {
  test('Dashboard page — full viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/agentic-console');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveScreenshot('dashboard-full.png', { fullPage: true });
  });

  test('Dashboard page — mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/agentic-console');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveScreenshot('dashboard-mobile.png', { fullPage: true });
  });

  test('Agent detail page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/agentic-console/agent-detail?agentId=01_ideation_agent');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveScreenshot('agent-detail.png', { fullPage: true });
  });

  test('Quality page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/agentic-console/quality');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveScreenshot('quality-page.png', { fullPage: true });
  });

  test('Health page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/agentic-console/health');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveScreenshot('health-page.png', { fullPage: true });
  });

  test('Operations page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/agentic-console/operations');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveScreenshot('operations-page.png', { fullPage: true });
  });

  test('Logs page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/agentic-console/logs');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveScreenshot('logs-page.png', { fullPage: true });
  });

  test('MCP servers page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/agentic-console/mcp');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveScreenshot('mcp-servers-page.png', { fullPage: true });
  });

  test('Pipeline graph', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/agentic-console/pipeline');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveScreenshot('pipeline-graph.png', { fullPage: true });
  });

  test('Onboarding wizard', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/agentic-console/onboarding');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveScreenshot('onboarding-wizard.png', { fullPage: true });
  });

  test('Agent cards grid', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/agentic-console');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
    const cards = page.locator('[data-testid*="agent-card"], [class*="agent-card"], [class*="AgentCard"]');
    const count = await cards.count();
    if (count > 0) {
      await expect(cards.first()).toBeVisible();
    }
    await expect(page).toHaveScreenshot('agent-cards-grid.png', { fullPage: true });
  });

  test('Supervisor chat modal', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/agentic-console/supervisor');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveScreenshot('supervisor-chat.png', { fullPage: true });
  });

  test('Breadcrumbs component', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/agentic-console/agent-detail?agentId=01_ideation_agent');
    await page.waitForLoadState('networkidle');
    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"], [class*="breadcrumb"], [data-testid="breadcrumbs"]').first();
    const exists = await breadcrumbs.count();
    if (exists > 0) {
      await expect(breadcrumbs).toBeVisible();
    }
    await expect(page).toHaveScreenshot('breadcrumbs.png', { fullPage: true });
  });

  test('Status badges', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/agentic-console');
    await page.waitForLoadState('networkidle');
    const badges = page.locator('[class*="badge"], [class*="Badge"], [data-testid*="badge"]');
    const count = await badges.count();
    if (count > 0) {
      await expect(badges.first()).toBeVisible();
    }
    await expect(page).toHaveScreenshot('status-badges.png', { fullPage: true });
  });

  test('KPI cards layout', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/agentic-console/quality');
    await page.waitForLoadState('networkidle');
    const kpis = page.locator('[data-testid="kpi-card"], [class*="kpi"], [class*="KPI"]');
    const count = await kpis.count();
    if (count > 0) {
      await expect(kpis.first()).toBeVisible();
    }
    await expect(page).toHaveScreenshot('kpi-cards.png', { fullPage: true });
  });

  test('Phase columns layout', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/agentic-console');
    await page.waitForLoadState('networkidle');
    const phases = page.locator('[data-testid="phase-column"], [class*="phase-column"], [class*="PhaseColumn"]');
    const count = await phases.count();
    if (count > 0) {
      await expect(phases.first()).toBeVisible();
    }
    await expect(page).toHaveScreenshot('phase-columns.png', { fullPage: true });
  });
});
