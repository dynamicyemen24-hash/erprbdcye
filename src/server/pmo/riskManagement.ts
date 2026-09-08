// ═══════════════════════════════════════════════════════════════════════════════
// UAMEX ERP™ - Project Management Office (PMO) Module
// Risk Management Engine - NEB-04 Project Management OS (ISO 31000:2018)
// ═══════════════════════════════════════════════════════════════════════════════
//
// © 2026 Rohamaa Baynahum Charity Foundation - UAMEX ERP™
// One Platform. One Organization. One Vision.
//
// Risk Management Implementation per ISO 31000:2018 and PMBOK® Guide 7th Edition
// ═══════════════════════════════════════════════════════════════════════════════

import { randomInt } from 'crypto';
import { z } from 'zod';
import type {
  Risk,
  RiskCategory,
  RiskLevel,
  RiskStatus,
  ResponseStrategy,
  RiskMatrix,
  RiskMatrixCell,
} from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Engine-Specific Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RiskDashboardData {
  summary: {
    totalRisks: number;
    byStatus: Record<RiskStatus, number>;
    byLevel: Record<RiskLevel, number>;
    averageScore: number;
    totalExposure: number;
    openRisks: number;
  };
  categoryBreakdown: Array<{
    category: RiskCategory;
    count: number;
    averageScore: number;
    highRisksCount: number;
  }>;
  topRisks: Risk[];
  matrix: RiskMatrix;
  complianceStatus: {
    'status': 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT';
    violations: string[];
  };
  recommendations: string[];
}

export interface RiskExposure {
  monetary: number;
  schedule: number;
  quality: number;
  reputation: number;
  total: number;
}

export interface RiskTrend {
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
  newRisksCount: number;
  closedRisksCount: number;
  netChange: number;
  periodDays: number;
}

export interface RiskResponsePlan {
  riskId: string;
  strategy: ResponseStrategy;
  actions: Array<{
    id: string;
    description: string;
    ownerId: string;
    dueDate: string;
    status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
    budget?: number;
  }>;
  contingencyPlan?: {
    trigger: string;
    actions: string[];
    estimatedCost: number;
  };
  estimatedCost: number;
  effectiveness: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Risk Matrix Configuration
// ─────────────────────────────────────────────────────────────────────────────

const RISK_COLORS: Record<RiskLevel, string> = {
  VERY_LOW: '#22c55e',
  LOW: '#84cc16',
  MEDIUM: '#facc15',
  HIGH: '#f97316',
  VERY_HIGH: '#ef4444',
};

const IMPACT_LEVELS: RiskLevel[] = ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'];

// ─────────────────────────────────────────────────────────────────────────────
// Risk Management Engine
// ─────────────────────────────────────────────────────────────────────────────

export class RiskManagementEngine {
  /**
   * Calculate risk score (probability × impact)
   */
  calculateRiskScore(probability: number, impact: RiskLevel): number {
    const impactScore = this.getImpactScore(impact);
    return Math.round(probability * impactScore * 100) / 100;
  }

  /**
   * Convert probability (0-1) and impact level to inherent risk level
   */
  calculateInherentRiskLevel(probability: number, impact: RiskLevel): RiskLevel {
    const score = probability * this.getImpactScore(impact);
    return this.scoreToLevel(score);
  }

  /**
   * Convert numeric score to risk level
   */
  scoreToLevel(score: number): RiskLevel {
    if (score <= 0.2) return 'VERY_LOW';
    if (score <= 0.4) return 'LOW';
    if (score <= 0.6) return 'MEDIUM';
    if (score <= 0.8) return 'HIGH';
    return 'VERY_HIGH';
  }

  /**
   * Get numeric score for impact level
   */
  private getImpactScore(impact: RiskLevel): number {
    const scores: Record<RiskLevel, number> = {
      VERY_LOW: 0.2,
      LOW: 0.4,
      MEDIUM: 0.6,
      HIGH: 0.8,
      VERY_HIGH: 1.0,
    };
    return scores[impact];
  }

  /**
   * Create a new risk entry
   */
  createRisk(params: {
    projectId: string;
    title: string;
    description: string;
    category: RiskCategory;
    probability: number;
    impact: RiskLevel;
    ownerId: string;
    mitigationPlan?: string;
    responseStrategy?: ResponseStrategy;
  }): Risk {
    const riskScore = this.calculateRiskScore(params.probability, params.impact);
    const inherentRiskLevel = this.calculateInherentRiskLevel(params.probability, params.impact);

    return {
      id: `RISK-${Date.now()}-${randomInt(0, 1000)}`,
      projectId: params.projectId,
      riskCode: `R-${Date.now().toString(36).toUpperCase()}`,
      title: params.title,
      description: params.description,
      category: params.category,
      probability: Math.max(0, Math.min(1, params.probability)),
      impact: params.impact,
      riskScore,
      inherentRiskLevel,
      responseStrategy: params.responseStrategy ?? 'MITIGATE',
      mitigationPlan: params.mitigationPlan ?? '',
      contingencyPlan: '',
      ownerId: params.ownerId,
      status: 'IDENTIFIED',
      identifiedDate: new Date().toISOString(),
      triggers: [],
    };
  }

  /**
   * Analyze individual risk with detailed insights
   */
  analyzeRisk(risk: Risk): {
    risk: Risk;
    exposure: RiskExposure;
    urgency: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
    recommendedStrategy: ResponseStrategy;
    recommendedActions: string[];
  } {
    const exposure = this.calculateExposure(risk);
    const urgency = this.determineUrgency(risk);
    const recommendedStrategy = this.recommendStrategy(risk);
    const recommendedActions = this.generateActions(risk);

    return { risk, exposure, urgency, recommendedStrategy, recommendedActions };
  }

  /**
   * Calculate risk exposure across multiple dimensions
   */
  private calculateExposure(risk: Risk): RiskExposure {
    const baseCost = risk.impact === 'VERY_HIGH' ? 100000 :
                     risk.impact === 'HIGH' ? 50000 :
                     risk.impact === 'MEDIUM' ? 20000 :
                     risk.impact === 'LOW' ? 5000 : 1000;

    const baseScheduleDays = risk.impact === 'VERY_HIGH' ? 30 :
                              risk.impact === 'HIGH' ? 14 :
                              risk.impact === 'MEDIUM' ? 7 :
                              risk.impact === 'LOW' ? 3 : 1;

    return {
      monetary: baseCost * risk.probability,
      schedule: baseScheduleDays * risk.probability,
      quality: risk.probability * (risk.impact === 'VERY_HIGH' ? 1 : risk.impact === 'HIGH' ? 0.7 : 0.4),
      reputation: risk.probability * (risk.category === 'REPUTATIONAL' ? 1 : 0.5),
      total: baseCost * risk.probability,
    };
  }

  /**
   * Determine risk urgency
   */
  private determineUrgency(risk: Risk): 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW' {
    if (risk.inherentRiskLevel === 'VERY_HIGH') return 'IMMEDIATE';
    if (risk.inherentRiskLevel === 'HIGH') return 'HIGH';
    if (risk.inherentRiskLevel === 'MEDIUM') return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Recommend response strategy based on risk characteristics
   */
  private recommendStrategy(risk: Risk): ResponseStrategy {
    // Very high risks should be avoided or escalated
    if (risk.inherentRiskLevel === 'VERY_HIGH') {
      if (risk.category === 'REPUTATIONAL' || risk.category === 'EXTERNAL') return 'ESCALATE';
      return 'AVOID';
    }

    // High risks: mitigate or transfer
    if (risk.inherentRiskLevel === 'HIGH') {
      if (risk.impact === 'VERY_HIGH') return 'TRANSFER';
      return 'MITIGATE';
    }

    // Medium risks: mitigate
    if (risk.inherentRiskLevel === 'MEDIUM') {
      return 'MITIGATE';
    }

    // Low risks: accept
    return 'ACCEPT';
  }

  /**
   * Generate recommended actions
   */
  private generateActions(risk: Risk): string[] {
    const actions: string[] = [];

    switch (risk.responseStrategy) {
      case 'AVOID':
        actions.push(`Eliminate the cause of risk "${risk.title}"`);
        actions.push('Modify project plan to avoid risk exposure');
        break;
      case 'MITIGATE':
        actions.push(`Develop mitigation plan for "${risk.title}"`);
        actions.push('Reduce probability through preventive measures');
        actions.push('Reduce impact through controls and safeguards');
        actions.push('Monitor risk triggers and early warning indicators');
        break;
      case 'TRANSFER':
        actions.push('Purchase insurance or warranty');
        actions.push('Outsource to specialized vendor');
        actions.push('Establish contractual risk-sharing arrangements');
        break;
      case 'ACCEPT':
        actions.push('Document risk in risk register');
        actions.push('Establish contingency reserve');
        actions.push('Monitor for changes');
        break;
      case 'ESCALATE':
        actions.push('Notify executive sponsor immediately');
        actions.push('Present to steering committee for decision');
        actions.push('Develop executive-level response plan');
        break;
    }

    return actions;
  }

  /**
   * Generate risk matrix visualization data
   */
  generateRiskMatrix(risks: Risk[]): RiskMatrix {
    const cells: RiskMatrixCell[] = [];

    // Build 5x5 matrix (probability × impact)
    for (let p = 1; p <= 5; p++) {
      for (let i = 0; i < IMPACT_LEVELS.length; i++) {
        const impact = IMPACT_LEVELS[i];
        const prob = p / 5; // 0.2, 0.4, 0.6, 0.8, 1.0
        const score = prob * this.getImpactScore(impact);
        
        const risksInCell = risks.filter(r => {
          const rProbBucket = Math.ceil(r.probability * 5);
          return rProbBucket === p && r.impact === impact;
        });

        cells.push({
          probability: prob,
          impact,
          count: risksInCell.length,
          risks: risksInCell.map(r => r.id),
          color: RISK_COLORS[this.scoreToLevel(score)],
        });
      }
    }

    const highRisks = risks.filter(r => r.inherentRiskLevel === 'HIGH' || r.inherentRiskLevel === 'VERY_HIGH').length;
    const mediumRisks = risks.filter(r => r.inherentRiskLevel === 'MEDIUM').length;
    const lowRisks = risks.filter(r => r.inherentRiskLevel === 'LOW' || r.inherentRiskLevel === 'VERY_LOW').length;

    return {
      projectId: risks[0]?.projectId ?? '',
      date: new Date().toISOString(),
      cells,
      highRisks,
      mediumRisks,
      lowRisks,
      trend: this.calculateTrendDirection(risks),
    };
  }

  /**
   * Calculate trend direction
   */
  private calculateTrendDirection(risks: Risk[]): 'INCREASING' | 'STABLE' | 'DECREASING' {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    const recentRisks = risks.filter(r => new Date(r.identifiedDate) >= thirtyDaysAgo);
    const oldRisks = risks.filter(r => new Date(r.identifiedDate) < thirtyDaysAgo);

    if (recentRisks.length > oldRisks.length * 0.5) return 'INCREASING';
    if (recentRisks.length < oldRisks.length * 0.1) return 'DECREASING';
    return 'STABLE';
  }

  /**
   * Generate comprehensive dashboard data
   */
  generateDashboard(risks: Risk[]): RiskDashboardData {
    const matrix = this.generateRiskMatrix(risks);

    // Status breakdown
    const byStatus: Record<RiskStatus, number> = {
      IDENTIFIED: 0,
      MITIGATED: 0,
      OCCURRED: 0,
      CLOSED: 0,
    };

    // Level breakdown
    const byLevel: Record<RiskLevel, number> = {
      VERY_LOW: 0,
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      VERY_HIGH: 0,
    };

    let totalScore = 0;
    let totalExposure = 0;

    for (const risk of risks) {
      byStatus[risk.status]++;
      byLevel[risk.inherentRiskLevel]++;
      totalScore += risk.riskScore;
      totalExposure += this.calculateExposure(risk).total;
    }

    // Category breakdown
    const categoryMap = new Map<RiskCategory, Risk[]>();
    for (const risk of risks) {
      const existing = categoryMap.get(risk.category) ?? [];
      existing.push(risk);
      categoryMap.set(risk.category, existing);
    }

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, categoryRisks]) => ({
      category,
      count: categoryRisks.length,
      averageScore: categoryRisks.length > 0
        ? Math.round((categoryRisks.reduce((sum, r) => sum + r.riskScore, 0) / categoryRisks.length) * 100) / 100
        : 0,
      highRisksCount: categoryRisks.filter(r => r.inherentRiskLevel === 'HIGH' || r.inherentRiskLevel === 'VERY_HIGH').length,
    }));

    // Top risks
    const topRisks = [...risks].sort((a, b) => b.riskScore - a.riskScore).slice(0, 10);

    // Compliance check
    const complianceStatus = this.checkCompliance(risks);

    // Recommendations
    const recommendations: string[] = [];
    if (matrix.highRisks > 3) {
      recommendations.push('Focus on mitigating high-impact risks first');
    }
    if (byStatus.IDENTIFIED > byStatus.MITIGATED * 2) {
      recommendations.push('Develop response plans for identified risks');
    }
    if (complianceStatus.status !== 'COMPLIANT') {
      recommendations.push('Address risk appetite violations immediately');
    }

    return {
      summary: {
        totalRisks: risks.length,
        byStatus,
        byLevel,
        averageScore: risks.length > 0 ? Math.round((totalScore / risks.length) * 100) / 100 : 0,
        totalExposure: Math.round(totalExposure * 100) / 100,
        openRisks: byStatus.IDENTIFIED + byStatus.OCCURRED,
      },
      categoryBreakdown,
      topRisks,
      matrix,
      complianceStatus,
      recommendations,
    };
  }

  /**
   * Check risk compliance with risk appetite
   */
  private checkCompliance(risks: Risk[]): {
    'status': 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT';
    violations: string[];
  } {
    const violations: string[] = [];

    const veryHighCount = risks.filter(r => r.inherentRiskLevel === 'VERY_HIGH').length;
    const highCount = risks.filter(r => r.inherentRiskLevel === 'HIGH').length;

    if (veryHighCount > 2) {
      violations.push(`${veryHighCount} risks at VERY HIGH level - exceeds appetite`);
    }

    if (highCount > 5) {
      violations.push(`${highCount} risks at HIGH level - approaching limit`);
    }

    // Check for unassigned risks
    const unassigned = risks.filter(r => !r.ownerId).length;
    if (unassigned > 0) {
      violations.push(`${unassigned} risks without assigned owners`);
    }

    // Check for risks without mitigation
    const noMitigation = risks.filter(r => 
      r.status === 'IDENTIFIED' && (!r.mitigationPlan || r.mitigationPlan.length < 10)
    ).length;
    if (noMitigation > 0) {
      violations.push(`${noMitigation} identified risks lack mitigation plans`);
    }

    if (violations.length > 0) {
      return {
        status: veryHighCount > 2 ? 'NON_COMPLIANT' : 'AT_RISK',
        violations,
      };
    }

    return { status: 'COMPLIANT', violations: [] };
  }

  /**
   * Create risk response plan
   */
  createResponsePlan(params: {
    risk: Risk;
    actions: Array<{ description: string; ownerId: string; dueDate: string; budget?: number }>;
    contingencyPlan?: { trigger: string; actions: string[]; estimatedCost: number };
  }): RiskResponsePlan {
    const actions = params.actions.map((action, i) => ({
      id: `ACT-${Date.now()}-${i}`,
      description: action.description,
      ownerId: action.ownerId,
      dueDate: action.dueDate,
      status: 'PLANNED' as const,
      budget: action.budget,
    }));

    const totalCost = actions.reduce((sum, a) => sum + (a.budget ?? 0), 0) +
                     (params.contingencyPlan?.estimatedCost ?? 0);

    return {
      riskId: params.risk.id,
      strategy: params.risk.responseStrategy,
      actions,
      contingencyPlan: params.contingencyPlan,
      estimatedCost: totalCost,
      effectiveness: this.estimateEffectiveness(params.risk, actions.length),
    };
  }

  /**
   * Estimate response plan effectiveness
   */
  private estimateEffectiveness(risk: Risk, actionCount: number): number {
    let baseEffectiveness = 0.5;

    if (actionCount >= 5) baseEffectiveness = 0.8;
    else if (actionCount >= 3) baseEffectiveness = 0.7;
    else if (actionCount >= 1) baseEffectiveness = 0.6;

    // Adjust based on response strategy
    switch (risk.responseStrategy) {
      case 'AVOID': baseEffectiveness *= 1.2; break;
      case 'MITIGATE': baseEffectiveness *= 1.0; break;
      case 'TRANSFER': baseEffectiveness *= 1.1; break;
      case 'ACCEPT': baseEffectiveness *= 0.5; break;
      case 'ESCALATE': baseEffectiveness *= 1.15; break;
    }

    return Math.min(1, Math.round(baseEffectiveness * 100) / 100);
  }

  /**
   * Analyze risk trend over time
   */
  analyzeTrend(risks: Risk[], periodDays: number = 30): RiskTrend {
    const now = new Date();
    const periodStart = new Date(now.getTime() - periodDays * 86400000);

    const newRisks = risks.filter(r => new Date(r.identifiedDate) >= periodStart);
    const closedRisks = risks.filter(r => r.status === 'CLOSED' && new Date(r.identifiedDate) >= periodStart);

    const netChange = newRisks.length - closedRisks.length;

    let trend: RiskTrend['trend'];
    if (netChange > 3) trend = 'INCREASING';
    else if (netChange < -3) trend = 'DECREASING';
    else trend = 'STABLE';

    return {
      trend,
      newRisksCount: newRisks.length,
      closedRisksCount: closedRisks.length,
      netChange,
      periodDays,
    };
  }

  /**
   * Update risk status
   */
  updateRiskStatus(risk: Risk, newStatus: RiskStatus): Risk {
    return {
      ...risk,
      status: newStatus,
    };
  }

  /**
   * Close risk
   */
  closeRisk(risk: Risk): Risk {
    return {
      ...risk,
      status: 'CLOSED',
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Zod Validation Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const RiskInputSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string(),
  category: z.enum(['TECHNICAL', 'SCHEDULE', 'COST', 'QUALITY', 'RESOURCE', 'EXTERNAL', 'LEGAL', 'REPUTATIONAL', 'ENVIRONMENTAL']),
  probability: z.number().min(0).max(1),
  impact: z.enum(['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']),
  ownerId: z.string(),
  responseStrategy: z.enum(['AVOID', 'MITIGATE', 'TRANSFER', 'ACCEPT', 'ESCALATE']).optional(),
  mitigationPlan: z.string().optional(),
});

export const RiskResponsePlanSchema = z.object({
  riskId: z.string(),
  actions: z.array(z.object({
    description: z.string().min(1),
    ownerId: z.string(),
    dueDate: z.string(),
    budget: z.number().optional(),
  })).min(1),
  contingencyPlan: z.object({
    trigger: z.string(),
    actions: z.array(z.string()),
    estimatedCost: z.number(),
  }).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Factory Functions
// ─────────────────────────────────────────────────────────────────────────────

export function createRiskEngine(): RiskManagementEngine {
  return new RiskManagementEngine();
}

export function calculateRiskScore(probability: number, impact: RiskLevel): number {
  const engine = new RiskManagementEngine();
  return engine.calculateRiskScore(probability, impact);
}

export function calculateInherentRiskLevel(probability: number, impact: RiskLevel): RiskLevel {
  const engine = new RiskManagementEngine();
  return engine.calculateInherentRiskLevel(probability, impact);
}
