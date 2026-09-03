/**
 * NexoraOS™ — Performance Indexes
 * Idempotent index creation (CREATE INDEX IF NOT EXISTS).
 */

import pg from 'pg';
import logger from '../core/logger';

export async function ensureDatabasePerformanceIndexes(pool: pg.Pool): Promise<void> {
  const queries = [
    `CREATE INDEX IF NOT EXISTS idx_programs_deleted_at ON programs(deleted_at)`,
    `CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at)`,
    `CREATE INDEX IF NOT EXISTS idx_beneficiaries_deleted_at ON beneficiaries(deleted_at)`,
    `CREATE INDEX IF NOT EXISTS idx_sponsorships_deleted_at ON sponsorships(deleted_at)`,
    `CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at)`,
    `CREATE INDEX IF NOT EXISTS idx_programs_org_id ON programs(organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_projects_program_id ON projects(program_id)`,
    `CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)`,
    `CREATE INDEX IF NOT EXISTS idx_beneficiaries_status ON beneficiaries(status)`,
    `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
    `CREATE INDEX IF NOT EXISTS idx_beneficiaries_org_gov ON beneficiaries(organization_id, governorate)`,
    `CREATE INDEX IF NOT EXISTS idx_sponsorships_ben_curr ON sponsorships(beneficiary_id, currency_code)`,
    `CREATE INDEX IF NOT EXISTS idx_chart_accounts_org_type ON chart_of_accounts(organization_id, account_type)`,
    `CREATE INDEX IF NOT EXISTS idx_activities_project_status ON activities(project_id, status_code)`,
  ];

  for (const q of queries) {
    await pool.query(q).catch(() => {});
  }
}
