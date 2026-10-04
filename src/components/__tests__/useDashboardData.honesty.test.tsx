import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDashboardData } from '../dashboard/useDashboardData';

const emptyProps = {
  stats: null,
  lang: 'en' as const,
  programs: [],
  projects: [],
  beneficiaries: [],
  sponsorships: [],
  approvalRequests: []
};

describe('useDashboardData — honest empty state (no fabricated values)', () => {
  it('reports unknown/zero instead of invented fallbacks when there is no data', () => {
    const { result } = renderHook(() => useDashboardData(emptyProps));

    expect(result.current.budgetUtilization).toBeNull();
    expect(result.current.activeProgramsCount).toBe(0);
    expect(result.current.totalProjBudget).toBe(0);
    expect(result.current.monthlyBeneficiaryReach).toBe(0);
    expect(result.current.budgetDistributionData).toEqual([]);
    expect(result.current.projectBudgetData).toEqual([]);

    const health = result.current.healthMetrics;
    expect(health.overallScore).toBeNull();
    expect(health.strategic).toBeNull();
    expect(health.operational).toBeNull();
    expect(health.financial).toBeNull();
    expect(health.risk).toBeNull();
    expect(health.compliance).toBeNull();
    expect(health.impact).toBeNull();
    expect(health.data).toBeNull();
    expect(health.strategicAlignment).toBeNull();
    expect(health.dataConfidence).toBeNull();
  });

  it('never reports the legacy fabricated numbers (418 / 8450 / 76.8 / 45M)', () => {
    const { result } = renderHook(() => useDashboardData(emptyProps));
    const serialized = JSON.stringify({
      ...result.current,
      health: result.current.healthMetrics
    });
    expect(serialized).not.toContain('418');
    expect(serialized).not.toContain('8450');
    expect(serialized).not.toContain('76.8');
    expect(serialized).not.toContain('45000000');
    expect(serialized).not.toContain('4500000');
  });

  it('computes the beneficiary growth series only from real registrations', () => {
    const now = new Date();
    const inWindow = new Date(now.getFullYear(), now.getMonth(), 5);
    const { result } = renderHook(() =>
      useDashboardData({
        ...emptyProps,
        beneficiaries: [
          { created_at: inWindow.toISOString() },
          { created_at: inWindow.toISOString() }
        ]
      })
    );

    const series = result.current.beneficiaryGrowthData;
    expect(series).toHaveLength(12);
    const totalAdded = series.reduce((sum, point) => sum + point.added, 0);
    expect(totalAdded).toBe(2);
    // Cumulative series must be non-decreasing and end at the real total
    for (let i = 1; i < series.length; i++) {
      expect(series[i].cases).toBeGreaterThanOrEqual(series[i - 1].cases);
    }
    expect(series[series.length - 1].cases).toBe(2);
  });

  it('computes health metrics from real records when data exists', () => {
    const { result } = renderHook(() =>
      useDashboardData({
        ...emptyProps,
        programs: [
          { budget: '100000', actual_budget: '50000', progress_percent: '80', status_code: 'active' }
        ],
        projects: [
          { budget: '60000', progress_percent: '40', status_code: 'active', risk_level: 'LOW' }
        ],
        approvalRequests: [
          { status: 'pending' },
          { status: 'approved' }
        ]
      })
    );

    expect(result.current.budgetUtilization).toBe(50);
    expect(result.current.activeProgramsCount).toBe(1);
    expect(result.current.healthMetrics.strategic).not.toBeNull();
    expect(result.current.healthMetrics.compliance).not.toBeNull();
    expect(result.current.pendingApprovalsCount).toBe(1);
  });
});
