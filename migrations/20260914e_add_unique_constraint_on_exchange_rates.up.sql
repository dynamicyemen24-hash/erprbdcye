-- 2026-09-14e: Add unique constraint on exchange_rates for ON CONFLICT support
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'exchange_rates_org_src_curr_rate_uniq') THEN
    CREATE UNIQUE INDEX exchange_rates_org_src_curr_rate_uniq ON exchange_rates (organization_id, source_currency, target_currency, rate_date);
  END IF;
END $$;

COMMENT ON INDEX exchange_rates_org_src_curr_rate_uniq IS 'Unique constraint supporting ON CONFLICT in currency conversion migration';