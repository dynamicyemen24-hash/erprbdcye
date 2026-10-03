import { describe, it, expect, vi, beforeEach } from 'vitest';

const dbMock = vi.hoisted(() => ({
  getPool: vi.fn(),
}));

vi.mock('../../../core/database', () => ({
  getPool: dbMock.getPool,
}));

import { resolveBranchScope } from '../institutional-reports.routes';

function poolWithBranch(branch: string | null) {
  return { query: vi.fn(async () => ({ rows: branch ? [{ branch_code: branch }] : [] })) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('resolveBranchScope', () => {
  it('lets HQ users roam across branches', async () => {
    dbMock.getPool.mockReturnValue(poolWithBranch('HQ'));
    const s = await resolveBranchScope('org-1', 'u1', 'TAIZ');
    expect(s.effective).toBe('TAIZ');
    expect(s.restricted).toBe(false);
  });

  it('auto-scopes restricted users to their own branch', async () => {
    dbMock.getPool.mockReturnValue(poolWithBranch('TAIZ'));
    const s = await resolveBranchScope('org-1', 'u1', null);
    expect(s.effective).toBe('TAIZ');
    expect(s.restricted).toBe(true);
  });

  it('blocks restricted users from foreign branches', async () => {
    dbMock.getPool.mockReturnValue(poolWithBranch('TAIZ'));
    await expect(resolveBranchScope('org-1', 'u1', 'ADEN')).rejects.toThrow('Branch access denied');
  });

  it('stays unrestricted without a user context', async () => {
    const s = await resolveBranchScope('org-1', undefined, null);
    expect(s.effective).toBeNull();
    expect(s.restricted).toBe(false);
  });
});
