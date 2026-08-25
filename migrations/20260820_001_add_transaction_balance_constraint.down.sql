-- Migration: Remove CHECK constraint from transactions table
-- Rollback: Remove the balance constraint added in migration 20260820_001

ALTER TABLE transactions
DROP CONSTRAINT chk_transaction_balance;