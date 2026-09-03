// ═══════════════════════════════════════════════════════════════════════════════════════
// UAMEX ERP™ - Project Management Office (PMO) Module
// NEB-04 Project Management OS
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// © 2026 Rohamaa Baynahum Charity Foundation - UAMEX ERP™
// One Platform. One Organization. One Vision.
//
// Global Project Management Methodologies Support:
// - PMBOK® Guide 7th Edition
// - PRINCE2® 2017
// - Agile/Scrum
// - Waterfall
// - Hybrid
//
// Modules:
// - Earned Value Management (EVM)
// - Critical Path Method (CPM)
// - Risk Management (ISO 31000)
// - Stakeholder Management
// - Change Control & Issue Management
// - Portfolio & Program Management
// ═══════════════════════════════════════════════════════════════════════════════════════

// Re-export types
export * from './types';

// Re-export engines
export { EarnedValueEngine, createEVMEngine, calculateEVM, calculateEAC } from './evm';
export { CriticalPathEngine, createCriticalPathEngine, calculateCriticalPath, generateGanttData } from './criticalPath';
export { RiskManagementEngine, createRiskEngine, calculateRiskScore, calculateInherentRiskLevel } from './riskManagement';
export { StakeholderManagementEngine, createStakeholderEngine } from './stakeholder';
export { ChangeControlEngine, createChangeControlEngine } from './changeControl';
export { PortfolioManagementEngine, createPortfolioEngine } from './portfolio';

// ─────────────────────────────────────────────────────────────────────────────
// Unified PMO Controller
// ─────────────────────────────────────────────────────────────────────────────

import { EarnedValueEngine } from './evm';
import { CriticalPathEngine } from './criticalPath';
import { RiskManagementEngine } from './riskManagement';
import { StakeholderManagementEngine } from './stakeholder';
import { ChangeControlEngine } from './changeControl';
import { PortfolioManagementEngine } from './portfolio';
import type { EarnedValueData, ScheduleActivity, Risk, Stakeholder, ChangeRequest, Issue, Portfolio, Program } from './types';

/**
 * Unified PMO Controller
 * Provides a single entry point for all project management operations
 */
export class PMOController {
  private evmEngine: EarnedValueEngine;
  private cpmEngine: CriticalPathEngine;
  private riskEngine: RiskManagementEngine;
  private stakeholderEngine: StakeholderManagementEngine;
  private changeEngine: ChangeControlEngine;
  private portfolioEngine: PortfolioManagementEngine;

  constructor() {
    this.evmEngine = new EarnedValueEngine();
    this.cpmEngine = new CriticalPathEngine();
    this.riskEngine = new RiskManagementEngine();
    this.stakeholderEngine = new StakeholderManagementEngine();
    this.changeEngine = new ChangeControlEngine();
    this.portfolioEngine = new PortfolioManagementEngine();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EVM Methods
  // ─────────────────────────────────────────────────────────────────────────

  calculateEarnedValue(data: EarnedValueData) {
    return this.evmEngine.calculateEVM(data);
  }

  calculateEAC(earnedValue: number, actualCost: number, budgetAtCompletion: number, method?: 'TYPICAL' | 'ATYPICAL' | 'BEST_CASE' | 'MANUAL') {
    return this.evmEngine.calculateEAC(earnedValue, actualCost, budgetAtCompletion, method);
  }

  generateEVMForecastScenarios(data: EarnedValueData) {
    return this.evmEngine.generateForecastScenarios(data);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Schedule Methods
  // ─────────────────────────────────────────────────────────────────────────

  calculateCriticalPath(activities: ScheduleActivity[]) {
    return this.cpmEngine.calculateCriticalPath(activities);
  }

  analyzeSchedule(activities: ScheduleActivity[], targetDuration?: number) {
    return this.cpmEngine.analyzeSchedule(activities, targetDuration);
  }

  generateGanttChart(activities: ScheduleActivity[]) {
    return this.cpmEngine.generateGanttData(activities);
  }

  performResourceLeveling(activities: ScheduleActivity[]) {
    return this.cpmEngine.performResourceLeveling(activities);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Risk Methods
  // ─────────────────────────────────────────────────────────────────────────

  createRisk(params: {
    projectId: string;
    title: string;
    description: string;
    category: Risk['category'];
    probability: number;
    impact: Risk['impact'];
    ownerId: string;
    mitigationPlan?: string;
  }) {
    return this.riskEngine.createRisk(params);
  }

  analyzeRisk(risk: Risk) {
    return this.riskEngine.analyzeRisk(risk);
  }

  generateRiskDashboard(risks: Risk[]) {
    return this.riskEngine.generateDashboard(risks);
  }

  generateRiskMatrix(risks: Risk[]) {
    return this.riskEngine.generateRiskMatrix(risks);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Stakeholder Methods
  // ─────────────────────────────────────────────────────────────────────────

  createStakeholder(params: {
    projectId: string;
    stakeholderId: string;
    name: string;
    organization: string;
    role: string;
    power: Stakeholder['power'];
    interest: Stakeholder['interest'];
    influence: Stakeholder['influence'];
  }) {
    return this.stakeholderEngine.createStakeholder(params);
  }

  analyzeStakeholder(stakeholder: Stakeholder) {
    return this.stakeholderEngine.analyzeStakeholder(stakeholder);
  }

  generateStakeholderMatrix(stakeholders: Stakeholder[]) {
    return this.stakeholderEngine.generateStakeholderMatrix(stakeholders);
  }

  generateStakeholderDashboard(stakeholders: Stakeholder[]) {
    return this.stakeholderEngine.generateDashboard(stakeholders);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Change Control Methods
  // ─────────────────────────────────────────────────────────────────────────

  createChangeRequest(params: {
    projectId: string;
    title: string;
    description: string;
    rationale: string;
    submittedBy: string;
    scopeImpact?: string;
    scheduleImpactDays?: number;
    costImpact?: number;
  }) {
    return this.changeEngine.createChangeRequest(params);
  }

  assessChangeRequest(change: ChangeRequest) {
    return this.changeEngine.assessChangeRequest(change);
  }

  createIssue(params: {
    projectId: string;
    title: string;
    description: string;
    type: Issue['type'];
    priority: Issue['priority'];
    raisedBy: string;
    assignedTo?: string;
    dueDate?: string;
  }) {
    return this.changeEngine.createIssue(params);
  }

  calculateChangeMetrics(changes: ChangeRequest[]) {
    return this.changeEngine.calculateMetrics(changes);
  }

  calculateIssueMetrics(issues: Issue[]) {
    return this.changeEngine.calculateIssueMetrics(issues);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Portfolio Methods
  // ─────────────────────────────────────────────────────────────────────────

  createPortfolio(params: {
    portfolioCode: string;
    name: string;
    description: string;
    managerId: string;
    objectives?: string[];
    totalBudget?: number;
  }) {
    return this.portfolioEngine.createPortfolio(params);
  }

  createProgram(params: {
    programCode: string;
    name: string;
    portfolioId: string;
    managerId: string;
    objectives?: string[];
    benefits?: string[];
    totalBudget?: number;
  }) {
    return this.portfolioEngine.createProgram(params);
  }

  generatePortfolioDashboard(portfolio: Portfolio, projects: Array<{
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
  }>) {
    return this.portfolioEngine.generatePortfolioDashboard(portfolio, projects);
  }

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
  ) {
    return this.portfolioEngine.optimizePortfolio(portfolio, projects, availableResources);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory Function
// ─────────────────────────────────────────────────────────────────────────────

export function createPMOController(): PMOController {
  return new PMOController();
}
