/**
 * Hygiene regression tests for migrations/20261006_finance_integrity_backstops.sql
 *
 * Guards the hard safety rules of that migration (same pattern as
 * sql-hygiene.test.ts — pure file inspection, no database):
 *   1. It is a forward migration file and sorts last (migrator discovery).
 *   2. It contains no destructive statements (DROP/TRUNCATE) and no
 *      explicit transaction control (BEGIN/COMMIT/ROLLBACK) — the runner
 *      owns the transaction.
 *   3. Every ADD CONSTRAINT is guarded by a pg_constraint existence check
 *      (PostgreSQL has no ADD CONSTRAINT IF NOT EXISTS).
 *   4. All required deliverables are present.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { listForwardMigrationFiles } from '../migrator';

const FILE = '20261006_finance_integrity_backstops.sql';
const text = readFileSync(join(process.cwd(), 'migrations', FILE), 'utf8');

describe('20261006 finance integrity migration', () => {
  it('is a forward migration file and sorts last', () => {
    const files = listForwardMigrationFiles(join(process.cwd(), 'migrations'));
    expect(files).toContain(FILE);
    expect(files[files.length - 1]).toBe(FILE);
  });

  it('contains no destructive statements or explicit transaction control', () => {
    expect(text).not.toMatch(/\bDROP\s+(TABLE|COLUMN|INDEX|VIEW|CONSTRAINT|FUNCTION|TRIGGER)\b/i);
    expect(text).not.toMatch(/\bTRUNCATE\b/i);
    expect(text).not.toMatch(/^\s*(BEGIN|COMMIT|ROLLBACK)\s*;/im);
  });

  it('guards every ADD CONSTRAINT with a pg_constraint existence check', () => {
    const adds = (text.match(/ADD CONSTRAINT/g) || []).length;
    const guards = (text.match(/FROM pg_constraint/g) || []).length;
    expect(adds).toBeGreaterThan(0);
    expect(guards).toBeGreaterThanOrEqual(adds);
  });

  it('delivers the required backstops', () => {
    // 1. Ledger read-path indexes
    expect(text).toContain('CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_entry');
    expect(text).toContain('CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account');
    expect(text).toContain('CREATE INDEX IF NOT EXISTS idx_journal_entries_org');
    // 2. transactions null-safe balance backstop
    expect(text).toContain('ALTER TABLE transactions ALTER COLUMN total_debit SET NOT NULL');
    expect(text).toContain('ALTER TABLE transactions ALTER COLUMN total_credit SET NOT NULL');
    expect(text).toContain('chk_transaction_balance_notnull');
    // 3. transaction_lines amount integrity
    expect(text).toContain('ALTER TABLE transaction_lines ALTER COLUMN debit_amount SET NOT NULL');
    expect(text).toContain('ALTER TABLE transaction_lines ALTER COLUMN credit_amount SET NOT NULL');
    expect(text).toContain('chk_transaction_lines_nonnegative');
    expect(text).toContain('chk_transaction_lines_single_side');
    // NOT VALID first, separate VALIDATE step
    expect(text).toContain('NOT VALID');
    expect(text).toContain('VALIDATE CONSTRAINT');
    // 4. chart_of_accounts.account_type normalisation + CHECK
    expect(text).toContain('SET account_type = LOWER(account_type)');
    expect(text).toContain('chk_chart_of_accounts_type');
    expect(text).toContain("account_type IN ('asset', 'expense', 'revenue', 'liability', 'equity')");
    // 5. fiscal_periods CREATE TABLE IF NOT EXISTS
    expect(text).toContain('CREATE TABLE IF NOT EXISTS fiscal_periods');
  });
});