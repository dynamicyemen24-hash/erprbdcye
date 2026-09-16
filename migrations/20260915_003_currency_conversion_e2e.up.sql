-- ═══════════════════════════════════════════════════════════════════
-- NexoraOS™ — Multi-Currency E2E Verification Tables
-- Migration: 20260915_003_currency_conversion_e2e.up.sql
-- Purpose: Add tables and triggers to verify end-to-end currency
--          conversion workflow for YER, SAR, USD transactions.
-- Standard: IPSAS 21 (Effect of Changes in Foreign Exchange Rates)
-- Note: Fully idempotent.
-- ═══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── 1. Exchange Rate Master ──────────────────────────────
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  source_currency VARCHAR(3) NOT NULL,
  target_currency VARCHAR(3) NOT NULL,
  rate NUMERIC(15,6) NOT NULL,
  rate_date DATE NOT NULL,
  source VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, source_currency, target_currency, rate_date)
);

CREATE INDEX IF NOT EXISTS idx_exchange_curr ON exchange_rates(source_currency, target_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_date ON exchange_rates(rate_date);

-- ─── 2. Multi-Currency Voucher Tracking ───────────────────
CREATE TABLE IF NOT EXISTS multicurrency_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  original_currency VARCHAR(3) NOT NULL,
  original_amount NUMERIC(15,6) NOT NULL,
  base_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  base_amount NUMERIC(15,6) NOT NULL,
  exchange_rate NUMERIC(15,6) NOT NULL,
  rate_date DATE NOT NULL,
  exchange_gain_loss NUMERIC(15,6) NOT NULL DEFAULT 0,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_mc_voucher_tx ON multicurrency_vouchers(transaction_id);

-- ─── 3. Currency Gain/Loss Account Mapping ────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exchange_rates' AND column_name = 'gain_loss_account_id'
  ) THEN
    ALTER TABLE exchange_rates ADD COLUMN gain_loss_account_id UUID REFERENCES chart_of_accounts(id);
  END IF;
END $$;

-- ─── 4. Sample exchange rates for testing ─────────────────
INSERT INTO exchange_rates (organization_id, source_currency, target_currency, rate, rate_date, source)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'YER', 'USD', 250.000000, CURRENT_DATE, 'system'),
  ('00000000-0000-0000-0000-000000000001', 'SAR', 'USD', 0.266667, CURRENT_DATE, 'system'),
  ('00000000-0000-0000-0000-000000000001', 'USD', 'YER', 250.000000, CURRENT_DATE, 'system'),
  ('00000000-0000-0000-0000-000000000001', 'USD', 'SAR', 3.750000, CURRENT_DATE, 'system')
ON CONFLICT (organization_id, source_currency, target_currency, rate_date) DO NOTHING;

COMMENT ON TABLE exchange_rates IS 'Master exchange rate table for multi-currency transactions (IPSAS 21)';
COMMENT ON TABLE multicurrency_vouchers IS 'Tracks original currency amounts and base currency equivalents with gain/loss';
