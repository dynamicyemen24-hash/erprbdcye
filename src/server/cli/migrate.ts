import { runPendingMigrations, rollbackMigrations, getMigrationStatus } from '../db/migrator';

async function main() {
  const command = process.argv[2];
  const db = { query: async (sql: string, params?: any[]) => { const { default: pg } = await import('pg'); const client = new pg.Client({ connectionString: process.env.DATABASE_URL }); await client.connect(); const result = await client.query(sql, params); await client.end(); return result; } };
  
  switch (command) {
    case 'migrate': {
      console.log('Running pending migrations...');
      const results = await runPendingMigrations(db);
      console.log(`Applied ${results.length} migrations`);
      break;
    }
    case 'rollback': {
      const count = parseInt(process.argv[3] || '1');
      console.log(`Rolling back ${count} migration(s)...`);
      const results = await rollbackMigrations(db, count);
      console.log(`Rolled back ${results.length} migrations`);
      break;
    }
    case 'status': {
      const status = await getMigrationStatus(db);
      console.log(`Applied: ${status.applied.length}`);
      console.log(`Pending: ${status.pending.length}`);
      status.pending.forEach(m => console.log(`  - ${m.name}`));
      break;
    }
    default:
      console.log('Usage: npx tsx src/server/cli/migrate.ts [migrate|rollback|status]');
  }
}
main().catch(console.error);
