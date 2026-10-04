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
            // These suites exercise Node-only surfaces (pg pools, Redis, the
            // durable queue, Prometheus registries, SMTP, SQL allow-lists).
            // They previously matched the frontend project's catch-all
            // `src/**/*.test.ts` and therefore ran under jsdom, where
            // node:timers/fs/net are absent — false confidence, plus every
            // suite ran twice in CI.
            'src/server/database/**/*.test.ts',
            'src/server/db/**/*.test.ts',
            'src/server/observability/**/*.test.ts',
            'src/server/queue/**/*.test.ts',
            'src/server/redis/**/*.test.ts',
            'src/server/services/**/*.test.ts',
            'src/server/governance/**/*.test.ts',
            'src/server/tenant/**/*.test.ts',
            'src/server/validators/**/*.test.ts',
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
          // The catch-all globs above also match every `src/server/**` suite.
          // Those belong to the `server` project (node env); letting them
          // through here executed each one twice per run — once in jsdom,
          // where pg/Redis/timers behave differently and can pass for the
          // wrong reason.
          exclude: [
            'node_modules',
            'dist',
            'src/server/**',
            'src/lib/**',
            'src/core/**',
            'tests/**',
          ],
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
