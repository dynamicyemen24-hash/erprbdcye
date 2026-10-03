-- ================================================================
-- NexoraOS - Sync Status Indexes Completion
-- Migration: 20261003_sync_status_indexes_completion
-- Target: close the 4 missing offline-first sync indexes
--   (donations, field_disbursements, transactions, journal_entries)
-- Pattern mirrors initial_schema.ts:
--   ON <table>(organization_id, sync_status) WHERE deleted_at IS NULL
-- Guarded with DO blocks so schema drift can never break bootstrap.
-- ================================================================

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_donations_sync_status
    ON donations(organization_id, sync_status) WHERE deleted_at IS NULL;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'sync-idx-completion skipped (schema drift): %', SQLERRM;
END
$$;

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_field_disbursements_sync_status
    ON field_disbursements(organization_id, sync_status) WHERE deleted_at IS NULL;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'sync-idx-completion skipped (schema drift): %', SQLERRM;
END
$$;

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_transactions_sync_status
    ON transactions(organization_id, sync_status) WHERE deleted_at IS NULL;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'sync-idx-completion skipped (schema drift): %', SQLERRM;
END
$$;

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_journal_entries_sync_status
    ON journal_entries(organization_id, sync_status) WHERE deleted_at IS NULL;
EXCEPTION WHEN undefined_table OR undefined_column OR duplicate_table OR duplicate_object THEN
  RAISE NOTICE 'sync-idx-completion skipped (schema drift): %', SQLERRM;
END
$$;
