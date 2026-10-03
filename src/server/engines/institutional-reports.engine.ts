/**
 * NexoraOS™ — Institutional Reports & Analytics Engine
 * Closes the export gaps of ReportExportEngine with an institutional
 * methodology: IPSAS 2 (cash flow), IPSAS 24 (budget information),
 * donor/grant stewardship, COA trial balance, executive brief, audit.
 * ADDITIVE ONLY — reuses KPIEngine as the single source for KPIs and
 * mirrors the IPSASFinanceService balance rule for sliced trial balances.
 */

import { queryOne, queryMany } from '../core/database';
import { KPIEngine } from './reporting.engine';
import { buildReportEnvelope } from '../services/institutional-branding.service';

export interface InstitutionalFilters {
  startDate?: string;
  endDate?: string;
  projectId?: string;
  programId?: string;
  activityId?: string;
  fiscalYearId?: string;
  currency?: string;
  lang?: string;
  branchCode?: string;
}

function stamp() {
  return new Date().toISOString();
}

function quality(valid: boolean, warnings: string[] = []) {
  return { valid, warnings, lastVerified: stamp() };
}

export class InstitutionalReportsEngine {
  /**
   * IPSAS 24 — Budget vs Actual by line (account / project / fiscal year).
   */
  static async generateBudgetVarianceReport(orgId: string, filters: InstitutionalFilters = {}) {
    const envelope = await buildReportEnvelope(orgId, {
      titleAr: 'تقرير الموازنة مقابل الفعلي',
      titleEn: 'Budget vs Actual Report (IPSAS 24)',
      standard: 'IPSAS 24',
      branchCode: filters.branchCode,
      lang: filters.lang,
    });
    const lines = await queryMany(
      `SELECT bl.id, bl.allocated_budget, bl.spent_amount, bl.currency_code, bl.branch_code,
              coa.account_code, coa.name_ar as account_name,
              fy.year_number as fiscal_year, p.name_ar as project_name, pr.name_ar as program_name
         FROM budget_lines bl
         JOIN chart_of_accounts coa ON coa.id = bl.account_id
         JOIN fiscal_years fy ON fy.id = bl.fiscal_year_id
         LEFT JOIN projects p ON p.id = bl.project_id
         LEFT JOIN programs pr ON pr.id = p.program_id
        WHERE bl.organization_id = $1
          AND ($2::uuid IS NULL OR bl.fiscal_year_id = $2::uuid)
          AND ($3::uuid IS NULL OR bl.project_id = $3::uuid)
          AND ($4::uuid IS NULL OR pr.id = $4::uuid)
          AND ($5::text IS NULL OR bl.currency_code = $5)
          AND ($6::text IS NULL OR bl.branch_code = $6)
        ORDER BY fy.year_number DESC, coa.account_code ASC`,
      [orgId, filters.fiscalYearId ?? null, filters.projectId ?? null, filters.programId ?? null, filters.currency ?? null, filters.branchCode ?? null]
    );

    let totalAllocated = 0;
    let totalSpent = 0;
    const rows = lines.map((l: Record<string, unknown>) => {
      const allocated = Number(l.allocated_budget || 0);
      const spent = Number(l.spent_amount || 0);
      totalAllocated += allocated;
      totalSpent += spent;
      const utilization = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
      return {
        ...l,
        allocatedBudget: allocated,
        spentAmount: spent,
        variance: allocated - spent,
        utilizationPercent: utilization,
        status: utilization > 100 ? 'OVERSPENT' : utilization >= 80 ? 'WATCH' : 'ON_TRACK',
      };
    });

    return {
      ...envelope,
      totals: {
        totalAllocated,
        totalSpent,
        totalVariance: totalAllocated - totalSpent,
        utilizationPercent: totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0,
      },
      lines: rows,
      compliance: 'IPSAS 24 Presentation of Budget Information',
      dataQuality: quality(rows.length > 0, rows.length === 0 ? ['No budget lines found'] : []),
    };
  }

  /**
   * Donor & grant stewardship: pledged vs received, campaign progress.
   */
  static async generateDonorReport(orgId: string, filters: InstitutionalFilters = {}) {
    const envelope = await buildReportEnvelope(orgId, {
      titleAr: 'تقرير المانحين والمنح',
      titleEn: 'Donor & Grant Stewardship Report',
      standard: 'IATI / CHS',
      branchCode: filters.branchCode,
      lang: filters.lang,
    });
    const [donors, grants, installments, campaigns, donations] = await Promise.all([
      queryMany(
        `SELECT id, donor_code, name_ar, name_en, donor_type, country, status
           FROM donors WHERE organization_id = $1 ORDER BY name_ar ASC`,
        [orgId]
      ),
      queryMany(
        `SELECT g.*, d.name_ar as donor_name
           FROM grants g LEFT JOIN donors d ON d.id = g.donor_id
          WHERE g.organization_id = $1
            AND ($2::timestamptz IS NULL OR g.start_date >= $2::timestamptz)
            AND ($3::timestamptz IS NULL OR g.start_date <= $3::timestamptz)
          ORDER BY g.start_date DESC`,
        [orgId, filters.startDate ?? null, filters.endDate ?? null]
      ),
      queryMany(
        `SELECT gi.grant_id,
                COALESCE(SUM(gi.amount), 0) as expected_total,
                COALESCE(SUM(CASE WHEN gi.status = 'RECEIVED' THEN gi.amount ELSE 0 END), 0) as received_total
           FROM grant_installments gi
           JOIN grants g ON g.id = gi.grant_id
          WHERE g.organization_id = $1
          GROUP BY gi.grant_id`,
        [orgId]
      ),
      queryMany(
        `SELECT id, name_ar, name_en, target_amount, raised_amount, currency_code, status, start_date, end_date
           FROM donation_campaigns WHERE organization_id = $1 ORDER BY start_date DESC`,
        [orgId]
      ),
      queryOne(
        `SELECT COALESCE(SUM(amount), 0) as total_donations, COUNT(*) as donation_count
           FROM donations
          WHERE organization_id = $1 AND status = 'RECEIVED'
            AND ($2::timestamptz IS NULL OR donation_date >= $2::timestamptz)
            AND ($3::timestamptz IS NULL OR donation_date <= $3::timestamptz)`,
        [orgId, filters.startDate ?? null, filters.endDate ?? null]
      ),
    ]);

    const byGrant = new Map<string, Record<string, unknown>>();
    for (const gi of installments as Record<string, unknown>[]) {
      byGrant.set(String(gi.grant_id), gi);
    }
    let pledged = 0;
    let received = 0;
    const grantRows = (grants as Record<string, unknown>[]).map((g) => {
      const inst = byGrant.get(String(g.id)) ?? { expected_total: 0, received_total: 0 };
      pledged += Number(g.total_amount || 0);
      received += Number(inst.received_total || 0);
      return { ...g, ...inst };
    });

    const campaignRows = (campaigns as Record<string, unknown>[]).map((c) => {
      const target = Number(c.target_amount || 0);
      const raised = Number(c.raised_amount || 0);
      return { ...c, progressPercent: target > 0 ? Math.round((raised / target) * 100) : 0 };
    });

    return {
      ...envelope,
      summary: {
        donorCount: (donors as unknown[]).length,
        grantCount: grantRows.length,
        totalPledged: pledged,
        totalReceived: received,
        collectionRate: pledged > 0 ? Math.round((received / pledged) * 100) : 0,
        totalDonations: Number((donations as Record<string, unknown>)?.total_donations || 0),
        donationCount: Number((donations as Record<string, unknown>)?.donation_count || 0),
      },
      donors,
      grants: grantRows,
      campaigns: campaignRows,
      compliance: 'IATI Standard v2.03 / CHS Commitments 2, 4',
      dataQuality: quality(true),
    };
  }

  /**
   * IPSAS 2 (simplified direct method): receipts vs payments per month.
   */
  static async generateCashFlowReport(orgId: string, filters: InstitutionalFilters = {}) {
    const envelope = await buildReportEnvelope(orgId, {
      titleAr: 'تقرير التدفقات النقدية',
      titleEn: 'Cash Flow Statement (IPSAS 2, direct method)',
      standard: 'IPSAS 2',
      branchCode: filters.branchCode,
      lang: filters.lang,
    });
    const months = await queryMany(
      `SELECT TO_CHAR(t.transaction_date, 'YYYY-MM') as month,
              COALESCE(SUM(CASE WHEN t.transaction_type = 'RECEIPT' THEN t.total_debit ELSE 0 END), 0) as inflows,
              COALESCE(SUM(CASE WHEN t.transaction_type = 'PAYMENT' THEN t.total_credit ELSE 0 END), 0) as outflows,
              COUNT(*) as tx_count
         FROM transactions t
        WHERE t.organization_id = $1 AND t.status = 'POSTED'
          AND ($2::timestamptz IS NULL OR t.transaction_date >= $2::timestamptz)
          AND ($3::timestamptz IS NULL OR t.transaction_date <= $3::timestamptz)
          AND ($4::text IS NULL OR t.branch_code = $4)
        GROUP BY 1 ORDER BY 1 ASC`,
      [orgId, filters.startDate ?? null, filters.endDate ?? null, filters.branchCode ?? null]
    );

    let totalIn = 0;
    let totalOut = 0;
    const rows = (months as Record<string, unknown>[]).map((m) => {
      const inflows = Number(m.inflows || 0);
      const outflows = Number(m.outflows || 0);
      totalIn += inflows;
      totalOut += outflows;
      return { ...m, inflows, outflows, netFlow: inflows - outflows };
    });

    return {
      ...envelope,
      totals: { totalInflows: totalIn, totalOutflows: totalOut, netFlow: totalIn - totalOut },
      months: rows,
      compliance: 'IPSAS 2 Cash Flow Statements',
      dataQuality: quality(rows.length > 0, rows.length === 0 ? ['No posted transactions in range'] : []),
    };
  }

  /**
   * COA trial balance in export shape, sliceable by branch / project /
   * activity. Same control rule as IPSASFinanceService (the canonical
   * org-wide trial balance): balanced when |debit − credit| < 0.001.
   */
  static async generateTrialBalanceReport(orgId: string, filters: InstitutionalFilters = {}) {
    const envelope = await buildReportEnvelope(orgId, {
      titleAr: 'ميزان المراجعة',
      titleEn: 'Trial Balance (double-entry)',
      standard: 'IPSAS',
      branchCode: filters.branchCode,
      lang: filters.lang,
    });
    const accounts = await queryMany(
      `SELECT coa.id as account_id, coa.account_code, coa.name_ar, coa.name_en, coa.account_type,
              COALESCE(SUM(tl.debit), 0) as total_debit,
              COALESCE(SUM(tl.credit), 0) as total_credit,
              (COALESCE(SUM(tl.debit), 0) - COALESCE(SUM(tl.credit), 0)) as net_balance
         FROM chart_of_accounts coa
         LEFT JOIN transaction_lines tl
           ON tl.account_id = coa.id AND tl.organization_id = $1
          AND ($2::uuid IS NULL OR tl.project_id = $2::uuid)
          AND ($3::uuid IS NULL OR tl.activity_id = $3::uuid)
         LEFT JOIN transactions t
           ON t.id = tl.transaction_id AND t.status = 'POSTED'
          AND ($4::text IS NULL OR t.branch_code = $4)
        WHERE (coa.organization_id = $1 OR coa.organization_id IS NULL)
          AND coa.deleted_at IS NULL
        GROUP BY coa.id, coa.account_code, coa.name_ar, coa.name_en, coa.account_type
        ORDER BY coa.account_code ASC`,
      [orgId, filters.projectId ?? null, filters.activityId ?? null, filters.branchCode ?? null]
    );

    let sumDebit = 0;
    let sumCredit = 0;
    const rows = (accounts as Record<string, unknown>[]).map((a) => {
      const d = Number(a.total_debit || 0);
      const c = Number(a.total_credit || 0);
      sumDebit += d;
      sumCredit += c;
      return { ...a, totalDebit: d, totalCredit: c, netBalance: d - c };
    });
    const variance = Math.abs(sumDebit - sumCredit);
    const summary = { totalDebit: sumDebit, totalCredit: sumCredit, variance, isBalanced: variance < 0.001 };
    return {
      ...envelope,
      organizationId: orgId,
      slices: {
        branchCode: filters.branchCode ?? null,
        projectId: filters.projectId ?? null,
        activityId: filters.activityId ?? null,
      },
      summary,
      accounts: rows,
      compliance: 'IPSAS double-entry control: total debit = total credit',
      dataQuality: quality(summary.isBalanced, summary.isBalanced ? [] : ['Ledger out of balance']),
    };
  }

  /**
   * One-page institutional snapshot for leadership (reuses KPIEngine).
   */
  static async generateExecutiveBrief(orgId: string, filters: InstitutionalFilters = {}) {
    const envelope = await buildReportEnvelope(orgId, {
      titleAr: 'الموجز التنفيذي المؤسسي',
      titleEn: 'Institutional Executive Brief',
      standard: 'NEB / IPSAS',
      branchCode: filters.branchCode,
      lang: filters.lang,
    });
    const [kpis, budget, donors] = await Promise.all([
      KPIEngine.getConsolidatedKPIs(orgId),
      queryOne(
        `SELECT COALESCE(SUM(allocated_budget), 0) as allocated, COALESCE(SUM(spent_amount), 0) as spent
           FROM budget_lines WHERE organization_id = $1`,
        [orgId]
      ),
      queryOne(
        `SELECT COUNT(*) as donor_count FROM donors WHERE organization_id = $1 AND status = 'ACTIVE'`,
        [orgId]
      ),
    ]);

    const allocated = Number((budget as Record<string, unknown>)?.allocated || 0);
    const spent = Number((budget as Record<string, unknown>)?.spent || 0);

    return {
      ...envelope,
      kpis,
      budget: {
        allocated,
        spent,
        remaining: allocated - spent,
        utilizationPercent: allocated > 0 ? Math.round((spent / allocated) * 100) : 0,
      },
      activeDonors: Number((donors as Record<string, unknown>)?.donor_count || 0),
      compliance: 'NEB institutional governance / IPSAS',
      dataQuality: quality(true),
    };
  }

  /**
   * Finance decision scorecard (evaluative layer): ledger balance state,
   * budget utilization, draft backlog, payables pressure and grant
   * collection — one verdict per pillar for decision support.
   * Grain rule: every pillar states its own scope explicitly.
   */
  static async generateFinanceScorecard(
    orgId: string,
    filters: InstitutionalFilters & { fiscalYearId?: string } = {}
  ) {
    const envelope = await buildReportEnvelope(orgId, {
      titleAr: 'بطاقة الأداء المالي لاتخاذ القرار',
      titleEn: 'Finance Decision Scorecard',
      standard: 'IPSAS / NEB',
      branchCode: filters.branchCode,
      lang: filters.lang,
    });
    const branch = filters.branchCode ?? null;
    const [trial, budget, drafts, payables, grants] = await Promise.all([
      this.generateTrialBalanceReport(orgId, { branchCode: filters.branchCode }),
      queryOne(
        `SELECT COALESCE(SUM(allocated_budget), 0) as allocated,
                COALESCE(SUM(spent_amount), 0) as spent
           FROM budget_lines
          WHERE organization_id = $1
            AND ($2::text IS NULL OR branch_code = $2)
            AND ($3::text IS NULL OR currency_code = $3)`,
        [orgId, branch, filters.currency ?? null]
      ),
      queryOne(
        `SELECT
           (SELECT COUNT(*) FROM transactions
             WHERE organization_id = $1 AND status = 'DRAFT'
               AND ($2::text IS NULL OR branch_code = $2)) as tx,
           (SELECT COUNT(*) FROM journal_entries
             WHERE organization_id = $1 AND status = 'DRAFT'
               AND ($2::text IS NULL OR branch_code = $2)) as je`,
        [orgId, branch]
      ),
      queryOne(
        `SELECT COALESCE(SUM(total_amount), 0) as outstanding, COUNT(*) as count
           FROM vendor_invoices
          WHERE organization_id = $1
            AND UPPER(COALESCE(status, '')) NOT IN ('PAID', 'CANCELLED', 'REJECTED')`,
        [orgId]
      ),
      queryOne(
        `SELECT COALESCE(SUM(CASE WHEN gi.status = 'RECEIVED' THEN gi.amount ELSE 0 END), 0) as received,
                COALESCE(SUM(gi.amount), 0) as expected
           FROM grant_installments gi
           JOIN grants g ON g.id = gi.grant_id
          WHERE g.organization_id = $1`,
        [orgId]
      ),
    ]);

    const t = trial.summary as { totalDebit: number; totalCredit: number; variance: number; isBalanced: boolean };
    const b = (budget ?? {}) as Record<string, unknown>;
    const d = (drafts ?? {}) as Record<string, unknown>;
    const p = (payables ?? {}) as Record<string, unknown>;
    const g = (grants ?? {}) as Record<string, unknown>;
    const allocated = Number(b.allocated || 0);
    const spent = Number(b.spent || 0);
    const utilization = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
    const collectionRate =
      Number(g.expected || 0) > 0 ? Math.round((Number(g.received || 0) / Number(g.expected || 0)) * 100) : 0;

    const pillars = [
      {
        pillarAr: 'سلامة الدفتر', pillarEn: 'Ledger integrity',
        scope: branch ? `branch:${branch}` : 'organization',
        verdict: t.isBalanced ? 'PASS' : 'FAIL', detail: { variance: t.variance },
      },
      {
        pillarAr: 'الانضباط الموازني', pillarEn: 'Budget discipline',
        scope: branch ? `branch:${branch}` : 'organization',
        verdict: utilization <= 100 ? 'PASS' : 'FAIL', detail: { utilizationPercent: utilization },
      },
      {
        pillarAr: 'تراكم المسودات', pillarEn: 'Draft backlog',
        scope: branch ? `branch:${branch}` : 'organization',
        verdict: Number(d.tx || 0) + Number(d.je || 0) === 0 ? 'PASS' : 'WATCH',
        detail: { draftTransactions: Number(d.tx || 0), draftJournals: Number(d.je || 0) },
      },
      {
        pillarAr: 'ضغط الدائنين', pillarEn: 'Payables pressure',
        scope: 'organization',
        verdict: Number(p.outstanding || 0) > 0 ? 'WATCH' : 'PASS',
        detail: { outstanding: Number(p.outstanding || 0), invoiceCount: Number(p.count || 0) },
      },
      {
        pillarAr: 'تحصيل المنح', pillarEn: 'Grant collection',
        scope: 'organization',
        verdict: collectionRate >= 80 ? 'PASS' : 'WATCH',
        detail: { collectionRate, received: Number(g.received || 0), expected: Number(g.expected || 0) },
      },
    ];

    return {
      ...envelope,
      pillars,
      fails: pillars.filter((x) => x.verdict === 'FAIL').length,
      warnings: pillars.filter((x) => x.verdict === 'WATCH').length,
      compliance: 'IPSAS decision-usefulness / NEB governance',
      dataQuality: quality(true),
    };
  }

  /**
   * Audit activity: volume by action/table plus latest entries.
   */
  static async generateAuditActivityReport(orgId: string, filters: InstitutionalFilters = {}) {
    const envelope = await buildReportEnvelope(orgId, {
      titleAr: 'تقرير النشاط الرقابي',
      titleEn: 'Audit Activity Report',
      standard: 'Internal control',
      branchCode: filters.branchCode,
      lang: filters.lang,
    });
    const [byAction, latest] = await Promise.all([
      queryMany(
        `SELECT action, status, COUNT(*) as count
           FROM audit_logs
          WHERE organization_id = $1
            AND ($2::timestamptz IS NULL OR created_at >= $2::timestamptz)
            AND ($3::timestamptz IS NULL OR created_at <= $3::timestamptz)
          GROUP BY action, status ORDER BY count DESC`,
        [orgId, filters.startDate ?? null, filters.endDate ?? null]
      ),
      queryMany(
        `SELECT action, table_name, record_id, status, ip_address, created_at
           FROM audit_logs
          WHERE organization_id = $1
            AND ($2::timestamptz IS NULL OR created_at >= $2::timestamptz)
            AND ($3::timestamptz IS NULL OR created_at <= $3::timestamptz)
          ORDER BY created_at DESC LIMIT 100`,
        [orgId, filters.startDate ?? null, filters.endDate ?? null]
      ),
    ]);

    return {
      ...envelope,
      byAction,
      latest,
      compliance: 'Immutable audit trail / SoD oversight',
      dataQuality: quality(true),
    };
  }
}
