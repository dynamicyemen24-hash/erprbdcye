import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface Migration { id: string; name: string; up: string; down: string; checksum: string; }
export interface MigrationStatus { id: string; name: string; appliedAt: Date; durationMs: number; }

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'migrations');

export async function getAppliedMigrations(db: any): Promise<string[]> {
  try {
    const result = await db.query("SELECT migration_id FROM schema_migrations ORDER BY id");
    return result.rows?.map((r: any) => r.migration_id) || [];
  } catch { return []; }
}

export async function getPendingMigrations(db: any): Promise<Migration[]> {
  const applied = await getAppliedMigrations(db);
  const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();
  const pending: Migration[] = [];
  for (const file of files) {
    const id = file.replace('.sql', '');
    if (!applied.includes(id)) {
      const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
      const [up, down] = content.split('-- DOWN');
      pending.push({ id, name: file, up: up.trim(), down: (down || '').trim(), checksum: crypto.createHash('sha256').update(content).digest('hex').slice(0, 16) });
    }
  }
  return pending;
}

export async function runPendingMigrations(db: any): Promise<MigrationStatus[]> {
  const results: MigrationStatus[] = [];
  const pending = await getPendingMigrations(db);
  for (const migration of pending) {
    const start = Date.now();
    try {
      await db.query('BEGIN');
      await db.query(migration.up);
      await db.query("INSERT INTO schema_migrations (migration_id, name, checksum, duration_ms) VALUES ($1, $2, $3, $4)", [migration.id, migration.name, migration.checksum, Date.now() - start]);
      await db.query('COMMIT');
      results.push({ id: migration.id, name: migration.name, appliedAt: new Date(), durationMs: Date.now() - start });
      console.log(`[MIGRATOR] Applied: ${migration.name} (${Date.now() - start}ms)`);
    } catch (error: any) {
      await db.query('ROLLBACK');
      console.error(`[MIGRATOR] Failed: ${migration.name}:`, error.message);
      break;
    }
  }
  if (results.length === 0) console.log('[MIGRATOR] No pending migrations');
  return results;
}

export async function rollbackMigrations(db: any, count: number = 1): Promise<string[]> {
  const result = await db.query("SELECT migration_id, name FROM schema_migrations ORDER BY id DESC LIMIT $1", [count]);
  const rolledBack: string[] = [];
  for (const row of result.rows || []) {
    const filePath = path.join(MIGRATIONS_DIR, `${row.migration_id}.sql`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parts = content.split('-- DOWN');
      if (parts[1]) {
        try {
          await db.query('BEGIN');
          await db.query(parts[1].trim());
          await db.query("DELETE FROM schema_migrations WHERE migration_id = $1", [row.migration_id]);
          await db.query('COMMIT');
          rolledBack.push(row.migration_id);
          console.log(`[MIGRATOR] Rolled back: ${row.migration_id}`);
        } catch (error: any) {
          await db.query('ROLLBACK');
          console.error(`[MIGRATOR] Rollback failed: ${row.migration_id}:`, error.message);
        }
      }
    }
  }
  return rolledBack;
}

export async function getMigrationStatus(db: any): Promise<{ applied: string[]; pending: Migration[] }> {
  const applied = await getAppliedMigrations(db);
  const pending = await getPendingMigrations(db);
  return { applied, pending };
}
