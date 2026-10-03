/**
 * NexoraOS™ — Accountant Workbench Service
 * Everything the accountant reaches for daily, read-only:
 *  1. Account ledger (كشف حساب) with opening + running balance.
 *  2. Unposted worklist: every DRAFT voucher awaiting posting.
 *  3. Vendor AP aging buckets (current / 30 / 60 / 90+ days).
 *  4. Grant receivables follow-up: overdue + due-soon installments.
 *  5. Zakat due estimator (pure calculator, SILVER_595G nisab standard).
 * Pure SELECTs + pure math — no posting, no mutation, no behavior change.
 */

import { getDatabasePool } from './db.service';

export interface LedgerFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  limit?: number;
  branchCode?: string;
  projectId?: string;
  activityId?: string;
}

export interface LedgerLine {
  entryDate: string;
  voucherNumber: string;
  description: string | null;
  debit: number;
  credit: number;
  currency: string;
  runningBalance: number;
}

export async function getAccountLedger(
  orgId: string,
  accountId: string,
  filters: LedgerFilters = {}
): Promise<{
  account: Record<string, unknown> | null;
  openingBalance: number;
  lines: LedgerLine[];
  totals: { totalDebit: number; totalCredit: number; closingBalance: number };
}> {
  const pool = getDatabasePool();
  const status = filters.status ?? 'POSTED';
  const limit = Math.min(500, Math.max(1, filters.limit ?? 200));

  const account = await pool
    .query(
      `SELECT id, account_code, name_ar, name_en, account_type, currency_code
         FROM chart_of_accounts WHERE id = $1 AND organization_id = $2`,
      [accountId, orgId]
    )
    .then((r) => (r.rows[0] as Record<string, unknown> | undefined) ?? null)
    .catch(() => null);

  const opening = await pool
    .query(
      `SELECT COALESCE(SUM(tl.debit - tl.credit), 0) as balance
         FROM transaction_lines tl
         JOIN transactions t ON t.id = tl.transaction_id
        WHERE tl.organization_id = $1 AND tl.account_id = $2 AND t.status = $3
          AND ($4::date IS NULL OR t.transaction_date < $4::date)
          AND ($5::text IS NULL OR t.branch_code = $5)
          AND ($6::uuid IS NULL OR tl.project_id = $6::uuid)
          AND ($7::uuid IS NULL OR tl.activity_id = $7::uuid)`,
      [orgId, accountId, status, filters.startDate ?? null, filters.branchCode ?? null, filters.projectId ?? null, filters.activityId ?? null]
    )
    .then((r) => Number((r.rows[0] as Record<string, unknown>)?.balance || 0))
    .catch(() => 0);

  const rows = await pool
    .query(
      `SELECT t.transaction_date as entry_date, t.transaction_number as voucher_number,
              COALESCE(tl.description, t.description) as description,
              COALESCE(tl.debit, 0) as debit, COALESCE(tl.credit, 0) as credit,
              COALESCE(tl.currency_code, '') as currency
         FROM transaction_lines tl
         JOIN transactions t ON t.id = tl.transaction_id
        WHERE tl.organization_id = $1 AND tl.account_id = $2 AND t.status = $3
          AND ($4::date IS NULL OR t.transaction_date >= $4::date)
          AND ($5::date IS NULL OR t.transaction_date <= $5::date)
          AND ($6::text IS NULL OR t.branch_code = $6)
          AND ($7::uuid IS NULL OR tl.project_id = $7::uuid)
          AND ($8::uuid IS NULL OR tl.activity_id = $8::uuid)
        ORDER BY t.transaction_date ASC, t.created_at ASC
        LIMIT $9`,
      [orgId, accountId, status, filters.startDate ?? null, filters.endDate ?? null, filters.branchCode ?? null, filters.projectId ?? null, filters.activityId ?? null, limit]
    )
    .then((r) => r.rows as Record<string, unknown>[])
    .catch((): Record<string, unknown>[] => []);

  let running = opening;
  let totalDebit = 0;
  let totalCredit = 0;
  const lines: LedgerLine[] = rows.map((r) => {
    const debit = Number(r.debit || 0);
    const credit = Number(r.credit || 0);
    totalDebit += debit;
    totalCredit += credit;
    running += debit - credit;
    return {
      entryDate: String(r.entry_date),
      voucherNumber: String(r.voucher_number),
      description: r.description == null ? null : String(r.description),
      debit,
      credit,
      currency: String(r.currency || ''),
      runningBalance: running,
    };
  });

  return {
    account,
    openingBalance: opening,
    lines,
    totals: { totalDebit, totalCredit, closingBalance: running },
  };
}

export interface WorklistFilters {
  fiscalYearId?: string;
  limit?: number;
  branchCode?: string;
}

export async function getUnpostedWorklist(orgId: string, filters: WorklistFilters = {}) {
  const pool = getDatabasePool();
  const limit = Math.min(500, Math.max(1, filters.limit ?? 100));
  const rows = await pool
    .query(
      `SELECT 'TRANSACTION' as kind, id, transaction_number as voucher_number,
              transaction_date as voucher_date, total_debit as amount, status,
              (CURRENT_DATE - transaction_date) as age_days
         FROM transactions
        WHERE organization_id = $1 AND status = 'DRAFT'
          AND ($2::uuid IS NULL OR fiscal_year_id = $2::uuid)
          AND ($3::text IS NULL OR branch_code = $3)
       UNION ALL
       SELECT 'JOURNAL' as kind, id, entry_number as voucher_number,
              entry_date as voucher_date,
              (SELECT COALESCE(SUM(debit), 0) FROM journal_entry_lines jel WHERE jel.journal_entry_id = journal_entries.id) as amount,
              status, (CURRENT_DATE - entry_date) as age_days
         FROM journal_entries
        WHERE organization_id = $1 AND status = 'DRAFT'
          AND ($2::uuid IS NULL OR fiscal_year_id = $2::uuid)
          AND ($3::text IS NULL OR branch_code = $3)
       ORDER BY voucher_date ASC
       LIMIT $4`,
      [orgId, filters.fiscalYearId ?? null, filters.branchCode ?? null, limit]
    )
    .then((r) => r.rows as Record<string, unknown>[])
    .catch((): Record<string, unknown>[] => []);
  return {
    count: rows.length,
    totalDraftAmount: rows.reduce((s, r) => s + Number(r.amount || 0), 0),
    items: rows,
    generatedAt: new Date().toISOString(),
  };
}

export interface AgingBucket {
  vendorId: string;
  vendorName: string;
  current: number;
  days30: number;
  days60: number;
  days90plus: number;
  total: number;
}

export async function getVendorAging(orgId: string): Promise<{
  vendors: AgingBucket[];
  totals: { current: number; days30: number; days60: number; days90plus: number; grandTotal: number };
}> {
  const pool = getDatabasePool();
  const rows = await pool
    .query(
      `SELECT vi.vendor_id, COALESCE(v.name_ar, v.name_en, vi.vendor_id::text) as vendor_name,
              vi.total_amount as amount, vi.invoice_date
         FROM vendor_invoices vi
         LEFT JOIN vendors v ON v.id = vi.vendor_id
        WHERE vi.organization_id = $1
          AND UPPER(COALESCE(vi.status, '')) NOT IN ('PAID', 'CANCELLED', 'REJECTED')`,
      [orgId]
    )
    .then((r) => r.rows as Record<string, unknown>[])
    .catch((): Record<string, unknown>[] => []);

  const today = new Date();
  const byVendor = new Map<string, AgingBucket>();
  const totals = { current: 0, days30: 0, days60: 0, days90plus: 0, grandTotal: 0 };

  for (const r of rows) {
    const amount = Number(r.amount || 0);
    const ageDays = Math.max(
      0,
      Math.floor((today.getTime() - new Date(String(r.invoice_date)).getTime()) / 86400000)
    );
    const bucket = ageDays <= 30 ? 'current' : ageDays <= 60 ? 'days30' : ageDays <= 90 ? 'days60' : 'days90plus';
    const id = String(r.vendor_id);
    let entry = byVendor.get(id);
    if (!entry) {
      entry = { vendorId: id, vendorName: String(r.vendor_name), current: 0, days30: 0, days60: 0, days90plus: 0, total: 0 };
      byVendor.set(id, entry);
    }
    entry[bucket] += amount;
    entry.total += amount;
    totals[bucket] += amount;
    totals.grandTotal += amount;
  }

  return { vendors: [...byVendor.values()].sort((a, b) => b.total - a.total), totals };
}

export interface GrantReceivable {
  installmentId: string;
  grantNumber: string;
  grantTitle: string | null;
  donorName: string | null;
  installmentNumber: number | null;
  amount: number;
  currency: string;
  expectedDate: string;
  status: string;
  overdueDays: number;
  urgency: 'OVERDUE' | 'DUE_SOON' | 'UPCOMING';
}

export async function getGrantReceivablesFollowUp(
  orgId: string,
  dueSoonDays = 45
): Promise<{
  overdue: GrantReceivable[];
  dueSoon: GrantReceivable[];
  upcoming: GrantReceivable[];
  totals: { overdueTotal: number; dueSoonTotal: number; upcomingTotal: number; grandTotal: number };
}> {
  const pool = getDatabasePool();
  const rows = await pool
    .query(
      `SELECT gi.id, g.grant_number, g.title_ar as grant_title, d.name_ar as donor_name,
              gi.installment_number, gi.amount, gi.currency_code, gi.expected_date, gi.status,
              (CURRENT_DATE - gi.expected_date) as overdue_days
         FROM grant_installments gi
         JOIN grants g ON g.id = gi.grant_id
         LEFT JOIN donors d ON d.id = g.donor_id
        WHERE g.organization_id = $1
          AND UPPER(COALESCE(gi.status, '')) NOT IN ('RECEIVED', 'CANCELLED')
          AND gi.expected_date IS NOT NULL
        ORDER BY gi.expected_date ASC`
      ,
      [orgId]
    )
    .then((r) => r.rows as Record<string, unknown>[])
    .catch((): Record<string, unknown>[] => []);

  const overdue: GrantReceivable[] = [];
  const dueSoon: GrantReceivable[] = [];
  const upcoming: GrantReceivable[] = [];
  const totals = { overdueTotal: 0, dueSoonTotal: 0, upcomingTotal: 0, grandTotal: 0 };

  for (const r of rows) {
    const overdueDays = Number(r.overdue_days || 0);
    const urgency: GrantReceivable['urgency'] =
      overdueDays > 0 ? 'OVERDUE' : -overdueDays <= dueSoonDays ? 'DUE_SOON' : 'UPCOMING';
    const item: GrantReceivable = {
      installmentId: String(r.id),
      grantNumber: String(r.grant_number),
      grantTitle: r.grant_title == null ? null : String(r.grant_title),
      donorName: r.donor_name == null ? null : String(r.donor_name),
      installmentNumber: r.installment_number == null ? null : Number(r.installment_number),
      amount: Number(r.amount || 0),
      currency: String(r.currency_code || ''),
      expectedDate: String(r.expected_date),
      status: String(r.status),
      overdueDays,
      urgency,
    };
    if (urgency === 'OVERDUE') {
      overdue.push(item);
      totals.overdueTotal += item.amount;
    } else if (urgency === 'DUE_SOON') {
      dueSoon.push(item);
      totals.dueSoonTotal += item.amount;
    } else {
      upcoming.push(item);
      totals.upcomingTotal += item.amount;
    }
    totals.grandTotal += item.amount;
  }

  return { overdue, dueSoon, upcoming, totals };
}

export interface ZakatInputs {
  cashAndBank: number;
  receivables: number;
  inventoryForTrade?: number;
  debtsOwed?: number;
}

export function estimateZakatDue(
  input: ZakatInputs,
  silverPricePerGram: number,
  nisabGrams = 595
): {
  nisabThreshold: number;
  zakatableBase: number;
  meetsNisab: boolean;
  rate: number;
  zakatDue: number;
} {
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const nisabThreshold = round2(Math.max(0, silverPricePerGram) * Math.max(0, nisabGrams));
  const zakatableBase = round2(
    Math.max(0, input.cashAndBank) + Math.max(0, input.receivables) +
    Math.max(0, input.inventoryForTrade ?? 0) - Math.max(0, input.debtsOwed ?? 0)
  );
  const meetsNisab = zakatableBase >= nisabThreshold && nisabThreshold > 0;
  const rate = 0.025;
  return {
    nisabThreshold,
    zakatableBase,
    meetsNisab,
    rate,
    zakatDue: meetsNisab ? round2(zakatableBase * rate) : 0,
  };
}
