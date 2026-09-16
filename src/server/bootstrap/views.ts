/**
 * NexoraOS™ — Database Views & Stored Procedures
 * Idempotent view/function creation (CREATE OR REPLACE).
 */

import pg from 'pg';
import logger from '../core/logger';

export async function ensureAdvancedDatabaseViewsAndProcedures(pool: pg.Pool): Promise<void> {
  try {
    // 1. Real-time domain statistics view (global legacy aggregate; the
    // tenant-scoped fn below is the SaaS path — this view stays for compat).
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

    // 2. Consolidated KPI stored procedure — tenant-scoped (SaaS).
    // p_org_id NULL preserves the legacy global behavior for compat callers.
    await pool.query(`
      CREATE OR REPLACE FUNCTION fn_nexora_get_consolidated_kpis(p_org_id UUID DEFAULT NULL)
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
      DECLARE
        v_programs BIGINT;
        v_programs_budget NUMERIC;
        v_projects BIGINT;
        v_projects_budget NUMERIC;
        v_beneficiaries BIGINT;
        v_sponsorships BIGINT;
        v_personnel BIGINT;
        v_assets BIGINT;
        v_assets_value NUMERIC;
      BEGIN
        SELECT COUNT(*), COALESCE(SUM(budget), 0)
          INTO v_programs, v_programs_budget FROM programs
          WHERE deleted_at IS NULL AND (p_org_id IS NULL OR organization_id = p_org_id);
        SELECT COUNT(*), COALESCE(SUM(budget), 0)
          INTO v_projects, v_projects_budget FROM projects
          WHERE deleted_at IS NULL AND (p_org_id IS NULL OR organization_id = p_org_id);
        SELECT COUNT(*) INTO v_beneficiaries FROM beneficiaries
          WHERE deleted_at IS NULL AND (p_org_id IS NULL OR organization_id = p_org_id);
        SELECT COUNT(*) INTO v_sponsorships FROM sponsorships
          WHERE deleted_at IS NULL AND (p_org_id IS NULL OR organization_id = p_org_id);
        SELECT COUNT(*) INTO v_personnel FROM users
          WHERE deleted_at IS NULL AND (p_org_id IS NULL OR organization_id = p_org_id);
        SELECT COUNT(*), COALESCE(SUM(current_value), 0)
          INTO v_assets, v_assets_value FROM fixed_assets
          WHERE (p_org_id IS NULL OR organization_id = p_org_id);
        RETURN QUERY SELECT
          v_programs, v_programs_budget, v_projects, v_projects_budget,
          CASE WHEN v_programs_budget > 0
            THEN ROUND((v_projects_budget / v_programs_budget) * 100, 2)
            ELSE 0 END,
          v_beneficiaries, v_sponsorships, v_personnel,
          v_assets, v_assets_value, 1.45::NUMERIC;
      END;
      $$ LANGUAGE plpgsql;
    `);

    logger.info('[BOOTSTRAP] Views and stored procedures deployed', { context: 'bootstrap' });
  } catch (err: any) {
    logger.warn(`[BOOTSTRAP] Views/procedures warning: ${err.message}`, { context: 'bootstrap' });
  }
}
