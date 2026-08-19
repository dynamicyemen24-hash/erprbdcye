import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'src/server/engines/**/*.test.ts',
      'src/server/__tests__/**/*.test.ts',
    ],
    exclude: ['node_modules', 'dist'],
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/server/engines/**/*.ts', 'src/server/core/**/*.ts', 'src/server/middleware/**/*.ts'],
      exclude: ['src/server/engines/__tests__/**', 'src/server/__tests__/**'],
    },
  },
});
