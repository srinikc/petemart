import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['__tests__/**/*.test.{ts,tsx}'],
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: 'qa-dashboard/coverage',
      include: ['lib/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.config.ts'],
    },
  },
});
