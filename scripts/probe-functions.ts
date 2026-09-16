import { readFileSync } from 'fs';
import { getPool, closePool } from '../src/server/core/database';

// Dry-run every CREATE OR REPLACE FUNCTION in a file inside ROLLBACK.
async function main() {
  const file = process.argv[2];
  const text = readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const stmts: { name: string; sql: string }[] = [];
  let acc: string[] | null = null;
  let dollars = 0;
  for (const line of lines) {
    const m = acc === null ? line.match(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+(\S+)/i) : null;
    if (m) acc = [line];
    else if (acc !== null) acc.push(line);
    dollars += (line.match(/\$\$/g) || []).length;
    if (acc !== null && dollars >= 2 && /;\s*$/.test(line)) {
      const name = acc[0].match(/FUNCTION\s+(\S+)/i)?.[1] || '?';
      stmts.push({ name, sql: acc.join('\n') });
      acc = null;
      dollars = 0;
    }
  }
  console.log(`functions: ${stmts.length}`);
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const s of stmts) {
      try {
        await client.query(s.sql);
        console.log(`ok: ${s.name}`);
      } catch (e: any) {
        console.log(`FAIL: ${s.name}: ${e.message}`);
      }
    }
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
  await closePool();
}
main().catch((e) => {
  console.error('PROBE-CRASH', e?.message || e);
  process.exit(2);
});
