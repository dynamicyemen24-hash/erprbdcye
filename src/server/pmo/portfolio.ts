// ═══════════════════════════════════════════════════════════════════════════════
// UAMEX ERP™ - Project Management Office (PMO) Module
// Portfolio Management Engine - NEB-04 Project Management OS
// ═══════════════════════════════════════════════════════════════════════════════
//
// © 2026 Rohamaa Baynahum Charity Foundation - UAMEX ERP™
// One Platform. One Organization. One Vision.
//
// Portfolio & Program Management per PMBOK® Guide 7th Edition
// Strategic Alignment, Resource Optimization, Prioritization
// ═══════════════════════════════════════════════════════════════════════════════

import { randomInt } from 'crypto';
import type {
  Portfolio,
  Program,
} from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Engine Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ProjectHealthSummary {
  projectId: string;
  projectCode: string;
  projectName: string;
  status: 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'CRITICAL';
  healthScore: number;
  progress: number;
  budgetHealth: number;
  scheduleHealth: number;
  resourceHealth: number;
}

export interface PortfolioHealthDashboard {
  portfolio: Portfolio;
  projectCount: number;
  programCount: number;
  projectHealthSummary: ProjectHealthSummary[];
  budgetAnalysis: {
    totalBudget: number;
    totalSpent: number;
    totalPlannedValue: number;
    totalEarnedValue: number;
    budgetUtilization: number;
    projectedOverrun: number;
    projectedUnderrun: number;
  };
  scheduleAnalysis: {
    onTime: number;
    atRisk: number;
    behind: number;
    averageScheduleVariance: number;
  };
  resourceAnalysis: {
    totalResources: number;
    averageUtilization: number;
    overallocatedProjects: number;
    underutilizedProjects: number;
  };
  riskAnalysis: {
    totalRisks: number;
    highRisks: number;
    mediumRisks: number;
    lowRisks: number;
    averageRiskScore: number;
  };
  overallHealthScore: number;
  healthTrend: 'IMPROVING' | 'STABLE' | 'DETERIORATING';
  recommendations: string[];
}

export interface PortfolioOptimizationResult {
  currentPortfolio: {
    totalValue: number;
    riskAdjustedReturn: number;
    riskScore: number;
    resourceUtilization: number;
  };
  optimizedPortfolio: {
    totalValue: number;
    riskAdjustedReturn: number;
    riskScore: number;
    resourceUtilization: number;
    recommendedActions: Array<{
      type: 'ADD' | 'REMOVE' | 'REPRIORITIZE' | 'RESCHEDULE';
      projectId: string;
      projectName: string;
      reason: string;
      expectedImpact: number;
      priority: number;
    }>;
  };
  efficiencyGain: number;
  valueGain: number;
  riskReduction: number;
}

export interface ProgramHealthReport {
  program: Program;
  constituentProjects: ProjectHealthSummary[];
  programBenefits: {
    planned: number;
    achieved: number;
    achievementRate: number;
  };
  programHealth: {
    overallScore: number;
    budgetHealth: number;
    scheduleHealth: number;
    benefitHealth: number;
    status: 'HEALTHY' | 'AT_RISK' | 'UNHEALTHY';
  };
  recommendations: string[];
}

export interface ResourceCapacityAnalysis {
  totalCapacity: number;
  totalDemand: number;
  utilizationRate: number;
  overCapacity: boolean;
  byRole: Array<{
    role: string;
    capacity: number;
    demand: number;
    utilization: number;
    status: 'OVER' | 'OPTIMAL' | 'UNDER';
  }>;
  byDepartment: Array<{
    department: string;
    capacity: number;
    demand: number;
    utilization: number;
  }>;
  bottlenecks: string[];
  recommendations: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Portfolio Management Engine
// ─────────────────────────────────────────────────────────────────────────────

export class PortfolioManagementEngine {
  /**
   * Create a new portfolio
   */
  createPortfolio(params: {
    portfolioCode: string;
    name: string;
    description: string;
    managerId: string;
    objectives?: string[];
    constraints?: string[];
    totalBudget?: number;
  }): Portfolio {
    return {
      id: `PORT-${Date.now()}-${randomInt(0, 1000)}`,
      portfolioCode: params.portfolioCode,
      name: params.name,
      description: params.description,
      managerId: params.managerId,
      objectives: params.objectives ?? [],
      constraints: params.constraints ?? [],
      strategicAlignment: [],
      totalBudget: params.totalBudget ?? 0,
      totalSpent: 0,
      totalPlannedValue: 0,
      totalEarnedValue: 0,
      overallProgress: 0,
      healthScore: 0,
      projects: [],
      programs: [],
      status: 'PLANNING',
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Create a new program
   */
  createProgram(params: {
    programCode: string;
    name: string;
    portfolioId: string;
    managerId: string;
    objectives?: string[];
    benefits?: string[];
    totalBudget?: number;
  }): Program {
    return {
      id: `PROG-${Date.now()}-${randomInt(0, 1000)}`,
      programCode: params.programCode,
      name: params.name,
      portfolioId: params.portfolioId,
      managerId: params.managerId,
      objectives: params.objectives ?? [],
      benefits: params.benefits ?? [],
      totalBudget: params.totalBudget ?? 0,
      totalSpent: 0,
      overallProgress: 0,
      projects: [],
      status: 'CHARTERED',
    };
  }

  /**
   * Generate comprehensive portfolio health dashboard
   */
  generatePortfolioDashboard(
    portfolio: Portfolio,
    projects: Array<{
      id: string;
      code: string;
      name: string;
      progress: number;
      budgetSpent: number;
      budgetPlanned: number;
      scheduleVariance: number;
      resourceUtilization: number;
      riskScore: number;
      status: 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'CRITICAL';
    }>
  ): PortfolioHealthDashboard {
    // Calculate budget analysis
    const budgetAnalysis = this.calculateBudgetAnalysis(portfolio, projects);
    
    // Calculate schedule analysis
    const scheduleAnalysis = this.calculateScheduleAnalysis(projects);
    
    // Calculate resource analysis
    const resourceAnalysis = this.calculateResourceAnalysis(projects);
    
    // Calculate risk analysis
    const riskAnalysis = this.calculateRiskAnalysis(projects);

    // Project health summaries
    const projectHealthSummary = projects.map(p => ({
      projectId: p.id,
      projectCode: p.code,
      projectName: p.name,
      status: p.status,
      healthScore: this.calculateProjectHealthScore(p),
      progress: p.progress,
      budgetHealth: p.budgetPlanned > 0 ? (p.budgetSpent / p.budgetPlanned) * 100 : 0,
      scheduleHealth: this.calculateScheduleHealth(p.scheduleVariance),
      resourceHealth: p.resourceUtilization,
    }));

    // Overall health score
    const overallHealthScore = this.calculateOverallHealthScore(
      projectHealthSummary,
      budgetAnalysis,
      scheduleAnalysis,
      resourceAnalysis,
      riskAnalysis
    );

    // Health trend
    const healthTrend = this.determineHealthTrend(portfolio, projectHealthSummary);

    // Recommendations
    const recommendations = this.generatePortfolioRecommendations(
      budgetAnalysis,
      scheduleAnalysis,
      resourceAnalysis,
      riskAnalysis,
      projects.length
    );

    return {
      portfolio,
      projectCount: projects.length,
      programCount: portfolio.programs.length,
      projectHealthSummary,
      budgetAnalysis,
      scheduleAnalysis,
      resourceAnalysis,
      riskAnalysis,
      overallHealthScore,
      healthTrend,
      recommendations,
    };
  }

  /**
   * Calculate budget analysis
   */
  private calculateBudgetAnalysis(
    portfolio: Portfolio,
    projects: Array<{ budgetPlanned: number; budgetSpent: number }>
  ) {
    const totalBudget = projects.reduce((sum, p) => sum + p.budgetPlanned, 0);
    const totalSpent = projects.reduce((sum, p) => sum + p.budgetSpent, 0);
    const totalPlannedValue = totalBudget * 0.8; // Simplified
    const totalEarnedValue = totalSpent * 1.1; // Simplified

    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    const expectedFinal = totalSpent / (budgetUtilization / 100 || 1);
    const projectedOverrun = Math.max(0, expectedFinal - totalBudget);
    const projectedUnderrun = Math.max(0, totalBudget - expectedFinal);

    return {
      totalBudget,
      totalSpent,
      totalPlannedValue,
      totalEarnedValue,
      budgetUtilization: Math.round(budgetUtilization * 100) / 100,
      projectedOverrun: Math.round(projectedOverrun * 100) / 100,
      projectedUnderrun: Math.round(projectedUnderrun * 100) / 100,
    };
  }

  /**
   * Calculate schedule analysis
   */
  private calculateScheduleAnalysis(
    projects: Array<{ scheduleVariance: number; status: string }>
  ) {
    let onTime = 0;
    let atRisk = 0;
    let behind = 0;
    let totalVariance = 0;

    for (const p of projects) {
      totalVariance += p.scheduleVariance;
      if (p.status === 'ON_TRACK') onTime++;
      else if (p.status === 'AT_RISK') atRisk++;
      else behind++;
    }

    return {
      onTime,
      atRisk,
      behind,
      averageScheduleVariance: projects.length > 0 ? totalVariance / projects.length : 0,
    };
  }

  /**
   * Calculate resource analysis
   */
  private calculateResourceAnalysis(
    projects: Array<{ resourceUtilization: number }>
  ) {
    let totalUtilization = 0;
    let overallocated = 0;
    let underutilized = 0;

    for (const p of projects) {
      totalUtilization += p.resourceUtilization;
      if (p.resourceUtilization > 100) overallocated++;
      else if (p.resourceUtilization < 50) underutilized++;
    }

    return {
      totalResources: projects.length,
      averageUtilization: projects.length > 0 ? totalUtilization / projects.length : 0,
      overallocatedProjects: overallocated,
      underutilizedProjects: underutilized,
    };
  }

  /**
   * Calculate risk analysis
   */
  private calculateRiskAnalysis(
    projects: Array<{ riskScore: number }>
  ) {
    let totalRisks = 0;
    let highRisks = 0;
    let mediumRisks = 0;
    let lowRisks = 0;
    let totalScore = 0;

    for (const p of projects) {
      totalScore += p.riskScore;
      totalRisks++;
      
      if (p.riskScore >= 0.7) highRisks++;
      else if (p.riskScore >= 0.4) mediumRisks++;
      else lowRisks++;
    }

    return {
      totalRisks,
      highRisks,
      mediumRisks,
      lowRisks,
      averageRiskScore: projects.length > 0 ? totalScore / projects.length : 0,
    };
  }

  /**
   * Calculate project health score
   */
  private calculateProjectHealthScore(project: {
    progress: number;
    budgetPlanned: number;
    budgetSpent: number;
    scheduleVariance: number;
    resourceUtilization: number;
    riskScore: number;
  }): number {
    const budgetScore = project.budgetPlanned > 0
      ? Math.max(0, 100 - (Math.abs(project.budgetSpent - project.budgetPlanned) / project.budgetPlanned) * 100)
      : 50;

    const scheduleScore = Math.max(0, 100 - Math.abs(project.scheduleVariance) * 5);
    const resourceScore = project.resourceUtilization <= 100
      ? project.resourceUtilization
      : Math.max(0, 100 - (project.resourceUtilization - 100) * 2);
    const riskScore = Math.max(0, 100 - project.riskScore * 100);

    return Math.round((budgetScore * 0.3 + scheduleScore * 0.3 + resourceScore * 0.2 + riskScore * 0.2) * 100) / 100;
  }

  /**
   * Calculate schedule health
   */
  private calculateScheduleHealth(variance: number): number {
    if (variance >= 0) return 100;
    if (variance >= -7) return 80;
    if (variance >= -14) return 60;
    if (variance >= -30) return 40;
    return 20;
  }

  /**
   * Calculate overall health score
   */
  private calculateOverallHealthScore(
    projects: ProjectHealthSummary[],
    budget: PortfolioHealthDashboard['budgetAnalysis'],
    schedule: PortfolioHealthDashboard['scheduleAnalysis'],
    resources: PortfolioHealthDashboard['resourceAnalysis'],
    risks: PortfolioHealthDashboard['riskAnalysis']
  ): number {
    if (projects.length === 0) return 0;

    const projectHealthAvg = projects.reduce((sum, p) => sum + p.healthScore, 0) / projects.length;
    const budgetHealth = Math.max(0, 100 - (budget.budgetUtilization - 80) * 2);
    const scheduleHealth = schedule.onTime / projects.length * 100;
    const resourceHealth = resources.averageUtilization;
    const riskHealth = Math.max(0, 100 - risks.highRisks * 10);

    return Math.round(
      (projectHealthAvg * 0.4 +
       budgetHealth * 0.2 +
       scheduleHealth * 0.15 +
       resourceHealth * 0.15 +
       riskHealth * 0.1) * 100
    ) / 100;
  }

  /**
   * Determine health trend
   */
  private determineHealthTrend(
    portfolio: Portfolio,
    projects: ProjectHealthSummary[]
  ): 'IMPROVING' | 'STABLE' | 'DETERIORATING' {
    const healthScore = portfolio.healthScore;
    
    if (healthScore >= 80) return 'IMPROVING';
    if (healthScore >= 50) return 'STABLE';
    return 'DETERIORATING';
  }

  /**
   * Generate portfolio recommendations
   */
  private generatePortfolioRecommendations(
    budget: PortfolioHealthDashboard['budgetAnalysis'],
    schedule: PortfolioHealthDashboard['scheduleAnalysis'],
    resources: PortfolioHealthDashboard['resourceAnalysis'],
    risks: PortfolioHealthDashboard['riskAnalysis'],
    projectCount: number
  ): string[] {
    const recommendations: string[] = [];

    if (budget.budgetUtilization > 90) {
      recommendations.push('Budget utilization is high - review and adjust allocations if needed');
    }

    if (schedule.behind > projectCount * 0.3) {
      recommendations.push('Multiple projects behind schedule - consider resource reallocation or schedule adjustment');
    }

    if (resources.overallocatedProjects > 0) {
      recommendations.push('Resource overallocations detected - implement resource leveling');
    }

    if (risks.highRisks > 5) {
      recommendations.push('High concentration of project risks - develop mitigation strategies');
    }

    if (recommendations.length === 0) {
      recommendations.push('Portfolio is performing well - maintain current approach');
    }

    return recommendations;
  }

  /**
   * Optimize portfolio
   */
  optimizePortfolio(
    portfolio: Portfolio,
    projects: Array<{
      id: string;
      name: string;
      value: number;
      riskScore: number;
      resourceRequirement: number;
      progress: number;
      status: string;
    }>,
    availableResources: number
  ): PortfolioOptimizationResult {
    // Calculate current portfolio metrics
    const currentValue = projects.reduce((sum, p) => sum + p.value, 0);
    const currentRisk = projects.length > 0
      ? projects.reduce((sum, p) => sum + p.riskScore, 0) / projects.length
      : 0;
    const currentResourceUtil = projects.reduce((sum, p) => sum + p.resourceRequirement, 0) / availableResources;

    const currentPortfolio = {
      totalValue: currentValue,
      riskAdjustedReturn: currentValue * (1 - currentRisk),
      riskScore: currentRisk,
      resourceUtilization: currentResourceUtil * 100,
    };

    // Generate optimization recommendations
    const recommendedActions: PortfolioOptimizationResult['optimizedPortfolio']['recommendedActions'] = [];

    // Identify high-risk projects for potential removal
    const highRiskProjects = projects.filter(p => p.riskScore > 0.7);
    for (const p of highRiskProjects.slice(0, 3)) {
      recommendedActions.push({
        type: 'REPRIORITIZE',
        projectId: p.id,
        projectName: p.name,
        reason: `High risk score (${Math.round(p.riskScore * 100)}%) - consider reducing scope or allocating more resources`,
        expectedImpact: -p.value * 0.1,
        priority: 1,
      });
    }

    // Identify underperforming projects
    const underperforming = projects.filter(p => p.progress < 20 && p.status !== 'ON_TRACK');
    for (const p of underperforming.slice(0, 2)) {
      recommendedActions.push({
        type: 'RESCHEDULE',
        projectId: p.id,
        projectName: p.name,
        reason: 'Low progress with potential issues - review and adjust timeline',
        expectedImpact: p.value * 0.05,
        priority: 2,
      });
    }

    // Sort by priority
    recommendedActions.sort((a, b) => a.priority - b.priority);

    // Calculate optimized portfolio
    const optimizedValue = currentValue * 1.05;
    const optimizedRisk = currentRisk * 0.9;
    const optimizedResourceUtil = currentResourceUtil * 0.95;

    const optimizedPortfolio = {
      totalValue: Math.round(optimizedValue * 100) / 100,
      riskAdjustedReturn: Math.round(optimizedValue * (1 - optimizedRisk) * 100) / 100,
      riskScore: Math.round(optimizedRisk * 1000) / 1000,
      resourceUtilization: Math.round(optimizedResourceUtil * 10000) / 100,
      recommendedActions,
    };

    return {
      currentPortfolio,
      optimizedPortfolio,
      efficiencyGain: Math.round((optimizedValue - currentValue) / currentValue * 10000) / 100,
      valueGain: Math.round((optimizedValue - currentValue) * 100) / 100,
      riskReduction: Math.round((currentRisk - optimizedRisk) * 100) / 100,
    };
  }

  /**
   * Generate program health report
   */
  generateProgramHealthReport(
    program: Program,
    projects: Array<{
      id: string;
      code: string;
      name: string;
      progress: number;
      budgetSpent: number;
      budgetPlanned: number;
      scheduleVariance: number;
      riskScore: number;
      status: 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'CRITICAL';
    }>,
    benefitsAchieved: number
  ): ProgramHealthReport {
    // Project summaries
    const constituentProjects = projects.map(p => ({
      projectId: p.id,
      projectCode: p.code,
      projectName: p.name,
      status: p.status,
      healthScore: this.calculateProjectHealthScore({
        progress: p.progress,
        budgetPlanned: p.budgetPlanned,
        budgetSpent: p.budgetSpent,
        scheduleVariance: p.scheduleVariance,
        resourceUtilization: 80,
        riskScore: p.riskScore,
      }),
      progress: p.progress,
      budgetHealth: p.budgetPlanned > 0 ? (p.budgetSpent / p.budgetPlanned) * 100 : 0,
      scheduleHealth: this.calculateScheduleHealth(p.scheduleVariance),
      resourceHealth: 80,
    }));

    // Benefits achievement
    const benefitAchievementRate = program.totalBudget > 0
      ? (benefitsAchieved / program.totalBudget) * 100
      : 0;

    // Program health scores
    const budgetHealth = this.calculateProgramBudgetHealth(program, projects);
    const scheduleHealth = this.calculateProgramScheduleHealth(projects);
    const benefitHealth = benefitAchievementRate;
    const overallScore = (budgetHealth + scheduleHealth + benefitHealth) / 3;

    let programStatus: 'HEALTHY' | 'AT_RISK' | 'UNHEALTHY';
    if (overallScore >= 70) programStatus = 'HEALTHY';
    else if (overallScore >= 40) programStatus = 'AT_RISK';
    else programStatus = 'UNHEALTHY';

    // Recommendations
    const recommendations: string[] = [];
    if (budgetHealth < 70) {
      recommendations.push('Review budget allocation and spending across program projects');
    }
    if (scheduleHealth < 70) {
      recommendations.push('Coordinate schedule adjustments across program projects');
    }
    if (benefitAchievementRate < 50) {
      recommendations.push('Focus on achieving planned benefits - review benefit realization strategy');
    }

    return {
      program,
      constituentProjects,
      programBenefits: {
        planned: program.totalBudget,
        achieved: benefitsAchieved,
        achievementRate: Math.round(benefitAchievementRate * 100) / 100,
      },
      programHealth: {
        overallScore: Math.round(overallScore * 100) / 100,
        budgetHealth: Math.round(budgetHealth * 100) / 100,
        scheduleHealth: Math.round(scheduleHealth * 100) / 100,
        benefitHealth: Math.round(benefitHealth * 100) / 100,
        status: programStatus,
      },
      recommendations,
    };
  }

  /**
   * Calculate program budget health
   */
  private calculateProgramBudgetHealth(
    program: Program,
    projects: Array<{ budgetPlanned: number; budgetSpent: number }>
  ): number {
    const totalBudget = projects.reduce((sum, p) => sum + p.budgetPlanned, 0);
    const totalSpent = projects.reduce((sum, p) => sum + p.budgetSpent, 0);

    if (totalBudget === 0) return 50;
    
    const utilization = totalSpent / totalBudget;
    if (utilization <= 0.9) return 100;
    if (utilization <= 1.0) return 80;
    if (utilization <= 1.1) return 60;
    return 40;
  }

  /**
   * Calculate program schedule health
   */
  private calculateProgramScheduleHealth(
    projects: Array<{ status: string }>
  ): number {
    if (projects.length === 0) return 50;

    const onTrack = projects.filter(p => p.status === 'ON_TRACK').length;
    return (onTrack / projects.length) * 100;
  }

  /**
   * Analyze resource capacity
   */
  analyzeResourceCapacity(
    resources: Array<{
      role: string;
      department: string;
      availableHours: number;
      allocatedHours: number;
    }>
  ): ResourceCapacityAnalysis {
    let totalCapacity = 0;
    let totalDemand = 0;
    const byRole: ResourceCapacityAnalysis['byRole'] = [];
    const byDepartment: ResourceCapacityAnalysis['byDepartment'] = [];
    const bottlenecks: string[] = [];

    const roleMap = new Map<string, { capacity: number; demand: number }>();
    const deptMap = new Map<string, { capacity: number; demand: number }>();

    for (const r of resources) {
      totalCapacity += r.availableHours;
      totalDemand += r.allocatedHours;

      // By role
      const existingRole = roleMap.get(r.role) ?? { capacity: 0, demand: 0 };
      roleMap.set(r.role, {
        capacity: existingRole.capacity + r.availableHours,
        demand: existingRole.demand + r.allocatedHours,
      });

      // By department
      const existingDept = deptMap.get(r.department) ?? { capacity: 0, demand: 0 };
      deptMap.set(r.department, {
        capacity: existingDept.capacity + r.availableHours,
        demand: existingDept.demand + r.allocatedHours,
      });
    }

    // Convert to arrays
    for (const [role, data] of roleMap.entries()) {
      const utilization = data.capacity > 0 ? (data.demand / data.capacity) * 100 : 0;
      byRole.push({
        role,
        capacity: data.capacity,
        demand: data.demand,
        utilization: Math.round(utilization * 100) / 100,
        status: utilization > 100 ? 'OVER' : utilization < 50 ? 'UNDER' : 'OPTIMAL',
      });

      if (utilization > 100) {
        bottlenecks.push(`${role} role is over-allocated`);
      }
    }

    for (const [dept, data] of deptMap.entries()) {
      byDepartment.push({
        department: dept,
        capacity: data.capacity,
        demand: data.demand,
        utilization: data.capacity > 0 ? Math.round((data.demand / data.capacity) * 10000) / 100 : 0,
      });
    }

    const utilizationRate = totalCapacity > 0 ? (totalDemand / totalCapacity) * 100 : 0;

    return {
      totalCapacity,
      totalDemand,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      overCapacity: utilizationRate > 100,
      byRole,
      byDepartment,
      bottlenecks,
      recommendations: bottlenecks.length > 0
        ? ['Address resource bottlenecks by hiring or reallocating', 'Review project timelines for resource conflicts']
        : ['Resource capacity is balanced', 'Continue monitoring utilization trends'],
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory Function
// ─────────────────────────────────────────────────────────────────────────────

export function createPortfolioEngine(): PortfolioManagementEngine {
  return new PortfolioManagementEngine();
}
