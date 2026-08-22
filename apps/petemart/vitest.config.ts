import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@productforge/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@productforge/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    root: __dirname,
    include: ['__tests__/**/*.test.{ts,tsx}'],
    setupFiles: ['__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: '../qa-dashboard/coverage/petemart',
      include: ['app/**/*.{ts,tsx}', 'lib/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.config.ts'],
    },
  },
});