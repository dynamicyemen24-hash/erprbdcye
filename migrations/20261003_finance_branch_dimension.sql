-- ================================================================
-- NexoraOS - Finance Branch Dimension
-- Migration: 20261003_finance_branch_dimension
-- Multi-branch slicing for accounting reports: branch_code on the
-- three finance fact tables. NULL = headquarters / unassigned.
-- Nullable ADD COLUMN is metadata-only (no table rewrite), guarded
-- DO blocks, runner owns the transaction. ADDITIVE ONLY.
-- ================================================================

DO $$
BEGIN
  ALTER TABLE transactions ADD COLUMN IF NOT EXISTS branch_code VARCHAR(50);
EXCEPTION WHEN undefined_table OR duplicate_column OR duplicate_object THEN
  RAISE NOTICE 'branch-dimension skipped (schema drift): %', SQLERRM;
END
$$;

DO $$
BEGIN
  ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS branch_code VARCHAR(50);
EXCEPTION WHEN undefined_table OR duplicate_column OR duplicate_object THEN
  RAISE NOTICE 'branch-dimension skipped (schema drift): %', SQLERRM;
END
$$;

DO $$
BEGIN
  ALTER TABLE budget_lines ADD COLUMN IF NOT EXISTS branch_code VARCHAR(50);
EXCEPTION WHEN undefined_table OR duplicate_column OR duplicate_object THEN
  RAISE NOTICE 'branch-dimension skipped (schema drift): %', SQLERRM;
END
$$;

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_transactions_branch
    ON transactions(organization_id, branch_code) WHERE branch_code IS NOT NULL;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'branch-dimension skipped (schema drift): %', SQLERRM;
END
$$;

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_journal_entries_branch
    ON journal_entries(organization_id, branch_code) WHERE branch_code IS NOT NULL;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'branch-dimension skipped (schema drift): %', SQLERRM;
END
$$;

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_budget_lines_branch
    ON budget_lines(organization_id, branch_code) WHERE branch_code IS NOT NULL;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'branch-dimension skipped (schema drift): %', SQLERRM;
END
$$;

-- DOWN
DROP INDEX IF EXISTS idx_transactions_branch;
DROP INDEX IF EXISTS idx_journal_entries_branch;
DROP INDEX IF EXISTS idx_budget_lines_branch;
ALTER TABLE transactions DROP COLUMN IF EXISTS branch_code;
ALTER TABLE journal_entries DROP COLUMN IF EXISTS branch_code;
ALTER TABLE budget_lines DROP COLUMN IF EXISTS branch_code;
