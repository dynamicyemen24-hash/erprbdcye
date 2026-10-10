/**
 * NexoraOS™ — Period-Close Readiness Service (CPA track)
 * Institutional month/year-end methodology: a fiscal year may close
 * only when (1) the double-entry ledger balances and (2) no DRAFT
 * vouchers remain. READ-ONLY diagnostics — enforcement stays opt-in
 * via assertPeriodOpen so no existing posting flow changes behavior.
 */

import { getDatabasePool } from './db.service';
import { IPSASFinanceService } from './finance.service';

export interface PeriodCloseChecklist {
  fiscalYearId: string;
  fiscalYearStatus: string;
  balanced: boolean;
  totalDebit: number;
  totalCredit: number;
  variance: number;
  draftTransactions: number;
  draftJournalEntries: number;
  ready: boolean;
  blockers: string[];
  checkedAt: string;
}

const CLOSED_STATUSES = new Set(['CLOSED', 'LOCKED', 'HARD_CLOSED', 'ARCHIVED']);

/**
 * Live `fiscal_years` has no `status` column: openness is the `is_closed`
 * boolean (with `closed_at` as its timestamp). Rows that do not carry that
 * column (legacy / mocked rows) fall back to their raw `status` value so no
 * caller breaks; the database path always reads `is_closed`.
 */
function fiscalYearIsClosed(row: Record<string, unknown>): boolean {
  if ('is_closed' in row) return Boolean(row.is_closed);
  return CLOSED_STATUSES.has(String(row.status ?? '').toUpperCase());
}

function fiscalYearState(row: Record<string, unknown> | null | undefined): string {
  if (!row) return 'UNKNOWN';
  if ('is_closed' in row) return row.is_closed ? 'CLOSED' : 'OPEN';
  return String(row.status ?? 'UNKNOWN');
}

export async function getPeriodCloseChecklist(
  orgId: string,
  fiscalYearId: string
): Promise<PeriodCloseChecklist> {
  const pool = getDatabasePool();
  const blockers: string[] = [];

  const year = (await pool.query(
    `SELECT id, name, start_date, end_date, is_closed, closed_at
       FROM fiscal_years WHERE id = $1 AND organization_id = $2`,
    [fiscalYearId, orgId]
  ).then((r) => r.rows[0] as Record<string, unknown> | undefined).catch(() => undefined)) ?? null;

  const fiscalYearStatus = fiscalYearState(year);
  if (!year) blockers.push('FISCAL_YEAR_NOT_FOUND');
  else if (fiscalYearIsClosed(year)) blockers.push('FISCAL_YEAR_ALREADY_CLOSED');

  const trial = await IPSASFinanceService.getTrialBalance(orgId).catch(() => null);
  const summary = (trial?.summary ?? {}) as { isBalanced?: boolean; totalDebit?: number; totalCredit?: number; variance?: number };
  const balanced = Boolean(summary.isBalanced);
  if (!balanced) blockers.push('LEDGER_OUT_OF_BALANCE');

  const drafts = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM transactions WHERE organization_id = $1 AND fiscal_year_id = $2 AND status = 'DRAFT') as tx,
       (SELECT COUNT(*) FROM journal_entries WHERE organization_id = $1 AND fiscal_year_id = $2 AND status = 'DRAFT') as je`,
    [orgId, fiscalYearId]
  ).then((r) => r.rows[0] as Record<string, unknown>).catch(() => ({ tx: 0, je: 0 }));

  const draftTransactions = Number(drafts.tx || 0);
  const draftJournalEntries = Number(drafts.je || 0);
  if (draftTransactions > 0) blockers.push(`UNPOSTED_TRANSACTIONS:${draftTransactions}`);
  if (draftJournalEntries > 0) blockers.push(`UNPOSTED_JOURNALS:${draftJournalEntries}`);

  return {
    fiscalYearId,
    fiscalYearStatus,
    balanced,
    totalDebit: Number(summary.totalDebit || 0),
    totalCredit: Number(summary.totalCredit || 0),
    variance: Number(summary.variance || 0),
    draftTransactions,
    draftJournalEntries,
    ready: blockers.length === 0,
    blockers,
    checkedAt: new Date().toISOString(),
  };
}

export async function assertPeriodOpen(orgId: string, fiscalYearId: string): Promise<void> {
  const pool = getDatabasePool();
  const row = await pool.query(
    `SELECT id, is_closed, closed_at FROM fiscal_years WHERE id = $1 AND organization_id = $2`,
    [fiscalYearId, orgId]
  ).then((r) => r.rows[0] as Record<string, unknown> | undefined);
  if (row && fiscalYearIsClosed(row)) {
    throw new Error(`Fiscal year is closed (${fiscalYearState(row)}); posting is blocked`);
  }
}
