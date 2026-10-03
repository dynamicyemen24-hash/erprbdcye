import { describe, it, expect, vi, beforeEach } from 'vitest';

const dbMock = vi.hoisted(() => ({
  queryOne: vi.fn(),
  queryMany: vi.fn(),
}));

vi.mock('../../core/database', () => ({
  queryOne: dbMock.queryOne,
  queryMany: dbMock.queryMany,
}));

vi.mock('../../services/institutional-branding.service', () => ({
  buildReportEnvelope: vi.fn(
    async (
      _orgId: string,
      input: { titleAr: string; titleEn: string; standard?: string }
    ) => ({
      lang: 'ar',
      dir: 'rtl',
      title: input.titleAr,
      titleAr: input.titleAr,
      titleEn: input.titleEn,
      standard: input.standard,
      header: { orgNameAr: 'ترويسة', orgNameEn: 'Header', branchCode: 'HQ' },
      generatedAt: '2026-01-01T00:00:00.000Z',
    })
  ),
}));

const kpiMock = vi.hoisted(() => ({
  getConsolidatedKPIs: vi.fn(),
}));

vi.mock('../reporting.engine', () => ({
  KPIEngine: { getConsolidatedKPIs: kpiMock.getConsolidatedKPIs },
}));

import { InstitutionalReportsEngine } from '../institutional-reports.engine';

beforeEach(() => {
  vi.clearAllMocks();
  dbMock.queryOne.mockResolvedValue(null);
  dbMock.queryMany.mockResolvedValue([]);
});

describe('generateBudgetVarianceReport (IPSAS 24)', () => {
  it('computes variance, utilization and overspend flags', async () => {
    dbMock.queryMany.mockResolvedValue([
      { id: 'l1', allocated_budget: 1000, spent_amount: 1200, account_code: '6101' },
      { id: 'l2', allocated_budget: 2000, spent_amount: 500, account_code: '6102' },
    ]);
    const r = await InstitutionalReportsEngine.generateBudgetVarianceReport('org-1', {});
    expect(r.totals.totalAllocated).toBe(3000);
    expect(r.totals.totalSpent).toBe(1700);
    expect(r.totals.totalVariance).toBe(1300);
    expect(r.lines[0].status).toBe('OVERSPENT');
    expect(r.lines[1].status).toBe('ON_TRACK');
    expect(r.standard).toBe('IPSAS 24');
  });
});

describe('generateDonorReport', () => {
  it('aggregates pledged vs received and campaign progress', async () => {
    dbMock.queryMany
      .mockResolvedValueOnce([{ id: 'd1', name_ar: 'مانح' }])
      .mockResolvedValueOnce([{ id: 'g1', total_amount: 5000 }])
      .mockResolvedValueOnce([{ grant_id: 'g1', expected_total: 5000, received_total: 3000 }])
      .mockResolvedValueOnce([{ id: 'c1', target_amount: 1000, raised_amount: 250 }]);
    dbMock.queryOne.mockResolvedValue({ total_donations: 900, donation_count: 9 });
    const r = await InstitutionalReportsEngine.generateDonorReport('org-1', {});
    expect(r.summary.totalPledged).toBe(5000);
    expect(r.summary.totalReceived).toBe(3000);
    expect(r.summary.collectionRate).toBe(60);
    expect(r.campaigns[0].progressPercent).toBe(25);
  });
});

describe('generateCashFlowReport (IPSAS 2)', () => {
  it('nets monthly inflows against outflows', async () => {
    dbMock.queryMany.mockResolvedValue([
      { month: '2026-01', inflows: 1000, outflows: 400 },
      { month: '2026-02', inflows: 500, outflows: 700 },
    ]);
    const r = await InstitutionalReportsEngine.generateCashFlowReport('org-1', {});
    expect(r.totals).toEqual({ totalInflows: 1500, totalOutflows: 1100, netFlow: 400 });
    expect(r.months[1].netFlow).toBe(-200);
  });
});

describe('generateTrialBalanceReport', () => {
  it('balances sliced ledger lines and flags imbalance', async () => {
    dbMock.queryMany.mockResolvedValue([
      { account_id: 'a1', account_code: '1101', name_ar: 'نقدية', total_debit: 10, total_credit: 10 },
    ]);
    const ok = await InstitutionalReportsEngine.generateTrialBalanceReport('org-1', {});
    expect(ok.dataQuality.valid).toBe(true);
    expect(ok.summary).toEqual({ totalDebit: 10, totalCredit: 10, variance: 0, isBalanced: true });
    expect(ok.slices).toEqual({ branchCode: null, projectId: null, activityId: null });

    dbMock.queryMany.mockResolvedValue([
      { account_id: 'a1', account_code: '1101', name_ar: 'نقدية', total_debit: 10, total_credit: 9 },
    ]);
    const bad = await InstitutionalReportsEngine.generateTrialBalanceReport('org-1', { branchCode: 'TAIZ' });
    expect(bad.dataQuality.valid).toBe(false);
    expect(bad.dataQuality.warnings).toEqual(['Ledger out of balance']);
    expect(bad.slices.branchCode).toBe('TAIZ');
  });
});

describe('generateFinanceScorecard', () => {
  it('verdicts five pillars with explicit scopes', async () => {
    dbMock.queryMany.mockResolvedValue([
      { account_id: 'a1', account_code: '1101', name_ar: 'نقدية', total_debit: 50, total_credit: 50 },
    ]);
    dbMock.queryOne
      .mockResolvedValueOnce({ allocated: 1000, spent: 900 })
      .mockResolvedValueOnce({ tx: 0, je: 1 })
      .mockResolvedValueOnce({ outstanding: 500, count: 2 })
      .mockResolvedValueOnce({ received: 800, expected: 1000 });
    const r = await InstitutionalReportsEngine.generateFinanceScorecard('org-1', { branchCode: 'HQ' });
    expect(r.pillars).toHaveLength(5);
    expect(r.pillars.every((p) => p.scope)).toBe(true);
    expect(r.fails).toBe(0);
    expect(r.warnings).toBe(2);
    expect(r.pillars[0].verdict).toBe('PASS');
    expect(r.pillars[4].verdict).toBe('PASS');
  });
});

describe('generateExecutiveBrief', () => {
  it('composes KPIs with budget and donor counts', async () => {
    kpiMock.getConsolidatedKPIs.mockResolvedValue({ projects: { total: 5 } });
    dbMock.queryOne
      .mockResolvedValueOnce({ allocated: 10000, spent: 2500 })
      .mockResolvedValueOnce({ donor_count: 4 });
    const r = await InstitutionalReportsEngine.generateExecutiveBrief('org-1');
    expect(r.kpis.projects.total).toBe(5);
    expect(r.budget.utilizationPercent).toBe(25);
    expect(r.activeDonors).toBe(4);
  });
});

describe('generateAuditActivityReport', () => {
  it('returns grouped actions and latest entries', async () => {
    dbMock.queryMany
      .mockResolvedValueOnce([{ action: 'LOGIN', status: 'success', count: 3 }])
      .mockResolvedValueOnce([{ action: 'LOGIN', table_name: 'users', status: 'success' }]);
    const r = await InstitutionalReportsEngine.generateAuditActivityReport('org-1', {});
    expect(r.byAction[0].action).toBe('LOGIN');
    expect(r.latest.length).toBe(1);
  });
});
