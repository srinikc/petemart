import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3458';

export default defineConfig({
  testDir: path.join(__dirname, 'e2e'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['html', { outputFolder: path.join(__dirname, 'qa-dashboard', 'playwright-report') }],
    ['json', { outputFile: path.join(__dirname, 'qa-dashboard', 'playwright-results.json') }],
    ['list'],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.spec\.ts/,
    },
    ...(process.env.CI
      ? [
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
            testMatch: /.*\.spec\.ts/,
          },
          {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
            testMatch: /.*\.spec\.ts/,
          },
        ]
      : []),
  ],
  outputDir: path.join(__dirname, 'qa-dashboard', 'test-results'),
});
