-- Migration: Add CHECK constraint on transactions table
-- Ensures total_debit = total_credit for IPSAS compliance
-- Reference: NEXORA_TECHNICAL_DEBT_REGISTER.md TD-005

ALTER TABLE transactions
ADD CONSTRAINT chk_transaction_balance
CHECK (total_debit = total_credit);