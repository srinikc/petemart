import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: [
      { find: '@/lib/api-helpers', replacement: path.resolve(__dirname, 'apps/petemart/lib/api-helpers') },
      { find: '@/lib/qa', replacement: path.resolve(__dirname, 'apps/framework-console/lib/qa') },
      { find: '@/app/api/qa', replacement: path.resolve(__dirname, 'apps/framework-console/app/api/qa') },
      { find: '@/app/api/v1', replacement: path.resolve(__dirname, 'apps/petemart/app/api/v1') },
      { find: '@/qa-dashboard', replacement: path.resolve(__dirname, 'apps/framework-console/qa-dashboard') },
      { find: '@', replacement: path.resolve(__dirname, '.') },
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['__tests__/**/*.test.{ts,tsx}'],
    setupFiles: ['__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: 'qa-dashboard/coverage',
      include: ['lib/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.config.ts'],
    },
  },
});
