// ═══════════════════════════════════════════════════════════════════════════════
// UAMEX ERP™ - Project Management Office (PMO) Module
// Change Control & Issue Management Engine - NEB-04 Project Management OS
// ═══════════════════════════════════════════════════════════════════════════════
//
// © 2026 Rohamaa Baynahum Charity Foundation - UAMEX ERP™
// One Platform. One Organization. One Vision.
//
// Change Management and Issue Tracking per PMBOK® Guide 7th Edition
// ═══════════════════════════════════════════════════════════════════════════════

import { randomInt } from 'crypto';

import type {
  Issue,
  IssueType,
  IssueStatus,
  Priority,
  ChangeRequest,
  ChangeImpact,
  ChangeStatus,
} from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Engine Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ChangeControlMetrics {
  totalRequests: number;
  byStatus: Record<ChangeStatus, number>;
  byImpact: Record<ChangeImpact, number>;
  averageAssessmentTime: number;
  averageApprovalTime: number;
  approvalRate: number;
  rejectionRate: number;
  implementationSuccessRate: number;
  scheduleImpactTotal: number;
  costImpactTotal: number;
}

export interface IssueMetrics {
  totalIssues: number;
  byStatus: Record<IssueStatus, number>;
  byType: Record<IssueType, number>;
  byPriority: Record<Priority, number>;
  openIssues: number;
  overdueIssues: number;
  averageResolutionTime: number;
  blockerIssues: number;
  criticalIssues: number;
}

export interface ChangeAssessment {
  changeRequest: ChangeRequest;
  riskAssessment: {
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    reasons: string[];
  };
  impactAnalysis: {
    scopeImpact: 'NONE' | 'MINOR' | 'MODERATE' | 'SIGNIFICANT';
    scheduleImpactDays: number;
    costImpact: number;
    resourceImpact: 'LOW' | 'MEDIUM' | 'HIGH';
    qualityImpact: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  };
  recommendation: 'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'REJECT' | 'DEFER';
  conditions?: string[];
  rejectionReasons?: string[];
}

export interface ChangeForecast {
  projectedScheduleGrowth: number;
  projectedCostGrowth: number;
  projectedChangeVolume: number;
  riskIndicators: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Change Control Engine
// ─────────────────────────────────────────────────────────────────────────────

export class ChangeControlEngine {
  /**
   * Create a new change request
   */
  createChangeRequest(params: {
    projectId: string;
    title: string;
    description: string;
    rationale: string;
    submittedBy: string;
    impact?: Partial<Pick<ChangeRequest, 'scopeImpact' | 'scheduleImpactDays' | 'costImpact'>>;
  }): ChangeRequest {
    return {
      id: `CR-${Date.now()}-${randomInt(0, 1000)}`,
      projectId: params.projectId,
      changeNumber: `CR-${Date.now().toString(36).toUpperCase()}`,
      title: params.title,
      description: params.description,
      rationale: params.rationale,
      impact: 'LOW',
      scopeImpact: params.impact?.scopeImpact ?? '',
      scheduleImpactDays: params.impact?.scheduleImpactDays ?? 0,
      costImpact: params.impact?.costImpact ?? 0,
      riskImpact: '',
      status: 'SUBMITTED',
      submittedBy: params.submittedBy,
      submittedDate: new Date().toISOString(),
    };
  }

  /**
   * Create a new issue
   */
  createIssue(params: {
    projectId: string;
    title: string;
    description: string;
    type: IssueType;
    priority: Priority;
    raisedBy: string;
    assignedTo?: string;
    dueDate?: string;
  }): Issue {
    return {
      id: `ISS-${Date.now()}-${randomInt(0, 1000)}`,
      projectId: params.projectId,
      issueNumber: `ISS-${Date.now().toString(36).toUpperCase()}`,
      title: params.title,
      description: params.description,
      type: params.type,
      priority: params.priority,
      status: 'OPEN',
      raisedBy: params.raisedBy,
      assignedTo: params.assignedTo ?? '',
      dueDate: params.dueDate,
      relatedRisks: [],
      relatedChanges: [],
    };
  }

  /**
   * Assess a change request
   */
  assessChangeRequest(change: ChangeRequest): ChangeAssessment {
    const riskAssessment = this.assessChangeRisk(change);
    const impactAnalysis = this.assessImpact(change);
    const recommendation = this.generateRecommendation(change, riskAssessment, impactAnalysis);

    return {
      changeRequest: change,
      riskAssessment,
      impactAnalysis,
      recommendation,
      conditions: recommendation === 'APPROVE_WITH_CONDITIONS'
        ? this.generateConditions(change)
        : undefined,
      rejectionReasons: recommendation === 'REJECT'
        ? this.generateRejectionReasons(change)
        : undefined,
    };
  }

  /**
   * Assess change risk
   */
  private assessChangeRisk(change: ChangeRequest): ChangeAssessment['riskAssessment'] {
    const reasons: string[] = [];
    
    // Compute risk level based on multiple factors
    let score = 0;
    
    // Cost impact (0-0.3)
    if (change.costImpact > 100000) {
      score += 0.3;
      reasons.push('Significant financial impact');
    } else if (change.costImpact > 50000) {
      score += 0.2;
      reasons.push('Moderate financial impact');
    }
    
    // Schedule impact (0-0.4)
    if (change.scheduleImpactDays > 30) {
      score += 0.4;
      reasons.push('Major schedule extension');
    } else if (change.scheduleImpactDays > 14) {
      score += 0.3;
      reasons.push('Significant schedule impact');
    } else if (change.scheduleImpactDays > 7) {
      score += 0.2;
      reasons.push('Moderate schedule impact');
    }
    
    // Scope impact (0-0.3)
    if (change.scopeImpact.length > 100) {
      score += 0.3;
    } else if (change.scopeImpact.length > 50) {
      score += 0.2;
    } else if (change.scopeImpact.length > 0) {
      score += 0.1;
    }

    let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (score >= 0.7) {
      level = 'CRITICAL';
    } else if (score >= 0.5) {
      level = 'HIGH';
    } else if (score >= 0.3) {
      level = 'MEDIUM';
    } else {
      level = 'LOW';
    }

    if (reasons.length === 0) {
      reasons.push('Low impact change with minimal risk');
    }

    return { level, reasons };
  }

  /**
   * Assess change impact
   */
  private assessImpact(change: ChangeRequest): ChangeAssessment['impactAnalysis'] {
    const scopeImpact: 'NONE' | 'MINOR' | 'MODERATE' | 'SIGNIFICANT' =
      change.scopeImpact.length > 100 ? 'SIGNIFICANT' :
      change.scopeImpact.length > 50 ? 'MODERATE' :
      change.scopeImpact.length > 0 ? 'MINOR' : 'NONE';

    const resourceImpact: 'LOW' | 'MEDIUM' | 'HIGH' =
      change.costImpact > 100000 ? 'HIGH' :
      change.costImpact > 50000 ? 'MEDIUM' : 'LOW';

    const qualityImpact: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' =
      change.scopeImpact.toLowerCase().includes('quality') ? 'HIGH' :
      change.scopeImpact.toLowerCase().includes('enhance') ? 'MEDIUM' : 'LOW';

    return {
      scopeImpact,
      scheduleImpactDays: change.scheduleImpactDays,
      costImpact: change.costImpact,
      resourceImpact,
      qualityImpact,
    };
  }

  /**
   * Generate recommendation
   */
  private generateRecommendation(
    change: ChangeRequest,
    risk: ChangeAssessment['riskAssessment'],
    impact: ChangeAssessment['impactAnalysis']
  ): ChangeAssessment['recommendation'] {
    // Reject high-risk changes
    if (risk.level === 'CRITICAL') return 'REJECT';
    if (risk.level === 'HIGH' && impact.costImpact > 75000) return 'REJECT';

    // Approve with conditions for medium risk
    if (risk.level === 'MEDIUM' || impact.resourceImpact === 'MEDIUM') {
      return 'APPROVE_WITH_CONDITIONS';
    }

    // Defer low-priority changes
    if (change.status === 'SUBMITTED' && impact.scopeImpact === 'MINOR') {
      return 'DEFER';
    }

    // Default to approve
    return 'APPROVE';
  }

  /**
   * Generate conditions for conditional approval
   */
  private generateConditions(change: ChangeRequest): string[] {
    const conditions: string[] = [];

    if (change.scheduleImpactDays > 7) {
      conditions.push('Schedule impact must be offset by crashing or fast-tracking other activities');
    }

    if (change.costImpact > 50000) {
      conditions.push('Additional budget must be approved by project sponsor');
    }

    if (change.scopeImpact.length > 50) {
      conditions.push('Detailed scope definition required before implementation');
    }

    conditions.push('Change must be documented in project log');

    return conditions;
  }

  /**
   * Generate rejection reasons
   */
  private generateRejectionReasons(change: ChangeRequest): string[] {
    const reasons: string[] = [];

    if (change.costImpact > 100000) {
      reasons.push('Cost impact exceeds approved project budget');
    }

    if (change.scheduleImpactDays > 30) {
      reasons.push('Schedule impact would significantly delay project completion');
    }

    if (change.scopeImpact.toLowerCase().includes('fundamental')) {
      reasons.push('Change would fundamentally alter project objectives');
    }

    if (reasons.length === 0) {
      reasons.push('Change does not align with current project priorities');
    }

    return reasons;
  }

  /**
   * Update change request status
   */
  updateChangeStatus(change: ChangeRequest, newStatus: ChangeStatus): ChangeRequest {
    const updated = { ...change, status: newStatus };

    if (newStatus === 'ASSESSED') {
      updated.assessedDate = new Date().toISOString();
    } else if (newStatus === 'APPROVED') {
      updated.approvedDate = new Date().toISOString();
    } else if (newStatus === 'IMPLEMENTED') {
      updated.implementedDate = new Date().toISOString();
    }

    return updated;
  }

  /**
   * Update issue status
   */
  updateIssueStatus(issue: Issue, newStatus: IssueStatus): Issue {
    const updated = { ...issue, status: newStatus };

    if (newStatus === 'RESOLVED') {
      updated.resolvedDate = new Date().toISOString();
    }

    return updated;
  }

  /**
   * Calculate change control metrics
   */
  calculateMetrics(changes: ChangeRequest[]): ChangeControlMetrics {
    const byStatus: Record<ChangeStatus, number> = {
      SUBMITTED: 0,
      ASSESSED: 0,
      APPROVED: 0,
      REJECTED: 0,
      IMPLEMENTED: 0,
    };

    const byImpact: Record<ChangeImpact, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };

    let totalAssessmentTime = 0;
    let totalApprovalTime = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let implementedCount = 0;
    let scheduleImpactTotal = 0;
    let costImpactTotal = 0;

    for (const change of changes) {
      byStatus[change.status]++;
      byImpact[change.impact]++;

      if (change.assessedDate && change.submittedDate) {
        const assessmentTime = this.daysBetween(change.submittedDate, change.assessedDate);
        totalAssessmentTime += assessmentTime;
      }

      if (change.approvedDate && change.assessedDate) {
        const approvalTime = this.daysBetween(change.assessedDate, change.approvedDate);
        totalApprovalTime += approvalTime;
      }

      if (change.status === 'APPROVED') approvedCount++;
      if (change.status === 'REJECTED') rejectedCount++;
      if (change.status === 'IMPLEMENTED') implementedCount++;

      scheduleImpactTotal += change.scheduleImpactDays;
      costImpactTotal += change.costImpact;
    }

    const totalRequests = changes.length;

    return {
      totalRequests,
      byStatus,
      byImpact,
      averageAssessmentTime: totalRequests > 0 ? totalAssessmentTime / totalRequests : 0,
      averageApprovalTime: approvedCount > 0 ? totalApprovalTime / approvedCount : 0,
      approvalRate: totalRequests > 0 ? (approvedCount / totalRequests) * 100 : 0,
      rejectionRate: totalRequests > 0 ? (rejectedCount / totalRequests) * 100 : 0,
      implementationSuccessRate: approvedCount > 0 ? (implementedCount / approvedCount) * 100 : 0,
      scheduleImpactTotal,
      costImpactTotal,
    };
  }

  /**
   * Calculate issue metrics
   */
  calculateIssueMetrics(issues: Issue[]): IssueMetrics {
    const byStatus: Record<IssueStatus, number> = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0,
      REOPENED: 0,
    };

    const byType: Record<IssueType, number> = {
      BLOCKER: 0,
      CRITICAL: 0,
      MAJOR: 0,
      MINOR: 0,
    };

    const byPriority: Record<Priority, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };

    let openIssues = 0;
    let overdueIssues = 0;
    let totalResolutionTime = 0;
    let resolvedCount = 0;
    const now = new Date();

    for (const issue of issues) {
      byStatus[issue.status]++;
      byType[issue.type]++;
      byPriority[issue.priority]++;

      if (issue.status !== 'CLOSED' && issue.status !== 'RESOLVED') {
        openIssues++;
      }

      if (issue.dueDate && new Date(issue.dueDate) < now && 
          issue.status !== 'RESOLVED' && issue.status !== 'CLOSED') {
        overdueIssues++;
      }

      if (issue.resolvedDate && issue.status === 'RESOLVED') {
        const resolutionTime = this.daysBetween(issue.resolvedDate, issue.resolvedDate);
        totalResolutionTime += resolutionTime;
        resolvedCount++;
      }
    }

    return {
      totalIssues: issues.length,
      byStatus,
      byType,
      byPriority,
      openIssues,
      overdueIssues,
      averageResolutionTime: resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0,
      blockerIssues: byType.BLOCKER,
      criticalIssues: byType.CRITICAL,
    };
  }

  /**
   * Generate change forecast
   */
  generateForecast(changes: ChangeRequest[]): ChangeForecast {
    const recentChanges = changes.filter(c => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(c.submittedDate) >= thirtyDaysAgo;
    });

    const approvedRecent = recentChanges.filter(c => c.status === 'APPROVED' || c.status === 'IMPLEMENTED');
    const pendingChanges = changes.filter(c => c.status === 'SUBMITTED' || c.status === 'ASSESSED');

    const projectedScheduleGrowth = approvedRecent.reduce((sum, c) => sum + c.scheduleImpactDays, 0);
    const projectedCostGrowth = approvedRecent.reduce((sum, c) => sum + c.costImpact, 0);

    const riskIndicators: string[] = [];

    if (pendingChanges.length > 5) {
      riskIndicators.push('High volume of pending changes may indicate scope creep');
    }

    if (projectedCostGrowth > 50000) {
      riskIndicators.push('Significant projected cost growth from approved changes');
    }

    if (projectedScheduleGrowth > 30) {
      riskIndicators.push('Projected schedule growth may impact delivery date');
    }

    return {
      projectedScheduleGrowth,
      projectedCostGrowth,
      projectedChangeVolume: pendingChanges.length + Math.floor(recentChanges.length * 0.5),
      riskIndicators,
    };
  }

  /**
   * Days between two dates
   */
  private daysBetween(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory Function
// ─────────────────────────────────────────────────────────────────────────────

export function createChangeControlEngine(): ChangeControlEngine {
  return new ChangeControlEngine();
}
