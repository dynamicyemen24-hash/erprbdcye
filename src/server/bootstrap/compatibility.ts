/**
 * NexoraOS™ — PPM Schema Compatibility Patch
 * Ensures idempotent columns the V2 PPM engines rely on exist on the live Neon DB,
 * without ever dropping or rewriting existing tables/data.
 *
 * Handles the schema drift between the engine layer (which assumed legacy column
 * names) and the real production tables. All added columns are additive & safe.
 */

import pg from 'pg';
import logger from '../core/logger';

const ADDITIVE_COLUMNS: Array<{ table: string; column: string; ddl: string }> = [
  // project_tasks: activity-scoping + weighted progress for WBS cascade
  {
    table: 'project_tasks',
    column: 'activity_id',
    ddl: `ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS activity_id UUID`,
  },
  {
    table: 'project_tasks',
    column: 'weight_pct',
    ddl: `ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS weight_pct NUMERIC DEFAULT 10`,
  },
  // activities: progress tracking persisted as a real column (engine + UI friendly)
  {
    table: 'activities',
    column: 'progress_pct',
    ddl: `ALTER TABLE activities ADD COLUMN IF NOT EXISTS progress_pct NUMERIC DEFAULT 0`,
  },
];

export async function ensurePpmCompatibilityColumns(pool: pg.Pool): Promise<void> {
  const errors: string[] = [];
  for (const c of ADDITIVE_COLUMNS) {
    try {
      await pool.query(c.ddl);
      logger.info(`[SCHEMA] ensured ${c.table}.${c.column}`, { context: 'bootstrap' });
    } catch (err: any) {
      errors.push(`${c.table}.${c.column}: ${err.message}`);
      logger.warn(`[SCHEMA] skip ${c.table}.${c.column}: ${err.message}`, { context: 'bootstrap' });
    }
  }
  if (errors.length > 0) {
    logger.warn(`[SCHEMA] compatibility patch completed with ${errors.length} warnings`, { context: 'bootstrap' });
  }
}
