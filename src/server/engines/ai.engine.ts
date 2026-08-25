/**
 * NexoraOS™ — NEB-13: AI Intelligence & Impact Engine
 * Gemini AI Integration, Predictive Analytics, Anomaly Detection, Impact Assessment
 */

import { query, queryOne, queryMany } from '../core/database';
import logger from '../core/logger';

// ─── AI Insight Types ──────────────────────────────────

export interface AIInsight {
  id: string;
  type: string;
  domain: string;
  title: string;
  description: string;
  confidence: number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  data: Record<string, any>;
  createdAt: string;
}

// ─── AI Engine ─────────────────────────────────────────

export class AIEngine {
  /**
   * Get AI insights for the organization
   */
  static async getInsights(orgId: string, domain?: string) {
    let where = 'ai.organization_id = $1';
    const params: any[] = [orgId];
    if (domain) { where += ' AND ai.domain = $2'; params.push(domain); }

    return queryMany(
      `SELECT ai.* FROM ai_insights ai
       WHERE ${where} ORDER BY ai.created_at DESC LIMIT 50`,
      params
    ).catch((err) => { logger.error('Query failed', { context: 'ai', error: err.message }); return []; });
  }

  /**
   * Predictive Budget Analysis - Analyzes spending patterns
   */
  static async predictiveBudgetAnalysis(orgId: string) {
    // Get historical spending by month
    const monthlySpending = await queryMany(
      `SELECT
        DATE_TRUNC('month', transaction_date) as month,
        SUM(total_debit) as total_spent
       FROM transactions
       WHERE organization_id = $1 AND status = 'POSTED' AND transaction_type = 'PAYMENT'
       GROUP BY DATE_TRUNC('month', transaction_date)
       ORDER BY month DESC LIMIT 12`,
      [orgId]
    );

    // Get current budget status
    const budgetStatus = await queryMany(
      `SELECT
        bl.id, coa.name_ar as account_name,
        bl.allocated_budget, bl.spent_amount,
        (bl.allocated_budget - bl.spent_amount) as remaining,
        CASE WHEN bl.allocated_budget > 0
          THEN ROUND((bl.spent_amount / bl.allocated_budget * 100)::numeric, 2)
          ELSE 0 END as utilization_pct,
        CASE WHEN bl.allocated_budget > 0
          THEN ROUND(((bl.spent_amount / bl.allocated_budget * 100) / GREATEST(EXTRACT(DAY FROM AGE(CURRENT_DATE, fy.start_date)) / EXTRACT(DAY FROM AGE(fy.end_date, fy.start_date)) * 100, 1) * 100)::numeric, 2)
          ELSE 0 END as burn_rate_index
       FROM budget_lines bl
       JOIN chart_of_accounts coa ON coa.id = bl.account_id
       JOIN fiscal_years fy ON fy.id = bl.fiscal_year_id
       WHERE bl.organization_id = $1 AND fy.status = 'open'`,
      [orgId]
    );

    // Calculate projections
    const avgMonthlySpend = monthlySpending.length > 0
      ? monthlySpending.reduce((s: number, m: any) => s + Number(m.total_spent || 0), 0) / monthlySpending.length
      : 0;

    const projections = budgetStatus.map((b: any) => ({
      accountName: b.account_name,
      allocated: Number(b.allocated_budget),
      spent: Number(b.spent_amount),
      remaining: Number(b.remaining),
      utilizationPct: Number(b.utilization_pct),
      burnRateIndex: Number(b.burn_rate_index),
      projectedExhaustionDays: Number(b.burn_rate_index) > 0
        ? Math.round(Number(b.remaining) / (avgMonthlySpend / 30))
        : null,
      riskLevel: Number(b.utilization_pct) > 90 ? 'HIGH' : Number(b.utilization_pct) > 70 ? 'MEDIUM' : 'LOW',
    }));

    return {
      summary: {
        totalBudget: projections.reduce((s: number, p: any) => s + p.allocated, 0),
        totalSpent: projections.reduce((s: number, p: any) => s + p.spent, 0),
        totalRemaining: projections.reduce((s: number, p: any) => s + p.remaining, 0),
        avgUtilization: projections.length > 0
          ? Math.round(projections.reduce((s: number, p: any) => s + p.utilizationPct, 0) / projections.length)
          : 0,
        highRiskAccounts: projections.filter((p: any) => p.riskLevel === 'HIGH').length,
        avgMonthlySpend: Math.round(avgMonthlySpend),
      },
      projections,
      monthlySpending: monthlySpending.reverse(),
    };
  }

  /**
   * Anomaly Detection - Detect unusual patterns
   */
  static async detectAnomalies(orgId: string) {
    const anomalies: any[] = [];

    // 1. Unusually large transactions (> 2 standard deviations)
    const largeTransactions = await queryMany(
      `SELECT t.id, t.transaction_number, t.total_debit, t.transaction_date, t.description,
        (SELECT AVG(total_debit) FROM transactions WHERE organization_id = $1 AND transaction_type = t.transaction_type) as avg_amount,
        (SELECT STDDEV(total_debit) FROM transactions WHERE organization_id = $1 AND transaction_type = t.transaction_type) as stddev_amount
       FROM transactions t
       WHERE t.organization_id = $1 AND t.status = 'POSTED'
       ORDER BY t.total_debit DESC LIMIT 10`,
      [orgId]
    );

    for (const tx of largeTransactions) {
      if (Number(tx.stddev_amount) > 0) {
        const zScore = (Number(tx.total_debit) - Number(tx.avg_amount)) / Number(tx.stddev_amount);
        if (zScore > 2) {
          anomalies.push({
            type: 'LARGE_TRANSACTION',
            severity: zScore > 3 ? 'CRITICAL' : 'WARNING',
            entity: tx,
            zScore: Math.round(zScore * 100) / 100,
            description: `Transaction ${tx.transaction_number} is ${zScore.toFixed(1)} standard deviations above average`,
          });
        }
      }
    }

    // 2. Budget overrun detection
    const overruns = await queryMany(
      `SELECT bl.*, coa.name_ar as account_name
       FROM budget_lines bl
       JOIN chart_of_accounts coa ON coa.id = bl.account_id
       WHERE bl.organization_id = $1 AND bl.spent_amount > bl.allocated_budget * 1.1`,
      [orgId]
    );

    for (const item of overruns) {
      anomalies.push({
        type: 'BUDGET_OVERRUN',
        severity: 'CRITICAL',
        entity: item,
        description: `Account "${item.account_name}" has exceeded budget by ${Math.round((Number(item.spent_amount) / Number(item.allocated_budget) - 1) * 100)}%`,
      });
    }

    // 3. Inactive projects
    const inactiveProjects = await queryMany(
      `SELECT id, project_code, name_ar, updated_at
       FROM projects
       WHERE organization_id = $1 AND status_code = 'ACTIVE' AND deleted_at IS NULL
       AND updated_at < NOW() - INTERVAL '30 days'`,
      [orgId]
    );

    for (const proj of inactiveProjects) {
      anomalies.push({
        type: 'INACTIVE_PROJECT',
        severity: 'WARNING',
        entity: proj,
        description: `Project "${proj.name_ar}" has not been updated for 30+ days`,
      });
    }

    return {
      totalAnomalies: anomalies.length,
      critical: anomalies.filter(a => a.severity === 'CRITICAL').length,
      warnings: anomalies.filter(a => a.severity === 'WARNING').length,
      anomalies,
    };
  }

  /**
   * Impact Assessment - Sphere/CHS compliance scoring
   */
  static async impactAssessment(orgId: string) {
    const [beneficiaries, services, projects, finance] = await Promise.all([
      queryOne(
        `SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active
         FROM beneficiaries WHERE organization_id = $1`, [orgId]
      ),
      queryOne(
        `SELECT COUNT(*) as total, COALESCE(SUM(beneficiaries_reached), 0) as reached
         FROM service_deliveries WHERE organization_id = $1`, [orgId]
      ),
      queryOne(
        `SELECT COUNT(*) as total, COUNT(CASE WHEN status_code = 'COMPLETED' THEN 1 END) as completed,
          COALESCE(AVG(progress_percent), 0) as avg_progress
         FROM projects WHERE organization_id = $1 AND deleted_at IS NULL`, [orgId]
      ),
      queryOne(
        `SELECT COALESCE(SUM(total_debit), 0) as total_spent
         FROM transactions WHERE organization_id = $1 AND status = 'POSTED' AND transaction_type = 'PAYMENT'`, [orgId]
      ),
    ]);

    const totalBenef = Number(beneficiaries?.total || 0);
    const totalReached = Number(services?.reached || 0);
    const totalSpent = Number(finance?.total_spent || 0);

    return {
      sphereCompliance: {
        coverage: totalBenef > 0 ? Math.round((totalReached / totalBenef) * 100) : 0,
        efficiency: totalSpent > 0 ? Math.round((totalReached / totalSpent) * 10000) / 100 : 0,
        reachPerDollar: totalSpent > 0 ? Math.round(totalReached / totalSpent * 100) / 100 : 0,
      },
      projectImpact: {
        totalProjects: Number(projects?.total || 0),
        completedProjects: Number(projects?.completed || 0),
        avgProgress: Math.round(Number(projects?.avg_progress || 0)),
        completionRate: Number(projects?.total || 0) > 0
          ? Math.round((Number(projects?.completed || 0) / Number(projects?.total || 0)) * 100)
          : 0,
      },
      beneficiaryImpact: {
        totalRegistered: totalBenef,
        activeBeneficiaries: Number(beneficiaries?.active || 0),
        serviceReach: totalReached,
        costPerBeneficiary: totalBenef > 0 ? Math.round(totalSpent / totalBenef) : 0,
      },
      recommendations: this.generateRecommendations(totalBenef, totalReached, totalSpent),
    };
  }

  /**
   * Executive Summary Generation
   */
  static async executiveSummary(orgId: string) {
    const [projects, beneficiaries, finance, procure] = await Promise.all([
      queryOne(
        `SELECT COUNT(*) as total, COUNT(CASE WHEN status_code = 'ACTIVE' THEN 1 END) as active,
          COALESCE(AVG(progress_percent), 0) as avg_progress, COALESCE(SUM(budget), 0) as total_budget
         FROM projects WHERE organization_id = $1 AND deleted_at IS NULL`, [orgId]
      ),
      queryOne(
        `SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active,
          COALESCE(SUM(family_members_count), 0) as families
         FROM beneficiaries WHERE organization_id = $1`, [orgId]
      ),
      queryOne(
        `SELECT
          COALESCE(SUM(CASE WHEN transaction_type = 'RECEIPT' THEN total_debit ELSE 0 END), 0) as income,
          COALESCE(SUM(CASE WHEN transaction_type = 'PAYMENT' THEN total_debit ELSE 0 END), 0) as expenses,
          COUNT(*) as transactions
         FROM transactions WHERE organization_id = $1 AND status = 'POSTED'`, [orgId]
      ),
      queryOne(
        `SELECT COUNT(*) as po_count, COALESCE(SUM(total_amount), 0) as po_value
         FROM purchase_orders WHERE organization_id = $1 AND status != 'CANCELLED'`, [orgId]
      ),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        projects: { total: Number(projects?.total || 0), active: Number(projects?.active || 0), avgProgress: Math.round(Number(projects?.avg_progress || 0)), totalBudget: Number(projects?.total_budget || 0) },
        beneficiaries: { total: Number(beneficiaries?.total || 0), active: Number(beneficiaries?.active || 0), families: Number(beneficiaries?.families || 0) },
        finance: { income: Number(finance?.income || 0), expenses: Number(finance?.expenses || 0), netBalance: Number(finance?.income || 0) - Number(finance?.expenses || 0), transactions: Number(finance?.transactions || 0) },
        procurement: { poCount: Number(procure?.po_count || 0), poValue: Number(procure?.po_value || 0) },
      },
    };
  }

  private static generateRecommendations(totalBenef: number, totalReached: number, totalSpent: number) {
    const recs: string[] = [];
    if (totalBenef > 0 && totalReached / totalBenef < 0.5) {
      recs.push('Consider expanding service delivery coverage to reach more beneficiaries');
    }
    if (totalSpent > 0 && totalReached > 0 && totalSpent / totalReached > 100) {
      recs.push('Review cost efficiency - cost per beneficiary served is above average');
    }
    if (recs.length === 0) {
      recs.push('System operating within normal parameters');
    }
    return recs;
  }
}
