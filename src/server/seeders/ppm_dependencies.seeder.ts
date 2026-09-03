/**
 * NexoraOS™ — PPM Dependency Network Seeder
 * Builds the critical-path network by deriving dependency_network edges from the
 * predecessor_ids/successor_ids already stored on real project_schedules rows.
 *
 * Idempotent: only seeds when dependency_network is empty, so manually-curated
 * networks are never overwritten.
 */

import pg from 'pg';
import logger from '../core/logger';
import { CPMEngine } from '../engines/ppm.intelligence.engine';

export async function seedDependencyNetworkIfEmpty(pool: pg.Pool): Promise<{ created: number; projects: number }> {
  try {
    const check = await pool.query('SELECT COUNT(*) FROM dependency_network');
    const existing = parseInt(check.rows[0].count);
    if (existing > 0) {
      logger.info(`[SEED] dependency_network already populated (${existing} edges), skipping`, { context: 'seeder' });
      return { created: 0, projects: 0 };
    }

    const projects = await pool.query(
      `SELECT DISTINCT project_id FROM project_schedules
       WHERE deleted_at IS NULL AND project_id IS NOT NULL`
    );

    let created = 0;
    for (const row of projects.rows) {
      if (!row.project_id) continue;
      try {
        // Resolve org for tenant-scoping
        const orgRow = await pool.query(
          `SELECT organization_id FROM project_schedules WHERE project_id = $1 AND deleted_at IS NULL LIMIT 1`,
          [row.project_id]
        );
        const orgId = orgRow.rows[0]?.organization_id;
        if (!orgId) continue;
        const res = await CPMEngine.rebuildFromSchedules(row.project_id, orgId);
        created += res.created;
      } catch (e: any) {
        logger.warn(`[SEED] dependency rebuild failed for project ${row.project_id}: ${e.message}`, { context: 'seeder' });
      }
    }

    logger.info(`[SEED] dependency_network seeded: ${created} edges across ${projects.rows.length} projects`, { context: 'seeder' });
    return { created, projects: projects.rows.length };
  } catch (err: any) {
    logger.warn(`[SEED] dependency_network seeder error: ${err.message}`, { context: 'seeder' });
    return { created: 0, projects: 0 };
  }
}
