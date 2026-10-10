-- 2026-09-14b: Ensure exchange_rates table has target_currency column
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exchange_rates') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exchange_rates' AND column_name = 'target_currency') THEN
      ALTER TABLE exchange_rates ADD COLUMN target_currency VARCHAR(3) NOT NULL DEFAULT 'USD';
    END IF;
  ELSE
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
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
  END IF;
END $$;

COMMENT ON COLUMN exchange_rates.target_currency IS 'Target currency code for the exchange rate';