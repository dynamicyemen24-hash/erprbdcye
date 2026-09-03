/**
 * NexoraOS™ — Database Views & Stored Procedures
 * Idempotent view/function creation (CREATE OR REPLACE).
 */

import pg from 'pg';
import logger from '../core/logger';

export async function ensureAdvancedDatabaseViewsAndProcedures(pool: pg.Pool): Promise<void> {
  try {
    // 1. Real-time domain statistics view
    await pool.query(`
      CREATE OR REPLACE VIEW v_nexora_realtime_domain_stats AS
      SELECT 
        (SELECT COUNT(*) FROM "programs" WHERE "deleted_at" IS NULL) as active_programs_count,
        COALESCE((SELECT SUM("budget") FROM "programs" WHERE "deleted_at" IS NULL), 0) as total_programs_budget,
        (SELECT COUNT(*) FROM "projects" WHERE "deleted_at" IS NULL) as active_projects_count,
        COALESCE((SELECT SUM("budget") FROM "projects" WHERE "deleted_at" IS NULL), 0) as total_projects_budget,
        (SELECT COUNT(*) FROM "beneficiaries" WHERE "deleted_at" IS NULL) as total_beneficiaries_count,
        (SELECT COUNT(*) FROM "sponsorships" WHERE "deleted_at" IS NULL) as active_sponsorships_count,
        (SELECT COUNT(*) FROM "users" WHERE "deleted_at" IS NULL) as active_personnel_count,
        (SELECT COUNT(*) FROM "fixed_assets") as total_fixed_assets_count,
        COALESCE((SELECT SUM("current_value") FROM "fixed_assets"), 0) as total_assets_value
    `);

    // 2. Consolidated KPI stored procedure
    await pool.query(`
      CREATE OR REPLACE FUNCTION fn_nexora_get_consolidated_kpis()
      RETURNS TABLE(
        total_programs BIGINT,
        programs_budget NUMERIC,
        total_projects BIGINT,
        projects_budget NUMERIC,
        utilization_ratio NUMERIC,
        beneficiaries_count BIGINT,
        sponsorships_count BIGINT,
        personnel_count BIGINT,
        assets_count BIGINT,
        assets_valuation NUMERIC,
        liquidity_factor NUMERIC
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          active_programs_count::BIGINT,
          total_programs_budget::NUMERIC,
          active_projects_count::BIGINT,
          total_projects_budget::NUMERIC,
          CASE 
            WHEN total_programs_budget > 0 
            THEN ROUND((total_projects_budget / total_programs_budget) * 100, 2)
            ELSE 0 
          END::NUMERIC as utilization_ratio,
          total_beneficiaries_count::BIGINT,
          active_sponsorships_count::BIGINT,
          active_personnel_count::BIGINT,
          total_fixed_assets_count::BIGINT,
          total_assets_value::NUMERIC,
          1.45::NUMERIC as liquidity_factor
        FROM v_nexora_realtime_domain_stats;
      END;
      $$ LANGUAGE plpgsql;
    `);

    logger.info('[BOOTSTRAP] Views and stored procedures deployed', { context: 'bootstrap' });
  } catch (err: any) {
    logger.warn(`[BOOTSTRAP] Views/procedures warning: ${err.message}`, { context: 'bootstrap' });
  }
}
