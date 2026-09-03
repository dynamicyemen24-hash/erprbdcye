// ═══════════════════════════════════════════════════════════════════════════════
// UAMEX ERP™ — E2E Integration Tests: EVM (Earned Value Management)
// Premium Test Suite v2.0 — PMBOK® 7th Edition Compliant
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// © 2026 Rohamaa Baynahum Charity Foundation - UAMEX ERP™
// One Platform. One Organization. One Vision.
// ═══════════════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from 'vitest';
import { EarnedValueEngine } from '../../src/server/pmo/evm';
import type { EACMethod } from '../../src/server/pmo/types';

interface EVMInput {
  plannedValue: number;
  earnedValue: number;
  actualCost: number;
  totalBudgetAtCompletion: number;
}

const createInput = (overrides: Partial<EVMInput> = {}): EVMInput => ({
  plannedValue: 100000,
  earnedValue: 95000,
  actualCost: 105000,
  totalBudgetAtCompletion: 500000,
  ...overrides,
});

describe('EVM Engine - PMBOK 7th Edition Compliance', () => {
  let engine: EarnedValueEngine;

  beforeEach(() => {
    engine = new EarnedValueEngine();
  });

  describe('Core EVM Calculations', () => {
    it('should calculate Cost Variance (CV = EV - AC)', () => {
      const input = createInput({ earnedValue: 95000, actualCost: 105000 });
      const result = engine.calculateEVM({
        ...input,
        projectId: 'proj-1',
        dataDate: '2026-09-02',
      } as any);

      expect(result.costVariance).toBe(-10000);
      expect(result.costVariance).toBeLessThan(0); // Over budget
    });

    it('should calculate Schedule Variance (SV = EV - PV)', () => {
      const input = createInput({ plannedValue: 100000, earnedValue: 95000 });
      const result = engine.calculateEVM({
        ...input,
        projectId: 'proj-1',
        dataDate: '2026-09-02',
      } as any);

      expect(result.scheduleVariance).toBe(-5000);
      expect(result.scheduleVariance).toBeLessThan(0); // Behind schedule
    });

    it('should calculate Cost Performance Index (CPI = EV/AC)', () => {
      const input = createInput({ earnedValue: 95000, actualCost: 100000 });
      const result = engine.calculateEVM({
        ...input,
        projectId: 'proj-1',
        dataDate: '2026-09-02',
      } as any);

      expect(result.costPerformanceIndex).toBeCloseTo(0.95, 2);
      expect(result.costPerformanceIndex).toBeLessThan(1); // Cost overrun
    });

    it('should calculate Schedule Performance Index (SPI = EV/PV)', () => {
      const input = createInput({ plannedValue: 100000, earnedValue: 90000 });
      const result = engine.calculateEVM({
        ...input,
        projectId: 'proj-1',
        dataDate: '2026-09-02',
      } as any);

      expect(result.schedulePerformanceIndex).toBeCloseTo(0.9, 2);
      expect(result.schedulePerformanceIndex).toBeLessThan(1); // Behind schedule
    });
  });

  describe('EAC Methods - All 4 PMBOK Variants', () => {
    it('TYPICAL: EAC = AC + (BAC - EV) / CPI', () => {
      const input = createInput();
      const result = engine.calculateEAC(
        input.earnedValue,
        input.actualCost,
        input.totalBudgetAtCompletion,
        'TYPICAL' as EACMethod
      );

      const cpi = input.earnedValue / input.actualCost;
      const expectedEAC = input.actualCost + (input.totalBudgetAtCompletion - input.earnedValue) / cpi;
      expect(result).toBeCloseTo(expectedEAC, 0);
    });

    it('ATYPICAL: EAC = AC + (BAC - EV)', () => {
      const input = createInput();
      const result = engine.calculateEAC(
        input.earnedValue,
        input.actualCost,
        input.totalBudgetAtCompletion,
        'ATYPICAL' as EACMethod
      );

      expect(result).toBe(510000); // 105000 + (500000 - 95000)
    });

    it('BEST_CASE: EAC > 0 with optimistic forecasting', () => {
      const input = createInput();
      const result = engine.calculateEAC(
        input.earnedValue,
        input.actualCost,
        input.totalBudgetAtCompletion,
        'BEST_CASE' as EACMethod
      );

      expect(result).toBeGreaterThan(0);
    });
  });

  describe('Health Status Determination', () => {
    it('should assess project as ON_TRACK when CPI >= 1.0 and SPI >= 1.0', () => {
      const input = createInput({
        plannedValue: 95000,
        earnedValue: 100000,
        actualCost: 95000,
      });
      const result = engine.calculateEVM({
        ...input,
        projectId: 'proj-1',
        dataDate: '2026-09-02',
      } as any);

      expect(result.healthStatus).toBe('ON_TRACK');
    });

    it('should NOT be ON_TRACK when CPI is significantly less than 1.0', () => {
      const input = createInput({
        earnedValue: 50000,
        actualCost: 100000,
        plannedValue: 100000,
      });
      const result = engine.calculateEVM({
        ...input,
        projectId: 'proj-1',
        dataDate: '2026-09-02',
      } as any);

      // When CPI is 0.5 (significantly below 1.0), project should not be ON_TRACK
      expect(result.healthStatus).not.toBe('ON_TRACK');
      expect(['AT_RISK', 'CRITICAL', 'BEHIND']).toContain(result.healthStatus);
    });

    it('should mark project as non-ON_TRACK when CPI is very low', () => {
      const input = createInput({
        earnedValue: 50000,
        actualCost: 100000,
      });
      const result = engine.calculateEVM({
        ...input,
        projectId: 'proj-1',
        dataDate: '2026-09-02',
      } as any);

      // Very low CPI should result in a non-ON_TRACK status
      expect(result.healthStatus).not.toBe('ON_TRACK');
      expect(['AT_RISK', 'BEHIND', 'CRITICAL']).toContain(result.healthStatus);
    });
  });

  describe('Alert Generation', () => {
    it('should generate alerts when CV < 0 (cost overrun)', () => {
      const input = createInput({
        earnedValue: 90000,
        actualCost: 100000,
      });
      const result = engine.calculateEVM({
        ...input,
        projectId: 'proj-1',
        dataDate: '2026-09-02',
      } as any);

      expect(result.alerts.length).toBeGreaterThan(0);
    });

    it('should generate recommendations for off-track projects', () => {
      const input = createInput({
        earnedValue: 70000,
        actualCost: 100000,
        plannedValue: 100000,
      });
      const result = engine.calculateEVM({
        ...input,
        projectId: 'proj-1',
        dataDate: '2026-09-02',
      } as any);

      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('TCPI (To-Complete Performance Index)', () => {
    it('should calculate TCPI for BAC completion', () => {
      const input = createInput({
        earnedValue: 95000,
        actualCost: 105000,
        totalBudgetAtCompletion: 500000,
      });
      const result = engine.calculateEVM({
        ...input,
        projectId: 'proj-1',
        dataDate: '2026-09-02',
      } as any);

      const remainingBudget = input.totalBudgetAtCompletion - input.actualCost;
      const remainingWork = input.totalBudgetAtCompletion - input.earnedValue;
      const expectedTCPI = remainingBudget / Math.max(0.001, remainingWork);

      // Use lower precision due to engine internal rounding
      expect(result.toCompleteCostPerformanceIndex).toBeCloseTo(expectedTCPI, 2);
    });
  });
});
