/**
 * NexoraOS™ — Real migration runner (CI / Render pre-deploy / operator use)
 * Applies pending /migrations/*.sql files, tracked in `_migrations`.
 * Exits non-zero when any migration fails.
 *
 * Usage:
 *   npm run migration:run
 *   npm run migration:run -- --dry-run   (list pending without applying)
 */
import { join } from 'path';
import { Migrator } from '../src/server/database/migrator';

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is required to run migrations.');
    process.exit(1);
  }

  // Point the core pool at this DATABASE_URL before the Migrator imports it.
  process.env.DATABASE_URL = databaseUrl;

  const { getPool, closePool } = await import('../src/server/core/database');
  // Ensure pool singleton is created, then run migrations.
  getPool();

  const migrator = new Migrator(join(process.cwd(), 'migrations'));
  await migrator.ensureMigrationsTable();
  const pending = await migrator.getPendingMigrations();

  console.log(`Pending migrations (${pending.length}):`);
  pending.forEach((m) => console.log(`- ${m.name}`));

  if (dryRun) {
    await closePool();
    return;
  }

  const result = await migrator.migrate();
  console.log(`Applied: ${result.applied.length}, Errors: ${result.errors.length}`);
  result.applied.forEach((n) => console.log(`  applied: ${n}`));
  result.errors.forEach((e) => console.error(`  ERROR: ${e}`));

  await closePool();
  if (result.errors.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(`Migration runner crashed: ${err?.message || err}`);
  process.exit(1);
});
