import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'Desktop 1920', width: 1920, height: 1080 },
  { name: 'Desktop 1366', width: 1366, height: 768 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Mobile Large', width: 414, height: 896 },
  { name: 'Mobile Small', width: 375, height: 667 },
];

test.describe('Cross-Browser Viewport Tests', () => {
  for (const vp of VIEWPORTS) {
    test(`home page renders correctly at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('text=Application error')).toHaveCount(0);
      const noOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth;
      });
      if (vp.width >= 768) {
        expect(noOverflow).toBeTruthy();
      }
    });
  }

  for (const vp of VIEWPORTS) {
    test(`auth page renders correctly at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/auth');
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('text=Application error')).toHaveCount(0);
    });
  }

  for (const vp of VIEWPORTS) {
    test(`market page renders correctly at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/markets/chickpet');
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('text=Application error')).toHaveCount(0);
    });
  }
});
