/**
 * NexoraOS™ — Enterprise Bootstrap Service
 * Single orchestrator for all database initialization, seeding, and view creation.
 * Replaces the monolithic ensure*Schema / seed*IfEmpty functions from server.ts.
 *
 * Called once during server startup. All operations are idempotent (CREATE IF NOT EXISTS).
 */

import pg from 'pg';
import { join } from 'path';
import logger from '../core/logger';
import { Migrator } from '../database/migrator';
import { runEnterpriseSchemaCompletion, applyEnterpriseIndexes, applyEnterpriseViews, seedEnterpriseUsersAndOrg } from '../database/enterprise_schema_completion';
import { seedFixedAssetsIfEmpty } from '../seeders/fixed_assets.seeder';
import { seedExchangeRatesIfEmpty } from '../seeders/exchange_rates.seeder';
import { seedStrategicPlanningIfEmpty } from '../seeders/strategic_planning.seeder';
import { seedInvestmentProjectsIfEmpty } from '../seeders/investment_projects.seeder';
import { seedGlobalReferenceData } from '../seeders/global_reference_data.seeder';
import { seedDependencyNetworkIfEmpty } from '../seeders/ppm_dependencies.seeder';
import { ensureAdvancedDatabaseViewsAndProcedures } from './views';
import { ensureDatabasePerformanceIndexes } from './indexes';
import { ensurePpmCompatibilityColumns } from './compatibility';

export interface BootstrapResult {
  success: boolean;
  errors: string[];
  /** Set when schema completion or SQL migrations failed — fatal in production. */
  fatal: string | null;
}

export async function bootstrapDatabase(pool: pg.Pool): Promise<BootstrapResult> {
  const errors: string[] = [];
  let fatal: string | null = null;
  const startTime = Date.now();

  logger.info('[BOOTSTRAP] Starting NexoraOS™ database bootstrap...', { context: 'bootstrap' });

  // Phase 1: Core schema completion (all NEB domains)
  try {
    await runEnterpriseSchemaCompletion(pool);
    await applyEnterpriseIndexes(pool);
    await applyEnterpriseViews(pool);
    await ensurePpmCompatibilityColumns(pool);
    await seedEnterpriseUsersAndOrg(pool);
    logger.info('[BOOTSTRAP] Phase 1: Core schema completion done', { context: 'bootstrap' });
  } catch (err: any) {
    const msg = `Phase 1 (schema completion): ${err.message}`;
    errors.push(msg);
    fatal = msg;
    logger.error(`[BOOTSTRAP] FATAL ${msg}`, { context: 'bootstrap' });
  }

  // Phase 1.5: Apply pending SQL migrations (/migrations/*.sql)
  // — the migration runner tracks applied files in `_migrations` and every
  //    migration file is written idempotently (IF NOT EXISTS / ON CONFLICT).
  // NOTE: a failed migration stops the runner at that file and is FATAL —
  // serving traffic on a half-migrated schema is worse than not serving.
  try {
    const migrator = new Migrator(join(process.cwd(), 'migrations'));
    const result = await migrator.migrate();
    if (result.errors.length > 0) {
      const msg = `Phase 1.5 (SQL migrations): ${result.errors.join('; ')}`;
      logger.error(`[BOOTSTRAP] FATAL ${msg}`, { context: 'bootstrap' });
      errors.push(...result.errors);
      fatal = fatal || msg;
    } else if (result.applied.length > 0) {
      logger.info(`[BOOTSTRAP] Applied ${result.applied.length} pending migration(s): ${result.applied.join(', ')}`, { context: 'bootstrap' });
    }
  } catch (err: any) {
    const msg = `Phase 1.5 (SQL migrations): ${err.message}`;
    errors.push(msg);
    fatal = fatal || msg;
    logger.error(`[BOOTSTRAP] FATAL ${msg}`, { context: 'bootstrap' });
  }

  // Phase 2: Seed data (fire-and-forget, non-blocking)
  try {
    await Promise.all([
      seedGlobalReferenceData(pool),
      seedFixedAssetsIfEmpty(pool),
      seedExchangeRatesIfEmpty(pool),
      seedStrategicPlanningIfEmpty(pool),
      seedInvestmentProjectsIfEmpty(pool),
      seedDependencyNetworkIfEmpty(pool),
    ]);
    logger.info('[BOOTSTRAP] Phase 2: Seed data completed', { context: 'bootstrap' });
  } catch (err: any) {
    const msg = `Phase 2 (seed data): ${err.message}`;
    errors.push(msg);
    logger.warn(`[BOOTSTRAP] ${msg}`, { context: 'bootstrap' });
  }

  // Phase 3: Views, functions, triggers
  try {
    await ensureAdvancedDatabaseViewsAndProcedures(pool);
    logger.info('[BOOTSTRAP] Phase 3: Views & procedures done', { context: 'bootstrap' });
  } catch (err: any) {
    const msg = `Phase 3 (views): ${err.message}`;
    errors.push(msg);
    logger.warn(`[BOOTSTRAP] ${msg}`, { context: 'bootstrap' });
  }

  // Phase 4: Performance indexes
  try {
    await ensureDatabasePerformanceIndexes(pool);
    logger.info('[BOOTSTRAP] Phase 4: Performance indexes done', { context: 'bootstrap' });
  } catch (err: any) {
    const msg = `Phase 4 (indexes): ${err.message}`;
    errors.push(msg);
    logger.warn(`[BOOTSTRAP] ${msg}`, { context: 'bootstrap' });
  }

  const duration = Date.now() - startTime;
  logger.info(`[BOOTSTRAP] Database bootstrap completed in ${duration}ms (${errors.length} warnings)`, { context: 'bootstrap' });

  return { success: fatal === null, errors, fatal };
}
