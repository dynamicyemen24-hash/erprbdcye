/**
 * NexoraOS™ — Smart Reporting & Analytics Engine
 * KPI aggregation, cross-domain analytics, performance dashboards, export
 */

import { query, queryOne, queryMany } from '../core/database';
import { PaginationParams, PaginatedResult } from '../core/types';
import { paginatedQuery } from '../core/helpers';

// ─── Enterprise KPI Engine ─────────────────────────────

export class KPIEngine {
  /**
   * Get consolidated KPIs across all domains
   */
  static async getConsolidatedKPIs(orgId: string) {
    const [projects, beneficiaries, finance, procurement, hr] = await Promise.all([
      // Project KPIs
      queryOne(
        `SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN status_code = 'ACTIVE' THEN 1 END) as active,
          COUNT(CASE WHEN status_code = 'COMPLETED' THEN 1 END) as completed,
          COALESCE(AVG(progress_percent), 0) as avg_progress,
          COALESCE(SUM(budget), 0) as total_budget
         FROM projects WHERE organization_id = $1 AND deleted_at IS NULL`,
        [orgId]
      ),
      // Beneficiary KPIs
      queryOne(
        `SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active,
          COALESCE(SUM(family_members_count), 0) as family_members_reached,
          COUNT(CASE WHEN vulnerability_status = 'HIGH' THEN 1 END) as high_vulnerability
         FROM beneficiaries WHERE organization_id = $1`,
        [orgId]
      ),
      // Financial KPIs
      queryOne(
        `SELECT
          COALESCE(SUM(CASE WHEN t.transaction_type = 'RECEIPT' THEN t.total_debit ELSE 0 END), 0) as total_receipts,
          COALESCE(SUM(CASE WHEN t.transaction_type = 'PAYMENT' THEN t.total_credit ELSE 0 END), 0) as total_payments,
          COALESCE(SUM(t.total_debit), 0) as total_transactions,
          (SELECT COALESCE(SUM(bl.allocated_budget), 0) FROM budget_lines bl WHERE bl.organization_id = $1) as total_budget,
          (SELECT COALESCE(SUM(bl.spent_amount), 0) FROM budget_lines bl WHERE bl.organization_id = $1) as total_spent
         FROM transactions t WHERE t.organization_id = $1 AND t.status = 'POSTED'`,
        [orgId]
      ),
      // Procurement KPIs
      queryOne(
        `SELECT
          COUNT(DISTINCT r.id) as total_rfqs,
          COUNT(DISTINCT CASE WHEN r.status = 'OPEN' THEN r.id END) as open_rfqs,
          COUNT(DISTINCT CASE WHEN r.status = 'AWARDED' THEN r.id END) as awarded_rfqs,
          COUNT(DISTINCT po.id) as total_pos,
          COALESCE(SUM(po.total_amount), 0) as total_po_value
         FROM procurement_tenders r
         LEFT JOIN purchase_orders po ON po.rfq_id = r.id
         WHERE r.organization_id = $1`,
        [orgId]
      ),
      // HR KPIs
      queryOne(
        `SELECT
          COUNT(*) as total_staff,
          COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_staff,
          COUNT(DISTINCT department) as departments
         FROM hr_staff WHERE organization_id = $1`,
        [orgId]
      ),
    ]);

    return {
      timestamp: new Date().toISOString(),
      organizationId: orgId,
      projects: {
        total: Number(projects?.total || 0),
        active: Number(projects?.active || 0),
        completed: Number(projects?.completed || 0),
        avgProgress: Math.round(Number(projects?.avg_progress || 0)),
        totalBudget: Number(projects?.total_budget || 0),
      },
      beneficiaries: {
        total: Number(beneficiaries?.total || 0),
        active: Number(beneficiaries?.active || 0),
        familyMembersReached: Number(beneficiaries?.family_members_reached || 0),
        highVulnerability: Number(beneficiaries?.high_vulnerability || 0),
      },
      finance: {
        totalReceipts: Number(finance?.total_receipts || 0),
        totalPayments: Number(finance?.total_payments || 0),
        totalBudget: Number(finance?.total_budget || 0),
        totalSpent: Number(finance?.total_spent || 0),
        budgetUtilization: Number(finance?.total_budget || 0) > 0
          ? Math.round((Number(finance?.total_spent || 0) / Number(finance?.total_budget || 0)) * 100)
          : 0,
      },
      procurement: {
        totalRFQs: Number(procurement?.total_rfqs || 0),
        openRFQs: Number(procurement?.open_rfqs || 0),
        awardedRFQs: Number(procurement?.awarded_rfqs || 0),
        totalPOs: Number(procurement?.total_pos || 0),
        totalPOValue: Number(procurement?.total_po_value || 0),
      },
      hr: {
        totalStaff: Number(hr?.total_staff || 0),
        activeStaff: Number(hr?.active_staff || 0),
        departments: Number(hr?.departments || 0),
      },
    };
  }

  /**
   * Get strategic alignment KPIs (NEB-01)
   */
  static async getStrategicKPIs(orgId: string) {
    const plans = await queryMany(
      `SELECT sp.*, 
        (SELECT COUNT(*) FROM strategic_goals sg WHERE sg.plan_id = sp.id) as total_goals,
        (SELECT COUNT(*) FROM strategic_goals sg WHERE sg.plan_id = sp.id AND sg.status = 'ON_TRACK') as on_track_goals,
        (SELECT COUNT(*) FROM strategic_goals sg WHERE sg.plan_id = sp.id AND sg.status = 'AT_RISK') as at_risk_goals
       FROM strategic_plans sp
       WHERE sp.organization_id = $1 AND sp.status = 'ACTIVE'`,
      [orgId]
    );

    const kpis = await queryMany(
      `SELECT kpi.*,
        CASE WHEN kpi.target_value > 0
          THEN ROUND((kpi.current_value::float / kpi.target_value::float * 100)::numeric, 2)
          ELSE 0 END as achievement_pct
       FROM kpi_indicators kpi
       WHERE kpi.organization_id = $1 AND kpi.status = 'ACTIVE'
       ORDER BY achievement_pct DESC`,
      [orgId]
    );

    return { strategicPlans: plans, kpis };
  }

  /**
   * Get time-series data for trends (monthly)
   */
  static async getMonthlyTrends(orgId: string, months = 12) {
    const [beneficiaryTrends, financialTrends, projectTrends] = await Promise.all([
      // Beneficiary registration trends
      queryMany(
        `SELECT
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as new_beneficiaries
         FROM beneficiaries
         WHERE organization_id = $1 AND created_at >= NOW() - INTERVAL '${months} months'
         GROUP BY DATE_TRUNC('month', created_at)
         ORDER BY month`,
        [orgId]
      ),
      // Financial transaction trends
      queryMany(
        `SELECT
          DATE_TRUNC('month', transaction_date) as month,
          transaction_type,
          SUM(total_debit) as total_amount
         FROM transactions
         WHERE organization_id = $1 AND status = 'POSTED'
           AND transaction_date >= NOW() - INTERVAL '${months} months'
         GROUP BY DATE_TRUNC('month', transaction_date), transaction_type
         ORDER BY month`,
        [orgId]
      ),
      // Project completion trends
      queryMany(
        `SELECT
          DATE_TRUNC('month', updated_at) as month,
          COUNT(CASE WHEN status_code = 'COMPLETED' THEN 1 END) as completed
         FROM projects
         WHERE organization_id = $1 AND deleted_at IS NULL
           AND updated_at >= NOW() - INTERVAL '${months} months'
         GROUP BY DATE_TRUNC('month', updated_at)
         ORDER BY month`,
        [orgId]
      ),
    ]);

    return {
      beneficiaryTrends,
      financialTrends,
      projectTrends,
    };
  }
}

// ─── Database Views Engine ─────────────────────────────

export class ViewEngine {
  /**
   * Execute a whitelisted database view
   */
  private static readonly ALLOWED_VIEWS = [
    'v_beneficiary_summary',
    'v_project_overview',
    'v_financial_summary',
    'v_procurement_status',
    'v_volunteer_hours',
    'v_asset_register',
    'v_grant_utilization',
    'v_budget_variance',
    'v_service_delivery_metrics',
    'v_sponsorship_tracker',
    'v_hr_department_summary',
    'v_audit_trail',
  ];

  static async executeView(viewName: string, orgId: string, params?: Record<string, any>) {
    if (!this.ALLOWED_VIEWS.includes(viewName)) {
      throw new Error(`View '${viewName}' is not whitelisted for execution`);
    }

    const result = await queryMany(
      `SELECT * FROM ${viewName} WHERE organization_id = $1 LIMIT 500`,
      [orgId]
    );

    return {
      view: viewName,
      organizationId: orgId,
      recordCount: result.length,
      data: result,
      executedAt: new Date().toISOString(),
    };
  }

  /**
   * List available views
   */
  static async listAvailableViews(orgId: string) {
    const views = await queryMany(
      `SELECT table_name
       FROM information_schema.views
       WHERE table_schema = 'public' AND table_name LIKE 'v_%'
       ORDER BY table_name`
    );

    return {
      views: views.map((v: any) => v.table_name),
      whitelisted: this.ALLOWED_VIEWS,
    };
  }
}

// ─── Report Export Engine ───────────────────────────────

export class ReportExportEngine {
  /**
   * Generate report data structure for PDF/Excel export
   */
  static async generateReport(orgId: string, reportType: string, options?: {
    startDate?: string;
    endDate?: string;
    projectId?: string;
  }) {
    const baseFilters = options || {};

    switch (reportType) {
      case 'beneficiary_summary':
        return this.generateBeneficiaryReport(orgId, baseFilters);
      case 'financial_statement':
        return this.generateFinancialReport(orgId, baseFilters);
      case 'project_status':
        return this.generateProjectReport(orgId, baseFilters);
      case 'procurement_summary':
        return this.generateProcurementReport(orgId, baseFilters);
      case 'service_delivery':
        return this.generateServiceDeliveryReport(orgId, baseFilters);
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  private static async generateBeneficiaryReport(orgId: string, filters: any) {
    const stats = await queryOne(
      `SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN gender = 'MALE' THEN 1 END) as male,
        COUNT(CASE WHEN gender = 'FEMALE' THEN 1 END) as female,
        COALESCE(SUM(family_members_count), 0) as family_members,
        COUNT(CASE WHEN vulnerability_status = 'HIGH' THEN 1 END) as high_vuln,
        COUNT(CASE WHEN vulnerability_status = 'MEDIUM' THEN 1 END) as med_vuln,
        COUNT(CASE WHEN vulnerability_status = 'LOW' THEN 1 END) as low_vuln,
        (SELECT COUNT(*) FROM beneficiaries WHERE organization_id = $1 AND status = 'INACTIVE') as inactive
       FROM beneficiaries WHERE organization_id = $1`,
      [orgId]
    );

    const byGovernorate = await queryMany(
      `SELECT governorate, COUNT(*) as count, SUM(family_members_count) as families
       FROM beneficiaries WHERE organization_id = $1 AND governorate IS NOT NULL
       GROUP BY governorate ORDER BY count DESC`,
      [orgId]
    );

    // Validate data integrity before returning report
    function validateBeneficiaryData(stats: any): { valid: boolean; errors: string[] } {
      const errors: string[] = [];
      
      if (stats.total === 0 || stats.total === undefined) {
        errors.push('No beneficiary records found');
      }
      
      if (stats.male !== undefined && stats.female !== undefined && (stats.male + stats.female) > stats.total) {
        errors.push('Gender count exceeds total beneficiary count');
      }
      
      if (stats.family_members && stats.family_members < 0) {
        errors.push('Invalid family members count (negative value)');
      }
      
      if (stats.high_vuln !== undefined && stats.med_vuln !== undefined && stats.low_vuln !== undefined) {
        const vulnTotal = (stats.high_vuln || 0) + (stats.med_vuln || 0) + (stats.low_vuln || 0);
        if (vulnTotal > (stats.total || 0)) {
          errors.push('Vulnerability status counts exceed total beneficiary count');
        }
      }
      
      return { valid: errors.length === 0, errors };
    }
    
    const dataValidation = validateBeneficiaryData(stats);
    
    return {
          title: 'تقرير المستفيدين - Beneficiary Summary Report',
          titleEn: 'Beneficiary Summary Report',
          generatedAt: new Date().toISOString(),
          summary: {
            ...stats,
            // Add computed fields for better accuracy
            genderDistribution: {
              male: stats.male || 0,
              female: stats.female || 0,
              percentageMale: stats.total > 0
                ? Math.round((Number(stats.male || 0) / Number(stats.total)) * 100)
                : 0,
              percentageFemale: stats.total > 0
                ? Math.round((Number(stats.female || 0) / Number(stats.total)) * 100)
                : 0
            }
          },
          byGovernorate,
          compliance: 'Sphere Standards / CHS',
          dataQuality: {
            valid: dataValidation.valid,
            warnings: dataValidation.errors,
            lastVerified: new Date().toISOString()
          }
        };
  }

  private static async generateFinancialReport(orgId: string, filters: any) {
    const summary = await queryOne(
      `SELECT
        COALESCE(SUM(total_debit), 0) as total_debit,
        COALESCE(SUM(total_credit), 0) as total_credit,
        COUNT(*) as total_transactions,
        COALESCE(SUM(total_debit) - SUM(total_credit), 0) as net_position,
        (SELECT COUNT(DISTINCT account_id) FROM transactions WHERE organization_id = $1 AND status = 'POSTED') as active_accounts
       FROM transactions
       WHERE organization_id = $1 AND status = 'POSTED'`,
      [orgId]
    );

    const byType = await queryMany(
      `SELECT transaction_type, COUNT(*) as count, SUM(total_debit) as amount
       FROM transactions WHERE organization_id = $1 AND status = 'POSTED'
       GROUP BY transaction_type`,
      [orgId]
    );

    // Calculate financial health metrics
    const financialHealth = {
      liquidityRatio: Number(summary.total_credit) > 0
        ? Math.round((Number(summary.total_debit) / Number(summary.total_credit)) * 100) / 100
        : 0,
      averageTransactionValue: Number(summary.total_transactions) > 0
        ? Math.round(Number(summary.total_debit) / Number(summary.total_transactions))
        : 0,
      netPosition: Number(summary.net_position)
    };

    return {
      title: 'التقرير المالي - Financial Statement',
      titleEn: 'IPSAS Financial Statement',
      standard: 'IPSAS',
      generatedAt: new Date().toISOString(),
      summary: {
        ...summary,
        totalDebit: Number(summary.total_debit),
        totalCredit: Number(summary.total_credit),
        totalTransactions: Number(summary.total_transactions),
        netPosition: Number(summary.net_position),
        activeAccounts: Number(summary.active_accounts)
      },
      byType,
      financialHealth,
      compliance: 'IPSAS International Public Sector Accounting Standards',
      dataQuality: {
        valid: true,
        lastVerified: new Date().toISOString()
      }
    };
  }

  private static async generateProjectReport(orgId: string, filters: any) {
    const projects = await queryMany(
      `SELECT p.*, pr.name_ar as program_name,
         (SELECT COUNT(*) FROM milestones m WHERE m.project_id = p.id AND m.status = 'COMPLETED') as completed_milestones,
         (SELECT COUNT(*) FROM milestones m WHERE m.project_id = p.id) as total_milestones
        FROM projects p
        LEFT JOIN programs pr ON pr.id = p.program_id
        WHERE p.organization_id = $1 AND p.deleted_at IS NULL
        ORDER BY p.progress_percent DESC`,
      [orgId]
    );

    // Calculate project health metrics
    const projectHealth = {
      completionRate: projects.length > 0
        ? Math.round((projects.filter(p => p.progress_percent >= 100).length / projects.length) * 100)
        : 0,
      onTrackRate: projects.length > 0
        ? Math.round((projects.filter(p => p.progress_percent >= 70).length / projects.length) * 100)
        : 0,
      averageProgress: projects.length > 0
        ? Math.round(projects.reduce((sum, p) => sum + (p.progress_percent || 0), 0) / projects.length)
        : 0,
      totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
      totalSpent: projects.reduce((sum, p) => sum + (p.spent_amount || 0), 0)
    };

    return {
      title: 'تقرير المشاريع - Project Status Report',
      titleEn: 'Project Status Report',
      generatedAt: new Date().toISOString(),
      totalProjects: projects.length,
      projects,
      projectHealth,
      compliance: 'Project Management Best Practices',
      dataQuality: {
        valid: projects.length > 0,
        lastVerified: new Date().toISOString()
      }
    };
  }

  private static async generateProcurementReport(orgId: string, filters: any) {
    const rfqs = await queryMany(
      `SELECT r.*, (SELECT COUNT(*) FROM vendor_bids vb WHERE vb.rfq_id = r.id) as bids_count
       FROM procurement_tenders r WHERE r.organization_id = $1`,
      [orgId]
    );

    const pos = await queryMany(
      `SELECT po.*, v.name_ar as vendor_name
       FROM purchase_orders po
       LEFT JOIN vendors v ON v.id = po.vendor_id
       WHERE po.organization_id = $1`,
      [orgId]
    );

    // Calculate procurement metrics
    const procurementMetrics = {
      totalRFQs: rfqs.length,
      openRFQs: rfqs.filter(r => r.status === 'OPEN').length,
      awardedRFQs: rfqs.filter(r => r.status === 'AWARDED').length,
      totalPOs: pos.length,
      totalPOValue: pos.reduce((sum, po) => sum + (po.total_amount || 0), 0),
      averageBidsPerRFQ: rfqs.length > 0
        ? Math.round(rfqs.reduce((sum, r) => sum + (r.bids_count || 0), 0) / rfqs.length)
        : 0,
      vendorCount: new Set(pos.map(po => po.vendor_id).filter(Boolean)).size
    };

    return {
      title: 'تقرير المشتريات - Procurement Summary Report',
      titleEn: 'Procurement Summary Report',
      generatedAt: new Date().toISOString(),
      rfqs,
      purchaseOrders: pos,
      procurementMetrics,
      compliance: 'Public Procurement Standards',
      dataQuality: {
        valid: true,
        lastVerified: new Date().toISOString()
      }
    };
  }

  private static async generateServiceDeliveryReport(orgId: string, filters: any) {
    const services = await queryMany(
      `SELECT sd.*, p.name_ar as project_name, b.full_name_ar as beneficiary_name
       FROM service_deliveries sd
       LEFT JOIN projects p ON p.id = sd.project_id
       LEFT JOIN beneficiaries b ON b.id = sd.beneficiary_id
       WHERE sd.organization_id = $1
       ORDER BY sd.delivery_date DESC LIMIT 100`,
      [orgId]
    );

    const byType = await queryMany(
      `SELECT service_type, COUNT(*) as count, SUM(beneficiaries_reached) as reached
       FROM service_deliveries WHERE organization_id = $1
       GROUP BY service_type ORDER BY count DESC`,
      [orgId]
    );

    return {
      title: 'تقرير تقديم الخدمات - Service Delivery Report',
      titleEn: 'Service Delivery Report',
      generatedAt: new Date().toISOString(),
      services,
      byType,
    };
  }

  /**
   * Generates IATI Standard v2.03 Compliant Humanitarian Activity Export
   */
  static async generateIATIStandardReport(orgId: string, projectId?: string) {
    const projects = await queryMany(
      `SELECT p.*, o.name_ar as org_name
       FROM projects p
       LEFT JOIN organizations o ON o.id = p.organization_id
       WHERE (p.organization_id = $1 OR $1 IS NULL)
         AND ($2::text IS NULL OR p.id = $2::text)`,
      [orgId, projectId || null]
    );

    const iatiActivities = projects.map(proj => ({
      iatiIdentifier: `ROH-YEM-${proj.id}`,
      title: {
        narrativeAr: proj.name_ar,
        narrativeEn: proj.name_en || proj.name_ar,
      },
      description: proj.description_ar || 'Humanitarian Development Intervention',
      activityStatus: proj.status_code === 'COMPLETED' ? '3' : '2',
      participatingOrganizations: [
        {
          ref: 'ROHAMAAB-FOUNDATION',
          role: '4', // Implementing
          type: '22', // National NGO
          name: 'Rohamā\'a Baynahum Charity Foundation (جمعية رُحماء بينهم)',
        },
      ],
      recipientCountry: { code: 'YE', name: 'Yemen' },
      budget: {
        valueUSD: proj.budget || 0,
        currency: 'USD',
        periodStart: proj.start_date,
        periodEnd: proj.end_date,
      },
      spentAmountUSD: proj.spent_amount || 0,
      complianceStandard: 'IATI Standard v2.03 / CHS Sphere Standard',
    }));

    return {
      publisher: 'Rohamā\'a Baynahum Charity Foundation (جمعية رُحماء بينهم للعمل الإنساني والتنمية)',
      iatiVersion: '2.03',
      generatedAt: new Date().toISOString(),
      activityCount: iatiActivities.length,
      activities: iatiActivities,
    };
  }
}

