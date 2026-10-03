import { describe, it, expect, vi, beforeEach } from 'vitest';

const dbMock = vi.hoisted(() => ({
  getPool: vi.fn(),
}));

vi.mock('../../core/database', () => ({
  getPool: dbMock.getPool,
}));

const financeMock = vi.hoisted(() => ({
  getTrialBalance: vi.fn(),
}));

vi.mock('../finance.service', () => ({
  IPSASFinanceService: { getTrialBalance: financeMock.getTrialBalance },
}));

import { getPeriodCloseChecklist, assertPeriodOpen } from '../period-close.service';

function poolWith(handler: (text: string) => { rows: Record<string, unknown>[] }) {
  return { query: vi.fn(async (text: string) => handler(text)) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getPeriodCloseChecklist', () => {
  it('reports ready when ledger balances and no drafts remain', async () => {
    dbMock.getPool.mockReturnValue(
      poolWith((t) =>
        t.includes('FROM fiscal_years')
          ? { rows: [{ id: 'fy1', year_number: 2026, status: 'open' }] }
          : { rows: [{ tx: 0, je: 0 }] }
      )
    );
    financeMock.getTrialBalance.mockResolvedValue({
      summary: { isBalanced: true, totalDebit: 100, totalCredit: 100, variance: 0 },
    });
    const c = await getPeriodCloseChecklist('org-1', 'fy1');
    expect(c.ready).toBe(true);
    expect(c.blockers).toEqual([]);
    expect(c.balanced).toBe(true);
  });

  it('blocks on imbalance, drafts and closed year', async () => {
    dbMock.getPool.mockReturnValue(
      poolWith((t) =>
        t.includes('FROM fiscal_years')
          ? { rows: [{ id: 'fy1', year_number: 2025, status: 'CLOSED' }] }
          : { rows: [{ tx: 2, je: 1 }] }
      )
    );
    financeMock.getTrialBalance.mockResolvedValue({
      summary: { isBalanced: false, totalDebit: 100, totalCredit: 90, variance: 10 },
    });
    const c = await getPeriodCloseChecklist('org-1', 'fy1');
    expect(c.ready).toBe(false);
    expect(c.blockers).toContain('FISCAL_YEAR_ALREADY_CLOSED');
    expect(c.blockers).toContain('LEDGER_OUT_OF_BALANCE');
    expect(c.blockers).toContain('UNPOSTED_TRANSACTIONS:2');
    expect(c.blockers).toContain('UNPOSTED_JOURNALS:1');
  });
});

describe('assertPeriodOpen', () => {
  it('passes for open years and missing rows', async () => {
    dbMock.getPool.mockReturnValue(poolWith(() => ({ rows: [{ status: 'open' }] })));
    await expect(assertPeriodOpen('org-1', 'fy1')).resolves.toBeUndefined();
    dbMock.getPool.mockReturnValue(poolWith(() => ({ rows: [] })));
    await expect(assertPeriodOpen('org-1', 'fy1')).resolves.toBeUndefined();
  });
  it('throws for explicitly closed years', async () => {
    dbMock.getPool.mockReturnValue(poolWith(() => ({ rows: [{ status: 'HARD_CLOSED' }] })));
    await expect(assertPeriodOpen('org-1', 'fy1')).rejects.toThrow('posting is blocked');
  });
});
