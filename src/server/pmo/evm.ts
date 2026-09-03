// ═══════════════════════════════════════════════════════════════════════════════
// UAMEX ERP™ - Project Management Office (PMO) Module
// Earned Value Management Engine - NEB-04 Project Management OS
// ═══════════════════════════════════════════════════════════════════════════════
//
// © 2026 Rohamaa Baynahum Charity Foundation - UAMEX ERP™
// One Platform. One Organization. One Vision.
//
// Earned Value Management (EVM) Implementation per PMBOK® Guide 7th Edition
// Supports all EAC forecasting methods, performance indices, and variance analysis
// ═══════════════════════════════════════════════════════════════════════════════

import type {
  EarnedValueData,
  EACMethod,
} from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Result Types (Engine-Specific)
// ─────────────────────────────────────────────────────────────────────────────

export interface EVMResult {
  scheduleVariance: number;
  costVariance: number;
  schedulePerformanceIndex: number;
  costPerformanceIndex: number;
  estimateAtCompletion: number;
  estimateToComplete: number;
  varianceAtCompletion: number;
  toCompleteCostPerformanceIndex: number;
  percentComplete: number;
  healthStatus: 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'CRITICAL';
  trend: 'IMPROVING' | 'STABLE' | 'DETERIORATING';
  recommendations: string[];
  alerts: string[];
}

export interface ForecastScenarioResult {
  method: EACMethod;
  estimateAtCompletion: number;
  estimateToComplete: number;
  varianceFromBudget: number;
  variancePercent: number;
  isOnTrack: boolean;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
}

export interface HealthStatus {
  status: 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'CRITICAL';
  costHealth: 'GOOD' | 'WARNING' | 'BAD';
  scheduleHealth: 'GOOD' | 'WARNING' | 'BAD';
  healthScore: number;
  recommendations: string[];
  alerts: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// EVM Engine Core
// ─────────────────────────────────────────────────────────────────────────────

export class EarnedValueEngine {
  /**
   * Calculate complete Earned Value Management metrics
   * Implements PMBOK® Guide 7th Edition EVM formulas
   */
  calculateEVM(data: EarnedValueData): EVMResult {
    const { plannedValue, earnedValue, actualCost, totalBudgetAtCompletion } = data;

    // Cost Metrics
    const costVariance = earnedValue - actualCost;
    const costPerformanceIndex = actualCost > 0 ? earnedValue / actualCost : 1;

    // Schedule Metrics
    const scheduleVariance = earnedValue - plannedValue;
    const schedulePerformanceIndex = plannedValue > 0 ? earnedValue / plannedValue : 1;

    // Forecast Indices
    const remainingBudget = totalBudgetAtCompletion - actualCost;
    const toCompleteCostPerformanceIndex =
      remainingBudget > 0
        ? remainingBudget / Math.max(0.001, totalBudgetAtCompletion - earnedValue)
        : 0;

    // Estimates (use typical method as default)
    const estimateAtCompletion = this.calculateEAC(
      earnedValue,
      actualCost,
      totalBudgetAtCompletion,
      'TYPICAL'
    );
    const estimateToComplete = Math.max(0, estimateAtCompletion - actualCost);
    const varianceAtCompletion = totalBudgetAtCompletion - estimateAtCompletion;

    // Percent complete (based on EV/PV)
    const percentComplete = plannedValue > 0 
      ? Math.min(100, (earnedValue / Math.max(plannedValue, earnedValue)) * 100)
      : 0;

    // Health assessment
    const health = this.assessHealth(costPerformanceIndex, schedulePerformanceIndex);
    const alerts = this.generateAlerts(costPerformanceIndex, schedulePerformanceIndex, varianceAtCompletion);

    return {
      scheduleVariance,
      costVariance,
      schedulePerformanceIndex: Math.round(schedulePerformanceIndex * 1000) / 1000,
      costPerformanceIndex: Math.round(costPerformanceIndex * 1000) / 1000,
      estimateAtCompletion: Math.round(estimateAtCompletion * 100) / 100,
      estimateToComplete: Math.round(estimateToComplete * 100) / 100,
      varianceAtCompletion: Math.round(varianceAtCompletion * 100) / 100,
      toCompleteCostPerformanceIndex: Math.round(toCompleteCostPerformanceIndex * 1000) / 1000,
      percentComplete: Math.round(percentComplete * 100) / 100,
      healthStatus: health.status,
      trend: data.trend,
      recommendations: health.recommendations,
      alerts,
    };
  }

  /**
   * Calculate Estimate At Completion (EAC) using various methods
   * Per PMBOK® Guide forecasting techniques
   */
  calculateEAC(
    earnedValue: number,
    actualCost: number,
    budgetAtCompletion: number,
    method: EACMethod = 'TYPICAL'
  ): number {
    if (actualCost <= 0 || earnedValue <= 0) {
      return budgetAtCompletion;
    }

    const cpi = earnedValue / actualCost;

    switch (method) {
      case 'TYPICAL':
        // EAC = BAC / CPI (future work at current efficiency)
        return cpi > 0 ? budgetAtCompletion / cpi : budgetAtCompletion;

      case 'ATYPICAL':
        // EAC = AC + (BAC - EV) (future work at planned rate)
        return actualCost + (budgetAtCompletion - earnedValue);

      case 'BEST_CASE':
        // EAC = AC + (BAC - EV) / CPI (blended efficiency)
        return cpi > 0
          ? actualCost + (budgetAtCompletion - earnedValue) / cpi
          : budgetAtCompletion;

      case 'MANUAL':
      default:
        return budgetAtCompletion;
    }
  }

  /**
   * Calculate Estimate To Complete (ETC)
   */
  calculateETC(
    earnedValue: number,
    actualCost: number,
    budgetAtCompletion: number,
    method: EACMethod = 'TYPICAL'
  ): number {
    const eac = this.calculateEAC(earnedValue, actualCost, budgetAtCompletion, method);
    return Math.max(0, eac - actualCost);
  }

  /**
   * Calculate To-Complete Performance Index (TCPI)
   */
  calculateTCPI(
    earnedValue: number,
    actualCost: number,
    budgetAtCompletion: number
  ): number {
    const remainingBudget = budgetAtCompletion - actualCost;
    const remainingWork = budgetAtCompletion - earnedValue;
    return remainingWork > 0 ? remainingBudget / remainingWork : 0;
  }

  /**
   * Generate forecast scenarios with multiple EAC methods
   */
  generateForecastScenarios(data: EarnedValueData): ForecastScenarioResult[] {
    const { earnedValue, actualCost, totalBudgetAtCompletion } = data;
    const methods: EACMethod[] = ['TYPICAL', 'ATYPICAL', 'BEST_CASE', 'MANUAL'];
    const descriptions: Record<EACMethod, string> = {
      TYPICAL: 'Future work performed at current efficiency (EAC = BAC/CPI)',
      ATYPICAL: 'Future work performed at planned rate (EAC = AC + BAC - EV)',
      BEST_CASE: 'Blended efficiency approach (EAC = AC + (BAC-EV)/CPI)',
      MANUAL: 'Manual/Management estimate',
    };

    return methods.map(method => {
      const eac = this.calculateEAC(earnedValue, actualCost, totalBudgetAtCompletion, method);
      const etc = this.calculateETC(earnedValue, actualCost, totalBudgetAtCompletion, method);
      const variance = totalBudgetAtCompletion - eac;
      const variancePercent = totalBudgetAtCompletion > 0
        ? (variance / totalBudgetAtCompletion) * 100
        : 0;

      return {
        method,
        estimateAtCompletion: Math.round(eac * 100) / 100,
        estimateToComplete: Math.round(etc * 100) / 100,
        varianceFromBudget: Math.round(variance * 100) / 100,
        variancePercent: Math.round(variancePercent * 100) / 100,
        isOnTrack: Math.abs(variancePercent) <= 5,
        confidence: this.calculateConfidence(method, earnedValue, actualCost, totalBudgetAtCompletion),
        description: descriptions[method],
      };
    });
  }

  /**
   * Calculate confidence level for EAC method
   */
  private calculateConfidence(
    method: EACMethod,
    earnedValue: number,
    actualCost: number,
    budgetAtCompletion: number
  ): 'HIGH' | 'MEDIUM' | 'LOW' {
    const cpi = actualCost > 0 && earnedValue > 0 ? earnedValue / actualCost : 1;
    const percentComplete = budgetAtCompletion > 0 ? earnedValue / budgetAtCompletion : 0;

    switch (method) {
      case 'TYPICAL':
        if (percentComplete >= 0.5 && cpi >= 0.8 && cpi <= 1.2) return 'HIGH';
        if (percentComplete >= 0.25) return 'MEDIUM';
        return 'LOW';
      case 'ATYPICAL':
        return percentComplete >= 0.3 ? 'MEDIUM' : 'LOW';
      case 'BEST_CASE':
        return percentComplete >= 0.2 ? 'MEDIUM' : 'LOW';
      case 'MANUAL':
      default:
        return 'LOW';
    }
  }

  /**
   * Assess project health status
   */
  private assessHealth(
    costPerformanceIndex: number,
    schedulePerformanceIndex: number
  ): {
    status: 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'CRITICAL';
    recommendations: string[];
  } {
    const recommendations: string[] = [];

    let status: 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'CRITICAL';

    if (costPerformanceIndex < 0.8 || schedulePerformanceIndex < 0.8) {
      status = 'CRITICAL';
      recommendations.push('Immediate intervention required - performance indices below 0.8');
      recommendations.push('Conduct project recovery review with steering committee');
      recommendations.push('Re-baseline scope and schedule if necessary');
    } else if (costPerformanceIndex < 0.9 || schedulePerformanceIndex < 0.9) {
      status = 'BEHIND';
      recommendations.push('Performance below acceptable threshold');
      recommendations.push('Implement corrective actions to improve cost/schedule');
    } else if (costPerformanceIndex < 0.95 || schedulePerformanceIndex < 0.95) {
      status = 'AT_RISK';
      recommendations.push('Performance trending downward');
      recommendations.push('Increase monitoring frequency');
      recommendations.push('Consider preventive measures');
    } else {
      status = 'ON_TRACK';
      if (costPerformanceIndex > 1.1 && schedulePerformanceIndex > 1.1) {
        recommendations.push('Project ahead of plan - consider resource reallocation');
      } else {
        recommendations.push('Continue current execution approach');
      }
    }

    return { status, recommendations };
  }

  /**
   * Generate alerts based on EVM metrics
   */
  private generateAlerts(
    cpi: number,
    spi: number,
    vac: number
  ): string[] {
    const alerts: string[] = [];

    if (cpi < 0.7) alerts.push('🔴 CRITICAL: Cost performance severely below plan (CPI < 0.7)');
    else if (cpi < 0.85) alerts.push('🟠 WARNING: Cost performance below threshold');

    if (spi < 0.7) alerts.push('🔴 CRITICAL: Schedule performance severely behind (SPI < 0.7)');
    else if (spi < 0.85) alerts.push('🟠 WARNING: Schedule performance below threshold');

    if (vac < -budgetVarianceThreshold(cpi)) {
      alerts.push('🔴 Project will exceed budget significantly at completion');
    }

    return alerts;
  }

  /**
   * Compare two EVM snapshots to determine trend
   */
  analyzeTrend(
    current: EVMResult,
    previous: EVMResult
  ): 'IMPROVING' | 'STABLE' | 'DETERIORATING' {
    const cpiChange = current.costPerformanceIndex - previous.costPerformanceIndex;
    const spiChange = current.schedulePerformanceIndex - previous.schedulePerformanceIndex;

    const avgChange = (cpiChange + spiChange) / 2;

    if (avgChange > 0.03) return 'IMPROVING';
    if (avgChange < -0.03) return 'DETERIORATING';
    return 'STABLE';
  }

  /**
   * Calculate productivity index (work performed vs time elapsed)
   */
  calculateProductivityIndex(
    earnedValue: number,
    plannedValue: number,
    percentTimeElapsed: number
  ): number {
    if (percentTimeElapsed <= 0) return 0;
    const actualProgress = plannedValue > 0 ? earnedValue / plannedValue : 0;
    return actualProgress / percentTimeElapsed;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function budgetVarianceThreshold(cpi: number): number {
  // Estimate variance threshold based on CPI
  return -50000 * (1 - cpi);
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory Functions
// ─────────────────────────────────────────────────────────────────────────────

export function createEVMEngine(): EarnedValueEngine {
  return new EarnedValueEngine();
}

export function calculateEVM(data: EarnedValueData): EVMResult {
  const engine = new EarnedValueEngine();
  return engine.calculateEVM(data);
}

export function calculateEAC(
  earnedValue: number,
  actualCost: number,
  budgetAtCompletion: number,
  method: EACMethod = 'TYPICAL'
): number {
  const engine = new EarnedValueEngine();
  return engine.calculateEAC(earnedValue, actualCost, budgetAtCompletion, method);
}
