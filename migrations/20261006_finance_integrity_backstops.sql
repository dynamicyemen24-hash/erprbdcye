-- ================================================================
-- NexoraOS — Ledger read-path indexes + IPSAS integrity backstops
-- Migration: 20261006_finance_integrity_backstops
--
-- LIVE PROBE (read-only, PostgreSQL 17.11, 2026-10-06) — the numbers
-- this file was written against:
--   * journal_entry_lines / journal_entries: 0 rows, and
--     journal_entry_lines had ONLY journal_entry_lines_pkey — no index
--     on journal_entry_id (every ledger read joins through it) and none
--     on account_id. journal_entries(organization_id) already exists as
--     idx_journal_entries_org.
--   * transactions: 22 rows, 0 NULL totals, 0 total_debit/total_credit
--     mismatches, both columns NULLABLE, and chk_transaction_balance is
--     `CHECK (total_debit = total_credit)` — which PASSES when both
--     sides are NULL (null-rejecting-optional).
--   * transaction_lines: 44 rows, 0 NULL amounts, 0 negatives, 0 rows
--     with both sides positive, 0 rows with neither side positive;
--     SUM(debit_amount) = SUM(credit_amount) = 10,571,008.00.
--   * chart_of_accounts: 248 rows, account_type NOT NULL, no CHECK.
--     Observed set (LOWER(account_type) DISTINCT): asset, expense,
--     revenue, liability, equity. 2 uppercase outliers: 'ASSET' on
--     account_code DUP-001 and DUP-002.
--   * fiscal_periods exists live (8 rows) but no CREATE TABLE for it
--     exists anywhere in this repository.
--
-- HOUSE RULES HONOURED:
--   * Idempotent / re-runnable end to end: CREATE ... IF NOT EXISTS,
--     pg_constraint guards (PostgreSQL has no ADD CONSTRAINT IF NOT
--     EXISTS), SET NOT NULL (repeatable), UPDATEs keyed on "still
--     differs" predicates.
--   * src/server/database/migrator.ts applies each file inside ONE
--     transaction and then records the file name in _migrations, so
--     this file contains no explicit transaction control and no
--     rollback script (purely additive DDL + one 2-row case
--     normalisation; nothing is ever deleted).
--   * Every DDL block is wrapped in the repo's EXCEPTION WHEN
--     undefined_table / undefined_column / duplicate_* handler so that
--     schema drift degrades to a NOTICE instead of a fatal bootstrap
--     (guard style copied from 20260820_001 and 20261003_*).
--
-- VERIFICATION: the whole file was executed verbatim inside a
--   BEGIN ... ROLLBACK session against the live database on 2026-10-06
--   (never committed) and afterwards _migrations, pg_constraint,
--   pg_indexes, information_schema.columns and chart_of_accounts all
--   showed no trace of it.
--
-- ORDERING CAVEAT (single-file scope): this file sorts AFTER
--   20260830_unified_expense_engine and 20260915_001_immutable_audit_ledger,
--   which already carry FKs to cost_centers(id) / fiscal_periods(id).
--   On a database built from scratch those two files still fail first,
--   so making the migration set self-contained from an EMPTY database
--   additionally requires back-dating this DDL to <= 20260830 (and a
--   CREATE TABLE for cost_centers, which is a listed gap but not a
--   deliverable of this file). On the live database both tables already
--   exist, so here CREATE TABLE IF NOT EXISTS is a no-op.
-- ================================================================

-- ─── 1. Ledger read-path indexes (CONTRIBUTING: index your FKs) ────
-- journal_entry_lines is the JOIN-heavy table behind every ledger
-- read: journal_entries ON journal_entry_id, chart_of_accounts ON
-- account_id. Live had only the primary key.

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_entry
    ON journal_entry_lines (journal_entry_id);
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'journal_entry_lines(journal_entry_id) index skipped (schema drift): %', SQLERRM;
END
$$;

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account
    ON journal_entry_lines (account_id);
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'journal_entry_lines(account_id) index skipped (schema drift): %', SQLERRM;
END
$$;

-- idx_journal_entries_org already exists live (probed 2026-10-06), so
-- the IF NOT EXISTS below is a no-op there; it is still emitted because
-- no other file in the repo creates that index, so a freshly built
-- database would otherwise never get it.
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_journal_entries_org
    ON journal_entries (organization_id);
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'journal_entries(organization_id) index skipped (schema drift): %', SQLERRM;
END
$$;

-- ─── 2. transactions: null-safe balance backstop (IPSAS) ───────────
-- 2a. Backfill NULL totals first (0 rows live) so SET NOT NULL can
--     never fail on drifted data. This only fills the column default
--     into rows where it is still NULL — no row is removed or altered
--     otherwise.

DO $$
BEGIN
  UPDATE transactions SET total_debit = 0 WHERE total_debit IS NULL;
  UPDATE transactions SET total_credit = 0 WHERE total_credit IS NULL;
EXCEPTION WHEN undefined_table OR undefined_column THEN
  RAISE NOTICE 'transactions NULL-total backfill skipped (schema drift): %', SQLERRM;
END
$$;

-- 2b. Pin both totals NOT NULL. ALTER COLUMN SET NOT NULL is naturally
--     idempotent (re-running it on an already NOT NULL column is a
--     no-op), and with the columns NOT NULL the legacy equality CHECK
--     can no longer evaluate to NULL.

DO $$
BEGIN
  ALTER TABLE transactions ALTER COLUMN total_debit SET NOT NULL;
  ALTER TABLE transactions ALTER COLUMN total_credit SET NOT NULL;
EXCEPTION WHEN undefined_table OR undefined_column OR not_null_violation OR check_violation THEN
  RAISE NOTICE 'transactions NOT NULL pin skipped (schema drift): %', SQLERRM;
END
$$;

-- 2c. chk_transaction_balance (20260820_001) is deliberately LEFT IN
--     PLACE — never dropped — it stays valid once the columns are NOT
--     NULL. The constraint below states the backstop explicitly
--     (columns present + equal), so the check remains null-safe even
--     if column nullability is ever relaxed again.
--     Added NOT VALID so ADD can never fail on pre-existing rows of a
--     drifted database; validation is a separate guarded step (2d).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_transaction_balance_notnull'
      AND conrelid = 'transactions'::regclass
  ) THEN
    ALTER TABLE transactions
      ADD CONSTRAINT chk_transaction_balance_notnull
      CHECK (total_debit IS NOT NULL AND total_credit IS NOT NULL AND total_debit = total_credit)
      NOT VALID;
  END IF;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_object OR duplicate_table THEN
  RAISE NOTICE 'chk_transaction_balance_notnull skipped (schema drift): %', SQLERRM;
END
$$;

-- 2d. Separate VALIDATE step: skipped when already validated; if a
--     drifted database holds a pre-existing imbalance the validation
--     error is caught, the constraint stays NOT VALID (still enforced
--     for every new/updated row) and a WARNING tells the operator how
--     to finish the job instead of aborting the whole migration.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_transaction_balance_notnull'
      AND conrelid = 'transactions'::regclass
      AND NOT convalidated
  ) THEN
    ALTER TABLE transactions VALIDATE CONSTRAINT chk_transaction_balance_notnull;
  END IF;
EXCEPTION WHEN check_violation OR undefined_table OR undefined_column THEN
  RAISE WARNING 'chk_transaction_balance_notnull left NOT VALID (%). Fix the offending rows, then run: ALTER TABLE transactions VALIDATE CONSTRAINT chk_transaction_balance_notnull', SQLERRM;
END
$$;

-- ─── 3. transaction_lines: amount integrity (IPSAS double entry) ───
-- 3a. Backfill NULL amounts to the column default (0 rows live) so the
--     NOT NULL pin below cannot fail on drifted data.

DO $$
BEGIN
  UPDATE transaction_lines SET debit_amount = 0 WHERE debit_amount IS NULL;
  UPDATE transaction_lines SET credit_amount = 0 WHERE credit_amount IS NULL;
EXCEPTION WHEN undefined_table OR undefined_column THEN
  RAISE NOTICE 'transaction_lines NULL-amount backfill skipped (schema drift): %', SQLERRM;
END
$$;

DO $$
BEGIN
  ALTER TABLE transaction_lines ALTER COLUMN debit_amount SET NOT NULL;
  ALTER TABLE transaction_lines ALTER COLUMN credit_amount SET NOT NULL;
EXCEPTION WHEN undefined_table OR undefined_column OR not_null_violation OR check_violation THEN
  RAISE NOTICE 'transaction_lines NOT NULL pin skipped (schema drift): %', SQLERRM;
END
$$;

-- 3b. No negative amounts (0 of 44 live rows affected). NOT VALID first,
--     validated separately in 3d.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_transaction_lines_nonnegative'
      AND conrelid = 'transaction_lines'::regclass
  ) THEN
    ALTER TABLE transaction_lines
      ADD CONSTRAINT chk_transaction_lines_nonnegative
      CHECK (debit_amount >= 0 AND credit_amount >= 0)
      NOT VALID;
  END IF;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_object OR duplicate_table THEN
  RAISE NOTICE 'chk_transaction_lines_nonnegative skipped (schema drift): %', SQLERRM;
END
$$;

-- 3c. Exactly one side positive: a line may be a debit OR a credit,
--     never both and never neither (0 of 44 live rows affected — the
--     live data was verified row by row before enabling this).
--     WHY NOT VALID: ADD CONSTRAINT ... NOT VALID skips the scan of
--     pre-existing rows, so a drifted database can never be blocked at
--     ADD time; the separate VALIDATE step (3d) is what proves the
--     existing 44 rows, and if it ever fails the constraint still
--     governs every new/updated row while the migration itself
--     completes (WARNING instead of a fatal abort). Live data passes:
--     0 NULLs, 0 negatives, 0 both-positive, 0 zero-amount rows.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_transaction_lines_single_side'
      AND conrelid = 'transaction_lines'::regclass
  ) THEN
    ALTER TABLE transaction_lines
      ADD CONSTRAINT chk_transaction_lines_single_side
      CHECK (
        (debit_amount > 0 AND credit_amount = 0)
        OR (credit_amount > 0 AND debit_amount = 0)
      )
      NOT VALID;
  END IF;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_object OR duplicate_table THEN
  RAISE NOTICE 'chk_transaction_lines_single_side skipped (schema drift): %', SQLERRM;
END
$$;

-- 3d. Validate the two line constraints (no-op when already validated).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_transaction_lines_nonnegative'
      AND conrelid = 'transaction_lines'::regclass
      AND NOT convalidated
  ) THEN
    ALTER TABLE transaction_lines VALIDATE CONSTRAINT chk_transaction_lines_nonnegative;
  END IF;
EXCEPTION WHEN check_violation OR undefined_table OR undefined_column THEN
  RAISE WARNING 'chk_transaction_lines_nonnegative left NOT VALID (%). Fix the offending rows, then run: ALTER TABLE transaction_lines VALIDATE CONSTRAINT chk_transaction_lines_nonnegative', SQLERRM;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_transaction_lines_single_side'
      AND conrelid = 'transaction_lines'::regclass
      AND NOT convalidated
  ) THEN
    ALTER TABLE transaction_lines VALIDATE CONSTRAINT chk_transaction_lines_single_side;
  END IF;
EXCEPTION WHEN check_violation OR undefined_table OR undefined_column THEN
  RAISE WARNING 'chk_transaction_lines_single_side left NOT VALID (%). Fix the offending rows, then run: ALTER TABLE transaction_lines VALIDATE CONSTRAINT chk_transaction_lines_single_side', SQLERRM;
END
$$;

-- ─── 4. chart_of_accounts.account_type: normalise then guard ───────
-- 4a. Data normalisation — exactly 2 rows live (DUP-001, DUP-002):
--     'ASSET' -> 'asset'. The predicate re-checks the value, so a
--     second run touches 0 rows; no row is inserted or removed.

DO $$
BEGIN
  UPDATE chart_of_accounts
  SET account_type = LOWER(account_type)
  WHERE account_type IS DISTINCT FROM LOWER(account_type);
EXCEPTION WHEN undefined_table OR undefined_column THEN
  RAISE NOTICE 'chart_of_accounts.account_type normalisation skipped (schema drift): %', SQLERRM;
END
$$;

-- 4b. Allowed set confirmed against live data (SELECT account_type,
--     COUNT(*) GROUP BY 1 on 248 rows): expense 125, asset 58+2,
--     revenue 30, liability 24, equity 9. NOT VALID + separate
--     VALIDATE (4c) so an unknown type left behind by drift can never
--     abort the migration at ADD time.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_chart_of_accounts_type'
      AND conrelid = 'chart_of_accounts'::regclass
  ) THEN
    ALTER TABLE chart_of_accounts
      ADD CONSTRAINT chk_chart_of_accounts_type
      CHECK (account_type IN ('asset', 'expense', 'revenue', 'liability', 'equity'))
      NOT VALID;
  END IF;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_object OR duplicate_table THEN
  RAISE NOTICE 'chk_chart_of_accounts_type skipped (schema drift): %', SQLERRM;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_chart_of_accounts_type'
      AND conrelid = 'chart_of_accounts'::regclass
      AND NOT convalidated
  ) THEN
    ALTER TABLE chart_of_accounts VALIDATE CONSTRAINT chk_chart_of_accounts_type;
  END IF;
EXCEPTION WHEN check_violation OR undefined_table OR undefined_column THEN
  RAISE WARNING 'chk_chart_of_accounts_type left NOT VALID (%). Fix the offending rows, then run: ALTER TABLE chart_of_accounts VALIDATE CONSTRAINT chk_chart_of_accounts_type', SQLERRM;
END
$$;

-- ─── 5. fiscal_periods: missing CREATE TABLE (FK target of 20260915_001)
-- Column list mirrors the LIVE table (probed 2026-10-06), including its
-- defaults: security_level defaults to 4 (not 3), name is NOT NULL,
-- sync_status defaults 'SYNCED', data_classification 'PRODUCTION',
-- verification_status 'VERIFIED', version 1, is_closed is nullable
-- DEFAULT false, and the lock trio is_soft_locked / soft_locked_at /
-- locked_by (20260915_001 expects exactly these).
-- ONE deliberate addition beyond the live shape:
--   organization_id — live fiscal_periods predates the tenant-isolation
--   rule in CONTRIBUTING.md ("All tables must have organization_id"),
--   and src/server/engines/finance.engine.ts already queries it
--   (`WHERE id = $1 AND organization_id = $2`); it is nullable, with
--   UNIQUE (organization_id, code) as the tenant-scoped natural key.
--   The live table is untouched by this statement (it exists, so
--   IF NOT EXISTS skips the whole block).
-- Deliberately NOT added: is_hard_closed — finance.engine.ts reads it
-- but neither the live table nor any migration defines it. That is
-- pre-existing drift between app and live schema, reported separately
-- and out of scope for this additive migration.

CREATE TABLE IF NOT EXISTS fiscal_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_year_id UUID NOT NULL REFERENCES fiscal_years(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_closed BOOLEAN DEFAULT false,
  security_level INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  version INTEGER DEFAULT 1,
  sync_status TEXT DEFAULT 'SYNCED',
  is_demo BOOLEAN DEFAULT false,
  data_classification TEXT DEFAULT 'PRODUCTION',
  verification_status TEXT DEFAULT 'VERIFIED',
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_soft_locked BOOLEAN NOT NULL DEFAULT false,
  soft_locked_at TIMESTAMPTZ,
  locked_by UUID REFERENCES users(id),
  UNIQUE (organization_id, code)
);

-- 5a. FK indexes for fiscal_periods (CONTRIBUTING: index foreign keys).
-- idx_fiscal_periods_year reuses the LIVE index name, so it is a no-op
-- live and a real index on a fresh database (the live duplicate
-- idx_fk_fiscal_periods_fiscal_year_id is intentionally not re-emitted).
-- idx_fiscal_periods_org needs organization_id, which only exists on a
-- freshly created table — on live the column is absent, so the
-- undefined_column handler turns this into a NOTICE (the missing live
-- column is the tenant-isolation gap reported with this migration, not
-- something this additive file changes).

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_fiscal_periods_year
    ON fiscal_periods (fiscal_year_id);
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'fiscal_periods(fiscal_year_id) index skipped (schema drift): %', SQLERRM;
END
$$;

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_fiscal_periods_locked_by
    ON fiscal_periods (locked_by);
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'fiscal_periods(locked_by) index skipped (schema drift): %', SQLERRM;
END
$$;

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_fiscal_periods_org
    ON fiscal_periods (organization_id);
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'fiscal_periods(organization_id) index skipped (no organization_id column on live table): %', SQLERRM;
END
$$;
