import { describe, it, expect } from 'vitest';
import institutionalReportsRoutes from '../institutional-reports.routes';

function mountedGetPaths(router: unknown): string[] {
  const stack = (router as { stack?: Array<{ route?: { path?: unknown; methods?: Record<string, unknown> } }> }).stack;
  const paths: string[] = [];
  for (const layer of stack ?? []) {
    const path = layer.route?.path;
    if (typeof path === 'string' && layer.route?.methods?.get) paths.push(path);
  }
  return paths.sort();
}

describe('institutional-reports routes contract', () => {
  it('mounts exactly the thirteen read-only GET endpoints', () => {
    expect(mountedGetPaths(institutionalReportsRoutes)).toEqual([
      '/audit-activity',
      '/budget-variance',
      '/cash-flow',
      '/donor-report',
      '/executive-brief',
      '/finance-scorecard',
      '/grant-receivables',
      '/ledger',
      '/neb-coverage',
      '/period-close',
      '/trial-balance',
      '/unposted-worklist',
      '/vendor-aging',
    ]);
  });
});
