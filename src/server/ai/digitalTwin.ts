// ═══════════════════════════════════════════════════════════════════
// UAMEX ERP™ — Sovereign AI Core™ (NEB-13)
// Digital Twin Engine — Simulation for Humanitarian Operations
// Monte Carlo + Predictive Impact + Sphere/CHS Standard Evaluation
// ═══════════════════════════════════════════════════════════════════

import crypto from 'crypto';
import { getPool } from '../core/database';
import logger from '../core/logger';
import { createAIRouter } from './router';
import type { SimulationRequest, SimulationResult } from './router';

function toErrorObject(err: unknown): { name: string; message: string; stack?: string; code?: string } {
  if (err instanceof Error) {
    const e = err as Error & { code?: string };
    return { name: e.name, message: e.message, stack: e.stack, code: e.code };
  }
  return { name: 'UnknownError', message: String(err) };
}

/** Simulation outcome */
interface Outcome {
  outcome: string;
  probability: number;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  magnitude: number;  // 0-100
  details: string;
}

/** Field operation scenario */
interface FieldScenario {
  scenarioId: string;
  name: string;
  sector: 'FOOD' | 'WASH' | 'HEALTH' | 'EDUCATION' | 'SHELTER' | 'PROTECTION';
  targetPopulation: number;
  budget: number;
  durationMonths: number;
  geography: {
    country: string;
    region: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  };
  resources: {
    staff: number;
    vehicles: number;
    partners: number;
  };
}

/**
 * Digital Twin Engine — Simulates humanitarian operations
 * - Monte Carlo simulation
 * - Sphere/CHS impact assessment
 * - Predictive budget analysis
 * - Risk-adjusted outcomes
 */
export class DigitalTwinEngine {
  private router = createAIRouter();
  private pool: ReturnType<typeof getPool>;

  constructor() {
    this.pool = getPool();
  }

  /**
   * Run a full field operation simulation
   */
  async simulateFieldOperation(scenario: FieldScenario): Promise<{
    simulationId: string;
    scenario: FieldScenario;
    outcomes: Outcome[];
    recommendations: string[];
    riskAssessment: {
      overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
      riskScore: number;
      keyRisks: string[];
    };
    impactProjection: {
      beneficiariesReached: number;
      costPerBeneficiary: number;
      sphereIndicators: Array<{ code: string; met: boolean; value: number }>;
      chsIndicators: Array<{ code: string; met: boolean; value: number }>;
    };
    budgetAnalysis: {
      totalBudget: number;
      projectedSpend: number;
      variance: number;
      costBreakdown: Record<string, number>;
    };
    monteCarloRuns: number;
    confidenceScore: number;
    ranAt: string;
    durationMs: number;
  }> {
    const simulationId = crypto.randomUUID();
    const startTime = Date.now();
    const monteCarloRuns = 1000;

    logger.info(`[Digital Twin] Starting simulation ${simulationId}`, {
      meta: { scenario: scenario.name, sector: scenario.sector }
    });

    // 1. Run Monte Carlo simulation
    const simulations = this.runMonteCarlo(scenario, monteCarloRuns);

    // 2. Analyze outcomes
    const outcomes = this.analyzeOutcomes(simulations);
    
    // 3. Risk assessment
    const riskAssessment = this.assessRisk(scenario, simulations);
    
    // 4. Impact projection
    const impactProjection = this.projectImpact(scenario, simulations);
    
    // 5. Budget analysis
    const budgetAnalysis = this.analyzeBudget(scenario, simulations);

    // 6. AI-enhanced recommendations
    const recommendations = await this.generateRecommendations(scenario, {
      outcomes,
      riskAssessment,
      impactProjection,
      budgetAnalysis,
    });

    const confidenceScore = this.calculateConfidence(simulations);

    const result = {
      simulationId,
      scenario,
      outcomes,
      recommendations,
      riskAssessment,
      impactProjection,
      budgetAnalysis,
      monteCarloRuns,
      confidenceScore,
      ranAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    };

    // Persist simulation result
    await this.persistSimulation(result);

    logger.info(`[Digital Twin] Simulation ${simulationId} complete`, {
      meta: { durationMs: result.durationMs, confidence: confidenceScore }
    });

    return result;
  }

  /**
   * Monte Carlo simulation — runs scenario N times with random variations
   */
  private runMonteCarlo(scenario: FieldScenario, runs: number): Array<{
    beneficiariesReached: number;
    costPerBeneficiary: number;
    riskScore: number;
    success: boolean;
    sphereCompliance: number;  // 0-100
    chsCompliance: number;     // 0-100
  }> {
    const results = [];

    for (let i = 0; i < runs; i++) {
      // Add random variation to scenario parameters
      const variation = this.generateRandomVariation();
      
      const effectivePopulation = scenario.targetPopulation * (0.7 + variation * 0.6);
      const effectiveReach = Math.min(
        effectivePopulation,
        scenario.targetPopulation * (0.5 + variation * 0.5)
      );
      
      const baseCost = scenario.budget;
      const costVariance = 1 + (variation - 0.5) * 0.4; // ±20% cost variance
      const projectedCost = baseCost * costVariance;
      const costPerBeneficiary = projectedCost / Math.max(effectiveReach, 1);

      // Risk factors
      const riskFactors = {
        geography: scenario.geography.riskLevel === 'EXTREME' ? 0.9 : 
                  scenario.geography.riskLevel === 'HIGH' ? 0.7 :
                  scenario.geography.riskLevel === 'MEDIUM' ? 0.4 : 0.1,
        budget: projectedCost > scenario.budget * 1.2 ? 0.5 : 0.1,
        resources: scenario.resources.staff < scenario.targetPopulation / 1000 ? 0.3 : 0.05,
      };
      const riskScore = (riskFactors.geography + riskFactors.budget + riskFactors.resources) / 3;

      // Compliance scores (Sphere/CHS)
      const sphereCompliance = this.simulateSphereCompliance(scenario, variation);
      const chsCompliance = this.simulateCHSCompliance(scenario, variation);

      const success = sphereCompliance >= 80 && chsCompliance >= 80 && riskScore < 0.5;

      results.push({
        beneficiariesReached: Math.round(effectiveReach),
        costPerBeneficiary: Math.round(costPerBeneficiary),
        riskScore: Math.min(1, riskScore),
        success,
        sphereCompliance: Math.round(sphereCompliance),
        chsCompliance: Math.round(chsCompliance),
      });
    }

    return results;
  }

  /** Generate random variation factor (0-1) using Box-Muller transform */
  private generateRandomVariation(): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return Math.max(0, Math.min(1, (z + 3) / 6)); // Normalize to 0-1
  }

  /** Simulate Sphere compliance */
  private simulateSphereCompliance(scenario: FieldScenario, variation: number): number {
    let score = 100;
    
    // Water access
    if (scenario.sector === 'WASH' || scenario.sector === 'FOOD') {
      const waterAccess = 15 * (0.8 + variation * 0.4); // 12-18 L/person
      if (waterAccess < 15) score -= 20;
    }
    
    // Food security
    if (scenario.sector === 'FOOD') {
      const kcal = 2100 * (0.85 + variation * 0.3);
      if (kcal < 2100) score -= 15;
    }
    
    // Budget adequacy
    const costPerBeneficiary = scenario.budget / scenario.targetPopulation;
    if (costPerBeneficiary < 50) score -= 10; // Insufficient budget
    
    return Math.max(0, Math.min(100, score));
  }

  /** Simulate CHS compliance */
  private simulateCHSCompliance(scenario: FieldScenario, variation: number): number {
    let score = 100;
    
    // Community participation
    if (variation < 0.3) score -= 15; // Poor community engagement
    
    // Complaint mechanism
    if (scenario.resources.staff < 5) score -= 10; // Insufficient staff for feedback
    
    // M&E capacity
    if (scenario.budget < 100000) score -= 5;
    
    return Math.max(0, Math.min(100, score));
  }

  /** Analyze Monte Carlo outcomes */
  private analyzeOutcomes(simulations: Array<{ success: boolean }>): Outcome[] {
    const successCount = simulations.filter(s => s.success).length;
    const successRate = successCount / simulations.length;

    return [
      {
        outcome: 'Full success — meets Sphere/CHS standards',
        probability: successRate * 0.7,
        impact: 'POSITIVE',
        magnitude: 90,
        details: `${(successRate * 100).toFixed(1)}% probability of full success`,
      },
      {
        outcome: 'Partial success — meets minimum standards',
        probability: (1 - successRate) * 0.6,
        impact: 'NEUTRAL',
        magnitude: 60,
        details: 'Achieves core objectives with quality gaps',
      },
      {
        outcome: 'Underperformance — below Sphere/CHS',
        probability: (1 - successRate) * 0.3,
        impact: 'NEGATIVE',
        magnitude: 30,
        details: 'Risk of non-compliance with humanitarian standards',
      },
      {
        outcome: 'Critical failure — operational breakdown',
        probability: (1 - successRate) * 0.1,
        impact: 'NEGATIVE',
        magnitude: 10,
        details: 'Requires immediate intervention and contingency activation',
      },
    ];
  }

  /** Risk assessment */
  private assessRisk(scenario: FieldScenario, simulations: any[]): {
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    riskScore: number;
    keyRisks: string[];
  } {
    const avgRisk = simulations.reduce((sum, s) => sum + s.riskScore, 0) / simulations.length;
    const riskScore = Math.round(avgRisk * 100);
    
    const overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' = 
      riskScore >= 75 ? 'EXTREME' :
      riskScore >= 50 ? 'HIGH' :
      riskScore >= 25 ? 'MEDIUM' : 'LOW';

    const keyRisks: string[] = [];
    if (scenario.geography.riskLevel === 'HIGH' || scenario.geography.riskLevel === 'EXTREME') {
      keyRisks.push('High-risk operational geography (security/access)');
    }
    if (scenario.budget / scenario.targetPopulation < 50) {
      keyRisks.push('Insufficient budget per beneficiary');
    }
    if (scenario.resources.staff < scenario.targetPopulation / 1000) {
      keyRisks.push('Insufficient staffing capacity');
    }
    if (keyRisks.length === 0) {
      keyRisks.push('No major risks identified');
    }

    return { overallRisk, riskScore, keyRisks };
  }

  /** Impact projection */
  private projectImpact(scenario: FieldScenario, simulations: any[]): {
    beneficiariesReached: number;
    costPerBeneficiary: number;
    sphereIndicators: Array<{ code: string; met: boolean; value: number }>;
    chsIndicators: Array<{ code: string; met: boolean; value: number }>;
  } {
    const avgReached = simulations.reduce((s, x) => s + x.beneficiariesReached, 0) / simulations.length;
    const avgCost = simulations.reduce((s, x) => s + x.costPerBeneficiary, 0) / simulations.length;
    const avgSphere = simulations.reduce((s, x) => s + x.sphereCompliance, 0) / simulations.length;
    const avgCHS = simulations.reduce((s, x) => s + x.chsCompliance, 0) / simulations.length;

    return {
      beneficiariesReached: Math.round(avgReached),
      costPerBeneficiary: Math.round(avgCost),
      sphereIndicators: [
        { code: 'SPHERE-W1.1', met: scenario.sector === 'WASH' && scenario.budget / scenario.targetPopulation >= 50, value: avgSphere },
        { code: 'SPHERE-F1.1', met: scenario.sector === 'FOOD' && scenario.budget / scenario.targetPopulation >= 100, value: avgSphere },
        { code: 'SPHERE-S1.1', met: scenario.sector === 'SHELTER' && scenario.budget / scenario.targetPopulation >= 200, value: avgSphere },
      ],
      chsIndicators: [
        { code: 'CHS-C1', met: scenario.resources.staff >= 5, value: avgCHS },
        { code: 'CHS-C4', met: true, value: avgCHS },
        { code: 'CHS-C5', met: scenario.resources.staff >= 3, value: avgCHS },
      ],
    };
  }

  /** Budget analysis */
  private analyzeBudget(scenario: FieldScenario, simulations: any[]): {
    totalBudget: number;
    projectedSpend: number;
    variance: number;
    costBreakdown: Record<string, number>;
  } {
    const avgCostPerBeneficiary = simulations.reduce((s, x) => s + x.costPerBeneficiary, 0) / simulations.length;
    const projectedSpend = avgCostPerBeneficiary * Math.round(simulations.reduce((s, x) => s + x.beneficiariesReached, 0) / simulations.length);
    const variance = projectedSpend - scenario.budget;

    return {
      totalBudget: scenario.budget,
      projectedSpend: Math.round(projectedSpend),
      variance: Math.round(variance),
      costBreakdown: {
        personnel: Math.round(projectedSpend * 0.40),
        logistics: Math.round(projectedSpend * 0.20),
        supplies: Math.round(projectedSpend * 0.25),
        monitoring: Math.round(projectedSpend * 0.08),
        contingency: Math.round(projectedSpend * 0.07),
      },
    };
  }

  /** AI-enhanced recommendations */
  private async generateRecommendations(
    scenario: FieldScenario,
    analysis: {
      outcomes: Outcome[];
      riskAssessment: { overallRisk: string; keyRisks: string[] };
      impactProjection: { beneficiariesReached: number; sphereIndicators: any[]; chsIndicators: any[] };
      budgetAnalysis: { variance: number; costBreakdown: Record<string, number> };
    }
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Risk-based recommendations
    if (analysis.riskAssessment.overallRisk === 'HIGH' || analysis.riskAssessment.overallRisk === 'EXTREME') {
      recommendations.push('Increase contingency budget by 15% for high-risk operations');
      recommendations.push('Establish security protocols and rapid response team');
    }

    // Sphere compliance
    const unmetSphere = analysis.impactProjection.sphereIndicators.filter(i => !i.met);
    if (unmetSphere.length > 0) {
      recommendations.push(`Address Sphere indicators: ${unmetSphere.map(i => i.code).join(', ')}`);
    }

    // CHS compliance
    const unmetCHS = analysis.impactProjection.chsIndicators.filter(i => !i.met);
    if (unmetCHS.length > 0) {
      recommendations.push(`Strengthen CHS commitments: ${unmetCHS.map(i => i.code).join(', ')}`);
    }

    // Budget variance
    if (analysis.budgetAnalysis.variance > scenario.budget * 0.1) {
      recommendations.push('Budget overrun projected — consider phased implementation or additional funding');
    } else if (analysis.budgetAnalysis.variance < -scenario.budget * 0.1) {
      recommendations.push('Significant budget surplus — opportunity to expand beneficiary reach');
    }

    // Sector-specific
    if (scenario.sector === 'WASH' && scenario.budget / scenario.targetPopulation < 50) {
      recommendations.push('Increase per-capita budget for WASH interventions to meet Sphere minimum');
    }

    // Try to get AI-enhanced recommendation (if API available)
    try {
      const aiRec = await this.router.route({
        taskType: 'analysis',
        prompt: `Generate 2-3 specific operational recommendations for: ${scenario.name} in ${scenario.sector} sector. Risk: ${analysis.riskAssessment.overallRisk}. Budget variance: ${analysis.budgetAnalysis.variance}.`,
        tenantId: 'system',
        userId: 'digital-twin',
        temperature: 0.4,
        maxTokens: 300,
      });
      
      // Parse AI recommendations (line-separated)
      const aiRecommendations = aiRec.content.split('\n').filter(l => l.trim().length > 10).slice(0, 3);
      recommendations.push(...aiRecommendations);
    } catch (err) {
      logger.debug('[Digital Twin] AI recommendation enhancement skipped', { error: toErrorObject(err) });
    }

    return recommendations;
  }

  /** Calculate confidence score */
  private calculateConfidence(simulations: any[]): number {
    // Confidence based on outcome distribution
    const variance = this.calculateVariance(simulations.map(s => s.beneficiariesReached));
    const mean = simulations.reduce((s, x) => s + x.beneficiariesReached, 0) / simulations.length;
    const cv = Math.sqrt(variance) / Math.max(mean, 1);
    
    // Lower CV = higher confidence
    return Math.max(0, Math.min(100, Math.round(100 * (1 - cv))));
  }

  /** Calculate variance */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }

  /** Persist simulation result */
  private async persistSimulation(result: any): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO digital_twin_simulations 
         (id, scenario_name, sector, target_population, budget, outcomes, 
          risk_assessment, impact_projection, budget_analysis, monte_carlo_runs, 
          confidence_score, ran_at, duration_ms)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          result.simulationId,
          result.scenario.name,
          result.scenario.sector,
          result.scenario.targetPopulation,
          result.scenario.budget,
          JSON.stringify(result.outcomes),
          JSON.stringify(result.riskAssessment),
          JSON.stringify(result.impactProjection),
          JSON.stringify(result.budgetAnalysis),
          result.monteCarloRuns,
          result.confidenceScore,
          result.ranAt,
          result.durationMs,
        ]
      );
    } catch (err) {
      logger.debug('[Digital Twin] Failed to persist simulation (table may not exist)', { error: toErrorObject(err) });
    }
  }

  /** Get simulation history */
  async getSimulationHistory(limit = 20): Promise<any[]> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM digital_twin_simulations ORDER BY ran_at DESC LIMIT $1`,
        [limit]
      );
      return result.rows;
    } catch {
      return [];
    }
  }
}

/** Factory */
export function createDigitalTwin(): DigitalTwinEngine {
  return new DigitalTwinEngine();
}

export type { FieldScenario, Outcome };
