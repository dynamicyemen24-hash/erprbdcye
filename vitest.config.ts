import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'src/server/engines/**/*.ts',
        'src/server/core/**/*.ts',
        'src/server/middleware/**/*.ts',
        'src/server/routes/**/*.ts',
        'src/server/validators/**/*.ts',
      ],
      exclude: [
        'src/server/engines/__tests__/**',
        'src/server/__tests__/**',
        'src/server/core/__tests__/**',
        '**/*.test.ts',
        '**/*.test.tsx',
      ],
      thresholds: {
        statements: 50,
        branches: 40,
        functions: 50,
        lines: 50,
      },
    },
    projects: [
      {
        test: {
          name: 'server',
          environment: 'node',
          include: [
            'src/server/engines/**/*.test.ts',
            'src/server/__tests__/**/*.test.ts',
            'src/server/core/**/*.test.ts',
            'src/server/middleware/**/*.test.ts',
            'src/server/routes/**/*.test.ts',
            'src/lib/**/*.test.ts',
            'src/core/**/*.test.ts',
            'tests/pmo/**/*.test.ts',
          ],
          exclude: ['node_modules', 'dist'],
          testTimeout: 10000,
        },
      },
      {
        test: {
          name: 'frontend',
          environment: 'jsdom',
          setupFiles: ['src/test-setup.ts'],
          include: [
            'src/components/__tests__/**/*.test.tsx',
            'src/app/components/__tests__/**/*.test.tsx',
            'src/design-system/__tests__/**/*.test.{ts,tsx}',
            'src/**/*.test.tsx',
            'src/**/*.test.ts',
          ],
          exclude: ['node_modules', 'dist'],
          globals: true,
          testTimeout: 10000,
        },
      },
      {
        test: {
          name: 'e2e',
          environment: 'node',
          include: [
            'tests/e2e/**/*.test.ts',
          ],
          exclude: ['node_modules', 'dist'],
          testTimeout: 30000,
          pool: 'forks',
          poolOptions: {
            forks: {
              singleFork: true,
            },
          },
        },
      },
    ],
  },
});
