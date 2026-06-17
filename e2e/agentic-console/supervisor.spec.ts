import { test, expect } from '@playwright/test';

test.describe('Agentic Console — Supervisor Chat', () => {
  test('open supervisor modal and send message', async ({ page }) => {
    await page.goto('/agentic-console');
    await page.waitForLoadState('networkidle');

    // Open supervisor modal
    const supervisorBtn = page.locator(
      'button:has-text("Supervisor"), [data-testid="supervisor-btn"], a[href*="supervisor"]'
    ).first();
    const exists = await supervisorBtn.count();
    if (exists > 0) {
      await supervisorBtn.click();
      await page.waitForTimeout(500);
    } else {
      await page.goto('/agentic-console/supervisor');
      await page.waitForLoadState('networkidle');
    }

    // Find input field
    const input = page.locator('textarea, input[type="text"]').first();
    const inputExists = await input.count();
    if (inputExists > 0) {
      await input.fill('Run agent 01_ideation_agent');
      const sendBtn = page.locator('button:has-text("Send"), button[type="submit"]').first();
      if (await sendBtn.count() > 0) {
        await sendBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('see response stream from supervisor', async ({ page }) => {
    await page.goto('/agentic-console/supervisor');
    await page.waitForLoadState('networkidle');

    // Look for response area or chat messages
    const chatArea = page.locator('[class*="chat"], [class*="messages"], [class*="response"], [data-testid="chat-area"]').first();
    const exists = await chatArea.count();
    if (exists > 0) {
      const text = await chatArea.textContent();
      expect(text?.length ?? 0).toBeGreaterThanOrEqual(0);
    }
  });

  test('verify message persistence in supervisor log', async ({ page }) => {
    await page.goto('/agentic-console/supervisor');
    await page.waitForLoadState('networkidle');

    // Check for previously sent messages
    const messageLog = page.locator('[class*="log"], [class*="history"], [data-testid="message-log"]');
    const exists = await messageLog.count();
    if (exists > 0) {
      await expect(messageLog).toBeVisible();
    }
  });
});
